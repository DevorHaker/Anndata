export type SyncActionType = 
  | 'CHECK_IN'
  | 'OPERATIONAL_NOTE'
  | 'WEIGHMENT_ENTRY'
  | 'QUALITY_OBSERVATION'
  | 'QUEUE_STATUS_UPDATE';

export type SyncActionStatus = 
  | 'PENDING_SYNC'
  | 'SYNCING'
  | 'SERVER_VALIDATED'
  | 'SYNCED'
  | 'SYNC_FAILED'
  | 'CONFLICT'
  | 'REQUIRES_REVIEW';

export interface OfflineActionPayload {
  actionId: string;
  type: SyncActionType;
  entityId: string;
  centreId: string;
  actorId: string;
  timestamp: string;
  clientVersion: number;
  payload: Record<string, any>;
  status: SyncActionStatus;
  retryCount: number;
  errorCode?: string;
  errorMessage?: string;
}

export interface SyncBatchRequest {
  deviceId: string;
  actions: OfflineActionPayload[];
}

export interface SyncActionResult {
  actionId: string;
  status: SyncActionStatus;
  entityId: string;
  serverState?: any;
  conflictReason?: string;
  errorMessage?: string;
  syncedAt?: string;
}

export interface SyncBatchResponse {
  accepted: SyncActionResult[];
  rejected: SyncActionResult[];
  conflicts: SyncActionResult[];
  serverTimestamp: string;
}

export interface ConflictRecord {
  id: string;
  actionId: string;
  centreId: string;
  actorId: string;
  entityType: string;
  entityId: string;
  clientState: any;
  serverState: any;
  reason: string;
  resolved: boolean;
  resolutionAction?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}
