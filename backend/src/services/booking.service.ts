import { bookingRepository } from '../repositories/booking.repository';
import { slotRepository } from '../repositories/slot.repository';
import { centreDomainRepository } from '../repositories/centreDomain.repository';
import { farmerDomainRepository } from '../repositories/farmerDomain.repository';
import { quantityWorkloadModel } from './recommendation/QuantityWorkloadModel';
import { BookingRecord, BookingStatus } from '../types/scheduling';
import { AppError, NotFoundError, ValidationError, ConflictError, ForbiddenError } from '../utils/errors';
import { auditService } from './audit.service';
import { v4 as uuidv4 } from 'uuid';

export interface CreateBookingParams {
  farmerId: string;
  centreId: string;
  slotId: string;
  cropTypeId: string;
  declaredWeightKg: number;
  idempotencyKey?: string | null;
}

export class BookingService {
  async createBooking(
    params: CreateBookingParams,
    actorId: string,
    actorRole: string
  ): Promise<BookingRecord> {
    const { farmerId, centreId, slotId, cropTypeId, declaredWeightKg, idempotencyKey } = params;

    if (declaredWeightKg <= 0) {
      throw new ValidationError('Declared weight must be greater than zero.', 'INVALID_QUANTITY');
    }

    // 1. Idempotency Key Check
    if (idempotencyKey) {
      const existing = await bookingRepository.findBookingByIdempotencyKey(idempotencyKey);
      if (existing) {
        return existing;
      }
    }

    // 2. Validate Farmer & Ownership
    const farmer = await farmerDomainRepository.findFarmerById(farmerId);
    if (!farmer) {
      throw new NotFoundError(`Farmer '${farmerId}' not found.`);
    }

    if (actorRole === 'FARMER' && farmer.userId !== actorId) {
      throw new ForbiddenError('You can only book procurement slots for your own registered farmer profile.');
    }

    // 3. Validate Centre & Operational Status
    const centre = await centreDomainRepository.getCentreById(centreId);
    if (!centre) {
      throw new NotFoundError(`Procurement centre '${centreId}' not found.`);
    }
    if (centre.status === 'CLOSED') {
      throw new ConflictError('Selected procurement centre is CLOSED for operations.', 'CENTRE_CLOSED');
    }
    if (centre.status === 'EMERGENCY') {
      throw new ConflictError('Selected procurement centre is in EMERGENCY state.', 'CENTRE_DISRUPTED');
    }

    // 4. Validate Disruptions
    const disruptions = await centreDomainRepository.listDisruptions(centreId);
    const criticalDisruption = disruptions.find(
      (d) => d.status !== 'RESOLVED' && (d.severity === 'CRITICAL' || d.severity === 'HIGH')
    );
    if (criticalDisruption) {
      throw new ConflictError(
        `Selected centre is affected by an operational incident: ${criticalDisruption.title}`,
        'CENTRE_DISRUPTED'
      );
    }

    // 5. Validate Slot
    const slot = await slotRepository.findSlotById(slotId);
    if (!slot) {
      throw new NotFoundError(`Slot '${slotId}' not found.`);
    }
    if (slot.centreId !== centreId) {
      throw new ValidationError('Slot does not belong to specified procurement centre.', 'CENTRE_MISMATCH');
    }
    if (slot.status !== 'ACTIVE') {
      throw new ConflictError(`Slot is not active (status: ${slot.status}).`, 'SLOT_NOT_ACTIVE');
    }

    // Calculate workload-aware estimated service minutes
    const estimatedServiceMinutes = quantityWorkloadModel.calculateEstimatedServiceMinutes(declaredWeightKg);

    // 6. Concurrency Safe Atomic Reserve Capacity
    const reserveResult = await slotRepository.atomicReserveCapacity(
      slotId,
      declaredWeightKg,
      estimatedServiceMinutes
    );

    if (!reserveResult.success) {
      throw new ConflictError(
        `Slot capacity exceeded: ${reserveResult.reason || 'No available capacity.'}`,
        'SLOT_CAPACITY_EXCEEDED'
      );
    }

    // 7. Create Booking Record
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase();
    const bookingReferenceId = `BK-${dateStr}-${randomSuffix}`;

    const newBooking: BookingRecord = {
      id: uuidv4(),
      bookingReferenceId,
      farmerId,
      centreId,
      slotId,
      cropTypeId,
      declaredWeightKg,
      estimatedServiceMinutes,
      scheduledDate: slot.slotDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: 'CONFIRMED',
      idempotencyKey: idempotencyKey || null,
      cancellationReason: null,
      rescheduledFromId: null,
      rescheduledCount: 0,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = await bookingRepository.createBooking(newBooking, actorId, actorRole);

    await auditService.recordAudit({
      actorId,
      actorRole,
      action: 'CREATE_BOOKING',
      entityType: 'BOOKING',
      entityId: saved.id,
      ipAddress: '127.0.0.1',
      afterState: {
        bookingReferenceId,
        centreId,
        slotId,
        declaredWeightKg,
        scheduledDate: slot.slotDate
      }
    });

    return saved;
  }

  async cancelBooking(
    bookingId: string,
    actorId: string,
    actorRole: string,
    reason: string
  ): Promise<BookingRecord> {
    const booking = await bookingRepository.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundError(`Booking '${bookingId}' not found.`);
    }

    // Ownership check if farmer
    if (actorRole === 'FARMER') {
      const farmer = await farmerDomainRepository.findFarmerById(booking.farmerId);
      if (farmer && farmer.userId !== actorId) {
        throw new ForbiddenError('You can only cancel your own slot bookings.');
      }
    }

    if (booking.status === 'CANCELLED') {
      throw new ConflictError('Booking is already cancelled.', 'BOOKING_ALREADY_CANCELLED');
    }
    if (booking.status === 'COMPLETED' || booking.status === 'PROCESSING') {
      throw new ConflictError('Cannot cancel a booking that is already in progress or completed.', 'BOOKING_NOT_CANCELLABLE');
    }

    // Release capacity
    await slotRepository.atomicReleaseCapacity(
      booking.slotId,
      booking.declaredWeightKg,
      booking.estimatedServiceMinutes
    );

    // Update status
    const updated = await bookingRepository.updateBookingStatus(
      bookingId,
      'CANCELLED',
      actorId,
      actorRole,
      reason || 'Cancelled by user'
    );

    await auditService.recordAudit({
      actorId,
      actorRole,
      action: 'CANCEL_BOOKING',
      entityType: 'BOOKING',
      entityId: bookingId,
      ipAddress: '127.0.0.1',
      reason,
      afterState: { bookingId, reason }
    });

    return updated!;
  }

  async rescheduleBooking(
    bookingId: string,
    newSlotId: string,
    actorId: string,
    actorRole: string
  ): Promise<BookingRecord> {
    const booking = await bookingRepository.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundError(`Booking '${bookingId}' not found.`);
    }

    if (actorRole === 'FARMER') {
      const farmer = await farmerDomainRepository.findFarmerById(booking.farmerId);
      if (farmer && farmer.userId !== actorId) {
        throw new ForbiddenError('You can only reschedule your own slot bookings.');
      }
    }

    if (booking.status !== 'CONFIRMED') {
      throw new ConflictError('Only CONFIRMED bookings can be rescheduled.', 'BOOKING_NOT_RESCHEDULABLE');
    }

    if (booking.rescheduledCount >= 2) {
      throw new ConflictError('Maximum reschedule limit (2) reached for this booking.', 'RESCHEDULE_LIMIT_REACHED');
    }

    const newSlot = await slotRepository.findSlotById(newSlotId);
    if (!newSlot) {
      throw new NotFoundError(`Target slot '${newSlotId}' not found.`);
    }
    if (newSlot.status !== 'ACTIVE') {
      throw new ConflictError(`Target slot is not active (status: ${newSlot.status}).`, 'SLOT_NOT_ACTIVE');
    }

    // 1. Reserve new slot capacity
    const reserveRes = await slotRepository.atomicReserveCapacity(
      newSlotId,
      booking.declaredWeightKg,
      booking.estimatedServiceMinutes
    );
    if (!reserveRes.success) {
      throw new ConflictError(`New slot capacity exceeded: ${reserveRes.reason}`, 'SLOT_CAPACITY_EXCEEDED');
    }

    // 2. Release old slot capacity
    await slotRepository.atomicReleaseCapacity(
      booking.slotId,
      booking.declaredWeightKg,
      booking.estimatedServiceMinutes
    );

    // 3. Perform reschedule transition
    const rescheduled = await bookingRepository.rescheduleBooking(
      bookingId,
      newSlotId,
      newSlot.slotDate,
      newSlot.startTime,
      newSlot.endTime,
      actorId,
      actorRole
    );

    await auditService.recordAudit({
      actorId,
      actorRole,
      action: 'RESCHEDULE_BOOKING',
      entityType: 'BOOKING',
      entityId: bookingId,
      ipAddress: '127.0.0.1',
      afterState: {
        bookingId,
        oldSlotId: booking.slotId,
        newSlotId,
        newDate: newSlot.slotDate
      }
    });

    return rescheduled!;
  }

  async getFarmerBookings(farmerId: string): Promise<BookingRecord[]> {
    return bookingRepository.findBookingsByFarmer(farmerId);
  }

  async getCentreBookings(centreId: string, status?: BookingStatus): Promise<BookingRecord[]> {
    return bookingRepository.findBookingsByCentre(centreId, status);
  }

  async getBookingById(bookingId: string): Promise<BookingRecord> {
    const booking = await bookingRepository.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundError(`Booking '${bookingId}' not found.`);
    }
    return booking;
  }
}

export const bookingService = new BookingService();
