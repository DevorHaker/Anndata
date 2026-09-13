import { slotRepository } from '../repositories/slot.repository';
import { centreDomainRepository } from '../repositories/centreDomain.repository';
import { SlotRecord, SlotStatus } from '../types/scheduling';
import { AppError, NotFoundError, ValidationError } from '../utils/errors';
import { auditService } from './audit.service';

export class SlotService {
  async getSlotAvailability(
    centreId: string,
    slotDate: string,
    cropTypeId?: string
  ): Promise<SlotRecord[]> {
    const centre = await centreDomainRepository.getCentreById(centreId);
    if (!centre) {
      throw new NotFoundError(`Procurement centre '${centreId}' not found.`);
    }

    if (centre.status === 'CLOSED' || centre.status === 'EMERGENCY') {
      return [];
    }

    return slotRepository.findSlotsByCentreAndDate(centreId, slotDate, cropTypeId);
  }

  async getSlotById(slotId: string): Promise<SlotRecord> {
    const slot = await slotRepository.findSlotById(slotId);
    if (!slot) {
      throw new NotFoundError(`Slot '${slotId}' not found.`);
    }
    return slot;
  }

  async generateSlotsForCentre(
    centreId: string,
    slotDate: string,
    cropTypeId: string,
    actorId: string,
    actorRole: string
  ): Promise<SlotRecord[]> {
    const centre = await centreDomainRepository.getCentreById(centreId);
    if (!centre) {
      throw new NotFoundError(`Procurement centre '${centreId}' not found.`);
    }

    const slots = await slotRepository.generateSlotsInMemory(centreId, slotDate, cropTypeId);

    await auditService.recordAudit({
      actorId,
      actorRole,
      action: 'GENERATE_SLOTS',
      entityType: 'SLOT',
      entityId: centreId,
      ipAddress: '127.0.0.1',
      afterState: { centreId, slotDate, cropTypeId, generatedCount: slots.length }
    });

    return slots;
  }

  async updateSlotStatus(
    slotId: string,
    status: SlotStatus,
    actorId: string,
    actorRole: string
  ): Promise<SlotRecord> {
    const slot = await slotRepository.findSlotById(slotId);
    if (!slot) {
      throw new NotFoundError(`Slot '${slotId}' not found.`);
    }

    slot.status = status;
    const updated = await slotRepository.saveSlot(slot);

    await auditService.recordAudit({
      actorId,
      actorRole,
      action: 'UPDATE_SLOT_STATUS',
      entityType: 'SLOT',
      entityId: slotId,
      ipAddress: '127.0.0.1',
      afterState: { slotId, status }
    });

    return updated;
  }
}

export const slotService = new SlotService();
