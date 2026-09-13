import { useState, useEffect } from 'react';
import { tokenQueueService, FarmerQueueStatus } from '../../services/tokenQueue.service';
import { Users, Clock, Radio, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface LiveQueueTrackerCardProps {
  bookingId: string;
}

export const LiveQueueTrackerCard: React.FC<LiveQueueTrackerCardProps> = ({ bookingId }) => {
  const [queueStatus, setQueueStatus] = useState<FarmerQueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setRefreshing(true);
      const data = await tokenQueueService.getFarmerQueueStatus(bookingId);
      setQueueStatus(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to update queue position');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // 10 second polling fallback interval for real-time positioning updates
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [bookingId]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 animate-pulse space-y-4 max-w-md w-full">
        <div className="h-6 bg-slate-200 rounded w-2/3"></div>
        <div className="h-16 bg-slate-100 rounded-xl"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error || !queueStatus || !queueStatus.queue) {
    return (
      <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 text-amber-800 max-w-md w-full">
        <div className="flex items-center gap-2 font-semibold text-amber-900 mb-2">
          <Clock className="w-5 h-5 text-amber-600" />
          <span>Awaiting Gate Check-In</span>
        </div>
        <p className="text-sm text-amber-700">
          Your digital token is generated. Please scan your QR code at the entry gate security counter to enter the live procurement queue.
        </p>
      </div>
    );
  }

  const { queue, token } = queueStatus;

  // Determine stage active step index (0 to 3)
  let activeStep = 0;
  if (queue.status === 'WAITING') activeStep = 1;
  if (queue.status === 'CALLED') activeStep = 2;
  if (queue.status === 'PROCESSING') activeStep = 3;
  if (queue.status === 'COMPLETED') activeStep = 4;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 max-w-md w-full space-y-6">
      {/* Top Status Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">Live Queue Positioning</span>
        </div>
        <button
          onClick={fetchStatus}
          disabled={refreshing}
          className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Sync Now</span>
        </button>
      </div>

      {/* Main Position & ETA Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-100 flex flex-col justify-center items-center text-center">
          <p className="text-xs font-medium text-emerald-800 uppercase tracking-wider mb-1">People Ahead</p>
          <div className="flex items-baseline gap-1">
            <Users className="w-5 h-5 text-emerald-600 self-center" />
            <span className="text-3xl font-extrabold text-emerald-900 font-mono">{queue.peopleAhead}</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">in waiting queue</p>
        </div>

        <div className="bg-teal-50/70 p-4 rounded-xl border border-teal-100 flex flex-col justify-center items-center text-center">
          <p className="text-xs font-medium text-teal-800 uppercase tracking-wider mb-1">Est. Wait Time</p>
          <div className="flex items-baseline gap-1">
            <Clock className="w-5 h-5 text-teal-600 self-center" />
            <span className="text-3xl font-extrabold text-teal-900 font-mono">~{queue.estimatedWaitMinutes}</span>
          </div>
          <p className="text-[11px] text-teal-700 mt-1">minutes remaining</p>
        </div>
      </div>

      {/* Currently Serving Banner */}
      <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center shadow-lg">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Currently Serving</p>
          <p className="text-xl font-bold font-mono text-amber-400">
            {queue.currentlyServingToken || 'Preparing Counters'}
          </p>
        </div>
        {queue.servingStation && (
          <span className="bg-slate-800 text-slate-200 text-xs px-3 py-1 rounded-full font-medium border border-slate-700">
            {queue.servingStation}
          </span>
        )}
      </div>

      {/* Stepper Progress Visualizer */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Procurement Pipeline</p>
        <div className="relative flex justify-between items-center text-xs">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-100 -z-10"></div>
          <div
            className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-emerald-500 transition-all duration-500 -z-10"
            style={{ width: `${(Math.min(activeStep, 3) / 3) * 100}%` }}
          ></div>

          <div className={`flex flex-col items-center gap-1 ${activeStep >= 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${activeStep >= 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              1
            </div>
            <span className="text-[10px]">Checked In</span>
          </div>

          <div className={`flex flex-col items-center gap-1 ${activeStep >= 1 ? 'text-emerald-700' : 'text-slate-400'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${activeStep >= 1 ? 'bg-emerald-600 text-white animate-pulse' : 'bg-slate-200 text-slate-500'}`}>
              2
            </div>
            <span className="text-[10px]">In Queue</span>
          </div>

          <div className={`flex flex-col items-center gap-1 ${activeStep >= 2 ? 'text-emerald-700' : 'text-slate-400'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${activeStep >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              3
            </div>
            <span className="text-[10px]">Called</span>
          </div>

          <div className={`flex flex-col items-center gap-1 ${activeStep >= 3 ? 'text-emerald-700' : 'text-slate-400'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${activeStep >= 4 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              4
            </div>
            <span className="text-[10px]">Service</span>
          </div>
        </div>
      </div>
    </div>
  );
};
