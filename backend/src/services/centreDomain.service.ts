import { centreDomainRepository } from '../repositories/centreDomain.repository';
import { auditService } from './audit.service';
import { AppError, ForbiddenError, NotFoundError, ConflictError, ValidationError } from '../utils/errors';
import {
  ProcurementCentreDetail,
  CentreCapacityConfig,
  CentreOperationalStatus,
  DisruptionStatus,
  DisruptionSeverity
} from '../types/phase6';

export class CentreDomainService {
  async getCentreDetails(id: string) {
    const centre = await centreDomainRepository.findById(id);
    if (!centre) {
      throw new NotFoundError('Procurement centre does not exist', 'CENTRE_NOT_FOUND');
    }
    return centre;
  }

  async listCentres(params: { page?: number; pageSize?: number; district?: string; state?: string; status?: string; search?: string }) {
    return centreDomainRepository.listCentres(params);
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
    requestingUser: { userId: string; role: string; ipAddress?: string }
  ) {
    if (requestingUser.role !== 'SYSTEM_ADMIN' && requestingUser.role !== 'DISTRICT_ADMIN' && requestingUser.role !== 'ADMIN') {
      throw new ForbiddenError('Only authorized administrators may register procurement centres', 'FORBIDDEN_ROLE');
    }

    const existingCode = await centreDomainRepository.findByCode(data.centreCode);
    if (existingCode) {
      throw new ConflictError(`Procurement centre with code '${data.centreCode}' already exists`, 'DUPLICATE_CENTRE_CODE');
    }

    if (data.latitude < -90 || data.latitude > 90 || data.longitude < -180 || data.longitude > 180) {
      throw new ValidationError('Latitude must be between -90 and +90, longitude between -180 and +180', 'INVALID_COORDINATES');
    }

    const centre = await centreDomainRepository.createCentre(data);

    await auditService.recordAudit({
      requestId: 'REQ-CREATE-CENTRE',
      actorId: requestingUser.userId,
      actorRole: requestingUser.role,
      action: 'CENTRE_CREATED',
      entityType: 'PROCUREMENT_CENTRE',
      entityId: centre.id,
      afterState: centre,
      ipAddress: requestingUser.ipAddress || '127.0.0.1',
      reason: 'New procurement centre registered'
    });

    return centre;
  }

  async updateCentreStatus(
    centreId: string,
    newStatus: CentreOperationalStatus,
    reason: string,
    requestingUser: { userId: string; role: string; ipAddress?: string }
  ) {
    const existing = await centreDomainRepository.findById(centreId);
    if (!existing) {
      throw new NotFoundError('Procurement centre does not exist', 'CENTRE_NOT_FOUND');
    }

    const validStatuses: CentreOperationalStatus[] = [
      'NORMAL',
      'BUSY',
      'CONGESTED',
      'CRITICAL',
      'CLOSED',
      'PARTIAL',
      'EMERGENCY'
    ];
    if (!validStatuses.includes(newStatus)) {
      throw new ValidationError(`Invalid operational status '${newStatus}'`, 'INVALID_STATUS');
    }

    const updated = await centreDomainRepository.updateStatus(centreId, newStatus, reason, requestingUser.userId);

    await auditService.recordAudit({
      requestId: 'REQ-CENTRE-STATUS',
      actorId: requestingUser.userId,
      actorRole: requestingUser.role,
      action: 'CENTRE_STATUS_CHANGED',
      entityType: 'PROCUREMENT_CENTRE',
      entityId: centreId,
      beforeState: { status: existing.status },
      afterState: { status: updated.status },
      ipAddress: requestingUser.ipAddress || '127.0.0.1',
      reason
    });

    return updated;
  }

  async getCapacity(centreId: string) {
    const centre = await centreDomainRepository.findById(centreId);
    if (!centre) {
      throw new NotFoundError('Procurement centre does not exist', 'CENTRE_NOT_FOUND');
    }
    return centreDomainRepository.getCapacity(centreId);
  }

  async updateCapacity(
    centreId: string,
    data: Partial<CentreCapacityConfig>,
    requestingUser: { userId: string; role: string; ipAddress?: string }
  ) {
    const centre = await centreDomainRepository.findById(centreId);
    if (!centre) {
      throw new NotFoundError('Procurement centre does not exist', 'CENTRE_NOT_FOUND');
    }

    if (data.dailyFarmerCapacity !== undefined && data.dailyFarmerCapacity < 0) {
      throw new ValidationError('Farmer capacity cannot be negative', 'INVALID_CAPACITY');
    }
    if (data.dailyQuantityCapacityKg !== undefined && data.dailyQuantityCapacityKg < 0) {
      throw new ValidationError('Quantity capacity cannot be negative', 'INVALID_CAPACITY');
    }

    const existing = await centreDomainRepository.getCapacity(centreId);
    const updated = await centreDomainRepository.updateCapacity(centreId, data);

    await auditService.recordAudit({
      requestId: 'REQ-CAPACITY-UPDATE',
      actorId: requestingUser.userId,
      actorRole: requestingUser.role,
      action: 'CENTRE_CAPACITY_CHANGED',
      entityType: 'PROCUREMENT_CENTRE',
      entityId: centreId,
      beforeState: existing,
      afterState: updated,
      ipAddress: requestingUser.ipAddress || '127.0.0.1',
      reason: 'Procurement capacity configuration updated'
    });

    return updated;
  }

  async listDisruptions(centreId: string) {
    const centre = await centreDomainRepository.findById(centreId);
    if (!centre) {
      throw new NotFoundError('Procurement centre does not exist', 'CENTRE_NOT_FOUND');
    }
    return centreDomainRepository.listDisruptions(centreId);
  }

  async createDisruption(
    centreId: string,
    data: { disruptionType: string; severity: DisruptionSeverity; title: string; description: string; expectedEndTime?: Date },
    requestingUser: { userId: string; role: string; ipAddress?: string }
  ) {
    const centre = await centreDomainRepository.findById(centreId);
    if (!centre) {
      throw new NotFoundError('Procurement centre does not exist', 'CENTRE_NOT_FOUND');
    }

    const disruption = await centreDomainRepository.createDisruption(centreId, data, requestingUser.userId);

    await auditService.recordAudit({
      requestId: 'REQ-DISRUPTION-CREATE',
      actorId: requestingUser.userId,
      actorRole: requestingUser.role,
      action: 'CENTRE_DISRUPTION_CREATED',
      entityType: 'PROCUREMENT_CENTRE',
      entityId: centreId,
      afterState: disruption,
      ipAddress: requestingUser.ipAddress || '127.0.0.1',
      reason: `Operational disruption reported: ${data.title}`
    });

    return disruption;
  }

  async updateDisruptionStatus(
    disruptionId: string,
    newStatus: DisruptionStatus,
    resolutionNotes: string | undefined,
    requestingUser: { userId: string; role: string; ipAddress?: string }
  ) {
    const updated = await centreDomainRepository.updateDisruptionStatus(
      disruptionId,
      newStatus,
      resolutionNotes,
      requestingUser.userId
    );

    await auditService.recordAudit({
      requestId: 'REQ-DISRUPTION-UPDATE',
      actorId: requestingUser.userId,
      actorRole: requestingUser.role,
      action: 'CENTRE_DISRUPTION_UPDATED',
      entityType: 'PROCUREMENT_CENTRE',
      entityId: updated.centreId,
      afterState: updated,
      ipAddress: requestingUser.ipAddress || '127.0.0.1',
      reason: `Disruption status updated to ${newStatus}`
    });

    return updated;
  }

  async getStaff(centreId: string) {
    const centre = await centreDomainRepository.findById(centreId);
    if (!centre) {
      throw new NotFoundError('Procurement centre does not exist', 'CENTRE_NOT_FOUND');
    }
    return centreDomainRepository.getStaffAssignments(centreId);
  }

  async assignStaff(centreId: string, userId: string, role: string, requestingUser: { userId: string; role: string }) {
    const centre = await centreDomainRepository.findById(centreId);
    if (!centre) {
      throw new NotFoundError('Procurement centre does not exist', 'CENTRE_NOT_FOUND');
    }

    if (role === 'FARMER') {
      throw new ValidationError('Farmers cannot be assigned as procurement centre staff', 'INVALID_STAFF_ROLE');
    }
    return centreDomainRepository.assignStaff(centreId, userId, role);
  }
}

export const centreDomainService = new CentreDomainService();
