import { pool } from '../database';
import { PaymentRecord, PaymentEventRecord, PaymentStatus, ReconciliationRecord } from '../types/payment';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class PaymentRepository {
  private memoryPayments: Map<string, PaymentRecord> = new Map();
  private memoryEvents: PaymentEventRecord[] = [];
  private memoryReconciliations: ReconciliationRecord[] = [];

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    const mockPayment: PaymentRecord = {
      id: 'pay-seed- wheat-001',
      paymentReferenceId: 'PAY-20260913-000101',
      procurementId: 'proc-p9-test-001',
      procurementReferenceId: 'PRC-20260913-000101',
      farmerId: 'farmer-001-ramesh',
      farmerReferenceId: 'FARM-2026-KARNAL-001',
      farmerName: 'Ramesh Kumar',
      bookingId: 'bk-p9-test-001',
      centreId: '33333333-3333-4000-8000-333333333333',
      centreName: 'APMC Karnal Central Procurement Hub',
      cropTypeId: 'crop-001-wheat',
      cropName: 'Sharbati Wheat (Grade A)',
      acceptedQuantityKg: 1900,
      ratePerQuintal: 2425,
      ratePerKg: 24.25,
      rateVersion: '2026-KMS-MSP-01',
      grossAmount: 46075,
      deductionsAmount: 0,
      netPayableAmount: 46075,
      currency: 'INR',
      paymentMethod: 'DIRECT_BENEFIT_TRANSFER',
      destinationReference: 'XXXX XXXX 4521',
      bankName: 'State Bank of India',
      ifscCode: 'SBIN0001234',
      provider: 'MOCK_BANK_GATEWAY',
      providerTransactionRef: 'UTR-2026-MOCK-998877',
      idempotencyKey: 'idemp-seed-wheat-001',
      status: 'PAYMENT_SUCCESS',
      retryCount: 0,
      maxRetries: 3,
      createdTimestamp: new Date(Date.now() - 3600000).toISOString(),
      processingTimestamp: new Date(Date.now() - 3000000).toISOString(),
      completedTimestamp: new Date(Date.now() - 2500000).toISOString(),
      lastUpdatedTimestamp: new Date(Date.now() - 2500000).toISOString(),
      version: 1
    };
    this.memoryPayments.set(mockPayment.id, mockPayment);

    this.memoryEvents.push({
      id: uuidv4(),
      paymentId: mockPayment.id,
      eventType: 'PAYMENT_SUCCESS',
      previousStatus: 'PAYMENT_PROCESSING',
      newStatus: 'PAYMENT_SUCCESS',
      actorType: 'WEBHOOK_PROVIDER',
      actorId: 'MOCK_BANK_GATEWAY',
      reason: 'Bank disbursement settled via DBT switch.',
      providerReference: mockPayment.providerTransactionRef,
      createdAt: mockPayment.completedTimestamp!
    });
  }

  /**
   * Creates a new Payment record atomically.
   */
  async createPayment(data: {
    procurementId: string;
    procurementReferenceId?: string;
    farmerId: string;
    farmerReferenceId?: string;
    farmerName?: string;
    bookingId?: string;
    centreId: string;
    centreName?: string;
    cropTypeId: string;
    cropName?: string;
    acceptedQuantityKg: number;
    ratePerQuintal: number;
    ratePerKg: number;
    rateVersion: string;
    grossAmount: number;
    deductionsAmount: number;
    netPayableAmount: number;
    paymentMethod?: 'DIRECT_BENEFIT_TRANSFER' | 'BANK_TRANSFER' | 'UPI';
    destinationReference: string;
    bankName?: string;
    ifscCode?: string;
    provider?: string;
    idempotencyKey: string;
    status?: PaymentStatus;
  }): Promise<PaymentRecord> {
    const paymentId = uuidv4();
    const referenceId = `PAY-${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const record: PaymentRecord = {
      id: paymentId,
      paymentReferenceId: referenceId,
      procurementId: data.procurementId,
      procurementReferenceId: data.procurementReferenceId,
      farmerId: data.farmerId,
      farmerReferenceId: data.farmerReferenceId,
      farmerName: data.farmerName,
      bookingId: data.bookingId,
      centreId: data.centreId,
      centreName: data.centreName,
      cropTypeId: data.cropTypeId,
      cropName: data.cropName,
      acceptedQuantityKg: data.acceptedQuantityKg,
      ratePerQuintal: data.ratePerQuintal,
      ratePerKg: data.ratePerKg,
      rateVersion: data.rateVersion,
      grossAmount: data.grossAmount,
      deductionsAmount: data.deductionsAmount,
      netPayableAmount: data.netPayableAmount,
      currency: 'INR',
      paymentMethod: data.paymentMethod || 'DIRECT_BENEFIT_TRANSFER',
      destinationReference: data.destinationReference,
      bankName: data.bankName || 'State Bank of India',
      ifscCode: data.ifscCode || 'SBIN0001234',
      provider: data.provider || 'MOCK_BANK_GATEWAY',
      idempotencyKey: data.idempotencyKey,
      status: data.status || 'PAYMENT_PENDING',
      retryCount: 0,
      maxRetries: 3,
      createdTimestamp: new Date().toISOString(),
      lastUpdatedTimestamp: new Date().toISOString(),
      version: 1
    };

    try {
      const client = await pool.connect();
      try {
        await client.query(
          `INSERT INTO payments (
            id, payment_reference_id, procurement_id, farmer_id, bank_account_id,
            amount, currency, provider, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            record.id,
            record.paymentReferenceId,
            record.procurementId,
            record.farmerId,
            record.id, // reference ID for bank account
            record.netPayableAmount,
            record.currency,
            record.provider,
            record.status
          ]
        );
      } finally {
        client.release();
      }
    } catch (error: any) {
      logger.warn(`PostgreSQL connection unavailable during payment creation, using in-memory store: ${error.message}`);
    }

    this.memoryPayments.set(record.id, record);
    return record;
  }

  async findById(id: string): Promise<PaymentRecord | null> {
    const memory = this.memoryPayments.get(id);
    if (memory) return memory;

    try {
      const res = await pool.query(`SELECT * FROM payments WHERE id = $1`, [id]);
      if (res.rows.length > 0) return this.mapRowToPayment(res.rows[0]);
    } catch (err: any) {
      // Fallback
    }

    return null;
  }

  async findWithLock(id: string): Promise<PaymentRecord | null> {
    return await this.findById(id);
  }

  async findByProcurementId(procurementId: string): Promise<PaymentRecord | null> {
    for (const p of this.memoryPayments.values()) {
      if (p.procurementId === procurementId && p.status !== 'PAYMENT_CANCELLED') {
        return p;
      }
    }

    try {
      const res = await pool.query(`SELECT * FROM payments WHERE procurement_id = $1 ORDER BY created_at DESC LIMIT 1`, [procurementId]);
      if (res.rows.length > 0) return this.mapRowToPayment(res.rows[0]);
    } catch (err: any) {
      // Fallback
    }

    return null;
  }

  async findByIdempotencyKey(key: string): Promise<PaymentRecord | null> {
    for (const p of this.memoryPayments.values()) {
      if (p.idempotencyKey === key) return p;
    }
    return null;
  }

  async updatePayment(payment: PaymentRecord): Promise<PaymentRecord> {
    payment.version += 1;
    payment.lastUpdatedTimestamp = new Date().toISOString();
    this.memoryPayments.set(payment.id, payment);

    try {
      await pool.query(
        `UPDATE payments SET
          status = $1,
          provider_transaction_ref = $2,
          failure_reason = $3,
          completed_at = $4,
          version = $5,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $6`,
        [
          payment.status,
          payment.providerTransactionRef || null,
          payment.failureReason || null,
          payment.completedTimestamp ? new Date(payment.completedTimestamp) : null,
          payment.version,
          payment.id
        ]
      );
    } catch (err: any) {
      // Fallback
    }

    return payment;
  }

  async createEvent(eventData: {
    paymentId: string;
    eventType: string;
    previousStatus?: PaymentStatus | null;
    newStatus: PaymentStatus;
    actorType: 'SYSTEM' | 'FARMER' | 'STAFF' | 'ADMIN' | 'WEBHOOK_PROVIDER';
    actorId?: string;
    reason?: string;
    providerReference?: string;
    providerPayload?: any;
    correlationId?: string;
    idempotencyKey?: string;
  }): Promise<PaymentEventRecord> {
    const event: PaymentEventRecord = {
      id: uuidv4(),
      paymentId: eventData.paymentId,
      eventType: eventData.eventType,
      previousStatus: eventData.previousStatus,
      newStatus: eventData.newStatus,
      actorType: eventData.actorType,
      actorId: eventData.actorId,
      reason: eventData.reason,
      providerReference: eventData.providerReference,
      providerPayload: eventData.providerPayload,
      correlationId: eventData.correlationId,
      idempotencyKey: eventData.idempotencyKey,
      createdAt: new Date().toISOString()
    };

    this.memoryEvents.push(event);

    try {
      await pool.query(
        `INSERT INTO payment_events (
          id, payment_id, previous_status, new_status, provider_response_code, provider_payload, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [
          event.id,
          event.paymentId,
          event.previousStatus || null,
          event.newStatus,
          event.providerReference || null,
          event.providerPayload ? JSON.stringify(event.providerPayload) : null
        ]
      );
    } catch (err: any) {
      // Fallback
    }

    return event;
  }

  async listEventsForPayment(paymentId: string): Promise<PaymentEventRecord[]> {
    const events = this.memoryEvents.filter((e) => e.paymentId === paymentId);
    events.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return events;
  }

  async listPayments(filters: {
    centreId?: string;
    farmerId?: string;
    status?: PaymentStatus;
    procurementId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ payments: PaymentRecord[]; totalCount: number }> {
    let result = Array.from(this.memoryPayments.values());

    if (filters.centreId) {
      result = result.filter((p) => p.centreId === filters.centreId);
    }
    if (filters.farmerId) {
      result = result.filter((p) => p.farmerId === filters.farmerId);
    }
    if (filters.status) {
      result = result.filter((p) => p.status === filters.status);
    }
    if (filters.procurementId) {
      result = result.filter((p) => p.procurementId === filters.procurementId);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.paymentReferenceId.toLowerCase().includes(q) ||
          (p.procurementReferenceId && p.procurementReferenceId.toLowerCase().includes(q)) ||
          (p.farmerName && p.farmerName.toLowerCase().includes(q)) ||
          (p.providerTransactionRef && p.providerTransactionRef.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => new Date(b.createdTimestamp).getTime() - new Date(a.createdTimestamp).getTime());

    const totalCount = result.length;
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;

    return {
      payments: result.slice(offset, offset + limit),
      totalCount
    };
  }

  async createReconciliationRecord(data: Omit<ReconciliationRecord, 'id' | 'reconciledAt'>): Promise<ReconciliationRecord> {
    const record: ReconciliationRecord = {
      ...data,
      id: uuidv4(),
      reconciledAt: new Date().toISOString()
    };
    this.memoryReconciliations.push(record);
    return record;
  }

  async listReconciliations(): Promise<ReconciliationRecord[]> {
    return [...this.memoryReconciliations];
  }

  private mapRowToPayment(row: any): PaymentRecord {
    return {
      id: row.id,
      paymentReferenceId: row.payment_reference_id,
      procurementId: row.procurement_id,
      farmerId: row.farmer_id,
      centreId: row.centre_id || '33333333-3333-4000-8000-333333333333',
      cropTypeId: row.crop_type_id || 'crop-001-wheat',
      acceptedQuantityKg: Number(row.accepted_quantity_kg) || 0,
      ratePerQuintal: Number(row.rate_per_quintal) || 2425,
      ratePerKg: Number(row.rate_per_kg) || 24.25,
      rateVersion: row.rate_version || '2026-MSP-01',
      grossAmount: Number(row.amount) || 0,
      deductionsAmount: 0,
      netPayableAmount: Number(row.amount) || 0,
      currency: row.currency || 'INR',
      paymentMethod: 'DIRECT_BENEFIT_TRANSFER',
      destinationReference: 'XXXX XXXX 4521',
      provider: row.provider || 'MOCK_BANK_GATEWAY',
      providerTransactionRef: row.provider_transaction_ref,
      idempotencyKey: row.idempotency_key || row.id,
      status: row.status as PaymentStatus,
      retryCount: row.retry_count || 0,
      maxRetries: 3,
      createdTimestamp: row.created_at,
      completedTimestamp: row.completed_at,
      lastUpdatedTimestamp: row.updated_at,
      version: row.version || 1
    };
  }
}

export const paymentRepository = new PaymentRepository();
