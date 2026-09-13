import { ProcurementCentreDetail, CentreCapacityConfig, CentreDisruptionDetail } from '../../types/domain';
import { SlotRecord } from '../../types/scheduling';

export interface WorkloadEvaluationResult {
  workloadIndex: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  workloadRatio: number;
  estimatedWaitMinutes: number;
  totalConfirmedBookings: number;
  activeCapacityRatio: number;
}

export class WorkloadEvaluator {
  public evaluateWorkload(
    centre: ProcurementCentreDetail,
    capacity: CentreCapacityConfig | null,
    slots: SlotRecord[],
    disruptions: CentreDisruptionDetail[]
  ): WorkloadEvaluationResult {
    const dailyLimit = capacity?.dailyFarmerCapacity || 100;
    const weighbridges = Math.max(1, capacity?.weighingStationCount || 2);

    // Sum up total confirmed bookings across active slots
    const totalConfirmedBookings = slots.reduce((acc, s) => acc + s.confirmedCount, 0);

    const workloadRatio = Math.min(1.0, Math.round((totalConfirmedBookings / dailyLimit) * 100) / 100);

    // Workload Index Classification
    let workloadIndex: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (workloadRatio >= 0.9 || centre.status === 'CRITICAL') {
      workloadIndex = 'CRITICAL';
    } else if (workloadRatio >= 0.75 || centre.status === 'CONGESTED') {
      workloadIndex = 'HIGH';
    } else if (workloadRatio >= 0.5 || centre.status === 'BUSY') {
      workloadIndex = 'MODERATE';
    }

    // Base wait time calculation: (Confirmed Bookings / Weighbridges) * 8 mins average process time
    let baseWaitMinutes = Math.round((totalConfirmedBookings / weighbridges) * 8);

    // Operational Status Penalty
    let statusPenalty = 0;
    switch (centre.status) {
      case 'BUSY':
        statusPenalty = 15;
        break;
      case 'CONGESTED':
        statusPenalty = 30;
        break;
      case 'CRITICAL':
        statusPenalty = 60;
        break;
      default:
        statusPenalty = 0;
    }

    // Active Disruption Penalty
    const activeDisruptions = disruptions.filter((d) => d.status !== 'RESOLVED');
    const disruptionPenalty = activeDisruptions.length * 10;

    const estimatedWaitMinutes = Math.max(5, baseWaitMinutes + statusPenalty + disruptionPenalty);

    const activeCapacityRatio = Math.max(0, 1 - workloadRatio);

    return {
      workloadIndex,
      workloadRatio,
      estimatedWaitMinutes,
      totalConfirmedBookings,
      activeCapacityRatio
    };
  }
}

export const workloadEvaluator = new WorkloadEvaluator();
