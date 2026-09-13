import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { apiClient as api } from '../services/apiClient';
import { ShieldAlert, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

export interface ConflictItem {
  id: string;
  actionId: string;
  centreId: string;
  actorId: string;
  entityType: string;
  entityId: string;
  clientState: any;
  serverState: any;
  reason: string;
  resolved: boolean;
  createdAt: string;
}

export const SyncConflictPage: React.FC = () => {
  const { t } = useLanguage();
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolutionMsg, setResolutionMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchConflicts();
  }, []);

  const fetchConflicts = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/sync/conflicts');
      if (res && res.data) {
        setConflicts(res.data);
      }
    } catch (err) {
      console.warn('Failed to load sync conflicts');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string, action: 'ACCEPT_CLIENT' | 'OVERWRITE_SERVER' | 'DISCARD_CLIENT') => {
    try {
      await api.post(`/sync/conflicts/${id}/resolve`, { resolutionAction: action });
      setResolutionMsg(`Conflict ${id} resolved via ${action}`);
      setTimeout(() => setResolutionMsg(null), 3000);
      fetchConflicts();
    } catch (err) {
      console.warn('Failed to resolve conflict');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">{t('syncConflicts')}</h1>
            <p className="text-sm text-slate-400">
              Review and resolve server-authority offline synchronization conflicts
            </p>
          </div>
        </div>

        <button
          onClick={fetchConflicts}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {resolutionMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 font-bold text-sm">
          {resolutionMsg}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading unresolved conflicts...</div>
      ) : conflicts.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 border border-slate-800/80 rounded-2xl text-slate-400">
          🎉 No offline sync conflicts pending resolution.
        </div>
      ) : (
        <div className="space-y-4">
          {conflicts.map((item) => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs text-rose-400 font-bold px-2 py-0.5 bg-rose-950/60 border border-rose-800/50 rounded">
                    {item.entityType}: {item.entityId}
                  </span>
                  <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <span className="text-xs text-slate-500">Action ID: {item.actionId}</span>
              </div>

              <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-xl text-sm text-rose-300 font-medium">
                Reason: {item.reason}
              </div>

              {/* State Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <div className="font-bold text-amber-400 uppercase">Offline Client State</div>
                  <pre className="text-slate-300 overflow-x-auto">{JSON.stringify(item.clientState, null, 2)}</pre>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <div className="font-bold text-indigo-400 uppercase">Server Authority State</div>
                  <pre className="text-slate-300 overflow-x-auto">{JSON.stringify(item.serverState, null, 2)}</pre>
                </div>
              </div>

              {/* Resolution Controls */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => handleResolve(item.id, 'DISCARD_CLIENT')}
                  className="flex items-center space-x-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
                >
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>Discard Offline Action</span>
                </button>
                <button
                  onClick={() => handleResolve(item.id, 'OVERWRITE_SERVER')}
                  className="flex items-center space-x-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Offline Action & Overwrite Server</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
