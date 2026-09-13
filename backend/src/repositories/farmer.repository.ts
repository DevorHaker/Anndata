import { PoolClient } from 'pg';
import { pool } from '../database';
import { v4 as uuidv4 } from 'uuid';

export interface FarmerRecord {
  id: string;
  userId: string;
  farmerReferenceId: string;
  firstName: string;
  lastName: string;
  verificationStatus: string;
  status: string;
  createdAt: Date;
}

const inMemoryFarmers = new Map<string, FarmerRecord>();

export class FarmerRepository {
  async findByUserId(userId: string, dbClient: PoolClient | typeof pool = pool): Promise<FarmerRecord | null> {
    try {
      const query = `
        SELECT 
          id, 
          user_id AS "userId", 
          farmer_reference_id AS "farmerReferenceId",
          first_name AS "firstName",
          last_name AS "lastName",
          verification_status AS "verificationStatus",
          status,
          created_at AS "createdAt"
        FROM farmers
        WHERE user_id = $1 AND deleted_at IS NULL
      `;
      const res = await dbClient.query(query, [userId]);
      if (res.rows[0]) return res.rows[0];
    } catch (err) {
      // Memory fallback
    }
    for (const f of inMemoryFarmers.values()) {
      if (f.userId === userId) return f;
    }
    return null;
  }

  async findById(farmerId: string, dbClient: PoolClient | typeof pool = pool): Promise<FarmerRecord | null> {
    try {
      const query = `
        SELECT 
          id, 
          user_id AS "userId", 
          farmer_reference_id AS "farmerReferenceId",
          first_name AS "firstName",
          last_name AS "lastName",
          verification_status AS "verificationStatus",
          status,
          created_at AS "createdAt"
        FROM farmers
        WHERE id = $1 AND deleted_at IS NULL
      `;
      const res = await dbClient.query(query, [farmerId]);
      if (res.rows[0]) return res.rows[0];
    } catch (err) {
      // Memory fallback
    }
    return inMemoryFarmers.get(farmerId) || null;
  }

  async createFarmer(
    client: PoolClient | typeof pool,
    data: { userId: string; firstName: string; lastName: string }
  ): Promise<FarmerRecord> {
    const id = uuidv4();
    const farmerRef = `FARM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const farmer: FarmerRecord = {
      id,
      userId: data.userId,
      farmerReferenceId: farmerRef,
      firstName: data.firstName,
      lastName: data.lastName,
      verificationStatus: 'VERIFIED',
      status: 'ACTIVE',
      createdAt: new Date()
    };

    inMemoryFarmers.set(id, farmer);

    try {
      const query = `
        INSERT INTO farmers (id, user_id, farmer_reference_id, first_name, last_name, verification_status, status)
        VALUES ($1, $2, $3, $4, $5, 'VERIFIED', 'ACTIVE')
        RETURNING id
      `;
      await client.query(query, [id, data.userId, farmerRef, data.firstName, data.lastName]);
    } catch (err) {
      // Memory fallback active
    }

    return farmer;
  }
}

export const farmerRepository = new FarmerRepository();
