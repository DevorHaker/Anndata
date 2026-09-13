export type TokenStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED' | 'CANCELLED';

export type QueueStatus =
  | 'WAITING'
  | 'CALLED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'NO_SHOW'
  | 'CANCELLED';

export interface TokenRecord {
  id: string;
  tokenCode: string; // e.g. 'T-023' or 'SP-20260913-023'
  bookingId: string;
  farmerId: string;
  centreId: string;
  hmacSignature: string;
  status: TokenStatus;
  expiresAt: string;
  issuedAt: string;
  usedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CheckinRecord {
  id: string;
  tokenId: string;
  bookingId: string;
  centreId: string;
  farmerId: string;
  checkedInBy: string; // Officer user ID
  verificationMethod: 'QR_SCAN' | 'MANUAL_OVERRIDE';
  checkinTimestamp: string;
  deviceMetadata?: any;
  createdAt: string;
}

export interface QueueEntryRecord {
  id: string;
  centreId: string;
  bookingId: string;
  farmerId: string;
  tokenId: string;
  tokenCode: string;
  queueNumber: number; // Sequential integer e.g. 23
  priorityScore: number;
  status: QueueStatus;
  calledAt?: string | null;
  serviceStartedAt?: string | null;
  serviceCompletedAt?: string | null;
  estimatedWaitMinutes: number;
  assignedStationId?: string | null; // e.g. 'COUNTER_1' or 'WEIGHBRIDGE_01'
  skipReason?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface QueueEventRecord {
  id: string;
  queueEntryId: string;
  eventType: string; // 'TOKEN_GENERATED', 'TOKEN_CHECKED_IN', 'TOKEN_CALLED', 'SERVICE_STARTED', 'SERVICE_COMPLETED', 'TOKEN_SKIPPED', 'TOKEN_RECALLED', 'NO_SHOW', 'QUEUE_PAUSED', 'QUEUE_RESUMED'
  previousStatus?: string | null;
  newStatus: string;
  actorId: string;
  metadata?: any;
  createdAt: string;
}

export interface QRPayload {
  type: 'PROCUREMENT_CHECKIN';
  tokenCode: string;
  tokenId: string;
  bookingId: string;
  centreId: string;
  timestamp: number;
  signature: string;
  version: number;
}

export interface QueueSnapshot {
  centreId: string;
  centreName: string;
  currentlyServing: {
    queueEntryId: string;
    tokenCode: string;
    stationId: string;
    calledAt: string;
  }[];
  nextTokens: {
    queueEntryId: string;
    tokenCode: string;
    priorityScore: number;
  }[];
  waitingCount: number;
  activeCounters: number;
  estimatedWaitMinutes: number;
  isPaused: boolean;
  disruptionReason?: string | null;
  lastUpdatedAt: string;
}

export interface FarmerQueueStatusResponse {
  token: {
    id: string;
    tokenCode: string;
    status: TokenStatus;
  };
  booking: {
    id: string;
    bookingReferenceId: string;
    centreId: string;
    scheduledDate: string;
    startTime: string;
  };
  queue: {
    queueEntryId: string;
    status: QueueStatus;
    queueNumber: number;
    position: number;
    peopleAhead: number;
    currentlyServingToken?: string | null;
    servingStation?: string | null;
    estimatedWaitMinutes: number;
    lastUpdatedAt: string;
  } | null;
}
