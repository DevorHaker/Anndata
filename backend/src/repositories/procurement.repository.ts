import { pool } from '../database';
import { logger } from '../utils/logger';
import {
  ProcurementRecord,
  ProcurementStatus,
  QualityGrade,
  QualityStatus
} from '../types/procurement';
import { v4 as uuidv4 } from 'uuid';

export class ProcurementRepository {
  private memoryProcurements: Map<string, ProcurementRecord> = new Map();
  private seqCounter: number = 1000;

  private generateReferenceId(): string {
    this.seqCounter++;
    const numStr = this.seqCounter.toString().padStart(8, '0');
    return `PR-2026-${numStr}`;
  }

  async createProcurement(data: {
    bookingId: string;
    farmerId: string;
    centreId: string;
    cropTypeId: string;
    tokenCode?: string;
    queueEntryId?: string;
    procurementOfficerId: string;
    declaredQuantityKg: number;
  }): Promise<ProcurementRecord> {
    const id = uuidv4();
    const procurementReferenceId = this.generateReferenceId();
    const now = new Date().toISOString();

    const record: ProcurementRecord = {
      id,
      procurementReferenceId,
      bookingId: data.bookingId,
      farmerId: data.farmerId,
      centreId: data.centreId,
      cropTypeId: data.cropTypeId,
      tokenCode: data.tokenCode,
      queueEntryId: data.queueEntryId,
      procurementOfficerId: data.procurementOfficerId,
      status: 'INITIATED',
      declaredQuantityKg: data.declaredQuantityKg,
      qualityDeductionKg: 0,
      finalAcceptedWeightKg: 0,
      rejectedWeightKg: 0,
      ratePerKg: 0,
      ratePerQuintal: 0,
      rateVersion: 'PENDING_FINALIZATION',
      grossPayableAmount: 0,
      totalDeductionsAmount: 0,
      netPayableAmount: 0,
      startedAt: now,
      paymentReady: false,
      version: 1,
      createdAt: now,
      updatedAt: now
    };

    try {
      const query = `
        INSERT INTO procurements (
          id, procurement_reference_id, booking_id, farmer_id, centre_id,
          crop_type_id, gross_weight_kg, net_weight_kg, quality_deduction_kg,
          rate_per_kg, gross_payable_amount, total_deductions_amount, status,
          approved_by, approved_at, version, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        ) RETURNING *;
      `;
      const values = [
        record.id,
        record.procurementReferenceId,
        record.bookingId,
        record.farmerId,
        record.centreId,
        record.cropTypeId,
        0, // gross
        0, // net
        0, // deduction
        0, // rate
        0, // gross amount
        0, // deductions amount
        record.status,
        record.procurementOfficerId,
        now,
        record.version,
        record.createdAt,
        record.updatedAt
      ];

      await pool.query(query, values);
    } catch (err: any) {
      logger.warn(`PostgreSQL unavailable for createProcurement, using memory fallback: ${err.message}`);
    }

    this.memoryProcurements.set(id, record);
    return record;
  }

  async findById(id: string): Promise<ProcurementRecord | null> {
    try {
      const query = `SELECT * FROM procurements WHERE id = $1;`;
      const result = await pool.query(query, [id]);
      if (result.rows.length > 0) {
        return this.mapRowToRecord(result.rows[0]);
      }
    } catch (err: any) {
      logger.warn(`PostgreSQL unavailable for findById, using memory fallback`);
    }

    return this.memoryProcurements.get(id) || null;
  }

  async findByBookingId(bookingId: string): Promise<ProcurementRecord | null> {
    for (const record of this.memoryProcurements.values()) {
      if (record.bookingId === bookingId) return record;
    }
    return null;
  }

  async findWithLock(id: string): Promise<ProcurementRecord | null> {
    try {
      const query = `SELECT * FROM procurements WHERE id = $1 FOR UPDATE;`;
      const result = await pool.query(query, [id]);
      if (result.rows.length > 0) {
        return this.mapRowToRecord(result.rows[0]);
      }
    } catch (err: any) {
      logger.warn(`PostgreSQL unavailable for findWithLock, using memory fallback`);
    }

    return this.memoryProcurements.get(id) || null;
  }

  async updateProcurement(record: ProcurementRecord): Promise<ProcurementRecord> {
    record.updatedAt = new Date().toISOString();
    record.version += 1;

    try {
      const query = `
        UPDATE procurements SET
          status = $1,
          gross_weight_kg = $2,
          net_weight_kg = $3,
          quality_deduction_kg = $4,
          rate_per_kg = $5,
          gross_payable_amount = $6,
          total_deductions_amount = $7,
          version = $8,
          updated_at = $9
        WHERE id = $10 AND version = $11 RETURNING *;
      `;
      const values = [
        record.status,
        record.measuredGrossWeightKg || 0,
        record.measuredNetWeightKg || 0,
        record.qualityDeductionKg || 0,
        record.ratePerKg || 0,
        record.grossPayableAmount || 0,
        record.totalDeductionsAmount || 0,
        record.version,
        record.updatedAt,
        record.id,
        record.version - 1
      ];

      await pool.query(query, values);
    } catch (err: any) {
      logger.warn(`PostgreSQL unavailable for updateProcurement, using memory fallback`);
    }

    this.memoryProcurements.set(record.id, record);
    return record;
  }

  async listProcurements(filters: {
    centreId?: string;
    farmerId?: string;
    status?: ProcurementStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ data: ProcurementRecord[]; total: number }> {
    let list = Array.from(this.memoryProcurements.values());

    if (filters.centreId) {
      list = list.filter((p) => p.centreId === filters.centreId);
    }
    if (filters.farmerId) {
      list = list.filter((p) => p.farmerId === filters.farmerId);
    }
    if (filters.status) {
      list = list.filter((p) => p.status === filters.status);
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = list.length;
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    const paginated = list.slice(offset, offset + limit);

    return { data: paginated, total };
  }

  private mapRowToRecord(row: any): ProcurementRecord {
    return {
      id: row.id,
      procurementReferenceId: row.procurement_reference_id,
      bookingId: row.booking_id,
      farmerId: row.farmer_id,
      centreId: row.centre_id,
      cropTypeId: row.crop_type_id,
      procurementOfficerId: row.approved_by,
      status: row.status,
      declaredQuantityKg: Number(row.declared_quantity_kg || 0),
      measuredGrossWeightKg: Number(row.gross_weight_kg || 0),
      measuredTareWeightKg: Number(row.tare_weight_kg || 0),
      measuredNetWeightKg: Number(row.net_weight_kg || 0),
      qualityDeductionKg: Number(row.quality_deduction_kg || 0),
      finalAcceptedWeightKg: Number(row.final_accepted_weight_kg || 0),
      rejectedWeightKg: Number(row.rejected_weight_kg || 0),
      ratePerKg: Number(row.rate_per_kg || 0),
      ratePerQuintal: Number(row.rate_per_kg || 0) * 100,
      rateVersion: row.rate_version || 'MSP-2025-26',
      grossPayableAmount: Number(row.gross_payable_amount || 0),
      totalDeductionsAmount: Number(row.total_deductions_amount || 0),
      netPayableAmount: Number(row.net_payable_amount || 0),
      startedAt: row.created_at,
      paymentReady: row.status === 'COMPLETED' || row.status === 'APPROVED',
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export const procurementRepository = new ProcurementRepository();
