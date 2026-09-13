import { ProcurementCentreDetail, CentreDisruptionDetail } from '../../types/domain';
import { WorkloadEvaluationResult } from './WorkloadEvaluator';

export interface ScoringWeights {
  distanceWeight: number; // default 0.25
  waitingTimeWeight: number; // default 0.30
  capacityWeight: number; // default 0.20
  workloadWeight: number; // default 0.15
  statusWeight: number; // default 0.10
}

export class CentreScoringService {
  private weights: ScoringWeights;

  constructor(customWeights?: Partial<ScoringWeights>) {
    this.weights = {
      distanceWeight: customWeights?.distanceWeight ?? 0.25,
      waitingTimeWeight: customWeights?.waitingTimeWeight ?? 0.30,
      capacityWeight: customWeights?.capacityWeight ?? 0.20,
      workloadWeight: customWeights?.workloadWeight ?? 0.15,
      statusWeight: customWeights?.statusWeight ?? 0.10
    };
  }

  public calculateScore(
    centre: ProcurementCentreDetail,
    distanceKm: number | null,
    workload: WorkloadEvaluationResult,
    disruptions: CentreDisruptionDetail[]
  ): number {
    // 1. Distance score (0-100)
    let distanceScore = 75; // Default score if distance unavailable
    if (distanceKm !== null) {
      distanceScore = Math.max(0, 100 - distanceKm * 2);
    }

    // 2. Waiting time score (0-100)
    // 15 mins = 100 points, 90 mins = 0 points
    const waitScore = Math.max(0, 100 - Math.max(0, workload.estimatedWaitMinutes - 15) * 1.33);

    // 3. Capacity score (0-100)
    const capacityScore = workload.activeCapacityRatio * 100;

    // 4. Workload score (0-100)
    const workloadScore = (1 - workload.workloadRatio) * 100;

    // 5. Operational Status score (0-100)
    let statusScore = 100;
    switch (centre.status) {
      case 'NORMAL':
        statusScore = 100;
        break;
      case 'BUSY':
        statusScore = 75;
        break;
      case 'CONGESTED':
        statusScore = 50;
        break;
      case 'CRITICAL':
        statusScore = 25;
        break;
      default:
        statusScore = 10;
    }

    // Weighted raw score sum
    const rawScore =
      this.weights.distanceWeight * distanceScore +
      this.weights.waitingTimeWeight * waitScore +
      this.weights.capacityWeight * capacityScore +
      this.weights.workloadWeight * workloadScore +
      this.weights.statusWeight * statusScore;

    // Disruption penalty subtraction
    const activeDisruptions = disruptions.filter((d) => d.status !== 'RESOLVED');
    const disruptionPenalty = activeDisruptions.length * 15;

    const finalScore = Math.max(0, Math.min(100, Math.round(rawScore - disruptionPenalty)));
    return finalScore;
  }
}

export const centreScoringService = new CentreScoringService();
