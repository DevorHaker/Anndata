import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { syncEngine } from '../offline/syncEngine';
import { smartProcureDB, OfflineAction } from '../offline/indexedDB';
import { WifiOff, QrCode, ClipboardList, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { voiceAssistanceService } from '../services/voiceAssistance';

export const OfflineCentrePage: React.FC = () => {
  const { t, language } = useLanguage();
  const [tokenInput, setTokenInput] = useState('');
  const [gateNumber, setGateNumber] = useState('GATE_01');
  const [noteInput, setNoteInput] = useState('');
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadPendingActions();
    const unsubscribe = syncEngine.subscribe(() => {
      loadPendingActions();
    });
    return unsubscribe;
  }, []);

  const loadPendingActions = async () => {
    try {
      const actions = await smartProcureDB.getPendingActions();
      setPendingActions(actions);
    } catch (err) {
      console.warn('Failed to load pending actions');
    }
  };

  const handleOfflineCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    try {
      await syncEngine.queueOfflineAction({
        type: 'CHECK_IN',
        entityId: tokenInput.trim(),
        centreId: '33333333-3333-4000-8000-333333333333',
        actorId: 'offline-officer-1',
        timestamp: new Date().toISOString(),
        clientVersion: 1,
        payload: { gateNumber, tokenCode: tokenInput.trim() }
      });

      setStatusMsg({
        type: 'success',
        text: `Offline Check-In queued for Token ${tokenInput.trim()}`
      });

      voiceAssistanceService.speak(`टोकन ${tokenInput} ऑफलाइन चेक-इन दर्ज किया गया।`, language);
      setTokenInput('');
      loadPendingActions();
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to queue offline check-in' });
    }
  };

  const handleSaveOperationalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;

    try {
      await syncEngine.queueOfflineAction({
        type: 'OPERATIONAL_NOTE',
        entityId: 'centre-main',
        centreId: '33333333-3333-4000-8000-333333333333',
        actorId: 'offline-officer-1',
        timestamp: new Date().toISOString(),
        clientVersion: 1,
        payload: { note: noteInput.trim() }
      });

      setStatusMsg({ type: 'success', text: 'Operational Note saved to IndexedDB queue' });
      setNoteInput('');
      loadPendingActions();
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to save note' });
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border border-amber-500/30 p-6 rounded-2xl space-y-3">
        <div className="flex items-center space-x-3 text-amber-400">
          <WifiOff className="w-8 h-8 animate-pulse" />
          <h1 className="text-2xl font-extrabold text-white">{t('offlineTitle')}</h1>
        </div>
        <p className="text-sm text-slate-300 max-w-3xl">{t('offlineNotice')}</p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-2 text-sm font-bold ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Offline Gate Check-In Form */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-lg">
            <QrCode className="w-5 h-5" />
            <span>Offline Gate Check-In</span>
          </div>

          <form onSubmit={handleOfflineCheckin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Token Code / ID
              </label>
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder={t('tokenCodePlaceholder')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Gate Entry Point
              </label>
              <select
                value={gateNumber}
                onChange={(e) => setGateNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="GATE_01">Gate 01 - Main Farmers Entry</option>
                <option value="GATE_02">Gate 02 - Tractor & Heavy Vehicle</option>
                <option value="GATE_03">Gate 03 - Priority / Express</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/30"
            >
              {t('offlineCheckinBtn')}
            </button>
          </form>
        </div>

        {/* Offline Operational Log Form */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-lg">
            <ClipboardList className="w-5 h-5" />
            <span>Record Offline Operational Log</span>
          </div>

          <form onSubmit={handleSaveOperationalNote} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Shift Note / Weighbridge Alert
              </label>
              <textarea
                rows={3}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="e.g. Weighbridge #2 calibrated at 14:00. Ramp cleared for intake."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-900/30"
            >
              {t('recordOfflineNote')}
            </button>
          </form>
        </div>
      </div>

      {/* IndexedDB Queue Status Box */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 text-amber-400" />
            <span>IndexedDB Pending Action Queue ({pendingActions.length})</span>
          </h2>

          <button
            onClick={() => syncEngine.triggerSync()}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
          >
            <span>{t('syncNow')}</span>
          </button>
        </div>

        {pendingActions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No offline actions queued in IndexedDB.
          </div>
        ) : (
          <div className="space-y-2">
            {pendingActions.map((act) => (
              <div
                key={act.actionId}
                className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 font-mono text-emerald-400">
                    <span className="font-bold">{act.type}</span>
                    <span className="text-slate-400">({act.entityId})</span>
                  </div>
                  <div className="text-slate-400">
                    Timestamp: {new Date(act.timestamp).toLocaleTimeString()}
                  </div>
                </div>

                <span
                  className={`px-2 py-1 rounded font-bold uppercase ${
                    act.status === 'PENDING_SYNC'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : act.status === 'CONFLICT'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {act.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
