export interface ServiceTimeParams {
  baseServiceTimeMinutes?: number;
  quantityUnitFactor?: number;
  weighingTimeMinutes?: number;
  qualityCheckTimeMinutes?: number;
  minServiceMinutes?: number;
  maxServiceMinutes?: number;
}

export class QuantityWorkloadModel {
  private baseServiceTimeMinutes: number;
  private quantityUnitFactor: number;
  private weighingTimeMinutes: number;
  private qualityCheckTimeMinutes: number;
  private minServiceMinutes: number;
  private maxServiceMinutes: number;

  constructor(params: ServiceTimeParams = {}) {
    this.baseServiceTimeMinutes = params.baseServiceTimeMinutes ?? 10;
    this.quantityUnitFactor = params.quantityUnitFactor ?? 0.003; // 3 mins per 1000 kg
    this.weighingTimeMinutes = params.weighingTimeMinutes ?? 5;
    this.qualityCheckTimeMinutes = params.qualityCheckTimeMinutes ?? 5;
    this.minServiceMinutes = params.minServiceMinutes ?? 15;
    this.maxServiceMinutes = params.maxServiceMinutes ?? 60;
  }

  /**
   * Calculates workload-aware estimated service duration for a given produce quantity
   */
  public calculateEstimatedServiceMinutes(quantityKg: number): number {
    const rawTime =
      this.baseServiceTimeMinutes +
      quantityKg * this.quantityUnitFactor +
      this.weighingTimeMinutes +
      this.qualityCheckTimeMinutes;

    const clampedTime = Math.max(
      this.minServiceMinutes,
      Math.min(this.maxServiceMinutes, Math.round(rawTime))
    );

    return clampedTime;
  }
}

export const quantityWorkloadModel = new QuantityWorkloadModel();
