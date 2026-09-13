import { EventEmitter } from 'events';
import { logger } from './logger';
import { QueueSnapshot } from '../types/tokenQueue';

class RealtimeHub extends EventEmitter {
  private centreSubscriptions: Map<string, Set<string>> = new Map();

  constructor() {
    super();
    this.setMaxListeners(100);
  }

  /**
   * Broadcasts a queue update event to subscribers for a specific procurement centre
   */
  public broadcastQueueEvent(centreId: string, eventType: string, payload: any): void {
    logger.info(`[REALTIME BROADCAST] Centre: ${centreId} | Event: ${eventType}`, payload);
    this.emit(`queue:${centreId}`, { eventType, centreId, payload, timestamp: new Date().toISOString() });
    this.emit('queue:global', { eventType, centreId, payload, timestamp: new Date().toISOString() });
  }

  /**
   * Broadcasts a token status update to a specific farmer subscriber
   */
  public broadcastFarmerEvent(farmerId: string, eventType: string, payload: any): void {
    logger.info(`[REALTIME FARMER] Farmer: ${farmerId} | Event: ${eventType}`, payload);
    this.emit(`farmer:${farmerId}`, { eventType, farmerId, payload, timestamp: new Date().toISOString() });
  }
}

export const realtimeHub = new RealtimeHub();
