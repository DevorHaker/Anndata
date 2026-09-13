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
    <div className="p-6 max-w-6xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-serif-header text-slate-900">{t('syncConflicts')}</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Review and resolve server-authority offline synchronization conflicts
            </p>
          </div>
        </div>

        <button
          onClick={fetchConflicts}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition shadow-sm"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {resolutionMsg && (
        <div className="p-4 bg-[#e6f7ef] border border-[#b2e8cf] rounded-2xl text-[#0d6e48] font-bold text-xs shadow-sm">
          {resolutionMsg}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center bg-white border border-slate-200/80 rounded-3xl text-slate-500 font-medium shadow-sm">Loading unresolved conflicts...</div>
      ) : conflicts.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200/80 rounded-3xl text-slate-500 font-medium shadow-sm">
          🎉 No offline sync conflicts pending resolution.
        </div>
      ) : (
        <div className="space-y-4">
          {conflicts.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs text-rose-800 font-bold px-2 py-0.5 bg-rose-50 border border-rose-200 rounded">
                    {item.entityType}: {item.entityId}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">Action ID: {item.actionId}</span>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 font-bold">
                Reason: {item.reason}
              </div>

              {/* State Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-amber-700 uppercase">Offline Client State</div>
                  <pre className="text-slate-800 font-bold overflow-x-auto">{JSON.stringify(item.clientState, null, 2)}</pre>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-blue-700 uppercase">Server Authority State</div>
                  <pre className="text-slate-800 font-bold overflow-x-auto">{JSON.stringify(item.serverState, null, 2)}</pre>
                </div>
              </div>

              {/* Resolution Controls */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => handleResolve(item.id, 'DISCARD_CLIENT')}
                  className="flex items-center space-x-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Discard Offline Action</span>
                </button>
                <button
                  onClick={() => handleResolve(item.id, 'OVERWRITE_SERVER')}
                  className="flex items-center space-x-1 px-4 py-2 bg-[#0d6e48] hover:bg-[#095235] text-white font-bold text-xs rounded-xl transition shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Offline Action &amp; Overwrite Server</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
