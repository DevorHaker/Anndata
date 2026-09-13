import { pool } from '../database';
import { logger } from '../utils/logger';
import { WeighmentRecord, WeighmentCorrectionRecord, WeightUnit } from '../types/procurement';
import { centreDomainRepository } from './centreDomain.repository';
import { AppError } from '../utils/errors';
import { v4 as uuidv4 } from 'uuid';

export class WeighmentRepository {
  private memoryWeighments: Map<string, WeighmentRecord> = new Map();
  private memoryCorrections: Map<string, WeighmentCorrectionRecord[]> = new Map();

  async createWeighment(data: {
    procurementId: string;
    bookingId: string;
    centreId: string;
    equipmentId: string;
    weighbridgeOperatorId: string;
    grossWeightKg: number;
    tareWeightKg: number;
    netWeightKg: number;
    unit?: WeightUnit;
  }): Promise<WeighmentRecord> {
    // 1. Equipment Status Validation against Phase 6 equipment registry!
    const equipment = await centreDomainRepository.getEquipmentById(data.equipmentId);
    if (!equipment) {
      throw new AppError(
        'EQUIPMENT_NOT_FOUND',
        `Weighing equipment '${data.equipmentId}' does not exist in registry.`,
        404
      );
    }

    if (equipment.centreId !== data.centreId) {
      throw new AppError(
        'EQUIPMENT_MISMATCH',
        `Weighing equipment '${equipment.equipmentName}' belongs to another procurement centre.`,
        409
      );
    }

    if (equipment.status !== 'OPERATIONAL') {
      throw new AppError(
        'EQUIPMENT_UNAVAILABLE',
        `Weighing equipment '${equipment.equipmentName}' is currently ${equipment.status} and cannot be used for official weighment.`,
        409
      );
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const record: WeighmentRecord = {
      id,
      procurementId: data.procurementId,
      bookingId: data.bookingId,
      centreId: data.centreId,
      equipmentId: data.equipmentId,
      equipmentName: equipment.equipmentName,
      weighbridgeOperatorId: data.weighbridgeOperatorId,
      grossWeightKg: data.grossWeightKg,
      tareWeightKg: data.tareWeightKg,
      netWeightKg: data.netWeightKg,
      unit: data.unit || 'KG',
      status: 'VERIFIED',
      version: 1,
      weighedAt: now,
      createdAt: now,
      updatedAt: now
    };

    try {
      const query = `
        INSERT INTO weighment_records (
          id, booking_id, centre_id, equipment_id, weighbridge_operator_id,
          gross_weight_kg, tare_weight_kg, unit, status, version, weighed_at,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *;
      `;
      const values = [
        record.id,
        record.bookingId,
        record.centreId,
        record.equipmentId,
        record.weighbridgeOperatorId,
        record.grossWeightKg,
        record.tareWeightKg,
        record.unit,
        record.status,
        record.version,
        record.weighedAt,
        record.createdAt,
        record.updatedAt
      ];

      await pool.query(query, values);
    } catch (err: any) {
      logger.warn(`PostgreSQL unavailable for createWeighment, using memory fallback: ${err.message}`);
    }

    this.memoryWeighments.set(id, record);
    return record;
  }

  async findById(id: string): Promise<WeighmentRecord | null> {
    try {
      const query = `SELECT * FROM weighment_records WHERE id = $1;`;
      const result = await pool.query(query, [id]);
      if (result.rows.length > 0) {
        return this.mapRowToRecord(result.rows[0]);
      }
    } catch (err: any) {
      logger.warn(`PostgreSQL unavailable for findById weighment, using memory fallback`);
    }

    return this.memoryWeighments.get(id) || null;
  }

  async findByProcurementId(procurementId: string): Promise<WeighmentRecord | null> {
    for (const record of this.memoryWeighments.values()) {
      if (record.procurementId === procurementId) return record;
    }
    return null;
  }

  async recordCorrection(
    weighmentId: string,
    correctedGrossKg: number,
    correctedTareKg: number,
    correctedNetKg: number,
    reason: string,
    authorizedBy: string
  ): Promise<{ weighment: WeighmentRecord; correction: WeighmentCorrectionRecord }> {
    const weighment = await this.findById(weighmentId);
    if (!weighment) {
      throw new AppError('WEIGHMENT_NOT_FOUND', `Weighment record '${weighmentId}' not found.`, 404);
    }

    const correctionId = uuidv4();
    const now = new Date().toISOString();

    const correction: WeighmentCorrectionRecord = {
      id: correctionId,
      weighmentRecordId: weighmentId,
      procurementId: weighment.procurementId,
      originalGrossWeightKg: weighment.grossWeightKg,
      originalTareWeightKg: weighment.tareWeightKg,
      correctedGrossWeightKg: correctedGrossKg,
      correctedTareWeightKg: correctedTareKg,
      correctionReason: reason,
      authorizedBy,
      createdAt: now
    };

    // Update authoritative weighment state
    weighment.grossWeightKg = correctedGrossKg;
    weighment.tareWeightKg = correctedTareKg;
    weighment.netWeightKg = correctedNetKg;
    weighment.status = 'CORRECTED';
    weighment.version += 1;
    weighment.updatedAt = now;

    this.memoryWeighments.set(weighmentId, weighment);

    const history = this.memoryCorrections.get(weighmentId) || [];
    history.push(correction);
    this.memoryCorrections.set(weighmentId, history);

    return { weighment, correction };
  }

  async getCorrectionHistory(weighmentId: string): Promise<WeighmentCorrectionRecord[]> {
    return this.memoryCorrections.get(weighmentId) || [];
  }

  private mapRowToRecord(row: any): WeighmentRecord {
    return {
      id: row.id,
      procurementId: row.procurement_id || row.booking_id,
      bookingId: row.booking_id,
      centreId: row.centre_id,
      equipmentId: row.equipment_id,
      weighbridgeOperatorId: row.weighbridge_operator_id,
      grossWeightKg: Number(row.gross_weight_kg),
      tareWeightKg: Number(row.tare_weight_kg),
      netWeightKg: Number(row.net_weight_kg),
      unit: row.unit || 'KG',
      status: row.status,
      version: row.version,
      weighedAt: row.weighed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export const weighmentRepository = new WeighmentRepository();
