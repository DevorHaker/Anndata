import { apiClient as api } from './apiClient';

export interface NotificationItem {
  id: string;
  userId?: string;
  roleTarget?: 'FARMER' | 'CENTRE_MANAGER' | 'ALL';
  title: string;
  message: string;
  channel: string;
  status: string;
  readAt?: string | null;
  createdAt: string;
}

const LOCAL_STORAGE_KEY = 'smartprocure_notifications_store';

const getDefaultNotifications = (): NotificationItem[] => [
  {
    id: 'notif-default-1',
    roleTarget: 'FARMER',
    title: 'Welcome to Anndata SmartProcure',
    message: 'Declare your harvest produce and book procurement slots directly at APMC hubs.',
    channel: 'IN_APP',
    status: 'DELIVERED',
    readAt: null,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'notif-default-2',
    roleTarget: 'CENTRE_MANAGER',
    title: 'Centre Manager Workspace Active',
    message: 'You can now monitor incoming farmer procurement requests and approve slots.',
    channel: 'IN_APP',
    status: 'DELIVERED',
    readAt: null,
    createdAt: new Date(Date.now() - 7200000).toISOString()
  }
];

export class NotificationServiceUI {
  private getLocalStore(): NotificationItem[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      console.warn('Failed to parse local notification storage', err);
    }
    const defaults = getDefaultNotifications();
    this.saveLocalStore(defaults);
    return defaults;
  }

  private saveLocalStore(items: NotificationItem[]): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('Failed to save local notification storage', err);
    }
  }

  async getNotifications(userRole?: string, userId?: string): Promise<NotificationItem[]> {
    let remoteNotifications: NotificationItem[] = [];
    try {
      const res: any = await api.get('/notifications');
      if (res && res.data && Array.isArray(res.data)) {
        remoteNotifications = res.data.map((n: any) => ({
          id: n.id,
          userId: n.userId || n.user_id,
          title: n.title,
          message: n.message,
          channel: n.channel || 'IN_APP',
          status: n.status || 'DELIVERED',
          readAt: n.readAt || n.read_at || null,
          createdAt: n.createdAt || n.created_at || new Date().toISOString()
        }));
      }
    } catch (err) {
      // Backend may be offline or unauthenticated, rely on local store
    }

    const localItems = this.getLocalStore();
    const map = new Map<string, NotificationItem>();

    // Put local items first
    for (const item of localItems) {
      map.set(item.id, item);
    }

    // Put remote items (overriding if existing)
    for (const item of remoteNotifications) {
      map.set(item.id, item);
    }

    let allItems = Array.from(map.values());

    // Filter by role or userId if provided
    if (userRole) {
      const isManager = userRole === 'CENTRE_MANAGER' || userRole === 'PROCUREMENT_OFFICER' || userRole === 'DISTRICT_ADMIN' || userRole === 'SYSTEM_ADMIN' || userRole === 'ADMIN';
      allItems = allItems.filter((n) => {
        if (!n.roleTarget && !n.userId) return true;
        if (n.roleTarget === 'ALL') return true;
        if (isManager) {
          return n.roleTarget === 'CENTRE_MANAGER' || (n.userId && (n.userId.includes('manager') || n.userId === '10000000-0000-4000-8000-000000000003'));
        } else {
          return n.roleTarget === 'FARMER' || (n.userId && !n.userId.includes('manager') && n.userId !== '10000000-0000-4000-8000-000000000003');
        }
      });
    }

    return allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  addNotification(newNotif: {
    userId?: string;
    roleTarget?: 'FARMER' | 'CENTRE_MANAGER' | 'ALL';
    title: string;
    message: string;
    channel?: string;
  }): NotificationItem {
    const item: NotificationItem = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: newNotif.userId,
      roleTarget: newNotif.roleTarget || 'ALL',
      title: newNotif.title,
      message: newNotif.message,
      channel: newNotif.channel || 'IN_APP',
      status: 'DELIVERED',
      readAt: null,
      createdAt: new Date().toISOString()
    };

    const store = this.getLocalStore();
    store.unshift(item);
    this.saveLocalStore(store);
    return item;
  }

  async markAsRead(id: string): Promise<void> {
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (err) {
      // Local fallback
    }

    const store = this.getLocalStore();
    const updated = store.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
    this.saveLocalStore(updated);
  }

  async markAllAsRead(): Promise<void> {
    try {
      await api.post('/notifications/read-all');
    } catch (err) {
      // Local fallback
    }

    const store = this.getLocalStore();
    const updated = store.map((n) => ({ ...n, readAt: new Date().toISOString() }));
    this.saveLocalStore(updated);
  }
}

export const notificationServiceUI = new NotificationServiceUI();
