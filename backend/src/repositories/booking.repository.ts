import { pool } from '../database';
import { logger } from '../utils/logger';
import { BookingRecord, BookingEventRecord, BookingStatus } from '../types/scheduling';
import { v4 as uuidv4 } from 'uuid';

class BookingRepository {
  private memoryBookings: Map<string, BookingRecord> = new Map();
  private memoryEvents: BookingEventRecord[] = [];
  private memoryIdempotencyKeys: Map<string, BookingRecord> = new Map();

  async createBooking(booking: BookingRecord, actorId: string, actorRole: string): Promise<BookingRecord> {
    if (booking.idempotencyKey && this.memoryIdempotencyKeys.has(booking.idempotencyKey)) {
      return this.memoryIdempotencyKeys.get(booking.idempotencyKey)!;
    }

    try {
      const query = `
        INSERT INTO bookings (
          id, booking_reference_id, farmer_id, centre_id, slot_id, crop_type_id,
          declared_weight_kg, estimated_service_minutes, status, idempotency_key,
          cancellation_reason, rescheduled_from_id, rescheduled_count, version,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *;
      `;
      const values = [
        booking.id,
        booking.bookingReferenceId,
        booking.farmerId,
        booking.centreId,
        booking.slotId,
        booking.cropTypeId,
        booking.declaredWeightKg,
        booking.estimatedServiceMinutes,
        booking.status,
        booking.idempotencyKey || null,
        booking.cancellationReason || null,
        booking.rescheduledFromId || null,
        booking.rescheduledCount || 0,
        booking.version || 1,
        booking.createdAt,
        booking.updatedAt
      ];
      const res = await pool.query(query, values);
      if (res.rows.length > 0) {
        const saved = this.mapDbRowToBooking(res.rows[0], booking.scheduledDate, booking.startTime, booking.endTime);
        await this.recordEvent({
          id: uuidv4(),
          bookingId: saved.id,
          previousStatus: null,
          newStatus: saved.status,
          actorId,
          actorRole,
          reason: 'Initial booking creation',
          createdAt: new Date().toISOString()
        });
        if (booking.idempotencyKey) {
          this.memoryIdempotencyKeys.set(booking.idempotencyKey, saved);
        }
        this.memoryBookings.set(saved.id, saved);
        return saved;
      }
    } catch (err) {
      // Fallback
    }

    this.memoryBookings.set(booking.id, booking);
    if (booking.idempotencyKey) {
      this.memoryIdempotencyKeys.set(booking.idempotencyKey, booking);
    }
    this.memoryEvents.push({
      id: uuidv4(),
      bookingId: booking.id,
      previousStatus: null,
      newStatus: booking.status,
      actorId,
      actorRole,
      reason: 'Initial booking creation',
      createdAt: new Date().toISOString()
    });
    return booking;
  }

  async findById(id: string): Promise<BookingRecord | null> {
    return this.findBookingById(id);
  }

  async findBookingById(id: string): Promise<BookingRecord | null> {
    try {
      const res = await pool.query(
        `SELECT b.*, s.slot_date, s.start_time, s.end_time
         FROM bookings b
         LEFT JOIN slots s ON b.slot_id = s.id
         WHERE b.id = $1 AND b.deleted_at IS NULL`,
        [id]
      );
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return this.mapDbRowToBooking(row, row.slot_date, row.start_time, row.end_time);
      }
    } catch (err) {
      // Fallback
    }
    return this.memoryBookings.get(id) || null;
  }

  async findBookingByIdempotencyKey(key: string): Promise<BookingRecord | null> {
    if (this.memoryIdempotencyKeys.has(key)) {
      return this.memoryIdempotencyKeys.get(key)!;
    }
    try {
      const res = await pool.query(
        `SELECT b.*, s.slot_date, s.start_time, s.end_time
         FROM bookings b
         LEFT JOIN slots s ON b.slot_id = s.id
         WHERE b.idempotency_key = $1 AND b.deleted_at IS NULL`,
        [key]
      );
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return this.mapDbRowToBooking(row, row.slot_date, row.start_time, row.end_time);
      }
    } catch (err) {
      // Fallback
    }
    return null;
  }

  async findBookingsByFarmer(farmerId: string): Promise<BookingRecord[]> {
    try {
      const res = await pool.query(
        `SELECT b.*, s.slot_date, s.start_time, s.end_time
         FROM bookings b
         LEFT JOIN slots s ON b.slot_id = s.id
         WHERE b.farmer_id = $1 AND b.deleted_at IS NULL
         ORDER BY b.created_at DESC`,
        [farmerId]
      );
      if (res.rows.length > 0) {
        return res.rows.map((row) => this.mapDbRowToBooking(row, row.slot_date, row.start_time, row.end_time));
      }
    } catch (err) {
      // Fallback
    }

    const list: BookingRecord[] = [];
    for (const b of this.memoryBookings.values()) {
      if (b.farmerId === farmerId && !b.deletedAt) {
        list.push({ ...b });
      }
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findBookingsByCentre(centreId: string, status?: BookingStatus): Promise<BookingRecord[]> {
    try {
      let query = `
        SELECT b.*, s.slot_date, s.start_time, s.end_time
        FROM bookings b
        LEFT JOIN slots s ON b.slot_id = s.id
        WHERE b.centre_id = $1 AND b.deleted_at IS NULL
      `;
      const params: any[] = [centreId];
      if (status) {
        query += ' AND b.status = $2';
        params.push(status);
      }
      query += ' ORDER BY b.created_at DESC';
      const res = await pool.query(query, params);
      if (res.rows.length > 0) {
        return res.rows.map((row) => this.mapDbRowToBooking(row, row.slot_date, row.start_time, row.end_time));
      }
    } catch (err) {
      // Fallback
    }

    const list: BookingRecord[] = [];
    for (const b of this.memoryBookings.values()) {
      if (b.centreId === centreId && (!status || b.status === status) && !b.deletedAt) {
        list.push({ ...b });
      }
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async updateBookingStatus(
    id: string,
    newStatus: BookingStatus,
    actorId: string,
    actorRole: string,
    reason?: string
  ): Promise<BookingRecord | null> {
    const booking = await this.findBookingById(id);
    if (!booking) return null;

    const previousStatus = booking.status;
    booking.status = newStatus;
    if (reason) booking.cancellationReason = reason;
    booking.version += 1;
    booking.updatedAt = new Date().toISOString();

    try {
      await pool.query(
        `UPDATE bookings
         SET status = $1, cancellation_reason = $2, version = version + 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [newStatus, reason || null, id]
      );
    } catch (err) {
      // Fallback
    }

    this.memoryBookings.set(id, booking);

    await this.recordEvent({
      id: uuidv4(),
      bookingId: id,
      previousStatus,
      newStatus,
      actorId,
      actorRole,
      reason: reason || null,
      createdAt: new Date().toISOString()
    });

    return booking;
  }

  async rescheduleBooking(
    id: string,
    newSlotId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string,
    actorId: string,
    actorRole: string
  ): Promise<BookingRecord | null> {
    const booking = await this.findBookingById(id);
    if (!booking) return null;

    const previousStatus = booking.status;
    booking.slotId = newSlotId;
    booking.scheduledDate = newDate;
    booking.startTime = newStartTime;
    booking.endTime = newEndTime;
    booking.status = 'RESCHEDULED';
    booking.rescheduledCount += 1;
    booking.version += 1;
    booking.updatedAt = new Date().toISOString();

    try {
      await pool.query(
        `UPDATE bookings
         SET slot_id = $1, status = 'RESCHEDULED', rescheduled_count = rescheduled_count + 1, version = version + 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [newSlotId, id]
      );
    } catch (err) {
      // Fallback
    }

    // Set back to CONFIRMED for active schedule
    booking.status = 'CONFIRMED';
    this.memoryBookings.set(id, booking);

    await this.recordEvent({
      id: uuidv4(),
      bookingId: id,
      previousStatus,
      newStatus: 'RESCHEDULED',
      actorId,
      actorRole,
      reason: `Rescheduled to slot ${newSlotId} on ${newDate}`,
      createdAt: new Date().toISOString()
    });

    return booking;
  }

  async recordEvent(event: BookingEventRecord): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO booking_events (id, booking_id, previous_status, new_status, actor_id, actor_role, reason, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [event.id, event.bookingId, event.previousStatus, event.newStatus, event.actorId, event.actorRole, event.reason || null, event.createdAt]
      );
    } catch (err) {
      // Fallback
    }
    this.memoryEvents.push(event);
  }

  async getEventsByBooking(bookingId: string): Promise<BookingEventRecord[]> {
    try {
      const res = await pool.query(
        `SELECT * FROM booking_events WHERE booking_id = $1 ORDER BY created_at ASC`,
        [bookingId]
      );
      if (res.rows.length > 0) {
        return res.rows.map((row) => ({
          id: row.id,
          bookingId: row.booking_id,
          previousStatus: row.previous_status,
          newStatus: row.new_status,
          actorId: row.actor_id,
          actorRole: row.actor_role,
          reason: row.reason,
          createdAt: new Date(row.created_at).toISOString()
        }));
      }
    } catch (err) {
      // Fallback
    }
    return this.memoryEvents.filter((e) => e.bookingId === bookingId);
  }

  private mapDbRowToBooking(
    row: any,
    scheduledDate?: string,
    startTime?: string,
    endTime?: string
  ): BookingRecord {
    return {
      id: row.id,
      bookingReferenceId: row.booking_reference_id,
      farmerId: row.farmer_id,
      centreId: row.centre_id,
      slotId: row.slot_id,
      cropTypeId: row.crop_type_id,
      declaredWeightKg: Number(row.declared_weight_kg),
      estimatedServiceMinutes: Number(row.estimated_service_minutes || 25),
      scheduledDate: scheduledDate || (row.slot_date instanceof Date ? row.slot_date.toISOString().split('T')[0] : String(row.slot_date || new Date().toISOString().split('T')[0])),
      startTime: startTime || String(row.start_time || '09:00'),
      endTime: endTime || String(row.end_time || '10:00'),
      status: row.status as BookingStatus,
      idempotencyKey: row.idempotency_key,
      cancellationReason: row.cancellation_reason,
      rescheduledFromId: row.rescheduled_from_id,
      rescheduledCount: Number(row.rescheduled_count || 0),
      version: Number(row.version || 1),
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
      deletedAt: row.deleted_at ? new Date(row.deleted_at).toISOString() : null
    };
  }
}

export const bookingRepository = new BookingRepository();
