import { pool } from '../database';
import { logger } from '../utils/logger';
import { QueueEntryRecord, QueueEventRecord, QueueStatus, QueueSnapshot } from '../types/tokenQueue';
import { v4 as uuidv4 } from 'uuid';

class QueueRepository {
  private memoryEntries: Map<string, QueueEntryRecord> = new Map(); // id -> entry
  private memoryEntriesByBooking: Map<string, QueueEntryRecord> = new Map();
  private memoryEvents: QueueEventRecord[] = [];
  private memoryPausedCentres: Map<string, { isPaused: boolean; reason?: string }> = new Map();

  /**
   * Enters checked-in token into live queue
   */
  public async createQueueEntry(params: {
    centreId: string;
    bookingId: string;
    farmerId: string;
    tokenId: string;
    tokenCode: string;
    priorityScore?: number;
    estimatedWaitMinutes?: number;
    actorId: string;
  }): Promise<QueueEntryRecord> {
    const existing = await this.findQueueEntryByBookingId(params.bookingId);
    if (existing) {
      return existing;
    }

    const queueNumber = parseInt(params.tokenCode.replace(/\D/g, '') || '1', 10);
    const entryId = uuidv4();
    const now = new Date().toISOString();

    const record: QueueEntryRecord = {
      id: entryId,
      centreId: params.centreId,
      bookingId: params.bookingId,
      farmerId: params.farmerId,
      tokenId: params.tokenId,
      tokenCode: params.tokenCode,
      queueNumber,
      priorityScore: params.priorityScore || 1.0,
      status: 'WAITING',
      calledAt: null,
      serviceStartedAt: null,
      serviceCompletedAt: null,
      estimatedWaitMinutes: params.estimatedWaitMinutes || 30,
      assignedStationId: null,
      skipReason: null,
      version: 1,
      createdAt: now,
      updatedAt: now
    };

    try {
      const query = `
        INSERT INTO queue_entries (
          id, centre_id, booking_id, farmer_id, token_id, queue_number,
          priority_score, status, estimated_wait_minutes, version, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *;
      `;
      const values = [
        record.id,
        record.centreId,
        record.bookingId,
        record.farmerId,
        record.tokenId,
        record.queueNumber,
        record.priorityScore,
        record.status,
        record.estimatedWaitMinutes,
        record.version,
        record.createdAt,
        record.updatedAt
      ];
      await pool.query(query, values);
    } catch (err) {
      // Memory fallback active
    }

    this.memoryEntries.set(record.id, record);
    this.memoryEntriesByBooking.set(record.bookingId, record);

    await this.recordQueueEvent({
      id: uuidv4(),
      queueEntryId: record.id,
      eventType: 'QUEUE_ENTRY_CREATED',
      previousStatus: null,
      newStatus: 'WAITING',
      actorId: params.actorId,
      metadata: { tokenCode: record.tokenCode, queueNumber },
      createdAt: now
    });

    return record;
  }

  public async findQueueEntryById(id: string): Promise<QueueEntryRecord | null> {
    try {
      const res = await pool.query(`SELECT * FROM queue_entries WHERE id = $1`, [id]);
      if (res.rows.length > 0) {
        return this.mapDbRowToQueueEntry(res.rows[0]);
      }
    } catch (err) {
      // Fallback
    }
    return this.memoryEntries.get(id) || null;
  }

  public async findQueueEntryByBookingId(bookingId: string): Promise<QueueEntryRecord | null> {
    try {
      const res = await pool.query(`SELECT * FROM queue_entries WHERE booking_id = $1`, [bookingId]);
      if (res.rows.length > 0) {
        return this.mapDbRowToQueueEntry(res.rows[0]);
      }
    } catch (err) {
      // Fallback
    }
    return this.memoryEntriesByBooking.get(bookingId) || null;
  }

  /**
   * Concurrency-safe atomic operation to call next WAITING token
   */
  public async atomicCallNextToken(
    centreId: string,
    stationId: string,
    actorId: string
  ): Promise<QueueEntryRecord | null> {
    // Check if queue is paused
    const pausedState = this.memoryPausedCentres.get(centreId);
    if (pausedState && pausedState.isPaused) {
      throw new Error(`Queue is currently PAUSED: ${pausedState.reason || 'Operational pause'}`);
    }

    const now = new Date().toISOString();

    try {
      // FOR UPDATE SKIP LOCKED ensures atomic non-blocking selection between concurrent staff callers
      const res = await pool.query(
        `SELECT * FROM queue_entries
         WHERE centre_id = $1 AND status = 'WAITING'
         ORDER BY priority_score DESC, created_at ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED`,
        [centreId]
      );

      if (res.rows.length > 0) {
        const row = res.rows[0];
        const updateRes = await pool.query(
          `UPDATE queue_entries
           SET status = 'CALLED', assigned_station_id = $1, called_at = CURRENT_TIMESTAMP, version = version + 1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 AND status = 'WAITING'
           RETURNING *`,
          [stationId, row.id]
        );

        if (updateRes.rows.length > 0) {
          const updated = this.mapDbRowToQueueEntry(updateRes.rows[0]);
          this.memoryEntries.set(updated.id, updated);
          this.memoryEntriesByBooking.set(updated.bookingId, updated);

          await this.recordQueueEvent({
            id: uuidv4(),
            queueEntryId: updated.id,
            eventType: 'TOKEN_CALLED',
            previousStatus: 'WAITING',
            newStatus: 'CALLED',
            actorId,
            metadata: { stationId, tokenCode: updated.tokenCode },
            createdAt: now
          });

          return updated;
        }
      }
    } catch (err) {
      // Fallback in-memory atomic lock
    }

    // In-memory atomic search
    const candidates = Array.from(this.memoryEntries.values())
      .filter((e) => e.centreId === centreId && e.status === 'WAITING')
      .sort((a, b) => {
        if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
        return a.createdAt.localeCompare(b.createdAt);
      });

    if (candidates.length === 0) {
      return null;
    }

    const target = candidates[0];
    target.status = 'CALLED';
    target.assignedStationId = stationId;
    target.calledAt = now;
    target.version += 1;
    target.updatedAt = now;

    this.memoryEntries.set(target.id, target);
    this.memoryEntriesByBooking.set(target.bookingId, target);

    await this.recordQueueEvent({
      id: uuidv4(),
      queueEntryId: target.id,
      eventType: 'TOKEN_CALLED',
      previousStatus: 'WAITING',
      newStatus: 'CALLED',
      actorId,
      metadata: { stationId, tokenCode: target.tokenCode },
      createdAt: now
    });

    return target;
  }

  /**
   * Start service for a CALLED token (CALLED -> PROCESSING)
   */
  public async atomicServeToken(
    queueEntryId: string,
    stationId: string,
    actorId: string
  ): Promise<QueueEntryRecord | null> {
    const entry = await this.findQueueEntryById(queueEntryId);
    if (!entry) return null;

    if (entry.status !== 'CALLED' && entry.status !== 'WAITING') {
      throw new Error(`Cannot start service for token in state ${entry.status}`);
    }

    const previousStatus = entry.status;
    const now = new Date().toISOString();

    entry.status = 'PROCESSING';
    entry.assignedStationId = stationId;
    entry.serviceStartedAt = now;
    entry.version += 1;
    entry.updatedAt = now;

    try {
      await pool.query(
        `UPDATE queue_entries
         SET status = 'PROCESSING', assigned_station_id = $1, service_started_at = CURRENT_TIMESTAMP, version = version + 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [stationId, queueEntryId]
      );
    } catch (err) {
      // Fallback
    }

    this.memoryEntries.set(entry.id, entry);
    this.memoryEntriesByBooking.set(entry.bookingId, entry);

    await this.recordQueueEvent({
      id: uuidv4(),
      queueEntryId,
      eventType: 'SERVICE_STARTED',
      previousStatus,
      newStatus: 'PROCESSING',
      actorId,
      metadata: { stationId, tokenCode: entry.tokenCode },
      createdAt: now
    });

    return entry;
  }

  /**
   * Complete queue service step (PROCESSING -> COMPLETED)
   */
  public async atomicCompleteToken(
    queueEntryId: string,
    actorId: string
  ): Promise<QueueEntryRecord | null> {
    const entry = await this.findQueueEntryById(queueEntryId);
    if (!entry) return null;

    const previousStatus = entry.status;
    const now = new Date().toISOString();

    entry.status = 'COMPLETED';
    entry.serviceCompletedAt = now;
    entry.version += 1;
    entry.updatedAt = now;

    try {
      await pool.query(
        `UPDATE queue_entries
         SET status = 'COMPLETED', service_completed_at = CURRENT_TIMESTAMP, version = version + 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [queueEntryId]
      );
    } catch (err) {
      // Fallback
    }

    this.memoryEntries.set(entry.id, entry);
    this.memoryEntriesByBooking.set(entry.bookingId, entry);

    await this.recordQueueEvent({
      id: uuidv4(),
      queueEntryId,
      eventType: 'SERVICE_COMPLETED',
      previousStatus,
      newStatus: 'COMPLETED',
      actorId,
      metadata: { tokenCode: entry.tokenCode },
      createdAt: now
    });

    return entry;
  }

  /**
   * Skip a token (CALLED/WAITING -> SKIPPED)
   */
  public async atomicSkipToken(
    queueEntryId: string,
    reason: string,
    actorId: string
  ): Promise<QueueEntryRecord | null> {
    const entry = await this.findQueueEntryById(queueEntryId);
    if (!entry) return null;

    const previousStatus = entry.status;
    const now = new Date().toISOString();

    entry.status = 'SKIPPED';
    entry.skipReason = reason;
    entry.version += 1;
    entry.updatedAt = now;

    try {
      await pool.query(
        `UPDATE queue_entries
         SET status = 'SKIPPED', skip_reason = $1, version = version + 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [reason, queueEntryId]
      );
    } catch (err) {
      // Fallback
    }

    this.memoryEntries.set(entry.id, entry);
    this.memoryEntriesByBooking.set(entry.bookingId, entry);

    await this.recordQueueEvent({
      id: uuidv4(),
      queueEntryId,
      eventType: 'TOKEN_SKIPPED',
      previousStatus,
      newStatus: 'SKIPPED',
      actorId,
      metadata: { reason, tokenCode: entry.tokenCode },
      createdAt: now
    });

    return entry;
  }

  /**
   * Recall a skipped token back into WAITING state
   */
  public async atomicRecallToken(
    queueEntryId: string,
    actorId: string
  ): Promise<QueueEntryRecord | null> {
    const entry = await this.findQueueEntryById(queueEntryId);
    if (!entry) return null;

    if (entry.status !== 'SKIPPED' && entry.status !== 'NO_SHOW') {
      throw new Error(`Cannot recall token in state ${entry.status}`);
    }

    const previousStatus = entry.status;
    const now = new Date().toISOString();

    entry.status = 'WAITING';
    entry.skipReason = null;
    entry.version += 1;
    entry.updatedAt = now;

    try {
      await pool.query(
        `UPDATE queue_entries
         SET status = 'WAITING', skip_reason = NULL, version = version + 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [queueEntryId]
      );
    } catch (err) {
      // Fallback
    }

    this.memoryEntries.set(entry.id, entry);
    this.memoryEntriesByBooking.set(entry.bookingId, entry);

    await this.recordQueueEvent({
      id: uuidv4(),
      queueEntryId,
      eventType: 'TOKEN_RECALLED',
      previousStatus,
      newStatus: 'WAITING',
      actorId,
      metadata: { tokenCode: entry.tokenCode },
      createdAt: now
    });

    return entry;
  }

  /**
   * Set pause status for centre queue
   */
  public setCentreQueuePause(centreId: string, isPaused: boolean, reason?: string): void {
    this.memoryPausedCentres.set(centreId, { isPaused, reason });
  }

  /**
   * Computes operational Queue Snapshot for staff dashboards & public displays
   */
  public async getQueueSnapshotForCentre(centreId: string, centreName: string = 'Procurement Centre'): Promise<QueueSnapshot> {
    let allEntries: QueueEntryRecord[] = [];

    try {
      const res = await pool.query(
        `SELECT * FROM queue_entries WHERE centre_id = $1 AND status IN ('WAITING', 'CALLED', 'PROCESSING') ORDER BY priority_score DESC, created_at ASC`,
        [centreId]
      );
      if (res.rows.length > 0) {
        allEntries = res.rows.map((r) => this.mapDbRowToQueueEntry(r));
      }
    } catch (err) {
      // Fallback
    }

    if (allEntries.length === 0) {
      allEntries = Array.from(this.memoryEntries.values()).filter(
        (e) => e.centreId === centreId && ['WAITING', 'CALLED', 'PROCESSING'].includes(e.status)
      );
    }

    const serving = allEntries
      .filter((e) => e.status === 'CALLED' || e.status === 'PROCESSING')
      .map((e) => ({
        queueEntryId: e.id,
        tokenCode: e.tokenCode,
        stationId: e.assignedStationId || 'COUNTER_1',
        calledAt: e.calledAt || e.updatedAt
      }));

    const waiting = allEntries
      .filter((e) => e.status === 'WAITING')
      .sort((a, b) => {
        if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
        return a.createdAt.localeCompare(b.createdAt);
      });

    const nextTokens = waiting.slice(0, 5).map((w) => ({
      queueEntryId: w.id,
      tokenCode: w.tokenCode,
      priorityScore: w.priorityScore
    }));

    // Dynamic operational wait estimate: ~5 minutes per waiting farmer divided by active counters
    const activeCounters = Math.max(1, serving.length || 2);
    const estimatedWaitMinutes = Math.round((waiting.length * 5) / activeCounters);

    const pausedInfo = this.memoryPausedCentres.get(centreId);

    return {
      centreId,
      centreName,
      currentlyServing: serving,
      nextTokens,
      waitingCount: waiting.length,
      activeCounters,
      estimatedWaitMinutes,
      isPaused: pausedInfo ? pausedInfo.isPaused : false,
      disruptionReason: pausedInfo ? pausedInfo.reason : null,
      lastUpdatedAt: new Date().toISOString()
    };
  }

  /**
   * Calculates live position for a farmer in queue
   */
  public async getFarmerPositionInQueue(
    centreId: string,
    queueEntryId: string
  ): Promise<{ position: number; peopleAhead: number; currentlyServingToken: string | null; estimatedWaitMinutes: number }> {
    const entry = await this.findQueueEntryById(queueEntryId);
    if (!entry || entry.status !== 'WAITING') {
      return { position: 0, peopleAhead: 0, currentlyServingToken: null, estimatedWaitMinutes: 0 };
    }

    const snapshot = await this.getQueueSnapshotForCentre(centreId);
    const waitingList = Array.from(this.memoryEntries.values())
      .filter((e) => e.centreId === centreId && e.status === 'WAITING')
      .sort((a, b) => {
        if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
        return a.createdAt.localeCompare(b.createdAt);
      });

    const index = waitingList.findIndex((w) => w.id === queueEntryId);
    const peopleAhead = index >= 0 ? index : 0;
    const position = peopleAhead + 1;
    const currentlyServingToken = snapshot.currentlyServing.length > 0 ? snapshot.currentlyServing[0].tokenCode : null;
    const estimatedWaitMinutes = Math.round((peopleAhead * 5) / Math.max(1, snapshot.activeCounters));

    return {
      position,
      peopleAhead,
      currentlyServingToken,
      estimatedWaitMinutes
    };
  }

  public async recordQueueEvent(event: QueueEventRecord): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO queue_events (id, queue_entry_id, event_type, previous_status, new_status, actor_id, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          event.id,
          event.queueEntryId,
          event.eventType,
          event.previousStatus || null,
          event.newStatus,
          event.actorId,
          event.metadata ? JSON.stringify(event.metadata) : null,
          event.createdAt
        ]
      );
    } catch (err) {
      // Memory fallback active
    }
    this.memoryEvents.push(event);
  }

  public async getQueueEventsForEntry(queueEntryId: string): Promise<QueueEventRecord[]> {
    try {
      const res = await pool.query(
        `SELECT * FROM queue_events WHERE queue_entry_id = $1 ORDER BY created_at ASC`,
        [queueEntryId]
      );
      if (res.rows.length > 0) {
        return res.rows.map((row) => ({
          id: row.id,
          queueEntryId: row.queue_entry_id,
          eventType: row.event_type,
          previousStatus: row.previous_status,
          newStatus: row.new_status,
          actorId: row.actor_id,
          metadata: row.metadata ? JSON.parse(JSON.stringify(row.metadata)) : null,
          createdAt: new Date(row.created_at).toISOString()
        }));
      }
    } catch (err) {
      // Fallback
    }
    return this.memoryEvents.filter((e) => e.queueEntryId === queueEntryId);
  }

  private mapDbRowToQueueEntry(row: any): QueueEntryRecord {
    return {
      id: row.id,
      centreId: row.centre_id,
      bookingId: row.booking_id,
      farmerId: row.farmer_id,
      tokenId: row.token_id,
      tokenCode: row.token_code || `T-${String(row.queue_number || 1).padStart(3, '0')}`,
      queueNumber: Number(row.queue_number || 1),
      priorityScore: Number(row.priority_score || 1.0),
      status: row.status as QueueStatus,
      calledAt: row.called_at ? new Date(row.called_at).toISOString() : null,
      serviceStartedAt: row.service_started_at ? new Date(row.service_started_at).toISOString() : null,
      serviceCompletedAt: row.service_completed_at ? new Date(row.service_completed_at).toISOString() : null,
      estimatedWaitMinutes: Number(row.estimated_wait_minutes || 30),
      assignedStationId: row.assigned_station_id || null,
      skipReason: row.skip_reason || null,
      version: Number(row.version || 1),
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString()
    };
  }
}

export const queueRepository = new QueueRepository();
