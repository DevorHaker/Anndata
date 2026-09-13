import { pool } from '../database';
import { logger } from '../utils/logger';
import { 
  IntelligenceDecisionRecord, 
  OperationalAnomalyEvent, 
  ModelRegistryEntry 
} from '../types/intelligence';

class IntelligenceRepository {
  private memoryDecisions: Map<string, IntelligenceDecisionRecord> = new Map();
  private memoryAnomalies: Map<string, OperationalAnomalyEvent> = new Map();
  private memoryModels: Map<string, ModelRegistryEntry> = new Map();

  constructor() {
    this.seedDefaultModels();
  }

  private seedDefaultModels() {
    const defaultModels: ModelRegistryEntry[] = [
      {
        modelId: 'model-eta-stat-v1.2',
        modelName: 'SmartProcure Queue ETA Predictor',
        modelType: 'STATISTICAL',
        version: '1.2.0',
        featureVersion: 'v1.0',
        maeMinutes: 4.2,
        rmseMinutes: 5.8,
        p95ErrorMinutes: 8.5,
        trainingTimestamp: '2026-09-01T00:00:00Z',
        status: 'ACTIVE',
        createdTimestamp: new Date().toISOString()
      },
      {
        modelId: 'model-cong-rule-v1.0',
        modelName: 'Congestion & Bottleneck Rule Engine',
        modelType: 'RULE_ENGINE',
        version: '1.0.0',
        featureVersion: 'v1.0',
        maeMinutes: 3.1,
        rmseMinutes: 4.5,
        p95ErrorMinutes: 6.2,
        trainingTimestamp: '2026-09-05T00:00:00Z',
        status: 'ACTIVE',
        createdTimestamp: new Date().toISOString()
      },
      {
        modelId: 'model-gbt-service-v2.1',
        modelName: 'Quantity-Aware Gradient Boosted Service Predictor',
        modelType: 'GRADIENT_BOOSTED_TREE',
        version: '2.1.0',
        featureVersion: 'v2.0',
        maeMinutes: 2.8,
        rmseMinutes: 3.9,
        p95ErrorMinutes: 5.4,
        trainingTimestamp: '2026-09-10T00:00:00Z',
        status: 'ACTIVE',
        createdTimestamp: new Date().toISOString()
      }
    ];

    for (const model of defaultModels) {
      this.memoryModels.set(model.modelId, model);
    }
  }

  /**
   * Save intelligence decision audit entry
   */
  async recordDecision(decision: IntelligenceDecisionRecord): Promise<IntelligenceDecisionRecord> {
    try {
      const query = `
        INSERT INTO intelligence_decisions (
          id, decision_type, centre_id, farmer_id, input_snapshot, output_data,
          model_engine, model_version, confidence, explanation, actor, override_status, created_timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
      const values = [
        decision.id,
        decision.decisionType,
        decision.centreId || null,
        decision.farmerId || null,
        JSON.stringify(decision.inputSnapshot),
        JSON.stringify(decision.outputData),
        decision.modelEngine,
        decision.modelVersion,
        decision.confidence,
        decision.explanation,
        decision.actor,
        decision.overrideStatus,
        decision.createdTimestamp
      ];

      await pool.query(query, values);
    } catch (err: any) {
      logger.warn(`PostgreSQL unavailable for recordDecision, using memory fallback: ${err.message}`);
    }

    this.memoryDecisions.set(decision.id, decision);
    return decision;
  }

  /**
   * Get decision by ID
   */
  async getDecisionById(decisionId: string): Promise<IntelligenceDecisionRecord | null> {
    try {
      const res = await pool.query('SELECT * FROM intelligence_decisions WHERE id = $1', [decisionId]);
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: row.id,
          decisionType: row.decision_type,
          centreId: row.centre_id,
          farmerId: row.farmer_id,
          inputSnapshot: typeof row.input_snapshot === 'string' ? JSON.parse(row.input_snapshot) : row.input_snapshot,
          outputData: typeof row.output_data === 'string' ? JSON.parse(row.output_data) : row.output_data,
          modelEngine: row.model_engine,
          modelVersion: row.model_version,
          confidence: row.confidence,
          explanation: row.explanation,
          actor: row.actor,
          overrideStatus: row.override_status,
          overrideReason: row.override_reason,
          overrideActor: row.override_actor,
          createdTimestamp: row.created_timestamp
        };
      }
    } catch (err: any) {
      logger.warn(`PostgreSQL unavailable for getDecisionById, using memory fallback`);
    }

    return this.memoryDecisions.get(decisionId) || null;
  }

  /**
   * Update human override on decision
   */
  async recordOverride(
    decisionId: string, 
    reason: string, 
    actorId: string
  ): Promise<IntelligenceDecisionRecord | null> {
    const existing = await this.getDecisionById(decisionId);
    if (!existing) return null;

    existing.overrideStatus = 'OVERRIDDEN';
    existing.overrideReason = reason;
    existing.overrideActor = actorId;

    try {
      const query = `
        UPDATE intelligence_decisions
        SET override_status = 'OVERRIDDEN', override_reason = $1, override_actor = $2
        WHERE id = $3
      `;
      await pool.query(query, [reason, actorId, decisionId]);
    } catch (err: any) {
      logger.warn(`PostgreSQL unavailable for recordOverride, using memory fallback`);
    }

    this.memoryDecisions.set(decisionId, existing);
    return existing;
  }

  /**
   * Save operational anomaly event
   */
  async recordAnomaly(anomaly: OperationalAnomalyEvent): Promise<OperationalAnomalyEvent> {
    try {
      const query = `
        INSERT INTO operational_anomalies (
          id, centre_id, anomaly_type, severity, description, detected_metric_value, baseline_metric_value, status, detected_timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;
      await pool.query(query, [
        anomaly.id,
        anomaly.centreId,
        anomaly.anomalyType,
        anomaly.severity,
        anomaly.description,
        anomaly.detectedMetricValue,
        anomaly.baselineMetricValue,
        anomaly.status,
        anomaly.detectedTimestamp
      ]);
    } catch (err: any) {
      logger.warn(`PostgreSQL unavailable for recordAnomaly, using memory fallback`);
    }

    this.memoryAnomalies.set(anomaly.id, anomaly);
    return anomaly;
  }

  /**
   * List active anomalies for a centre
   */
  async getActiveAnomalies(centreId?: string): Promise<OperationalAnomalyEvent[]> {
    const all = Array.from(this.memoryAnomalies.values());
    if (centreId) {
      return all.filter(a => a.centreId === centreId && a.status === 'ACTIVE');
    }
    return all.filter(a => a.status === 'ACTIVE');
  }

  /**
   * List all models from registry
   */
  async getModelRegistry(): Promise<ModelRegistryEntry[]> {
    return Array.from(this.memoryModels.values());
  }

  /**
   * Update model status (e.g. mark DEGRADED)
   */
  async updateModelStatus(modelId: string, status: 'ACTIVE' | 'DEGRADED' | 'STAGING'): Promise<ModelRegistryEntry | null> {
    const model = this.memoryModels.get(modelId);
    if (!model) return null;

    model.status = status;
    this.memoryModels.set(modelId, model);
    return model;
  }
}

export const intelligenceRepository = new IntelligenceRepository();
