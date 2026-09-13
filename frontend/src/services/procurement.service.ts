import { apiClient } from './apiClient';

export interface ProcurementRecordUI {
  id: string;
  procurementReferenceId: string;
  bookingId: string;
  farmerId: string;
  centreId: string;
  cropTypeId: string;
  tokenCode?: string;
  procurementOfficerId: string;
  status:
    | 'INITIATED'
    | 'RECEIVED'
    | 'WEIGHING'
    | 'QUALITY_CHECK'
    | 'UNDER_REVIEW'
    | 'ACCEPTED'
    | 'PARTIALLY_ACCEPTED'
    | 'REJECTED'
    | 'COMPLETED'
    | 'CANCELLED';
  declaredQuantityKg: number;
  measuredGrossWeightKg?: number;
  measuredTareWeightKg?: number;
  measuredNetWeightKg?: number;
  qualityDeductionKg: number;
  finalAcceptedWeightKg: number;
  rejectedWeightKg: number;
  rejectionReasonCode?: string;
  rejectionReasonDetails?: string;
  weighmentId?: string;
  qualityInspectionId?: string;
  qualityGrade?: string;
  qualityStatus?: string;
  qualityRuleVersion?: string;
  ratePerKg: number;
  ratePerQuintal: number;
  rateVersion: string;
  grossPayableAmount: number;
  totalDeductionsAmount: number;
  netPayableAmount: number;
  startedAt: string;
  weighedAt?: string;
  qualityInspectedAt?: string;
  completedAt?: string;
  paymentReady: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface WeighmentRecordUI {
  id: string;
  procurementId: string;
  bookingId: string;
  centreId: string;
  equipmentId: string;
  equipmentName?: string;
  weighbridgeOperatorId: string;
  grossWeightKg: number;
  tareWeightKg: number;
  netWeightKg: number;
  unit: string;
  status: string;
  weighedAt: string;
}

export interface QualityInspectionUI {
  id: string;
  procurementId: string;
  inspectorId: string;
  cropTypeId: string;
  ruleVersion: string;
  moisturePercentage: number;
  foreignMatterPercentage: number;
  damagedGrainsPercentage: number;
  brokenGrainsPercentage: number;
  qualityGrade: string;
  status: string;
  deductionPercentage: number;
  deductionKg: number;
  rejectionReason?: string;
  overridden: boolean;
  overrideReason?: string;
  inspectedAt: string;
}

export interface QualityConfigUI {
  cropTypeId: string;
  cropName: string;
  ruleVersion: string;
  maxMoisturePercentage: number;
  maxForeignMatterPercentage: number;
  maxDamagedGrainsPercentage: number;
  maxBrokenGrainsPercentage: number;
  deductionThresholdMoisturePercentage: number;
  deductionRatePerPercentAboveThreshold: number;
}

class ProcurementServiceUI {
  async startSession(bookingId: string, centreId?: string): Promise<ProcurementRecordUI> {
    const res = await apiClient.post<ProcurementRecordUI>('/procurements/start', {
      bookingId,
      centreId
    });
    return res.data!;
  }

  async confirmIntake(procurementId: string): Promise<ProcurementRecordUI> {
    const res = await apiClient.post<ProcurementRecordUI>(`/procurements/${procurementId}/intake`);
    return res.data!;
  }

  async recordWeighment(data: {
    procurementId: string;
    equipmentId: string;
    grossWeight: number;
    tareWeight: number;
    unit?: string;
  }): Promise<{ procurement: ProcurementRecordUI; weighment: WeighmentRecordUI }> {
    const res = await apiClient.post<{ procurement: ProcurementRecordUI; weighment: WeighmentRecordUI }>(
      '/weighments',
      data
    );
    return res.data!;
  }

  async correctWeighment(
    weighmentId: string,
    data: { correctedGrossWeight: number; correctedTareWeight: number; reason: string; unit?: string }
  ): Promise<{ procurement: ProcurementRecordUI; weighment: WeighmentRecordUI }> {
    const res = await apiClient.post<{ procurement: ProcurementRecordUI; weighment: WeighmentRecordUI }>(
      `/weighments/${weighmentId}/correct`,
      data
    );
    return res.data!;
  }

  async performQualityInspection(data: {
    procurementId: string;
    moisturePercentage: number;
    foreignMatterPercentage: number;
    damagedGrainsPercentage: number;
    brokenGrainsPercentage?: number;
  }): Promise<{ procurement: ProcurementRecordUI; quality: QualityInspectionUI }> {
    const res = await apiClient.post<{ procurement: ProcurementRecordUI; quality: QualityInspectionUI }>(
      '/quality/inspections',
      data
    );
    return res.data!;
  }

  async calculateValue(procurementId: string): Promise<ProcurementRecordUI> {
    const res = await apiClient.post<ProcurementRecordUI>(
      `/procurements/${procurementId}/calculate-value`
    );
    return res.data!;
  }

  async finalizeProcurement(procurementId: string): Promise<ProcurementRecordUI> {
    const res = await apiClient.post<ProcurementRecordUI>(
      `/procurements/${procurementId}/finalize`
    );
    return res.data!;
  }

  async getProcurementById(procurementId: string): Promise<{
    procurement: ProcurementRecordUI;
    weighment?: WeighmentRecordUI | null;
    quality?: QualityInspectionUI | null;
  }> {
    const res = await apiClient.get<{
      procurement: ProcurementRecordUI;
      weighment?: WeighmentRecordUI | null;
      quality?: QualityInspectionUI | null;
    }>(`/procurements/${procurementId}`);
    return res.data!;
  }

  async listProcurements(filters?: {
    centreId?: string;
    farmerId?: string;
    status?: string;
  }): Promise<ProcurementRecordUI[]> {
    const res = await apiClient.get<ProcurementRecordUI[]>('/procurements', { params: filters });
    return res.data!;
  }

  async listFarmerProcurements(): Promise<ProcurementRecordUI[]> {
    const res = await apiClient.get<ProcurementRecordUI[]>('/procurements/farmer');
    return res.data!;
  }

  async getQualityConfig(cropTypeId?: string): Promise<QualityConfigUI | QualityConfigUI[]> {
    const res = await apiClient.get<QualityConfigUI | QualityConfigUI[]>('/quality/configuration', {
      params: { cropTypeId }
    });
    return res.data!;
  }
}

export const procurementServiceUI = new ProcurementServiceUI();
