import { pool } from '../database';
import { logger } from '../utils/logger';
import { QualityInspectionRecord, QualityGrade, QualityStatus, QualityParameterResult } from '../types/procurement';
import { v4 as uuidv4 } from 'uuid';

export class QualityRepository {
  private memoryInspections: Map<string, QualityInspectionRecord> = new Map();

  async createInspection(data: {
    procurementId: string;
    bookingId: string;
    inspectorId: string;
    cropTypeId: string;
    ruleVersion: string;
    moisturePercentage: number;
    foreignMatterPercentage: number;
    damagedGrainsPercentage: number;
    brokenGrainsPercentage?: number;
    impuritiesPercentage?: number;
    parameters: QualityParameterResult[];
    qualityGrade: QualityGrade;
    status: QualityStatus;
    deductionPercentage: number;
    deductionKg: number;
    rejectionReason?: string;
  }): Promise<QualityInspectionRecord> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const record: QualityInspectionRecord = {
      id,
      procurementId: data.procurementId,
      bookingId: data.bookingId,
      inspectorId: data.inspectorId,
      cropTypeId: data.cropTypeId,
      ruleVersion: data.ruleVersion,
      moisturePercentage: data.moisturePercentage,
      foreignMatterPercentage: data.foreignMatterPercentage,
      damagedGrainsPercentage: data.damagedGrainsPercentage,
      brokenGrainsPercentage: data.brokenGrainsPercentage || 0,
      impuritiesPercentage: data.impuritiesPercentage || 0,
      parameters: data.parameters,
      qualityGrade: data.qualityGrade,
      status: data.status,
      deductionPercentage: data.deductionPercentage,
      deductionKg: data.deductionKg,
      rejectionReason: data.rejectionReason,
      overridden: false,
      inspectedAt: now,
      createdAt: now,
      updatedAt: now
    };

    try {
      const query = `
        INSERT INTO quality_inspections (
          id, booking_id, inspector_id, crop_type_id, moisture_percentage,
          foreign_matter_percentage, damaged_grains_percentage, quality_grade,
          deduction_percentage, status, rejection_reason, inspected_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *;
      `;
      const values = [
        record.id,
        record.bookingId,
        record.inspectorId,
        record.cropTypeId,
        record.moisturePercentage,
        record.foreignMatterPercentage,
        record.damagedGrainsPercentage,
        record.qualityGrade,
        record.deductionPercentage,
        record.status,
        record.rejectionReason || null,
        record.inspectedAt,
        record.createdAt,
        record.updatedAt
      ];

      await pool.query(query, values);
    } catch (err: any) {
      logger.warn(`PostgreSQL unavailable for createInspection, using memory fallback: ${err.message}`);
    }

    this.memoryInspections.set(id, record);
    return record;
  }

  async findById(id: string): Promise<QualityInspectionRecord | null> {
    try {
      const query = `SELECT * FROM quality_inspections WHERE id = $1;`;
      const result = await pool.query(query, [id]);
      if (result.rows.length > 0) {
        return this.mapRowToRecord(result.rows[0]);
      }
    } catch (err: any) {
      logger.warn(`PostgreSQL unavailable for findById quality inspection, using memory fallback`);
    }

    return this.memoryInspections.get(id) || null;
  }

  async findByProcurementId(procurementId: string): Promise<QualityInspectionRecord | null> {
    for (const record of this.memoryInspections.values()) {
      if (record.procurementId === procurementId) return record;
    }
    return null;
  }

  async recordOverride(
    inspectionId: string,
    overrideReason: string,
    overriddenBy: string,
    newStatus: QualityStatus,
    newGrade: QualityGrade
  ): Promise<QualityInspectionRecord> {
    const inspection = await this.findById(inspectionId);
    if (!inspection) {
      throw new Error(`Quality inspection '${inspectionId}' not found.`);
    }

    inspection.overridden = true;
    inspection.overrideReason = overrideReason;
    inspection.overriddenBy = overriddenBy;
    inspection.status = newStatus;
    inspection.qualityGrade = newGrade;
    inspection.updatedAt = new Date().toISOString();

    this.memoryInspections.set(inspectionId, inspection);
    return inspection;
  }

  private mapRowToRecord(row: any): QualityInspectionRecord {
    return {
      id: row.id,
      procurementId: row.procurement_id || row.booking_id,
      bookingId: row.booking_id,
      inspectorId: row.inspector_id,
      cropTypeId: row.crop_type_id,
      ruleVersion: row.rule_version || '2026-KMS-01',
      moisturePercentage: Number(row.moisture_percentage),
      foreignMatterPercentage: Number(row.foreign_matter_percentage || 0),
      damagedGrainsPercentage: Number(row.damaged_grains_percentage || 0),
      brokenGrainsPercentage: Number(row.broken_grains_percentage || 0),
      impuritiesPercentage: Number(row.impurities_percentage || 0),
      parameters: [],
      qualityGrade: row.quality_grade,
      status: row.status,
      deductionPercentage: Number(row.deduction_percentage || 0),
      deductionKg: Number(row.deduction_kg || 0),
      rejectionReason: row.rejection_reason,
      overridden: Boolean(row.overridden),
      overrideReason: row.override_reason,
      overriddenBy: row.overridden_by,
      inspectedAt: row.inspected_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export const qualityRepository = new QualityRepository();
