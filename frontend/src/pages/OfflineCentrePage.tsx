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
    <div className="p-6 max-w-6xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl space-y-3 shadow-sm">
        <div className="flex items-center space-x-3 text-amber-800">
          <WifiOff className="w-8 h-8 animate-pulse text-amber-700" />
          <h1 className="text-2xl font-bold font-serif-header text-amber-900">{t('offlineTitle')}</h1>
        </div>
        <p className="text-xs text-amber-800 font-medium max-w-3xl">{t('offlineNotice')}</p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl border flex items-center space-x-2 text-xs font-bold shadow-sm ${
            statusMsg.type === 'success'
              ? 'bg-[#e6f7ef] border-[#b2e8cf] text-[#0d6e48]'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-[#0d6e48]" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Offline Gate Check-In Form */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 text-[#0d6e48] font-bold text-base font-serif-header">
            <QrCode className="w-5 h-5 text-[#0d6e48]" />
            <span>Offline Gate Check-In</span>
          </div>

          <form onSubmit={handleOfflineCheckin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Token Code / ID
              </label>
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder={t('tokenCodePlaceholder')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0d6e48] text-sm font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Gate Entry Point
              </label>
              <select
                value={gateNumber}
                onChange={(e) => setGateNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0d6e48] text-xs font-medium"
              >
                <option value="GATE_01">Gate 01 - Main Farmers Entry</option>
                <option value="GATE_02">Gate 02 - Tractor &amp; Heavy Vehicle</option>
                <option value="GATE_03">Gate 03 - Priority / Express</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-[#0d6e48] hover:bg-[#095235] text-white font-bold py-3 rounded-xl transition text-xs shadow-md"
            >
              {t('offlineCheckinBtn')}
            </button>
          </form>
        </div>

        {/* Offline Operational Log Form */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 text-[#0d6e48] font-bold text-base font-serif-header">
            <ClipboardList className="w-5 h-5 text-[#0d6e48]" />
            <span>Record Offline Operational Log</span>
          </div>

          <form onSubmit={handleSaveOperationalNote} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Shift Note / Weighbridge Alert
              </label>
              <textarea
                rows={3}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="e.g. Weighbridge #2 calibrated at 14:00. Ramp cleared for intake."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0d6e48] text-xs font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#0d6e48] hover:bg-[#095235] text-white font-bold py-3 rounded-xl transition text-xs shadow-md"
            >
              {t('recordOfflineNote')}
            </button>
          </form>
        </div>
      </div>

      {/* IndexedDB Queue Status Box */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold font-serif-header text-slate-900 flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 text-amber-700" />
            <span>IndexedDB Pending Action Queue ({pendingActions.length})</span>
          </h2>

          <button
            onClick={() => syncEngine.triggerSync()}
            className="flex items-center space-x-2 bg-[#0d6e48] hover:bg-[#095235] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <span>{t('syncNow')}</span>
          </button>
        </div>

        {pendingActions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-medium">
            No offline actions queued in IndexedDB.
          </div>
        ) : (
          <div className="space-y-2">
            {pendingActions.map((act) => (
              <div
                key={act.actionId}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs font-medium"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 font-mono text-[#0d6e48]">
                    <span className="font-bold">{act.type}</span>
                    <span className="text-slate-500">({act.entityId})</span>
                  </div>
                  <div className="text-slate-500">
                    Timestamp: {new Date(act.timestamp).toLocaleTimeString()}
                  </div>
                </div>

                <span
                  className={`px-2 py-1 rounded-xl text-[10px] font-bold uppercase ${
                    act.status === 'PENDING_SYNC'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : act.status === 'CONFLICT'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-[#e6f7ef] text-[#0d6e48] border border-[#b2e8cf]'
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
