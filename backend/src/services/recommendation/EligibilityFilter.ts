import { ProcurementCentreDetail, CentreDisruptionDetail } from '../../types/domain';
import { SlotRecord } from '../../types/scheduling';

export interface EligibilityResult {
  isEligible: boolean;
  ineligibilityReasons: string[];
}

export class EligibilityFilter {
  public evaluateCentreEligibility(
    centre: ProcurementCentreDetail,
    disruptions: CentreDisruptionDetail[],
    slots: SlotRecord[],
    requestedCropTypeId: string,
    requestedQuantityKg: number,
    distanceKm: number | null,
    maxDistanceKm: number = 50
  ): EligibilityResult {
    const reasons: string[] = [];

    // 1. Operational status check
    if (centre.status === 'CLOSED') {
      reasons.push('Centre is currently CLOSED for operations.');
    } else if (centre.status === 'EMERGENCY') {
      reasons.push('Centre is in EMERGENCY state. Operations suspended.');
    }

    // 2. Active critical disruption check
    const activeCriticalDisruption = disruptions.find(
      (d) => d.status !== 'RESOLVED' && (d.severity === 'CRITICAL' || d.severity === 'HIGH')
    );
    if (activeCriticalDisruption) {
      reasons.push(`Centre affected by critical incident: ${activeCriticalDisruption.title}`);
    }

    // 3. Search distance check
    if (distanceKm !== null && distanceKm > maxDistanceKm) {
      reasons.push(`Centre is outside maximum search radius (${distanceKm} km > ${maxDistanceKm} km).`);
    }

    // 4. Available active slot check
    const hasAvailableSlot = slots.some(
      (s) => s.status === 'ACTIVE' && s.availableCapacity > 0 && s.availableQuantityKg >= requestedQuantityKg
    );
    if (!hasAvailableSlot) {
      reasons.push('No available time slots with sufficient farmer & quantity capacity.');
    }

    return {
      isEligible: reasons.length === 0,
      ineligibilityReasons: reasons
    };
  }
}

export const eligibilityFilter = new EligibilityFilter();
