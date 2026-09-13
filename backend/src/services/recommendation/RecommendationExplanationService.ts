import { ProcurementCentreDetail, CentreDisruptionDetail } from '../../types/domain';
import { WorkloadEvaluationResult } from './WorkloadEvaluator';

export class RecommendationExplanationService {
  public generateExplanations(
    centre: ProcurementCentreDetail,
    cropName: string,
    distanceKm: number | null,
    workload: WorkloadEvaluationResult,
    disruptions: CentreDisruptionDetail[],
    isLoadBalanced: boolean
  ): { reasons: string[]; warnings: string[] } {
    const reasons: string[] = [];
    const warnings: string[] = [];

    // 1. Distance explanation
    if (distanceKm !== null) {
      if (distanceKm <= 10) {
        reasons.push(`✓ Nearby facility: only ${distanceKm} km from your location`);
      } else {
        reasons.push(`✓ Located ${distanceKm} km away`);
      }
    } else {
      reasons.push('✓ District matched procurement centre');
    }

    // 2. Crop compatibility
    reasons.push(`✓ Your crop (${cropName}) is fully supported`);

    // 3. Waiting time & queue pressure
    if (workload.estimatedWaitMinutes <= 20) {
      reasons.push(`✓ Low expected waiting time (~${workload.estimatedWaitMinutes} mins)`);
    } else if (workload.estimatedWaitMinutes <= 45) {
      reasons.push(`✓ Moderate queue: ~${workload.estimatedWaitMinutes} mins estimated wait`);
    } else {
      warnings.push(`⚠ High queue pressure: ~${workload.estimatedWaitMinutes} mins estimated wait`);
    }

    // 4. Capacity status
    if (workload.activeCapacityRatio >= 0.5) {
      reasons.push(`✓ High available booking capacity (${Math.round(workload.activeCapacityRatio * 100)}% free)`);
    } else if (workload.activeCapacityRatio > 0.1) {
      reasons.push(`✓ Limited capacity remaining (${Math.round(workload.activeCapacityRatio * 100)}% free)`);
    } else {
      warnings.push(`⚠ Near maximum daily capacity (${Math.round(workload.activeCapacityRatio * 100)}% free)`);
    }

    // 5. Operational Status
    if (centre.status === 'NORMAL') {
      reasons.push('✓ Centre currently operating normally');
    } else if (centre.status === 'BUSY') {
      warnings.push('⚠ Centre experiencing busy token inflow');
    } else if (centre.status === 'CONGESTED') {
      warnings.push('⚠ Centre currently congested with heavy queue');
    }

    // 6. Cross-centre load balancing highlight
    if (isLoadBalanced) {
      reasons.push('✓ Recommended over closer centres due to 35%+ lower queue delay');
    }

    // 7. Disruptions
    const activeDisruptions = disruptions.filter((d) => d.status !== 'RESOLVED');
    for (const disruption of activeDisruptions) {
      warnings.push(`⚠ Active incident: ${disruption.title} (${disruption.severity})`);
    }

    return { reasons, warnings };
  }
}

export const recommendationExplanationService = new RecommendationExplanationService();
