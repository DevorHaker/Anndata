import { smartProcureDB, OfflineAction } from './indexedDB';
import { apiClient as api } from '../services/apiClient';

export interface SyncEngineListener {
  (status: { isOnline: boolean; pendingCount: number; isSyncing: boolean }): void;
}

export class SyncEngine {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private listeners: Set<SyncEngineListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnlineStatusChange(true));
      window.addEventListener('offline', () => this.handleOnlineStatusChange(false));
    }
  }

  public subscribe(listener: SyncEngineListener) {
    this.listeners.add(listener);
    this.notifyState();
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async notifyState() {
    let pendingCount = 0;
    try {
      const actions = await smartProcureDB.getPendingActions();
      pendingCount = actions.length;
    } catch (err) {
      // IndexedDB fallback
    }

    this.listeners.forEach((fn) =>
      fn({
        isOnline: this.isOnline,
        pendingCount,
        isSyncing: this.isSyncing
      })
    );
  }

  private handleOnlineStatusChange(online: boolean) {
    this.isOnline = online;
    this.notifyState();

    if (online) {
      this.triggerSync();
    }
  }

  public async queueOfflineAction(action: Omit<OfflineAction, 'actionId' | 'status' | 'retryCount'>): Promise<OfflineAction> {
    const fullAction: OfflineAction = {
      ...action,
      actionId: `act-cli-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      status: 'PENDING_SYNC',
      retryCount: 0
    };

    await smartProcureDB.savePendingAction(fullAction);
    this.notifyState();

    if (this.isOnline) {
      this.triggerSync();
    }

    return fullAction;
  }

  public async triggerSync(): Promise<{ accepted: number; conflicts: number; rejected: number }> {
    if (this.isSyncing || !this.isOnline) {
      return { accepted: 0, conflicts: 0, rejected: 0 };
    }

    this.isSyncing = true;
    this.notifyState();

    let accepted = 0;
    let conflicts = 0;
    let rejected = 0;

    try {
      const pending = await smartProcureDB.getPendingActions();
      if (pending.length === 0) {
        this.isSyncing = false;
        this.notifyState();
        return { accepted, conflicts, rejected };
      }

      // Send batch sync request to server endpoint
      const response: any = await api.post('/sync', {
        deviceId: typeof window !== 'undefined' ? window.navigator.userAgent : 'browser-client',
        actions: pending
      });

      if (response && response.data) {
        const { accepted: accList, conflicts: confList, rejected: rejList } = response.data;

        // Process accepted actions
        for (const item of accList || []) {
          await smartProcureDB.removeAction(item.actionId);
          accepted++;
        }

        // Process conflicts
        for (const item of confList || []) {
          await smartProcureDB.updateActionStatus(item.actionId, 'CONFLICT');
          conflicts++;
        }

        // Process rejected
        for (const item of rejList || []) {
          await smartProcureDB.updateActionStatus(item.actionId, 'SYNC_FAILED');
          rejected++;
        }
      }
    } catch (err) {
      console.warn('SyncEngine: Batch sync trigger failed (offline or server error)');
    } finally {
      this.isSyncing = false;
      this.notifyState();
    }

    return { accepted, conflicts, rejected };
  }
}

export const syncEngine = new SyncEngine();
