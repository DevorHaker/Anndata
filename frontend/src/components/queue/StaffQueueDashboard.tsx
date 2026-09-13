import React, { useState, useEffect } from 'react';
import { tokenQueueService, QueueSnapshot } from '../../services/tokenQueue.service';
import { QrCode, Search, PhoneCall, CheckCircle, SkipForward, Play, Pause, AlertCircle, RefreshCw, Layers } from 'lucide-react';

interface StaffQueueDashboardProps {
  centreId: string;
}

export const StaffQueueDashboard: React.FC<StaffQueueDashboardProps> = ({ centreId }) => {
  const [snapshot, setSnapshot] = useState<QueueSnapshot | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [stationId, setStationId] = useState('COUNTER_1');
  const [skipReason, setSkipReason] = useState('');
  const [selectedEntryForSkip, setSelectedEntryForSkip] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSnapshot = async () => {
    try {
      const data = await tokenQueueService.getCentreQueueSnapshot(centreId);
      setSnapshot(data);
    } catch (err: any) {
      console.error('Failed to load queue snapshot', err);
    }
  };

  useEffect(() => {
    fetchSnapshot();
    const interval = setInterval(fetchSnapshot, 5000);
    return () => clearInterval(interval);
  }, [centreId]);

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleCallNext = async () => {
    setLoading(true);
    try {
      const res = await tokenQueueService.callNextToken(centreId, stationId);
      showMessage(`Token '${res.data.tokenCode}' CALLED to ${stationId}`, 'success');
      await fetchSnapshot();
    } catch (err: any) {
      showMessage(err.response?.data?.error?.message || err.message || 'Failed to call next token', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    setLoading(true);
    try {
      const res = await tokenQueueService.manualTokenCheckin(manualToken.trim(), centreId);
      showMessage(`Gate Check-In recorded for token '${manualToken}'. Token entered live queue.`, 'success');
      setManualToken('');
      await fetchSnapshot();
    } catch (err: any) {
      showMessage(err.response?.data?.error?.message || err.message || 'Check-in failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleServe = async (queueEntryId: string) => {
    try {
      await tokenQueueService.serveToken(queueEntryId, stationId);
      showMessage('Service STARTED for token.', 'success');
      await fetchSnapshot();
    } catch (err: any) {
      showMessage(err.response?.data?.error?.message || err.message || 'Action failed', 'error');
    }
  };

  const handleComplete = async (queueEntryId: string) => {
    try {
      await tokenQueueService.completeToken(queueEntryId);
      showMessage('Queue service COMPLETED.', 'success');
      await fetchSnapshot();
    } catch (err: any) {
      showMessage(err.response?.data?.error?.message || err.message || 'Action failed', 'error');
    }
  };

  const handleSkip = async (queueEntryId: string) => {
    if (!skipReason.trim()) {
      showMessage('Please enter a skip reason.', 'error');
      return;
    }
    try {
      await tokenQueueService.skipToken(queueEntryId, skipReason);
      showMessage('Token SKIPPED.', 'success');
      setSelectedEntryForSkip(null);
      setSkipReason('');
      await fetchSnapshot();
    } catch (err: any) {
      showMessage(err.response?.data?.error?.message || err.message || 'Skip failed', 'error');
    }
  };

  const handleTogglePause = async () => {
    if (!snapshot) return;
    try {
      if (snapshot.isPaused) {
        await tokenQueueService.resumeQueue(centreId);
        showMessage('Queue operations RESUMED.', 'success');
      } else {
        await tokenQueueService.pauseQueue(centreId, 'Operational break');
        showMessage('Queue operations PAUSED.', 'success');
      }
      await fetchSnapshot();
    } catch (err: any) {
      showMessage(err.response?.data?.error?.message || err.message || 'Pause/Resume failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm transition-all ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Control Station & Gate Check-in Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gate QR & Manual Check-in Widget */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-lg">
            <QrCode className="w-5 h-5 text-emerald-600" />
            <span>Gate Check-In Scanner</span>
          </div>
          <form onSubmit={handleManualCheckin} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Enter Token Number (e.g. T-023)..."
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm uppercase font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !manualToken.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
            >
              Verify Check-In
            </button>
          </form>
        </div>

        {/* Counter Station & Call Next Widget */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-lg">
              <PhoneCall className="w-5 h-5 text-emerald-400" />
              <span>Counter Operations Dispatch</span>
            </div>
            <button
              onClick={handleTogglePause}
              className={`px-3 py-1 text-xs rounded-full font-bold flex items-center gap-1 transition-colors ${
                snapshot?.isPaused
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
            >
              {snapshot?.isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              <span>{snapshot?.isPaused ? 'Resume Queue' : 'Pause Queue'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              className="bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
            >
              <option value="COUNTER_1">Counter Station 1</option>
              <option value="COUNTER_2">Counter Station 2</option>
              <option value="WEIGHBRIDGE_01">Weighbridge Station 1</option>
            </select>

            <button
              onClick={handleCallNext}
              disabled={loading || snapshot?.isPaused || (snapshot?.waitingCount === 0)}
              className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-900 font-bold text-sm rounded-xl transition-all shadow-md flex justify-center items-center gap-2"
            >
              <PhoneCall className="w-4 h-4" /> Call Next Waiting Token
            </button>
          </div>
        </div>
      </div>

      {/* Operational Queue Snapshot Monitor */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Live Centre Queue Monitor</h3>
            <p className="text-xs text-slate-500">Real-time counter dispatches and waiting tokens</p>
          </div>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100">
              Waiting: {snapshot?.waitingCount || 0}
            </span>
            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">
              Est. Wait: ~{snapshot?.estimatedWaitMinutes || 0}m
            </span>
          </div>
        </div>

        {/* Currently Serving & Active Tokens */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Counter Dispatches</h4>
          {snapshot?.currentlyServing.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
              No active counter dispatches right now. Click 'Call Next Waiting Token' to call next farmer.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {snapshot?.currentlyServing.map((item) => (
                <div key={item.queueEntryId} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      {item.stationId}
                    </span>
                    <h4 className="text-2xl font-black font-mono text-slate-900 mt-1">{item.tokenCode}</h4>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleServe(item.queueEntryId)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                      title="Start Service"
                    >
                      <Play className="w-3.5 h-3.5" /> Serve
                    </button>
                    <button
                      onClick={() => handleComplete(item.queueEntryId)}
                      className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                      title="Complete Service"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Complete
                    </button>
                    <button
                      onClick={() => setSelectedEntryForSkip(item.queueEntryId)}
                      className="p-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                      title="Skip Token"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skip Reason Input Field Modal */}
        {selectedEntryForSkip && (
          <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 space-y-3">
            <p className="text-xs font-bold text-rose-800">Provide Skip Reason for Token</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Farmer not present at gate..."
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-rose-300 focus:outline-none"
              />
              <button
                onClick={() => handleSkip(selectedEntryForSkip)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg"
              >
                Confirm Skip
              </button>
              <button
                onClick={() => setSelectedEntryForSkip(null)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Waiting List Preview */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Next Tokens in Waiting Queue</h4>
          {snapshot?.nextTokens.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
              No farmers currently waiting in queue.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {snapshot?.nextTokens.map((t, idx) => (
                <div key={t.queueEntryId} className="bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold">#{idx + 1}</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">{t.tokenCode}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
