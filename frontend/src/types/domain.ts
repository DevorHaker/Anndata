export type VerificationStatus = 'UNVERIFIED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' | 'DRAFT';

export type CentreOperationalStatus = 'NORMAL' | 'BUSY' | 'CONGESTED' | 'CRITICAL' | 'CLOSED' | 'PARTIAL' | 'EMERGENCY';
export type EquipmentStatus = 'OPERATIONAL' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'DECOMMISSIONED';
export type DisruptionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DisruptionStatus = 'OPEN' | 'ACKNOWLEDGED' | 'MITIGATING' | 'RESOLVED' | 'CANCELLED';

export interface FarmerProfileData {
  villageName: string;
  subDistrict: string;
  district: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  preferredLanguage?: string;
  landHoldingAcres?: number;
}

export interface FarmerDetail {
  id: string;
  userId: string;
  farmerReferenceId: string;
  firstName: string;
  lastName: string;
  mobileNumber?: string;
  gender?: string | null;
  verificationStatus: VerificationStatus;
  status: AccountStatus;
  profile?: FarmerProfileData | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CropType {
  id: string;
  code: string;
  name: string;
  category: string;
  defaultUnit: string;
  isActive: boolean;
}

export interface FarmerProduceDetail {
  id: string;
  farmerId: string;
  cropTypeId: string;
  cropTypeName?: string;
  cropVarietyId?: string | null;
  harvestSeason: string;
  estimatedYieldKg: number;
  declaredQuantityKg: number;
  procuredQuantityKg: number;
  status: 'PENDING_CONFIRMATION' | 'EDIT_WINDOW' | 'DECLARED' | 'VERIFIED' | 'PROCURED' | 'CANCELLED';
  editableUntil?: string;
  centreId?: string;
  centreName?: string;
  createdAt: string;
}

export interface ProcurementCentreDetail {
  id: string;
  centreCode: string;
  name: string;
  district: string;
  subDistrict: string;
  state: string;
  pincode: string;
  addressText: string;
  latitude: number;
  longitude: number;
  timezone: string;
  contactPhone?: string | null;
  status: CentreOperationalStatus | 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface CentreCapacityConfig {
  id: string;
  centreId: string;
  dailyFarmerCapacity: number;
  dailyQuantityCapacityKg: number;
  hourlyThroughputKg: number;
  weighingStationCount: number;
  counterCount: number;
  storageCapacityQuintals: number;
  createdAt?: string;
}

export interface CentreDisruptionDetail {
  id: string;
  centreId: string;
  centreName?: string;
  disruptionType: string;
  severity: DisruptionSeverity;
  title: string;
  description: string;
  status: DisruptionStatus;
  startTime: string;
  expectedEndTime?: string | null;
  actualEndTime?: string | null;
  createdBy: string;
  resolvedBy?: string | null;
  resolutionNotes?: string | null;
  createdAt: string;
}

export interface CentreStaffAssignment {
  id: string;
  userId: string;
  userMobile?: string;
  centreId: string;
  assignmentRole: string;
  isActive: boolean;
  assignedFrom: string;
  assignedUntil?: string | null;
  createdAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
