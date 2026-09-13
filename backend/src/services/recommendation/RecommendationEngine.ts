import { centreDomainRepository } from '../../repositories/centreDomain.repository';
import { farmerDomainRepository } from '../../repositories/farmerDomain.repository';
import { slotRepository } from '../../repositories/slot.repository';
import { distanceCalculator } from './DistanceCalculator';
import { eligibilityFilter } from './EligibilityFilter';
import { workloadEvaluator } from './WorkloadEvaluator';
import { centreScoringService } from './CentreScoringService';
import { recommendationExplanationService } from './RecommendationExplanationService';
import { quantityWorkloadModel } from './QuantityWorkloadModel';
import { RecommendationRequest, CentreRecommendationScore } from '../../types/scheduling';
import { logger } from '../../utils/logger';

export class RecommendationEngine {
  public async getRecommendations(
    req: RecommendationRequest
  ): Promise<CentreRecommendationScore[]> {
    const { farmerId, cropTypeId, quantityKg, preferredDate, latitude, longitude, district, maxDistanceKm } = req;

    // 1. Fetch farmer profile if farmerId is provided to resolve home district / location fallback
    let farmerLat = latitude;
    let farmerLon = longitude;
    let farmerDistrict = district;

    if (farmerId) {
      const farmer = await farmerDomainRepository.findFarmerById(farmerId);
      if (farmer) {
        if (farmerLat === undefined || farmerLat === null) {
          farmerLat = farmer.profile?.latitude ? Number(farmer.profile.latitude) : null;
        }
        if (farmerLon === undefined || farmerLon === null) {
          farmerLon = farmer.profile?.longitude ? Number(farmer.profile.longitude) : null;
        }
        if (!farmerDistrict) {
          farmerDistrict = farmer.profile?.district || null;
        }
      }
    }

    // 2. Fetch candidate procurement centres
    const centresRes = await centreDomainRepository.listCentres({});
    const centres = centresRes.data;

    // 3. Resolve crop name
    const cropCatalog = await farmerDomainRepository.listCropTypes();
    const crop = cropCatalog.find((c) => c.id === cropTypeId || c.code === cropTypeId);
    const cropName = crop ? crop.name : 'Wheat';

    // Calculate workload-aware estimated service minutes for requested quantity
    const estimatedServiceMinutes = quantityWorkloadModel.calculateEstimatedServiceMinutes(quantityKg);

    const scoredCentres: CentreRecommendationScore[] = [];

    // 4. Iterate and evaluate candidate centres
    for (const centre of centres) {
      // Fetch centre capacity, disruptions, and active slots
      const [capacity, disruptions, slots] = await Promise.all([
        centreDomainRepository.getCapacity(centre.id),
        centreDomainRepository.listDisruptions(centre.id),
        slotRepository.findSlotsByCentreAndDate(centre.id, preferredDate, cropTypeId)
      ]);

      // Distance calculation
      const distanceRes = distanceCalculator.calculateDistance(
        farmerLat,
        farmerLon,
        centre.latitude,
        centre.longitude
      );

      // Filter eligibility
      const eligibility = eligibilityFilter.evaluateCentreEligibility(
        centre,
        disruptions,
        slots,
        cropTypeId,
        quantityKg,
        distanceRes.distanceKm,
        maxDistanceKm || 50
      );

      // Skip ineligible centres
      if (!eligibility.isEligible) {
        continue;
      }

      // Evaluate workload and queue wait estimate
      const workload = workloadEvaluator.evaluateWorkload(centre, capacity, slots, disruptions);

      // Calculate score
      const score = centreScoringService.calculateScore(centre, distanceRes.distanceKm, workload, disruptions);

      // Available active slots matching required quantity
      const availableSlots = slots.filter(
        (s) => s.status === 'ACTIVE' && s.availableCapacity > 0 && s.availableQuantityKg >= quantityKg
      );

      scoredCentres.push({
        centre: {
          id: centre.id,
          centreCode: centre.centreCode,
          name: centre.name,
          district: centre.district,
          subDistrict: centre.subDistrict,
          addressText: centre.addressText,
          latitude: centre.latitude,
          longitude: centre.longitude,
          operationalStatus: centre.status,
          contactPhone: centre.contactPhone
        },
        score,
        distanceKm: distanceRes.distanceKm,
        estimatedTravelTimeMinutes: distanceRes.estimatedTravelTimeMinutes,
        estimatedWaitMinutes: workload.estimatedWaitMinutes,
        estimatedServiceMinutes,
        workloadIndex: workload.workloadIndex,
        workloadRatio: workload.workloadRatio,
        availableSlots,
        reasons: [],
        warnings: []
      });
    }

    // 5. Detect load balancing: Is the #1 ranked centre slightly farther but significantly lower wait time?
    if (scoredCentres.length > 1) {
      // Sort by score descending
      scoredCentres.sort((a, b) => b.score - a.score);

      const top = scoredCentres[0];
      const nearest = [...scoredCentres].sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999))[0];

      const isLoadBalanced =
        nearest &&
        top.centre.id !== nearest.centre.id &&
        top.estimatedWaitMinutes < nearest.estimatedWaitMinutes;

      // Populate explanations for sorted list
      for (const item of scoredCentres) {
        const centre = centres.find((c) => c.id === item.centre.id)!;
        const disruptions = await centreDomainRepository.listDisruptions(item.centre.id);
        const workloadRes = workloadEvaluator.evaluateWorkload(
          centre,
          await centreDomainRepository.getCapacity(item.centre.id),
          item.availableSlots,
          disruptions
        );

        const exp = recommendationExplanationService.generateExplanations(
          centre,
          cropName,
          item.distanceKm,
          workloadRes,
          disruptions,
          isLoadBalanced && item.centre.id === top.centre.id
        );
        item.reasons = exp.reasons;
        item.warnings = exp.warnings;
      }
    } else if (scoredCentres.length === 1) {
      const item = scoredCentres[0];
      const centre = centres.find((c) => c.id === item.centre.id)!;
      const disruptions = await centreDomainRepository.listDisruptions(item.centre.id);
      const workloadRes = workloadEvaluator.evaluateWorkload(
        centre,
        await centreDomainRepository.getCapacity(item.centre.id),
        item.availableSlots,
        disruptions
      );
      const exp = recommendationExplanationService.generateExplanations(
        centre,
        cropName,
        item.distanceKm,
        workloadRes,
        disruptions,
        false
      );
      item.reasons = exp.reasons;
      item.warnings = exp.warnings;
    }

    return scoredCentres;
  }
}

export const recommendationEngine = new RecommendationEngine();
