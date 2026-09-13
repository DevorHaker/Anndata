import { syncRepository } from '../../repositories/sync.repository';
import { checkinRepository } from '../../repositories/checkin.repository';
import { tokenRepository } from '../../repositories/token.repository';
import { 
  SyncBatchRequest, 
  SyncBatchResponse, 
  SyncActionResult, 
  OfflineActionPayload, 
  ConflictRecord 
} from '../../types/sync';
import { logger } from '../../utils/logger';

export class SyncService {
  /**
   * Process batch of queued offline actions with server authority & conflict detection
   */
  async processSyncBatch(request: SyncBatchRequest): Promise<SyncBatchResponse> {
    const accepted: SyncActionResult[] = [];
    const rejected: SyncActionResult[] = [];
    const conflicts: SyncActionResult[] = [];
    const now = new Date().toISOString();

    for (const action of request.actions) {
      try {
        // 1. Idempotency Check: check if action has already been synced
        const existing = await syncRepository.getActionById(action.actionId);
        if (existing && existing.status === 'SYNCED') {
          accepted.push({
            actionId: action.actionId,
            status: 'SYNCED',
            entityId: action.entityId,
            syncedAt: existing.timestamp
          });
          continue;
        }

        // 2. Validate Action based on Type
        const result = await this.processSingleAction(action);
        if (result.status === 'SYNCED') {
          accepted.push(result);
          await syncRepository.recordSyncedAction({
            ...action,
            status: 'SYNCED'
          });
        } else if (result.status === 'CONFLICT' || result.status === 'REQUIRES_REVIEW') {
          conflicts.push(result);
          await syncRepository.recordSyncedAction({
            ...action,
            status: 'CONFLICT'
          });
        } else {
          rejected.push(result);
          await syncRepository.recordSyncedAction({
            ...action,
            status: 'SYNC_FAILED',
            errorMessage: result.errorMessage
          });
        }
      } catch (err: any) {
        logger.error(`SyncService: Exception processing action ${action.actionId}: ${err.message}`);
        rejected.push({
          actionId: action.actionId,
          status: 'SYNC_FAILED',
          entityId: action.entityId,
          errorMessage: err.message
        });
      }
    }

    return {
      accepted,
      rejected,
      conflicts,
      serverTimestamp: now
    };
  }

  private async processSingleAction(action: OfflineActionPayload): Promise<SyncActionResult> {
    const now = new Date().toISOString();

    switch (action.type) {
      case 'CHECK_IN': {
        // Fetch current server state of token
        const token = await tokenRepository.findTokenById(action.entityId);
        if (!token) {
          return {
            actionId: action.actionId,
            status: 'SYNC_FAILED',
            entityId: action.entityId,
            errorMessage: `Token ${action.entityId} not found on server`
          };
        }

        // Server authority check: if already USED or CANCELLED, detect potential conflict
        if (token.status === 'USED' || token.status === 'CANCELLED') {
          const conflict = await syncRepository.recordConflict({
            actionId: action.actionId,
            centreId: action.centreId,
            actorId: action.actorId,
            entityType: 'TOKEN',
            entityId: action.entityId,
            clientState: { status: 'CHECKED_IN', timestamp: action.timestamp },
            serverState: { status: token.status, tokenCode: token.tokenCode },
            reason: `Server token state is ${token.status} while offline action requested CHECK_IN`
          });

          return {
            actionId: action.actionId,
            status: 'CONFLICT',
            entityId: action.entityId,
            serverState: { status: token.status },
            conflictReason: conflict.reason
          };
        }

        // Apply offline checkin to server repository
        await checkinRepository.createCheckin({
          tokenId: token.id,
          bookingId: token.bookingId,
          centreId: action.centreId,
          farmerId: token.farmerId,
          checkedInBy: action.actorId,
          verificationMethod: 'QR_SCAN'
        });

        await tokenRepository.updateTokenStatus(token.id, 'USED');

        return {
          actionId: action.actionId,
          status: 'SYNCED',
          entityId: action.entityId,
          syncedAt: now
        };
      }

      case 'OPERATIONAL_NOTE':
      case 'WEIGHMENT_ENTRY':
      case 'QUALITY_OBSERVATION':
      case 'QUEUE_STATUS_UPDATE': {
        // Validate payload presence
        if (!action.payload) {
          return {
            actionId: action.actionId,
            status: 'SYNC_FAILED',
            entityId: action.entityId,
            errorMessage: 'Payload is empty'
          };
        }

        return {
          actionId: action.actionId,
          status: 'SYNCED',
          entityId: action.entityId,
          syncedAt: now
        };
      }

      default:
        return {
          actionId: action.actionId,
          status: 'SYNC_FAILED',
          entityId: action.entityId,
          errorMessage: `Unknown offline action type ${(action as any).type}`
        };
    }
  }

  async getUnresolvedConflicts(centreId?: string): Promise<ConflictRecord[]> {
    return syncRepository.getUnresolvedConflicts(centreId);
  }

  async resolveConflict(conflictId: string, resolutionAction: string, resolvedBy: string): Promise<ConflictRecord | null> {
    return syncRepository.resolveConflict(conflictId, resolutionAction, resolvedBy);
  }

  async getSyncMetrics() {
    return syncRepository.getSyncMetrics();
  }
}

export const syncService = new SyncService();
