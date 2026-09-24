import { ValidationError } from '../utils/errors';

export interface LandRecordVerification {
  isVerified: boolean;
  bhulekhRecordId: string;
  khasraNumber: string;
  khatauniNumber: string;
  district: string;
  state: string;
  verifiedAcreage: number; // in Acres
  cropVariety: string;
  stateYieldNormKgPerAcre: number;
  maxAntiHoardingQuotaKg: number;
  verifiedAt: string;
}

// Crop State Yield Norms (Kg per Acre) based on Agmarknet / CACP Guidelines
const STATE_YIELD_NORMS_KG_PER_ACRE: Record<string, number> = {
  'crop-paddy-a': 2500,
  'crop-001-wheat': 2000,
  'crop-mustard': 1200,
  'crop-pulses': 1000,
  'crop-maize': 2200,
  'default': 2000
};

export class LandRecordsService {
  /**
   * Mock/Sandbox API Adapter for State Land Records (Bhulekh API)
   */
  async verifyFarmerLandRecords(farmerId: string, cropTypeId: string): Promise<LandRecordVerification> {
    // Determine Yield Norm for Crop
    const normalizedCropKey = cropTypeId.toLowerCase();
    let yieldNorm = STATE_YIELD_NORMS_KG_PER_ACRE['default'];
    for (const key of Object.keys(STATE_YIELD_NORMS_KG_PER_ACRE)) {
      if (normalizedCropKey.includes(key) || key.includes(normalizedCropKey)) {
        yieldNorm = STATE_YIELD_NORMS_KG_PER_ACRE[key];
        break;
      }
    }

    // Default verified land record (e.g. 5.5 Acres verified via State Bhulekh DB)
    const verifiedAcreage = 5.5;
    const maxAntiHoardingQuotaKg = Math.round(verifiedAcreage * yieldNorm);

    return {
      isVerified: true,
      bhulekhRecordId: `BHULEKH-HR-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      khasraNumber: '142/15/2',
      khatauniNumber: '88-B',
      district: 'Karnal',
      state: 'Haryana',
      verifiedAcreage,
      cropVariety: cropTypeId,
      stateYieldNormKgPerAcre: yieldNorm,
      maxAntiHoardingQuotaKg,
      verifiedAt: new Date().toISOString()
    };
  }

  /**
   * Enforce Anti-Hoarding Quota Cap
   * Max Tonnage = Verified Acreage x State Yield Norm
   */
  async enforceAntiHoardingQuota(farmerId: string, cropTypeId: string, declaredWeightKg: number): Promise<LandRecordVerification> {
    const record = await this.verifyFarmerLandRecords(farmerId, cropTypeId);

    if (declaredWeightKg > record.maxAntiHoardingQuotaKg) {
      throw new ValidationError(
        `Anti-Hoarding Quota Exceeded! Declared weight (${declaredWeightKg.toLocaleString()} kg) exceeds maximum allowed quota of ${record.maxAntiHoardingQuotaKg.toLocaleString()} kg based on your Bhulekh verified acreage (${record.verifiedAcreage} Acres x ${record.stateYieldNormKgPerAcre} kg/acre norm).`,
        'EXCEEDS_ANTI_HOARDING_QUOTA'
      );
    }

    return record;
  }
}

export const landRecordsService = new LandRecordsService();
