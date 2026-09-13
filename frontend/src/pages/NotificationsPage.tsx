import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { apiClient as api } from '../services/apiClient';
import { Bell, Check, CheckCheck, Settings, ShieldCheck, Smartphone, MessageSquare } from 'lucide-react';
import { voiceAssistanceService } from '../services/voiceAssistance';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  channel: string;
  status: string;
  readAt?: string | null;
  createdAt: string;
}

export const NotificationsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inbox' | 'preferences'>('inbox');
  
  const [preferences, setPreferences] = useState({
    smsEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
    preferredLanguage: language
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/notifications');
      if (res && res.data) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.warn('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const res: any = await api.get('/notifications/preferences');
      if (res && res.data) {
        setPreferences(res.data);
      }
    } catch (err) {
      console.warn('Failed to load preferences');
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.warn('Failed to mark read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      );
    } catch (err) {
      console.warn('Failed to mark all read');
    }
  };

  const handleSavePreferences = async () => {
    try {
      await api.put('/notifications/preferences', preferences);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.warn('Failed to save preferences');
    }
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">{t('notificationsTitle')}</h1>
            <p className="text-sm text-slate-400">
              {t('unreadCount', { count: unreadCount })}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'inbox'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {t('notifications')}
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'preferences'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Inbox */}
      {activeTab === 'inbox' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center space-x-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 disabled:opacity-40"
            >
              <CheckCheck className="w-4 h-4" />
              <span>{t('markAllRead')}</span>
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 border border-slate-800/80 rounded-2xl text-slate-400">
              {t('noNotifications')}
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border transition-all ${
                    notif.readAt
                      ? 'bg-slate-900/40 border-slate-800/60 text-slate-300'
                      : 'bg-emerald-950/20 border-emerald-500/40 text-white shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-base text-emerald-400">{notif.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {notif.channel}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300">{notif.message}</p>
                      <p className="text-xs text-slate-500">{new Date(notif.createdAt).toLocaleString()}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => voiceAssistanceService.speak(notif.message, language)}
                        className="text-xs text-slate-400 hover:text-amber-400 p-1"
                        title="Read aloud"
                      >
                        🔊
                      </button>
                      {!notif.readAt && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="p-1.5 bg-emerald-600/20 text-emerald-400 rounded-lg hover:bg-emerald-600/40"
                          title="Mark Read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Preferences */}
      {activeTab === 'preferences' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Multichannel Delivery Channels</span>
          </h2>

          <div className="space-y-4 max-w-xl">
            <label className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl cursor-pointer">
              <div className="flex items-center space-x-3">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="text-sm font-bold text-white block">{t('smsEnabled')}</span>
                  <span className="text-xs text-slate-400">Critical slot & payment SMS alerts</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.smsEnabled}
                onChange={(e) => setPreferences({ ...preferences, smsEnabled: e.target.checked })}
                className="w-5 h-5 accent-emerald-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl cursor-pointer">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="text-sm font-bold text-white block">{t('pushEnabled')}</span>
                  <span className="text-xs text-slate-400">Real-time queue ETA & call alerts</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.pushEnabled}
                onChange={(e) => setPreferences({ ...preferences, pushEnabled: e.target.checked })}
                className="w-5 h-5 accent-emerald-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl cursor-pointer">
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="text-sm font-bold text-white block">{t('inAppEnabled')}</span>
                  <span className="text-xs text-slate-400">Dashboard inbox notifications</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.inAppEnabled}
                onChange={(e) => setPreferences({ ...preferences, inAppEnabled: e.target.checked })}
                className="w-5 h-5 accent-emerald-500 rounded"
              />
            </label>

            <div className="pt-2">
              <button
                onClick={handleSavePreferences}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all"
              >
                {t('savePreferences')}
              </button>
              {saveSuccess && (
                <p className="text-xs font-bold text-emerald-400 text-center mt-2">
                  {t('preferencesSaved')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
