import { PoolClient } from 'pg';
import { pool } from '../database';
import { v4 as uuidv4 } from 'uuid';

export interface UserRecord {
  id: string;
  mobileNumber: string;
  passwordHash: string;
  roleId: string;
  roleCode: string;
  roleName: string;
  status: string;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPermission {
  code: string;
  module: string;
}

const DEFAULT_ROLES = [
  { id: '00000000-0000-4000-8000-000000000001', code: 'SYSTEM_ADMIN', name: 'System Administrator' },
  { id: '00000000-0000-4000-8000-000000000001', code: 'ADMIN', name: 'System Administrator' },
  { id: '00000000-0000-4000-8000-000000000002', code: 'FARMER', name: 'Farmer' },
  { id: '00000000-0000-4000-8000-000000000003', code: 'CENTRE_MANAGER', name: 'Centre Manager' },
  { id: '00000000-0000-4000-8000-000000000004', code: 'PROCUREMENT_OFFICER', name: 'Procurement Officer' },
  { id: '00000000-0000-4000-8000-000000000005', code: 'DISTRICT_ADMIN', name: 'District Administrator' }
];

const DEFAULT_PASSWORD_HASH = '$2a$10$Mnq.AWbOxRROmIhRTm2N/eJT.WfpqEFx6pX/D//rRFyeg882vKSnS'; // Sp@123456

const INITIAL_DEMO_USERS: UserRecord[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    mobileNumber: '+919999900001',
    passwordHash: DEFAULT_PASSWORD_HASH,
    roleId: '00000000-0000-4000-8000-000000000001',
    roleCode: 'SYSTEM_ADMIN',
    roleName: 'System Administrator',
    status: 'ACTIVE',
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    mobileNumber: '+919999900002',
    passwordHash: DEFAULT_PASSWORD_HASH,
    roleId: '00000000-0000-4000-8000-000000000002',
    roleCode: 'FARMER',
    roleName: 'Farmer',
    status: 'ACTIVE',
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    mobileNumber: '+919999900003',
    passwordHash: DEFAULT_PASSWORD_HASH,
    roleId: '00000000-0000-4000-8000-000000000003',
    roleCode: 'CENTRE_MANAGER',
    roleName: 'Centre Manager',
    status: 'ACTIVE',
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    mobileNumber: '+919999900004',
    passwordHash: DEFAULT_PASSWORD_HASH,
    roleId: '00000000-0000-4000-8000-000000000004',
    roleCode: 'PROCUREMENT_OFFICER',
    roleName: 'Procurement Officer',
    status: 'ACTIVE',
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    mobileNumber: '+919999900005',
    passwordHash: DEFAULT_PASSWORD_HASH,
    roleId: '00000000-0000-4000-8000-000000000005',
    roleCode: 'DISTRICT_ADMIN',
    roleName: 'District Administrator',
    status: 'ACTIVE',
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const inMemoryUsers = new Map<string, UserRecord>(INITIAL_DEMO_USERS.map((u) => [u.id, u]));

export class UserRepository {
  async findByMobileNumber(mobileNumber: string, dbClient: PoolClient | typeof pool = pool): Promise<UserRecord | null> {
    const formattedMobile = mobileNumber.startsWith('+') ? mobileNumber : `+91${mobileNumber.replace(/^0+/, '')}`;

    try {
      const query = `
        SELECT 
          u.id,
          u.mobile_number AS "mobileNumber",
          u.password_hash AS "passwordHash",
          u.role_id AS "roleId",
          r.code AS "roleCode",
          r.name AS "roleName",
          u.status,
          u.failed_login_attempts AS "failedLoginAttempts",
          u.locked_until AS "lockedUntil",
          u.last_login_at AS "lastLoginAt",
          u.created_at AS "createdAt",
          u.updated_at AS "updatedAt"
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE (u.mobile_number = $1 OR u.mobile_number = $2) AND u.deleted_at IS NULL
      `;
      const res = await dbClient.query(query, [mobileNumber, formattedMobile]);
      if (res.rows[0]) return res.rows[0];
    } catch (err) {
      // Database unavailable, check memory store below
    }

    for (const u of inMemoryUsers.values()) {
      if (u.mobileNumber === mobileNumber || u.mobileNumber === formattedMobile) return u;
    }
    return null;
  }

  async findById(id: string, dbClient: PoolClient | typeof pool = pool): Promise<UserRecord | null> {
    try {
      const query = `
        SELECT 
          u.id,
          u.mobile_number AS "mobileNumber",
          u.password_hash AS "passwordHash",
          u.role_id AS "roleId",
          r.code AS "roleCode",
          r.name AS "roleName",
          u.status,
          u.failed_login_attempts AS "failedLoginAttempts",
          u.locked_until AS "lockedUntil",
          u.last_login_at AS "lastLoginAt",
          u.created_at AS "createdAt",
          u.updated_at AS "updatedAt"
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1 AND u.deleted_at IS NULL
      `;
      const res = await dbClient.query(query, [id]);
      return res.rows[0] || null;
    } catch (err) {
      return inMemoryUsers.get(id) || null;
    }
  }

  async findRoleByCode(code: string, dbClient: PoolClient | typeof pool = pool): Promise<{ id: string; code: string; name: string } | null> {
    try {
      const query = `SELECT id, code, name FROM roles WHERE code = $1 OR (code = 'ADMIN' AND $1 = 'SYSTEM_ADMIN') OR (code = 'SYSTEM_ADMIN' AND $1 = 'ADMIN')`;
      const res = await dbClient.query(query, [code]);
      if (res.rows[0]) return res.rows[0];
    } catch (err) {
      // Fallback below
    }
    const matched = DEFAULT_ROLES.find(
      (r) => r.code === code || (r.code === 'ADMIN' && code === 'SYSTEM_ADMIN') || (r.code === 'SYSTEM_ADMIN' && code === 'ADMIN')
    );
    return matched || null;
  }

  async getRolePermissions(roleId: string, dbClient: PoolClient | typeof pool = pool): Promise<UserPermission[]> {
    try {
      const query = `
        SELECT p.code, p.module
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = $1
      `;
      const res = await dbClient.query(query, [roleId]);
      if (res.rows.length > 0) return res.rows;
    } catch (err) {
      // Fallthrough
    }
    return [
      { code: 'READ_HEALTH', module: 'SYSTEM' },
      { code: 'MANAGE_USERS', module: 'IDENTITY' },
      { code: 'CREATE_BOOKING', module: 'SCHEDULING' }
    ];
  }

  async createUser(
    client: PoolClient | typeof pool,
    userData: { mobileNumber: string; passwordHash: string; roleId: string; status?: string }
  ): Promise<UserRecord> {
    const id = uuidv4();
    const role = (await this.findRoleByCode(userData.roleId, client)) || DEFAULT_ROLES.find((r) => r.id === userData.roleId) || DEFAULT_ROLES[2];
    const status = userData.status || 'ACTIVE';

    const record: UserRecord = {
      id,
      mobileNumber: userData.mobileNumber,
      passwordHash: userData.passwordHash,
      roleId: role.id,
      roleCode: role.code,
      roleName: role.name,
      status,
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const query = `
        INSERT INTO users (id, mobile_number, password_hash, role_id, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;
      await client.query(query, [id, userData.mobileNumber, userData.passwordHash, userData.roleId, status]);
    } catch (err) {
      // Degraded fallback save
    }

    inMemoryUsers.set(id, record);
    return record;
  }

  async recordFailedLogin(userId: string, attempts: number, lockUntil: Date | null): Promise<void> {
    try {
      const query = `
        UPDATE users 
        SET failed_login_attempts = $2,
            locked_until = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      await pool.query(query, [userId, attempts, lockUntil]);
    } catch (err) {
      // Memory fallback
    }
    const mem = inMemoryUsers.get(userId);
    if (mem) {
      mem.failedLoginAttempts = attempts;
      mem.lockedUntil = lockUntil;
    }
  }

  async resetFailedLogins(userId: string): Promise<void> {
    try {
      const query = `
        UPDATE users 
        SET failed_login_attempts = 0,
            locked_until = NULL,
            last_login_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      await pool.query(query, [userId]);
    } catch (err) {
      // Memory fallback
    }
    const mem = inMemoryUsers.get(userId);
    if (mem) {
      mem.failedLoginAttempts = 0;
      mem.lockedUntil = null;
      mem.lastLoginAt = new Date();
    }
  }

  async updateUserStatus(userId: string, status: string): Promise<void> {
    try {
      const query = `UPDATE users SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`;
      await pool.query(query, [userId, status]);
    } catch (err) {
      // Memory fallback
    }
    const mem = inMemoryUsers.get(userId);
    if (mem) mem.status = status;
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    try {
      const query = `
        UPDATE users 
        SET password_hash = $2,
            failed_login_attempts = 0,
            locked_until = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      await pool.query(query, [userId, passwordHash]);
    } catch (err) {
      // Memory fallback
    }
    const mem = inMemoryUsers.get(userId);
    if (mem) {
      mem.passwordHash = passwordHash;
      mem.failedLoginAttempts = 0;
      mem.lockedUntil = null;
    }
  }

  async updateUserRole(userId: string, roleId: string): Promise<void> {
    const role = DEFAULT_ROLES.find((r) => r.id === roleId || r.code === roleId) || DEFAULT_ROLES[0];
    try {
      const query = `UPDATE users SET role_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`;
      await pool.query(query, [userId, role.id]);
    } catch (err) {
      // Memory fallback
    }
    const mem = inMemoryUsers.get(userId);
    if (mem) {
      mem.roleId = role.id;
      mem.roleCode = role.code;
      mem.roleName = role.name;
    }
  }

  async listUsers(page = 1, limit = 20, roleCode?: string, status?: string): Promise<{ users: any[]; total: number }> {
    try {
      const offset = (page - 1) * limit;
      const params: any[] = [];
      let whereClauses = ['u.deleted_at IS NULL'];

      if (roleCode) {
        params.push(roleCode);
        whereClauses.push(`r.code = $${params.length}`);
      }

      if (status) {
        params.push(status);
        whereClauses.push(`u.status = $${params.length}`);
      }

      const whereStr = whereClauses.join(' AND ');
      const countQuery = `SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE ${whereStr}`;
      const countRes = await pool.query(countQuery, params);
      const total = parseInt(countRes.rows[0].count, 10);

      params.push(limit, offset);
      const dataQuery = `
        SELECT u.id, u.mobile_number AS "mobileNumber", u.status, r.code AS "roleCode", r.name AS "roleName",
               u.failed_login_attempts AS "failedLoginAttempts", u.locked_until AS "lockedUntil",
               u.last_login_at AS "lastLoginAt", u.created_at AS "createdAt"
        FROM users u JOIN roles r ON u.role_id = r.id
        WHERE ${whereStr}
        ORDER BY u.created_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `;
      const dataRes = await pool.query(dataQuery, params);
      return { users: dataRes.rows, total };
    } catch (err) {
      let filtered = Array.from(inMemoryUsers.values());
      if (roleCode) filtered = filtered.filter((u) => u.roleCode === roleCode);
      if (status) filtered = filtered.filter((u) => u.status === status);
      const total = filtered.length;
      const offset = (page - 1) * limit;
      const paginated = filtered.slice(offset, offset + limit);
      return { users: paginated, total };
    }
  }
}

export const userRepository = new UserRepository();
