export interface OfflineAction {
  actionId: string;
  type: 'CHECK_IN' | 'OPERATIONAL_NOTE' | 'WEIGHMENT_ENTRY' | 'QUALITY_OBSERVATION' | 'QUEUE_STATUS_UPDATE';
  entityId: string;
  centreId: string;
  actorId: string;
  timestamp: string;
  clientVersion: number;
  payload: Record<string, any>;
  status: 'PENDING_SYNC' | 'SYNCING' | 'SYNCED' | 'SYNC_FAILED' | 'CONFLICT';
  retryCount: number;
}

const DB_NAME = 'SmartProcureOfflineDB';
const DB_VERSION = 1;
const STORE_PENDING_ACTIONS = 'pending_actions';
const STORE_REFERENCE_DATA = 'centre_reference_data';

export class SmartProcureDB {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB not available'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_PENDING_ACTIONS)) {
          const store = db.createObjectStore(STORE_PENDING_ACTIONS, { keyPath: 'actionId' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_REFERENCE_DATA)) {
          db.createObjectStore(STORE_REFERENCE_DATA, { keyPath: 'id' });
        }
      };
    });
  }

  public async savePendingAction(action: OfflineAction): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PENDING_ACTIONS, 'readwrite');
      const store = tx.objectStore(STORE_PENDING_ACTIONS);
      const req = store.put(action);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async getPendingActions(): Promise<OfflineAction[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PENDING_ACTIONS, 'readonly');
      const store = tx.objectStore(STORE_PENDING_ACTIONS);
      const req = store.getAll();
      req.onsuccess = () => {
        const actions: OfflineAction[] = req.result || [];
        resolve(actions.filter((a) => a.status === 'PENDING_SYNC' || a.status === 'SYNC_FAILED'));
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async removeAction(actionId: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PENDING_ACTIONS, 'readwrite');
      const store = tx.objectStore(STORE_PENDING_ACTIONS);
      const req = store.delete(actionId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async updateActionStatus(actionId: string, status: OfflineAction['status']): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PENDING_ACTIONS, 'readwrite');
      const store = tx.objectStore(STORE_PENDING_ACTIONS);
      const getReq = store.get(actionId);
      getReq.onsuccess = () => {
        const action = getReq.result as OfflineAction;
        if (action) {
          action.status = status;
          store.put(action);
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }
}

export const smartProcureDB = new SmartProcureDB();
