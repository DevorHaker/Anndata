import { pool } from '../database';
import { logger } from '../utils/logger';

export interface AuditLogParams {
  requestId?: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  centreId?: string | null;
  beforeState?: any;
  afterState?: any;
  ipAddress: string;
  userAgent?: string | null;
  reason?: string | null;
}

export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  try {
    const query = `
      INSERT INTO audit_logs (
        request_id, actor_id, actor_role, action, entity_type, entity_id,
        centre_id, before_state, after_state, ip_address, user_agent, reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `;

    const values = [
      params.requestId || 'system',
      params.actorId,
      params.actorRole,
      params.action,
      params.entityType,
      params.entityId,
      params.centreId || null,
      params.beforeState ? JSON.stringify(params.beforeState) : null,
      params.afterState ? JSON.stringify(params.afterState) : null,
      params.ipAddress || '127.0.0.1',
      params.userAgent || null,
      params.reason || null
    ];

    await pool.query(query, values);
  } catch (err: any) {
    // Audit log failures should not crash business operations but must be logged to logger
    logger.error('Failed to record security audit log entry', { error: err.message, action: params.action, actorId: params.actorId });
  }
}

export const auditService = {
  recordAudit: logAuditEvent
};
