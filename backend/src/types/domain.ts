/**
 * types/domain.ts
 *
 * Domain type barrel — re-exports all Phase 6 domain types for backward
 * compatibility with recommendation sub-services that import from '../../types/domain'.
 *
 * This avoids modifying all recommendation service import paths while keeping
 * the types defined in their canonical location (phase6.ts).
 */
export type {
  VerificationStatus,
  AccountStatus,
  CentreOperationalStatus,
  EquipmentStatus,
  DisruptionSeverity,
  DisruptionStatus,
  FarmerProfileData,
  FarmerDetail,
  CropType,
  CropVariety,
  FarmerProduceDetail,
  ProcurementCentreDetail,
  CentreOperatingHour,
  CentreCapacityConfig,
  CentreServiceDetail,
  CentreSupportedCropDetail,
  CentreStaffAssignment,
  EquipmentDetail,
  CentreDisruptionDetail,
  PaginatedResult,
} from './phase6';
