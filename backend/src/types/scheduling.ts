export type SlotStatus = 'ACTIVE' | 'FULL' | 'CANCELLED' | 'CLOSED';

export type BookingStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_QUEUE'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'NO_SHOW'
  | 'RESCHEDULED';

export interface SlotRecord {
  id: string;
  centreId: string;
  cropTypeId: string;
  slotDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM:SS or HH:MM
  endTime: string; // HH:MM:SS or HH:MM
  totalCapacity: number; // Max farmers
  confirmedCount: number;
  availableCapacity: number;
  maxQuantityKg: number;
  bookedQuantityKg: number;
  availableQuantityKg: number;
  maxServiceMinutes: number;
  bookedServiceMinutes: number;
  availableServiceMinutes: number;
  status: SlotStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookingRecord {
  id: string;
  bookingReferenceId: string;
  farmerId: string;
  centreId: string;
  slotId: string;
  cropTypeId: string;
  declaredWeightKg: number;
  estimatedServiceMinutes: number;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  idempotencyKey?: string | null;
  cancellationReason?: string | null;
  rescheduledFromId?: string | null;
  rescheduledCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface BookingEventRecord {
  id: string;
  bookingId: string;
  previousStatus: string | null;
  newStatus: string;
  actorId: string;
  actorRole: string;
  reason?: string | null;
  createdAt: string;
}

export interface RecommendationRequest {
  farmerId?: string | null;
  cropTypeId: string;
  quantityKg: number;
  preferredDate: string; // YYYY-MM-DD
  latitude?: number | null;
  longitude?: number | null;
  district?: string | null;
  maxDistanceKm?: number;
}

export interface CentreRecommendationScore {
  centre: {
    id: string;
    centreCode: string;
    name: string;
    district: string;
    subDistrict: string;
    addressText: string;
    latitude: number;
    longitude: number;
    operationalStatus: string;
    contactPhone?: string | null;
  };
  score: number; // 0 to 100
  distanceKm: number | null;
  estimatedTravelTimeMinutes: number | null;
  estimatedWaitMinutes: number;
  estimatedServiceMinutes: number;
  workloadIndex: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  workloadRatio: number;
  availableSlots: SlotRecord[];
  reasons: string[];
  warnings: string[];
}
