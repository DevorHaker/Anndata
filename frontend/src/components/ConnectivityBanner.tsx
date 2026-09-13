import React, { useEffect, useState } from 'react';
import { syncEngine } from '../offline/syncEngine';
import { useLanguage } from '../i18n/LanguageContext';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

export const ConnectivityBanner: React.FC = () => {
  const { t } = useLanguage();
  const [state, setState] = useState({
    isOnline: true,
    pendingCount: 0,
    isSyncing: false
  });

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe(setState);
    return unsubscribe;
  }, []);

  if (state.isOnline && state.pendingCount === 0 && !state.isSyncing) {
    return null; // Clean state: no banner needed when online with zero pending offline queue
  }

  return (
    <div
      className={`px-4 py-2 text-sm font-medium flex items-center justify-between shadow-sm transition-colors ${
        !state.isOnline
          ? 'bg-amber-600 text-white'
          : state.pendingCount > 0
          ? 'bg-indigo-600 text-white'
          : 'bg-emerald-600 text-white'
      }`}
    >
      <div className="flex items-center space-x-2">
        {!state.isOnline ? (
          <>
            <WifiOff className="w-4 h-4 text-amber-200 animate-pulse" />
            <span>{t('offline')}</span>
          </>
        ) : (
          <>
            <Wifi className="w-4 h-4 text-emerald-200" />
            <span>{t('online')}</span>
          </>
        )}

        {state.pendingCount > 0 && (
          <span className="bg-black/20 px-2 py-0.5 rounded-full text-xs font-bold">
            {t('pendingActions', { count: state.pendingCount })}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-3">
        {state.pendingCount > 0 && state.isOnline && (
          <button
            onClick={() => syncEngine.triggerSync()}
            disabled={state.isSyncing}
            className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${state.isSyncing ? 'animate-spin' : ''}`} />
            <span>{t('syncNow')}</span>
          </button>
        )}
      </div>
    </div>
  );
};
