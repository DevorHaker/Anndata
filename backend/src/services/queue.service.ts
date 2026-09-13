import { queueRepository } from '../repositories/queue.repository';
import { tokenRepository } from '../repositories/token.repository';
import { bookingRepository } from '../repositories/booking.repository';
import { centreDomainRepository } from '../repositories/centreDomain.repository';
import { QueueEntryRecord, QueueSnapshot, FarmerQueueStatusResponse } from '../types/tokenQueue';
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from '../utils/errors';
import { auditService } from './audit.service';
import { realtimeHub } from '../utils/realtimeHub';

export class QueueService {
  /**
   * Concurrency-safe Call Next Token for staff
   */
  async callNextToken(
    centreId: string,
    stationId: string,
    actorId: string,
    actorRole: string
  ): Promise<QueueEntryRecord> {
    const centre = await centreDomainRepository.getCentreById(centreId);
    if (!centre) {
      throw new NotFoundError(`Procurement centre '${centreId}' not found.`);
    }

    const calledToken = await queueRepository.atomicCallNextToken(centreId, stationId, actorId);
    if (!calledToken) {
      throw new ConflictError('No waiting tokens in the queue for this centre.', 'NO_WAITING_TOKENS');
    }

    await auditService.recordAudit({
      actorId,
      actorRole,
      action: 'CALL_NEXT_TOKEN',
      entityType: 'QUEUE_ENTRY',
      entityId: calledToken.id,
      ipAddress: '127.0.0.1',
      afterState: {
        tokenCode: calledToken.tokenCode,
        stationId,
        centreId
      }
    });

    realtimeHub.broadcastQueueEvent(centreId, 'TOKEN_CALLED', {
      tokenCode: calledToken.tokenCode,
      queueEntryId: calledToken.id,
      stationId
    });
    realtimeHub.broadcastFarmerEvent(calledToken.farmerId, 'TOKEN_CALLED', {
      tokenCode: calledToken.tokenCode,
      stationId,
      status: 'CALLED'
    });

    return calledToken;
  }

  /**
   * Start service for a token (CALLED -> PROCESSING)
   */
  async startService(
    queueEntryId: string,
    stationId: string,
    actorId: string,
    actorRole: string
  ): Promise<QueueEntryRecord> {
    const entry = await queueRepository.findQueueEntryById(queueEntryId);
    if (!entry) {
      throw new NotFoundError(`Queue entry '${queueEntryId}' not found.`);
    }

    const updated = await queueRepository.atomicServeToken(queueEntryId, stationId, actorId);

    await auditService.recordAudit({
      actorId,
      actorRole,
      action: 'START_QUEUE_SERVICE',
      entityType: 'QUEUE_ENTRY',
      entityId: queueEntryId,
      ipAddress: '127.0.0.1',
      afterState: { tokenCode: entry.tokenCode, stationId }
    });

    realtimeHub.broadcastQueueEvent(entry.centreId, 'SERVICE_STARTED', {
      tokenCode: entry.tokenCode,
      queueEntryId,
      stationId
    });
    realtimeHub.broadcastFarmerEvent(entry.farmerId, 'SERVICE_STARTED', {
      tokenCode: entry.tokenCode,
      stationId,
      status: 'PROCESSING'
    });

    return updated!;
  }

  /**
   * Complete queue service step (PROCESSING -> COMPLETED)
   */
  async completeQueueService(
    queueEntryId: string,
    actorId: string,
    actorRole: string
  ): Promise<QueueEntryRecord> {
    const entry = await queueRepository.findQueueEntryById(queueEntryId);
    if (!entry) {
      throw new NotFoundError(`Queue entry '${queueEntryId}' not found.`);
    }

    const updated = await queueRepository.atomicCompleteToken(queueEntryId, actorId);

    await auditService.recordAudit({
      actorId,
      actorRole,
      action: 'COMPLETE_QUEUE_SERVICE',
      entityType: 'QUEUE_ENTRY',
      entityId: queueEntryId,
      ipAddress: '127.0.0.1',
      afterState: { tokenCode: entry.tokenCode }
    });

    realtimeHub.broadcastQueueEvent(entry.centreId, 'SERVICE_COMPLETED', {
      tokenCode: entry.tokenCode,
      queueEntryId
    });
    realtimeHub.broadcastFarmerEvent(entry.farmerId, 'SERVICE_COMPLETED', {
      tokenCode: entry.tokenCode,
      status: 'COMPLETED'
    });

    return updated!;
  }

  /**
   * Skip a token with mandatory reason
   */
  async skipToken(
    queueEntryId: string,
    reason: string,
    actorId: string,
    actorRole: string
  ): Promise<QueueEntryRecord> {
    if (!reason || reason.trim().length === 0) {
      throw new ValidationError('Reason is required when skipping a queue token.', 'MISSING_REASON');
    }

    const entry = await queueRepository.findQueueEntryById(queueEntryId);
    if (!entry) {
      throw new NotFoundError(`Queue entry '${queueEntryId}' not found.`);
    }

    const updated = await queueRepository.atomicSkipToken(queueEntryId, reason, actorId);

    await auditService.recordAudit({
      actorId,
      actorRole,
      action: 'SKIP_TOKEN',
      entityType: 'QUEUE_ENTRY',
      entityId: queueEntryId,
      ipAddress: '127.0.0.1',
      reason,
      afterState: { tokenCode: entry.tokenCode, reason }
    });

    realtimeHub.broadcastQueueEvent(entry.centreId, 'TOKEN_SKIPPED', {
      tokenCode: entry.tokenCode,
      queueEntryId,
      reason
    });
    realtimeHub.broadcastFarmerEvent(entry.farmerId, 'TOKEN_SKIPPED', {
      tokenCode: entry.tokenCode,
      status: 'SKIPPED',
      reason
    });

    return updated!;
  }

  /**
   * Recall a skipped token back into WAITING state
   */
  async recallToken(
    queueEntryId: string,
    actorId: string,
    actorRole: string
  ): Promise<QueueEntryRecord> {
    const entry = await queueRepository.findQueueEntryById(queueEntryId);
    if (!entry) {
      throw new NotFoundError(`Queue entry '${queueEntryId}' not found.`);
    }

    const updated = await queueRepository.atomicRecallToken(queueEntryId, actorId);

    await auditService.recordAudit({
      actorId,
      actorRole,
      action: 'RECALL_TOKEN',
      entityType: 'QUEUE_ENTRY',
      entityId: queueEntryId,
      ipAddress: '127.0.0.1',
      afterState: { tokenCode: entry.tokenCode }
    });

    realtimeHub.broadcastQueueEvent(entry.centreId, 'TOKEN_RECALLED', {
      tokenCode: entry.tokenCode,
      queueEntryId
    });
    realtimeHub.broadcastFarmerEvent(entry.farmerId, 'TOKEN_RECALLED', {
      tokenCode: entry.tokenCode,
      status: 'WAITING'
    });

    return updated!;
  }

  /**
   * Pause queue operations for a centre
   */
  async pauseQueue(
    centreId: string,
    reason: string,
    actorId: string,
    actorRole: string
  ): Promise<{ centreId: string; isPaused: boolean; reason: string }> {
    queueRepository.setCentreQueuePause(centreId, true, reason);

    await auditService.recordAudit({
      actorId,
      actorRole,
      action: 'PAUSE_QUEUE',
      entityType: 'CENTRE',
      entityId: centreId,
      ipAddress: '127.0.0.1',
      reason,
      afterState: { centreId, isPaused: true, reason }
    });

    realtimeHub.broadcastQueueEvent(centreId, 'QUEUE_PAUSED', { centreId, reason });

    return { centreId, isPaused: true, reason };
  }

  /**
   * Resume queue operations for a centre
   */
  async resumeQueue(
    centreId: string,
    actorId: string,
    actorRole: string
  ): Promise<{ centreId: string; isPaused: boolean }> {
    queueRepository.setCentreQueuePause(centreId, false);

    await auditService.recordAudit({
      actorId,
      actorRole,
      action: 'RESUME_QUEUE',
      entityType: 'CENTRE',
      entityId: centreId,
      ipAddress: '127.0.0.1',
      afterState: { centreId, isPaused: false }
    });

    realtimeHub.broadcastQueueEvent(centreId, 'QUEUE_RESUMED', { centreId });

    return { centreId, isPaused: false };
  }

  /**
   * Gets operational Queue Snapshot for staff dashboards & public displays
   */
  async getQueueSnapshot(centreId: string): Promise<QueueSnapshot> {
    const centre = await centreDomainRepository.getCentreById(centreId);
    const centreName = centre ? centre.name : 'Procurement Centre';
    return queueRepository.getQueueSnapshotForCentre(centreId, centreName);
  }

  /**
   * Gets live queue position and ETA for a farmer
   */
  async getFarmerQueueStatus(farmerId: string, bookingId: string): Promise<FarmerQueueStatusResponse> {
    const token = await tokenRepository.findTokenByBookingId(bookingId);
    if (!token) {
      throw new NotFoundError(`No digital token generated for booking '${bookingId}'.`);
    }

    const booking = await bookingRepository.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundError(`Booking '${bookingId}' not found.`);
    }

    const queueEntry = await queueRepository.findQueueEntryByBookingId(bookingId);
    if (!queueEntry) {
      return {
        token: {
          id: token.id,
          tokenCode: token.tokenCode,
          status: token.status
        },
        booking: {
          id: booking.id,
          bookingReferenceId: booking.bookingReferenceId,
          centreId: booking.centreId,
          scheduledDate: booking.scheduledDate,
          startTime: booking.startTime
        },
        queue: null
      };
    }

    const pos = await queueRepository.getFarmerPositionInQueue(booking.centreId, queueEntry.id);

    return {
      token: {
        id: token.id,
        tokenCode: token.tokenCode,
        status: token.status
      },
      booking: {
        id: booking.id,
        bookingReferenceId: booking.bookingReferenceId,
        centreId: booking.centreId,
        scheduledDate: booking.scheduledDate,
        startTime: booking.startTime
      },
      queue: {
        queueEntryId: queueEntry.id,
        status: queueEntry.status,
        queueNumber: queueEntry.queueNumber,
        position: pos.position,
        peopleAhead: pos.peopleAhead,
        currentlyServingToken: pos.currentlyServingToken,
        servingStation: queueEntry.assignedStationId || null,
        estimatedWaitMinutes: pos.estimatedWaitMinutes,
        lastUpdatedAt: queueEntry.updatedAt
      }
    };
  }
}

export const queueService = new QueueService();
