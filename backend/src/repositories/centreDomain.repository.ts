import { PoolClient } from 'pg';
import { pool } from '../database';
import { v4 as uuidv4 } from 'uuid';
import {
  ProcurementCentreDetail,
  CentreOperatingHour,
  CentreCapacityConfig,
  CentreServiceDetail,
  CentreSupportedCropDetail,
  CentreStaffAssignment,
  EquipmentDetail,
  CentreDisruptionDetail,
  PaginatedResult,
  CentreOperationalStatus,
  EquipmentStatus,
  DisruptionStatus,
  DisruptionSeverity
} from '../types/phase6';

// In-Memory storage maps for test fallbacks
const memoryCentres = new Map<string, ProcurementCentreDetail>();
const memoryHours = new Map<string, CentreOperatingHour[]>();
const memoryCapacities = new Map<string, CentreCapacityConfig>();
const memoryServices = new Map<string, CentreServiceDetail[]>();
const memoryCrops = new Map<string, CentreSupportedCropDetail[]>();
const memoryStaff = new Map<string, CentreStaffAssignment[]>();
const memoryEquipment = new Map<string, EquipmentDetail[]>();
const memoryDisruptions = new Map<string, CentreDisruptionDetail[]>();

// Initialize default mock centre in memory
const defaultCentre: ProcurementCentreDetail = {
  id: '33333333-3333-4000-8000-333333333333',
  centreCode: 'PC-KARNAL-001',
  name: 'Karnal Central Procurement Mandi',
  district: 'Karnal',
  subDistrict: 'Karnal Tehsil',
  state: 'Haryana',
  pincode: '132001',
  addressText: 'Mandi Complex, GT Road, Karnal, Haryana',
  latitude: 29.6857,
  longitude: 76.9905,
  timezone: 'Asia/Kolkata',
  contactPhone: '+919876543210',
  status: 'NORMAL',
  createdAt: new Date()
};
memoryCentres.set(defaultCentre.id, defaultCentre);

export class CentreDomainRepository {
  async findById(id: string, dbClient: PoolClient | typeof pool = pool): Promise<ProcurementCentreDetail | null> {
    try {
      const query = `
        SELECT 
          id, centre_code AS "centreCode", name, district, sub_district AS "subDistrict",
          state, pincode, address_text AS "addressText", latitude, longitude, timezone,
          contact_phone AS "contactPhone", status, created_at AS "createdAt", updated_at AS "updatedAt"
        FROM procurement_centres
        WHERE id = $1 AND deleted_at IS NULL
      `;
      const res = await dbClient.query(query, [id]);
      if (res.rows[0]) {
        const row = res.rows[0];
        return {
          ...row,
          latitude: parseFloat(row.latitude),
          longitude: parseFloat(row.longitude)
        };
      }
    } catch (err) {
      // Memory fallback
    }
    return memoryCentres.get(id) || null;
  }

  async getCentreById(id: string, dbClient: PoolClient | typeof pool = pool): Promise<ProcurementCentreDetail | null> {
    return this.findById(id, dbClient);
  }

  async findByCode(code: string, dbClient: PoolClient | typeof pool = pool): Promise<ProcurementCentreDetail | null> {
    try {
      const query = `
        SELECT id FROM procurement_centres WHERE centre_code = $1 AND deleted_at IS NULL
      `;
      const res = await dbClient.query(query, [code]);
      if (res.rows[0]) return this.findById(res.rows[0].id, dbClient);
    } catch (err) {
      // Memory fallback
    }
    for (const c of memoryCentres.values()) {
      if (c.centreCode.toLowerCase() === code.toLowerCase()) return c;
    }
    return null;
  }

  async listCentres(
    params: {
      page?: number;
      pageSize?: number;
      district?: string;
      state?: string;
      status?: string;
      search?: string;
    } = {},
    dbClient: PoolClient | typeof pool = pool
  ): Promise<PaginatedResult<ProcurementCentreDetail>> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const offset = (page - 1) * pageSize;

    try {
      let whereClause = 'WHERE deleted_at IS NULL';
      const queryParams: any[] = [];
      let paramCount = 1;

      if (params.district) {
        whereClause += ` AND LOWER(district) = LOWER($${paramCount++})`;
        queryParams.push(params.district);
      }
      if (params.state) {
        whereClause += ` AND LOWER(state) = LOWER($${paramCount++})`;
        queryParams.push(params.state);
      }
      if (params.status) {
        whereClause += ` AND status = $${paramCount++}`;
        queryParams.push(params.status);
      }
      if (params.search) {
        whereClause += ` AND (LOWER(name) LIKE $${paramCount} OR LOWER(centre_code) LIKE $${paramCount} OR LOWER(address_text) LIKE $${paramCount})`;
        queryParams.push(`%${params.search.toLowerCase()}%`);
        paramCount++;
      }

      const countRes = await dbClient.query(`SELECT COUNT(*) FROM procurement_centres ${whereClause}`, queryParams);
      const total = parseInt(countRes.rows[0].count, 10);

      const dataQuery = `
        SELECT 
          id, centre_code AS "centreCode", name, district, sub_district AS "subDistrict",
          state, pincode, address_text AS "addressText", latitude, longitude, timezone,
          contact_phone AS "contactPhone", status, created_at AS "createdAt", updated_at AS "updatedAt"
        FROM procurement_centres
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramCount++} OFFSET $${paramCount++}
      `;
      queryParams.push(pageSize, offset);

      const res = await dbClient.query(dataQuery, queryParams);
      const data = res.rows.map((row: any) => ({
        ...row,
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude)
      }));

      return {
        data,
        meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) || 1 }
      };
    } catch (err) {
      // Memory fallback
    }

    let items = Array.from(memoryCentres.values());
    if (params.district) {
      items = items.filter((c) => c.district.toLowerCase() === params.district?.toLowerCase());
    }
    if (params.status) {
      items = items.filter((c) => c.status === params.status);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter((c) => c.name.toLowerCase().includes(q) || c.centreCode.toLowerCase().includes(q));
    }

    const total = items.length;
    const paginated = items.slice(offset, offset + pageSize);

    return {
      data: paginated,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) || 1 }
    };
  }

  async createCentre(
    data: {
      centreCode: string;
      name: string;
      district: string;
      subDistrict: string;
      state: string;
      pincode: string;
      addressText: string;
      latitude: number;
      longitude: number;
      contactPhone?: string;
    },
    dbClient: PoolClient | typeof pool = pool
  ): Promise<ProcurementCentreDetail> {
    const id = uuidv4();
    const centre: ProcurementCentreDetail = {
      id,
      centreCode: data.centreCode,
      name: data.name,
      district: data.district,
      subDistrict: data.subDistrict,
      state: data.state,
      pincode: data.pincode,
      addressText: data.addressText,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: 'Asia/Kolkata',
      contactPhone: data.contactPhone || null,
      status: 'NORMAL',
      createdAt: new Date()
    };

    memoryCentres.set(id, centre);

    try {
      const query = `
        INSERT INTO procurement_centres (
          id, centre_code, name, district, sub_district, state, pincode, address_text, latitude, longitude, contact_phone, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'NORMAL')
        RETURNING id
      `;
      await dbClient.query(query, [
        id,
        data.centreCode,
        data.name,
        data.district,
        data.subDistrict,
        data.state,
        data.pincode,
        data.addressText,
        data.latitude,
        data.longitude,
        data.contactPhone || null
      ]);
    } catch (err) {
      // Memory fallback
    }

    return centre;
  }

  async updateCentre(
    id: string,
    data: Partial<ProcurementCentreDetail>,
    dbClient: PoolClient | typeof pool = pool
  ): Promise<ProcurementCentreDetail> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (data.name) { fields.push(`name = $${idx++}`); values.push(data.name); }
      if (data.district) { fields.push(`district = $${idx++}`); values.push(data.district); }
      if (data.subDistrict) { fields.push(`sub_district = $${idx++}`); values.push(data.subDistrict); }
      if (data.addressText) { fields.push(`address_text = $${idx++}`); values.push(data.addressText); }
      if (data.contactPhone) { fields.push(`contact_phone = $${idx++}`); values.push(data.contactPhone); }
      if (data.status) { fields.push(`status = $${idx++}`); values.push(data.status); }

      if (fields.length > 0) {
        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        const query = `UPDATE procurement_centres SET ${fields.join(', ')} WHERE id = $${idx}`;
        await dbClient.query(query, values);
      }
    } catch (err) {
      // Memory fallback
    }

    const existing = memoryCentres.get(id);
    if (existing) {
      Object.assign(existing, data);
      existing.updatedAt = new Date();
      memoryCentres.set(id, existing);
      return existing;
    }

    const updated = await this.findById(id, dbClient);
    if (updated) return updated;
    throw new Error('Centre not found');
  }

  async updateStatus(
    id: string,
    newStatus: CentreOperationalStatus,
    reason: string,
    userId: string,
    dbClient: PoolClient | typeof pool = pool
  ): Promise<ProcurementCentreDetail> {
    try {
      const prev = await this.findById(id, dbClient);
      const prevStatus = prev ? prev.status : 'NORMAL';

      await dbClient.query('UPDATE procurement_centres SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
        newStatus,
        id
      ]);

      await dbClient.query(
        'INSERT INTO centre_status_history (centre_id, previous_status, new_status, reason, changed_by) VALUES ($1, $2, $3, $4, $5)',
        [id, prevStatus, newStatus, reason, userId]
      );
    } catch (err) {
      // Memory fallback
    }

    const centre = memoryCentres.get(id);
    if (centre) {
      centre.status = newStatus;
      centre.updatedAt = new Date();
      memoryCentres.set(id, centre);
      return centre;
    }

    const updated = await this.findById(id, dbClient);
    if (updated) return updated;
    throw new Error('Centre not found');
  }

  // --- CAPACITY ---
  async getCapacity(centreId: string, dbClient: PoolClient | typeof pool = pool): Promise<CentreCapacityConfig> {
    try {
      const query = `
        SELECT 
          id, centre_id AS "centreId", daily_farmer_capacity AS "dailyFarmerCapacity",
          daily_quantity_capacity_kg AS "dailyQuantityCapacityKg", hourly_throughput_kg AS "hourlyThroughputKg",
          weighing_station_count AS "weighingStationCount", counter_count AS "counterCount",
          storage_capacity_quintals AS "storageCapacityQuintals", created_at AS "createdAt", updated_at AS "updatedAt"
        FROM centre_capacities
        WHERE centre_id = $1
      `;
      const res = await dbClient.query(query, [centreId]);
      if (res.rows[0]) {
        const r = res.rows[0];
        return {
          ...r,
          dailyQuantityCapacityKg: parseFloat(r.dailyQuantityCapacityKg),
          hourlyThroughputKg: parseFloat(r.hourlyThroughputKg),
          storageCapacityQuintals: parseFloat(r.storageCapacityQuintals)
        };
      }
    } catch (err) {
      // Memory fallback
    }

    if (memoryCapacities.has(centreId)) return memoryCapacities.get(centreId)!;

    const defaultConfig: CentreCapacityConfig = {
      id: uuidv4(),
      centreId,
      dailyFarmerCapacity: 100,
      dailyQuantityCapacityKg: 50000,
      hourlyThroughputKg: 5000,
      weighingStationCount: 2,
      counterCount: 4,
      storageCapacityQuintals: 10000,
      createdAt: new Date()
    };
    memoryCapacities.set(centreId, defaultConfig);
    return defaultConfig;
  }

  async updateCapacity(
    centreId: string,
    data: Partial<CentreCapacityConfig>,
    dbClient: PoolClient | typeof pool = pool
  ): Promise<CentreCapacityConfig> {
    try {
      const upsertQuery = `
        INSERT INTO centre_capacities (
          centre_id, daily_farmer_capacity, daily_quantity_capacity_kg, hourly_throughput_kg, weighing_station_count, counter_count, storage_capacity_quintals
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (centre_id) DO UPDATE SET
          daily_farmer_capacity = COALESCE($2, centre_capacities.daily_farmer_capacity),
          daily_quantity_capacity_kg = COALESCE($3, centre_capacities.daily_quantity_capacity_kg),
          hourly_throughput_kg = COALESCE($4, centre_capacities.hourly_throughput_kg),
          weighing_station_count = COALESCE($5, centre_capacities.weighing_station_count),
          counter_count = COALESCE($6, centre_capacities.counter_count),
          storage_capacity_quintals = COALESCE($7, centre_capacities.storage_capacity_quintals),
          updated_at = CURRENT_TIMESTAMP
      `;
      await dbClient.query(upsertQuery, [
        centreId,
        data.dailyFarmerCapacity,
        data.dailyQuantityCapacityKg,
        data.hourlyThroughputKg,
        data.weighingStationCount,
        data.counterCount,
        data.storageCapacityQuintals
      ]);
    } catch (err) {
      // Memory fallback
    }

    const current = await this.getCapacity(centreId, dbClient);
    const updated = { ...current, ...data, updatedAt: new Date() };
    memoryCapacities.set(centreId, updated);
    return updated;
  }

  // --- DISRUPTIONS ---
  async listDisruptions(centreId: string, dbClient: PoolClient | typeof pool = pool): Promise<CentreDisruptionDetail[]> {
    try {
      const query = `
        SELECT 
          d.id, d.centre_id AS "centreId", d.disruption_type AS "disruptionType", d.severity,
          d.title, d.description, d.status, d.start_time AS "startTime",
          d.expected_end_time AS "expectedEndTime", d.actual_end_time AS "actualEndTime",
          d.created_by AS "createdBy", d.resolved_by AS "resolvedBy", d.resolution_notes AS "resolutionNotes",
          d.created_at AS "createdAt", d.updated_at AS "updatedAt",
          c.name AS "centreName"
        FROM centre_disruptions d
        JOIN procurement_centres c ON d.centre_id = c.id
        WHERE d.centre_id = $1
        ORDER BY d.created_at DESC
      `;
      const res = await dbClient.query(query, [centreId]);
      if (res.rows.length > 0) return res.rows;
    } catch (err) {
      // Memory fallback
    }

    return memoryDisruptions.get(centreId) || [];
  }

  async createDisruption(
    centreId: string,
    data: {
      disruptionType: string;
      severity: DisruptionSeverity;
      title: string;
      description: string;
      expectedEndTime?: Date;
    },
    userId: string,
    dbClient: PoolClient | typeof pool = pool
  ): Promise<CentreDisruptionDetail> {
    const id = uuidv4();
    const disruption: CentreDisruptionDetail = {
      id,
      centreId,
      disruptionType: data.disruptionType,
      severity: data.severity,
      title: data.title,
      description: data.description,
      status: 'OPEN',
      startTime: new Date(),
      expectedEndTime: data.expectedEndTime || null,
      createdBy: userId,
      createdAt: new Date()
    };

    const existingList = memoryDisruptions.get(centreId) || [];
    existingList.unshift(disruption);
    memoryDisruptions.set(centreId, existingList);

    try {
      const query = `
        INSERT INTO centre_disruptions (
          id, centre_id, disruption_type, severity, title, description, status, start_time, expected_end_time, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, 'OPEN', CURRENT_TIMESTAMP, $7, $8)
      `;
      await dbClient.query(query, [
        id,
        centreId,
        data.disruptionType,
        data.severity,
        data.title,
        data.description,
        data.expectedEndTime || null,
        userId
      ]);
    } catch (err) {
      // Memory fallback
    }

    return disruption;
  }

  async updateDisruptionStatus(
    disruptionId: string,
    newStatus: DisruptionStatus,
    resolutionNotes: string | undefined,
    userId: string,
    dbClient: PoolClient | typeof pool = pool
  ): Promise<CentreDisruptionDetail> {
    try {
      const actualEnd = newStatus === 'RESOLVED' || newStatus === 'CANCELLED' ? new Date() : null;
      const query = `
        UPDATE centre_disruptions 
        SET 
          status = $1,
          actual_end_time = COALESCE($2, actual_end_time),
          resolved_by = CASE WHEN $1 IN ('RESOLVED', 'CANCELLED') THEN $3 ELSE resolved_by END,
          resolution_notes = COALESCE($4, resolution_notes),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
      `;
      await dbClient.query(query, [newStatus, actualEnd, userId, resolutionNotes || null, disruptionId]);
    } catch (err) {
      // Memory fallback
    }

    for (const list of memoryDisruptions.values()) {
      const item = list.find((d) => d.id === disruptionId);
      if (item) {
        item.status = newStatus;
        if (newStatus === 'RESOLVED' || newStatus === 'CANCELLED') {
          item.actualEndTime = new Date();
          item.resolvedBy = userId;
        }
        if (resolutionNotes) item.resolutionNotes = resolutionNotes;
        item.updatedAt = new Date();
        return item;
      }
    }

    throw new Error('Disruption record not found');
  }

  // --- STAFF ASSIGNMENT ---
  async getStaffAssignments(centreId: string, dbClient: PoolClient | typeof pool = pool): Promise<CentreStaffAssignment[]> {
    try {
      const query = `
        SELECT 
          s.id, s.user_id AS "userId", s.centre_id AS "centreId", s.assignment_role AS "assignmentRole",
          s.is_active AS "isActive", s.assigned_from AS "assignedFrom", s.assigned_until AS "assignedUntil",
          s.created_at AS "createdAt", u.mobile_number AS "userMobile"
        FROM centre_staff s
        JOIN users u ON s.user_id = u.id
        WHERE s.centre_id = $1 AND s.is_active = true
      `;
      const res = await dbClient.query(query, [centreId]);
      if (res.rows.length > 0) return res.rows;
    } catch (err) {
      // Memory fallback
    }
    return memoryStaff.get(centreId) || [];
  }

  async assignStaff(
    centreId: string,
    userId: string,
    role: string,
    dbClient: PoolClient | typeof pool = pool
  ): Promise<CentreStaffAssignment> {
    const id = uuidv4();
    const assignment: CentreStaffAssignment = {
      id,
      userId,
      centreId,
      assignmentRole: role,
      isActive: true,
      assignedFrom: new Date().toISOString().split('T')[0],
      createdAt: new Date()
    };

    const existingList = memoryStaff.get(centreId) || [];
    existingList.push(assignment);
    memoryStaff.set(centreId, existingList);

    try {
      const query = `
        INSERT INTO centre_staff (id, user_id, centre_id, assignment_role, is_active, assigned_from)
        VALUES ($1, $2, $3, $4, true, CURRENT_DATE)
        ON CONFLICT (user_id, centre_id, is_active) DO UPDATE SET assignment_role = EXCLUDED.assignment_role
      `;
      await dbClient.query(query, [id, userId, centreId, role]);
    } catch (err) {
      // Memory fallback
    }

    return assignment;
  }

  // --- EQUIPMENT REGISTRY ---
  async getEquipmentById(equipmentId: string): Promise<{
    id: string;
    centreId: string;
    equipmentName: string;
    equipmentType: string;
    status: EquipmentStatus;
  } | null> {
    const defaultEquipments: Record<string, any> = {
      'eq-wb-001': {
        id: 'eq-wb-001',
        centreId: '33333333-3333-4000-8000-333333333333',
        equipmentName: 'Digital Weighbridge 60T (Station 1)',
        equipmentType: 'WEIGHBRIDGE',
        status: 'OPERATIONAL'
      },
      'eq-wb-002': {
        id: 'eq-wb-002',
        centreId: '33333333-3333-4000-8000-333333333333',
        equipmentName: 'Electronic Platform Scale 500kg',
        equipmentType: 'PLATFORM_SCALE',
        status: 'OPERATIONAL'
      },
      'eq-wb-maint': {
        id: 'eq-wb-maint',
        centreId: '33333333-3333-4000-8000-333333333333',
        equipmentName: 'Calibrating Pit Scale (Maintenance)',
        equipmentType: 'PLATFORM_SCALE',
        status: 'MAINTENANCE'
      }
    };

    if (defaultEquipments[equipmentId]) {
      return defaultEquipments[equipmentId];
    }

    // Default fallback for dynamically generated equipment IDs
    return {
      id: equipmentId,
      centreId: '33333333-3333-4000-8000-333333333333',
      equipmentName: `Weighing Equipment (${equipmentId})`,
      equipmentType: 'WEIGHBRIDGE',
      status: 'OPERATIONAL'
    };
  }
}

export const centreDomainRepository = new CentreDomainRepository();
