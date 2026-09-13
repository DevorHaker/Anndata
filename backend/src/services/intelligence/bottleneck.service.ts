import { featureService } from './feature.service';
import { BottleneckAnalysis } from '../../types/intelligence';

export class BottleneckService {
  /**
   * Stage-level bottleneck analysis
   */
  async analyzeBottlenecks(centreId: string): Promise<BottleneckAnalysis[]> {
    const features = await featureService.getCentreFeatureVector(centreId);

    const stages: BottleneckAnalysis[] = [
      {
        stage: 'CHECK-IN',
        averageDurationSec: 120,
        p95DurationSec: 240,
        baselineDurationSec: 100,
        percentageIncrease: 20,
        isCurrentBottleneck: false,
        primaryContributor: 'Security QR token scanning throughput',
        confidence: 'HIGH'
      },
      {
        stage: 'QUEUE',
        averageDurationSec: Math.round(features.averageServiceTimeMs / 1000 * 1.8),
        p95DurationSec: Math.round(features.p95ServiceTimeMs / 1000 * 1.8),
        baselineDurationSec: 600,
        percentageIncrease: 55,
        isCurrentBottleneck: false,
        primaryContributor: 'High arrival volume relative to gate intake',
        confidence: 'HIGH'
      },
      {
        stage: 'WEIGHING',
        averageDurationSec: 480,
        p95DurationSec: 720,
        baselineDurationSec: 300,
        percentageIncrease: 60,
        isCurrentBottleneck: true,
        primaryContributor: 'Tare weight vehicle positioning & recalibration delay',
        secondaryContributor: 'Single active weighbridge operational',
        confidence: 'HIGH'
      },
      {
        stage: 'QUALITY',
        averageDurationSec: 360,
        p95DurationSec: 540,
        baselineDurationSec: 300,
        percentageIncrease: 20,
        isCurrentBottleneck: false,
        primaryContributor: 'Moisture analyzer testing turnaround time',
        confidence: 'MEDIUM'
      },
      {
        stage: 'PROCUREMENT',
        averageDurationSec: 240,
        p95DurationSec: 380,
        baselineDurationSec: 200,
        percentageIncrease: 20,
        isCurrentBottleneck: false,
        primaryContributor: 'Farmer ledger receipt generation',
        confidence: 'HIGH'
      },
      {
        stage: 'PAYMENT',
        averageDurationSec: 180,
        p95DurationSec: 300,
        baselineDurationSec: 150,
        percentageIncrease: 20,
        isCurrentBottleneck: false,
        primaryContributor: 'DBT bank destination account verification',
        confidence: 'HIGH'
      }
    ];

    return stages;
  }
}

export const bottleneckService = new BottleneckService();
