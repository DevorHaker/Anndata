import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { apiClient as api } from '../services/apiClient';
import { notificationServiceUI, NotificationItem } from '../services/notificationService';
import { Bell, Check, CheckCheck, Settings, ShieldCheck, Smartphone, MessageSquare, RefreshCw } from 'lucide-react';
import { voiceAssistanceService } from '../services/voiceAssistance';

export const NotificationsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
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
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const items = await notificationServiceUI.getNotifications(user?.role, user?.id);
      setNotifications(items);
    } catch (err) {
      console.warn('Failed to load notifications', err);
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
      await notificationServiceUI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.warn('Failed to mark read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationServiceUI.markAllAsRead();
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
    <div className="p-2 md:p-6 max-w-6xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-[#e6f7ef] border border-[#b2e8cf] rounded-2xl text-[#0d6e48]">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-serif-header text-slate-900">{t('notificationsTitle')}</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {t('unreadCount', { count: unreadCount })}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'inbox'
                ? 'bg-[#0d6e48] text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('notifications')}
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'preferences'
                ? 'bg-[#0d6e48] text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
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
              className="flex items-center space-x-1 text-xs font-bold text-[#0d6e48] hover:text-emerald-800 disabled:opacity-40"
            >
              <CheckCheck className="w-4 h-4" />
              <span>{t('markAllRead')}</span>
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 font-medium">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl text-slate-500 shadow-sm font-medium">
              {t('noNotifications')}
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    notif.readAt
                      ? 'bg-white border-slate-200 text-slate-700'
                      : 'bg-[#e6f7ef] border-[#b2e8cf] text-slate-900 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-base text-[#0d6e48] font-serif-header">{notif.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200 uppercase">
                          {notif.channel}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{new Date(notif.createdAt).toLocaleString()}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => voiceAssistanceService.speak(notif.message, language)}
                        className="text-xs text-slate-400 hover:text-amber-500 p-1"
                        title="Read aloud"
                      >
                        🔊
                      </button>
                      {!notif.readAt && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="p-1.5 bg-[#0d6e48] text-white rounded-lg hover:bg-[#095235] transition"
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
        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm space-y-6">
          <h2 className="text-lg font-bold font-serif-header text-slate-900 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[#0d6e48]" />
            <span>Multichannel Delivery Channels</span>
          </h2>

          <div className="space-y-4 max-w-xl">
            <label className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/60 transition">
              <div className="flex items-center space-x-3">
                <Smartphone className="w-5 h-5 text-[#0d6e48]" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{t('smsEnabled')}</span>
                  <span className="text-[11px] text-slate-500 font-medium">Critical slot & payment SMS alerts</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.smsEnabled}
                onChange={(e) => setPreferences({ ...preferences, smsEnabled: e.target.checked })}
                className="w-5 h-5 accent-[#0d6e48] rounded"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/60 transition">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-[#0d6e48]" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{t('pushEnabled')}</span>
                  <span className="text-[11px] text-slate-500 font-medium">Real-time queue ETA & call alerts</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.pushEnabled}
                onChange={(e) => setPreferences({ ...preferences, pushEnabled: e.target.checked })}
                className="w-5 h-5 accent-[#0d6e48] rounded"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/60 transition">
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5 text-[#0d6e48]" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{t('inAppEnabled')}</span>
                  <span className="text-[11px] text-slate-500 font-medium">Dashboard inbox notifications</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.inAppEnabled}
                onChange={(e) => setPreferences({ ...preferences, inAppEnabled: e.target.checked })}
                className="w-5 h-5 accent-[#0d6e48] rounded"
              />
            </label>

            <div className="pt-2">
              <button
                onClick={handleSavePreferences}
                className="w-full bg-[#0d6e48] hover:bg-[#095235] text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md"
              >
                {t('savePreferences')}
              </button>
              {saveSuccess && (
                <p className="text-xs font-bold text-[#0d6e48] text-center mt-2">
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
