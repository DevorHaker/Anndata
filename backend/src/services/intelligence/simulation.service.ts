import { featureService } from './feature.service';
import { statisticalEngineService } from './statisticalEngine.service';
import { 
  SimulationScenarioRequest, 
  SimulationResult, 
  OperationalStage 
} from '../../types/intelligence';

export class SimulationService {
  /**
   * Execute deterministic discrete-event operational scenario simulation
   */
  async runSimulation(req: SimulationScenarioRequest): Promise<SimulationResult> {
    const startMs = Date.now();
    const features = await featureService.getCentreFeatureVector(req.centreId);

    const baselineWait = statisticalEngineService.calculateWaitTimeMinutes(features);
    const baselineQueue = features.queueLength;
    const baselineUtil = features.currentCentreUtilizationPct;

    // Simulate scenario parameter shifts
    const simulatedQueue = Math.max(0, baselineQueue + req.additionalArrivals - req.redistributedBookingsCount);
    
    // Effective capacity multiplier based on staff & equipment deltas
    const effectiveStaff = Math.max(1, features.staffAvailable + req.staffDelta);
    const effectiveEquip = Math.max(1, features.equipmentAvailable + req.equipmentDelta);
    const capacityFactor = (effectiveStaff / 6) * (effectiveEquip / Math.max(1, features.equipmentAvailable));

    // Simulated Wait Calculation
    const simulatedWait = Math.round((baselineWait * (simulatedQueue / Math.max(1, baselineQueue || 1))) / capacityFactor);
    const simulatedUtil = Math.min(100, Math.round(baselineUtil * (1 + (req.additionalArrivals * 0.03) - (req.redistributedBookingsCount * 0.03))));

    let impactSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (simulatedWait > 60 || simulatedUtil > 95) impactSeverity = 'CRITICAL';
    else if (simulatedWait > 40 || simulatedUtil > 85) impactSeverity = 'HIGH';
    else if (simulatedWait > 25 || simulatedUtil > 70) impactSeverity = 'MEDIUM';

    let predictedBottleneck: OperationalStage = 'WEIGHING';
    if (req.equipmentDelta < 0) predictedBottleneck = 'WEIGHING';
    else if (req.staffDelta < 0) predictedBottleneck = 'QUALITY';
    else if (req.additionalArrivals > 20) predictedBottleneck = 'QUEUE';

    const mitigations: string[] = [];
    if (simulatedWait > 30) {
      mitigations.push(`Redistribute at least ${Math.round(req.additionalArrivals * 0.6)} future bookings to nearby Mandi`);
    }
    if (req.equipmentDelta < 0) {
      mitigations.push('Deploy portable digital weighbridge unit to clear intake bottleneck');
    }
    if (req.staffDelta < 0) {
      mitigations.push('Request temporary staff deployment from District Admin office');
    }
    if (mitigations.length === 0) {
      mitigations.push('Current operational capacity remains adequate for simulated scenario');
    }

    const executionTimeMs = Date.now() - startMs;

    return {
      scenarioId: `sim-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      centreId: req.centreId,
      baselineWaitMinutes: baselineWait,
      simulatedWaitMinutes: simulatedWait,
      baselineQueueLength: baselineQueue,
      simulatedQueueLength: simulatedQueue,
      baselineUtilizationPct: baselineUtil,
      simulatedUtilizationPct: simulatedUtil,
      predictedBottleneck,
      impactSeverity,
      recommendedMitigations: mitigations,
      executionTimeMs,
      timestamp: new Date().toISOString()
    };
  }
}

export const simulationService = new SimulationService();
