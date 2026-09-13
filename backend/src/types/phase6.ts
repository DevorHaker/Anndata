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
  createdAt: Date;
  updatedAt?: Date;
}

export interface CropType {
  id: string;
  code: string;
  name: string;
  category: string;
  defaultUnit: string;
  isActive: boolean;
}

export interface CropVariety {
  id: string;
  cropTypeId: string;
  code: string;
  name: string;
  maxAcceptableMoisturePct: number;
}

export interface FarmerProduceDetail {
  id: string;
  farmerId: string;
  cropTypeId: string;
  cropTypeName?: string;
  cropVarietyId?: string | null;
  cropVarietyName?: string | null;
  harvestSeason: string;
  estimatedYieldKg: number;
  declaredQuantityKg: number;
  procuredQuantityKg: number;
  status: 'DECLARED' | 'VERIFIED' | 'PROCURED' | 'CANCELLED';
  createdAt: Date;
  updatedAt?: Date;
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
  createdAt: Date;
  updatedAt?: Date;
}

export interface CentreOperatingHour {
  id: string;
  centreId: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday...
  openTime: string;
  closeTime: string;
  slotDurationMinutes: number;
  isOperating: boolean;
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
  createdAt: Date;
  updatedAt?: Date;
}

export interface CentreServiceDetail {
  id: string;
  centreId: string;
  serviceCode: string;
  serviceName: string;
  isAvailable: boolean;
}

export interface CentreSupportedCropDetail {
  centreId: string;
  cropTypeId: string;
  cropTypeName?: string;
  dailyMaxIntakeKg: number;
  isActive: boolean;
}

export interface CentreStaffAssignment {
  id: string;
  userId: string;
  userMobile?: string;
  userName?: string;
  centreId: string;
  centreName?: string;
  assignmentRole: string;
  isActive: boolean;
  assignedFrom: string;
  assignedUntil?: string | null;
  createdAt: Date;
}

export interface EquipmentDetail {
  id: string;
  centreId: string;
  equipmentCode: string;
  equipmentType: string;
  makeModel?: string | null;
  serialNumber?: string | null;
  calibrationDate?: string | null;
  nextCalibrationDue?: string | null;
  status: EquipmentStatus;
  createdAt: Date;
  updatedAt?: Date;
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
  startTime: Date;
  expectedEndTime?: Date | null;
  actualEndTime?: Date | null;
  createdBy: string;
  resolvedBy?: string | null;
  resolutionNotes?: string | null;
  createdAt: Date;
  updatedAt?: Date;
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
