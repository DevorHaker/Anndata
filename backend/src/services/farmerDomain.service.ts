import { farmerDomainRepository } from '../repositories/farmerDomain.repository';
import { auditService } from './audit.service';
import { AppError, ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';
import { FarmerDetail, FarmerProfileData, FarmerProduceDetail, VerificationStatus, AccountStatus } from '../types/phase6';

export class FarmerDomainService {
  async getFarmerProfile(farmerId: string, requestingUser: { userId: string; role: string; farmerId?: string | null }) {
    // Ownership or Admin RBAC Enforcement
    if (requestingUser.role === 'FARMER' && requestingUser.farmerId && requestingUser.farmerId !== farmerId) {
      throw new ForbiddenError('Farmers are only authorized to access their own profile', 'FORBIDDEN_SCOPE');
    }

    const farmer = await farmerDomainRepository.findById(farmerId);
    if (!farmer) {
      throw new NotFoundError('Farmer profile does not exist', 'FARMER_NOT_FOUND');
    }
    return farmer;
  }

  async getMyProfile(userId: string) {
    const farmer = await farmerDomainRepository.findByUserId(userId);
    if (!farmer) {
      throw new NotFoundError('No farmer domain profile associated with this account', 'FARMER_PROFILE_NOT_FOUND');
    }
    return farmer;
  }

  async updateFarmerProfile(
    farmerId: string,
    data: {
      firstName?: string;
      lastName?: string;
      gender?: string;
      profile?: FarmerProfileData;
    },
    requestingUser: { userId: string; role: string; farmerId?: string | null; ipAddress?: string }
  ) {
    // Ownership or Admin Check
    if (requestingUser.role === 'FARMER' && requestingUser.farmerId && requestingUser.farmerId !== farmerId) {
      throw new ForbiddenError('Farmers are only authorized to update their own profile', 'FORBIDDEN_SCOPE');
    }

    const existing = await farmerDomainRepository.findById(farmerId);
    if (!existing) {
      throw new NotFoundError('Farmer profile does not exist', 'FARMER_NOT_FOUND');
    }

    const updated = await farmerDomainRepository.saveProfile(farmerId, data);

    // Record Security Audit
    await auditService.recordAudit({
      requestId: 'REQ-PROFILE-UPDATE',
      actorId: requestingUser.userId,
      actorRole: requestingUser.role,
      action: 'FARMER_PROFILE_UPDATED',
      entityType: 'FARMER',
      entityId: farmerId,
      beforeState: existing,
      afterState: updated,
      ipAddress: requestingUser.ipAddress || '127.0.0.1',
      reason: 'Farmer profile information updated'
    });

    return updated;
  }

  async updateFarmerStatus(
    farmerId: string,
    status: AccountStatus,
    requestingUser: { userId: string; role: string; ipAddress?: string }
  ) {
    if (requestingUser.role !== 'SYSTEM_ADMIN' && requestingUser.role !== 'DISTRICT_ADMIN' && requestingUser.role !== 'ADMIN') {
      throw new ForbiddenError('Only authorized administrators may update farmer account status', 'FORBIDDEN_ROLE');
    }

    const existing = await farmerDomainRepository.findById(farmerId);
    if (!existing) {
      throw new NotFoundError('Farmer profile does not exist', 'FARMER_NOT_FOUND');
    }

    const updated = await farmerDomainRepository.updateFarmerStatus(farmerId, status);

    await auditService.recordAudit({
      requestId: 'REQ-FARMER-STATUS',
      actorId: requestingUser.userId,
      actorRole: requestingUser.role,
      action: 'FARMER_STATUS_UPDATED',
      entityType: 'FARMER',
      entityId: farmerId,
      beforeState: { status: existing.status },
      afterState: { status: updated.status },
      ipAddress: requestingUser.ipAddress || '127.0.0.1',
      reason: `Account status updated to ${status}`
    });

    return updated;
  }

  async verifyFarmer(
    farmerId: string,
    status: VerificationStatus,
    requestingUser: { userId: string; role: string; ipAddress?: string }
  ) {
    if (requestingUser.role !== 'SYSTEM_ADMIN' && requestingUser.role !== 'DISTRICT_ADMIN' && requestingUser.role !== 'ADMIN') {
      throw new ForbiddenError('Only authorized administrators may verify farmer profiles', 'FORBIDDEN_ROLE');
    }

    const existing = await farmerDomainRepository.findById(farmerId);
    if (!existing) {
      throw new NotFoundError('Farmer profile does not exist', 'FARMER_NOT_FOUND');
    }

    const updated = await farmerDomainRepository.updateFarmerVerification(farmerId, status);

    await auditService.recordAudit({
      requestId: 'REQ-FARMER-VERIFY',
      actorId: requestingUser.userId,
      actorRole: requestingUser.role,
      action: 'FARMER_VERIFICATION_UPDATED',
      entityType: 'FARMER',
      entityId: farmerId,
      beforeState: { verificationStatus: existing.verificationStatus },
      afterState: { verificationStatus: updated.verificationStatus },
      ipAddress: requestingUser.ipAddress || '127.0.0.1',
      reason: `Verification status updated to ${status}`
    });

    return updated;
  }

  async searchFarmers(
    params: { page?: number; pageSize?: number; district?: string; verificationStatus?: string; status?: string; search?: string },
    requestingUser: { userId: string; role: string }
  ) {
    if (requestingUser.role === 'FARMER') {
      throw new ForbiddenError('Farmers are not authorized to search the global farmer registry', 'FORBIDDEN_ROLE');
    }
    return farmerDomainRepository.listFarmers(params);
  }

  // --- PRODUCE SERVICE METHODS ---
  async getCropTypes() {
    return farmerDomainRepository.getCropTypes();
  }

  async addFarmerProduce(
    farmerId: string,
    data: { cropTypeId: string; cropVarietyId?: string; harvestSeason: string; estimatedYieldKg: number; declaredQuantityKg: number },
    requestingUser: { userId: string; role: string; farmerId?: string | null }
  ) {
    if (requestingUser.role === 'FARMER' && requestingUser.farmerId && requestingUser.farmerId !== farmerId) {
      throw new ForbiddenError('Farmers can only add produce declarations for their own account', 'FORBIDDEN_SCOPE');
    }

    if (data.declaredQuantityKg <= 0) {
      throw new ValidationError('Declared produce quantity must be greater than zero', 'INVALID_QUANTITY');
    }

    const produce = await farmerDomainRepository.createProduce(farmerId, data);
    return produce;
  }

  async listFarmerProduce(farmerId: string, requestingUser: { userId: string; role: string; farmerId?: string | null }) {
    if (requestingUser.role === 'FARMER' && requestingUser.farmerId && requestingUser.farmerId !== farmerId) {
      throw new ForbiddenError('Farmers can only view produce declarations for their own account', 'FORBIDDEN_SCOPE');
    }
    return farmerDomainRepository.listFarmerProduce(farmerId);
  }
}

export const farmerDomainService = new FarmerDomainService();
