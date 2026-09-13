import { pool } from '../database';
import { logger } from '../utils/logger';
import { OfflineActionPayload, ConflictRecord, SyncActionResult } from '../types/sync';
import { v4 as uuidv4 } from 'uuid';

class SyncRepository {
  private memorySyncedActions: Map<string, OfflineActionPayload> = new Map();
  private memoryConflicts: Map<string, ConflictRecord> = new Map();

  public async getActionById(actionId: string): Promise<OfflineActionPayload | null> {
    return this.memorySyncedActions.get(actionId) || null;
  }

  public async recordSyncedAction(action: OfflineActionPayload): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO sync_actions (
          action_id, type, entity_id, centre_id, actor_id, client_timestamp,
          client_version, status, retry_count, error_code, payload, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)`,
        [
          action.actionId,
          action.type,
          action.entityId,
          action.centreId,
          action.actorId,
          action.timestamp,
          action.clientVersion,
          action.status,
          action.retryCount,
          action.errorCode || null,
          JSON.stringify(action.payload)
        ]
      );
    } catch (err) {
      // Memory fallback active
    }

    this.memorySyncedActions.set(action.actionId, action);
  }

  public async recordConflict(conflict: Omit<ConflictRecord, 'id' | 'createdAt' | 'resolved'>): Promise<ConflictRecord> {
    const record: ConflictRecord = {
      id: uuidv4(),
      ...conflict,
      resolved: false,
      createdAt: new Date().toISOString()
    };

    try {
      await pool.query(
        `INSERT INTO sync_conflicts (
          id, action_id, centre_id, actor_id, entity_type, entity_id,
          client_state, server_state, reason, resolved, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          record.id,
          record.actionId,
          record.centreId,
          record.actorId,
          record.entityType,
          record.entityId,
          JSON.stringify(record.clientState),
          JSON.stringify(record.serverState),
          record.reason,
          record.resolved,
          record.createdAt
        ]
      );
    } catch (err) {
      // Memory fallback active
    }

    this.memoryConflicts.set(record.id, record);
    return record;
  }

  public async getUnresolvedConflicts(centreId?: string): Promise<ConflictRecord[]> {
    try {
      const query = centreId
        ? `SELECT * FROM sync_conflicts WHERE resolved = false AND centre_id = $1 ORDER BY created_at DESC`
        : `SELECT * FROM sync_conflicts WHERE resolved = false ORDER BY created_at DESC`;
      const res = await pool.query(query, centreId ? [centreId] : []);
      if (res.rows.length > 0) {
        return res.rows.map(this.mapDbRowToConflict);
      }
    } catch (err) {
      // Fallback
    }

    return Array.from(this.memoryConflicts.values()).filter(
      (c) => !c.resolved && (!centreId || c.centreId === centreId)
    );
  }

  public async resolveConflict(conflictId: string, resolutionAction: string, resolvedBy: string): Promise<ConflictRecord | null> {
    const conflict = this.memoryConflicts.get(conflictId);
    const now = new Date().toISOString();

    if (conflict) {
      conflict.resolved = true;
      conflict.resolutionAction = resolutionAction;
      conflict.resolvedBy = resolvedBy;
      conflict.resolvedAt = now;
    }

    try {
      await pool.query(
        `UPDATE sync_conflicts SET resolved = true, resolution_action = $1, resolved_by = $2, resolved_at = $3 WHERE id = $4`,
        [resolutionAction, resolvedBy, now, conflictId]
      );
    } catch (err) {
      // Fallback
    }

    return conflict || null;
  }

  public async getSyncMetrics() {
    const actions = Array.from(this.memorySyncedActions.values());
    const conflicts = Array.from(this.memoryConflicts.values());
    const totalActions = actions.length;
    const synced = actions.filter((a) => a.status === 'SYNCED').length;
    const failed = actions.filter((a) => a.status === 'SYNC_FAILED').length;

    return {
      totalActions,
      synced,
      failed,
      conflictCount: conflicts.filter((c) => !c.resolved).length,
      syncSuccessRatePct: totalActions > 0 ? Math.round((synced / totalActions) * 100) : 100
    };
  }

  private mapDbRowToConflict(row: any): ConflictRecord {
    return {
      id: row.id,
      actionId: row.action_id,
      centreId: row.centre_id,
      actorId: row.actor_id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      clientState: JSON.parse(JSON.stringify(row.client_state)),
      serverState: JSON.parse(JSON.stringify(row.server_state)),
      reason: row.reason,
      resolved: row.resolved,
      resolutionAction: row.resolution_action,
      resolvedBy: row.resolved_by,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at).toISOString() : undefined,
      createdAt: new Date(row.created_at).toISOString()
    };
  }
}

export const syncRepository = new SyncRepository();
