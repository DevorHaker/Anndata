import { apiClient } from './apiClient';

export interface DigitalToken {
  id: string;
  tokenCode: string;
  bookingId: string;
  farmerId: string;
  centreId: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED' | 'CANCELLED';
  expiresAt: string;
  issuedAt: string;
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

export interface FarmerQueueStatus {
  token: {
    id: string;
    tokenCode: string;
    status: string;
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
    status: string;
    queueNumber: number;
    position: number;
    peopleAhead: number;
    currentlyServingToken?: string | null;
    servingStation?: string | null;
    estimatedWaitMinutes: number;
    lastUpdatedAt: string;
  } | null;
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

export const tokenQueueService = {
  async generateToken(bookingId: string): Promise<DigitalToken> {
    const res = await apiClient.post<DigitalToken>('/tokens/generate', { bookingId });
    return res.data!;
  },

  async getTokenByBooking(bookingId: string): Promise<DigitalToken> {
    const res = await apiClient.get<DigitalToken>(`/tokens/booking/${bookingId}`);
    return res.data!;
  },

  async getQRPayload(tokenId: string): Promise<QRPayload> {
    const res = await apiClient.get<QRPayload>(`/tokens/${tokenId}/qr`);
    return res.data!;
  },

  async getFarmerQueueStatus(bookingId: string): Promise<FarmerQueueStatus> {
    const res = await apiClient.get<FarmerQueueStatus>(`/queue/farmer?bookingId=${bookingId}`);
    return res.data!;
  },

  async getCentreQueueSnapshot(centreId: string): Promise<QueueSnapshot> {
    const res = await apiClient.get<QueueSnapshot>(`/queue/snapshot?centreId=${centreId}`);
    return res.data!;
  },

  async scanQRCheckin(qrPayload: QRPayload, centreId: string) {
    const res = await apiClient.post<any>('/checkins/qr', { qrPayload, centreId });
    return res;
  },

  async manualTokenCheckin(tokenCode: string, centreId: string) {
    const res = await apiClient.post<any>('/checkins/token', { tokenCode, centreId });
    return res;
  },

  async callNextToken(centreId: string, stationId: string = 'COUNTER_1') {
    const res = await apiClient.post<any>('/queue/call-next', { centreId, stationId });
    return res;
  },

  async serveToken(queueEntryId: string, stationId: string = 'COUNTER_1') {
    const res = await apiClient.post<any>(`/queue/${queueEntryId}/serve`, { stationId });
    return res;
  },

  async completeToken(queueEntryId: string) {
    const res = await apiClient.post<any>(`/queue/${queueEntryId}/complete`);
    return res;
  },

  async skipToken(queueEntryId: string, reason: string) {
    const res = await apiClient.post<any>(`/queue/${queueEntryId}/skip`, { reason });
    return res;
  },

  async recallToken(queueEntryId: string) {
    const res = await apiClient.post<any>(`/queue/${queueEntryId}/recall`);
    return res;
  },

  async pauseQueue(centreId: string, reason: string) {
    const res = await apiClient.post<any>('/queue/pause', { centreId, reason });
    return res;
  },

  async resumeQueue(centreId: string) {
    const res = await apiClient.post<any>('/queue/resume', { centreId });
    return res;
  }
};
