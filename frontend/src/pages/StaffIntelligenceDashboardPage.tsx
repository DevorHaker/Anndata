import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  Layers, 
  RefreshCw, 
  ShieldAlert, 
  TrendingUp, 
  Users, 
  Zap,
  RotateCcw
} from 'lucide-react';

export const StaffIntelligenceDashboardPage: React.FC = () => {
  const [centreStatus, setCentreStatus] = useState<any>(null);
  const [bottlenecks, setBottlenecks] = useState<any[]>([]);
  const [loadBalancing, setLoadBalancing] = useState<any>(null);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideAction, setOverrideAction] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Simulated live metrics
    setCentreStatus({
      centreId: '33333333-3333-4000-8000-333333333333',
      centreName: 'Karnal Central Procurement Mandi',
      state: 'CONGESTED',
      currentQueueLength: 18,
      currentWaitMinutes: 38,
      predictedWait30Min: 46,
      predictedWait60Min: 54,
      capacityUtilizationPct: 82,
      bottleneckStage: 'WEIGHING',
      confidence: 'HIGH',
      reasons: [
        'Single active weighbridge operational due to sensor calibration',
        'Intake arrival surge exceeds hourly processing SLA'
      ]
    });

    setBottlenecks([
      { stage: 'CHECK-IN', avgSec: 110, p95Sec: 220, baselineSec: 100, increasePct: 10, isBottleneck: false, contributor: 'Security QR token scan' },
      { stage: 'QUEUE', avgSec: 1400, p95Sec: 2100, baselineSec: 600, increasePct: 130, isBottleneck: false, contributor: 'Intake gate queue line' },
      { stage: 'WEIGHING', avgSec: 520, p95Sec: 780, baselineSec: 300, increasePct: 73, isBottleneck: true, contributor: 'Tare weight vehicle positioning & single weighbridge' },
      { stage: 'QUALITY', avgSec: 340, p95Sec: 510, baselineSec: 300, increasePct: 13, isBottleneck: false, contributor: 'Moisture testing turnaround' },
      { stage: 'PROCUREMENT', avgSec: 220, p95Sec: 350, baselineSec: 200, increasePct: 10, isBottleneck: false, contributor: 'Receipt printing' },
      { stage: 'PAYMENT', avgSec: 160, p95Sec: 280, baselineSec: 150, increasePct: 6, isBottleneck: false, contributor: 'DBT bank verification' }
    ]);

    setLoadBalancing({
      needLoadBalancing: true,
      sourceState: 'CONGESTED',
      suggestedRedistributedBookingsCount: 10,
      expectedWaitReductionMinutes: 16,
      recommendedDestinationCentres: [
        { centreName: 'Karnal North Mandi', currentWaitMinutes: 14, state: 'NORMAL' },
        { centreName: 'Gharaunda Procurement Hub', currentWaitMinutes: 18, state: 'NORMAL' }
      ]
    });
  };

  const handleApplyOverride = () => {
    alert(`Human Manager Override Recorded in Audit Ledger: ${overrideReason}`);
    setOverrideModalOpen(false);
    setOverrideReason('');
    setOverrideAction('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Mandi Intelligence Monitor Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-500/20 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>Real-time Operations Intelligence</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Mandi Operations & Congestion Control</h1>
          <p className="text-slate-400 text-xs mt-1">Live stage bottleneck monitoring, predictive wait forecasting, and human decision overrides</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDashboardData}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setOverrideModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-lg transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Record Manager Override</span>
          </button>
        </div>
      </div>

      {/* Centre Congestion Status & Forecast Cards */}
      {centreStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md">
            <div className="text-xs text-slate-400 font-medium">Operational Status</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-bold text-rose-400">{centreStatus.state}</span>
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
            </div>
            <div className="text-xs text-slate-500 mt-2">Queue length: {centreStatus.currentQueueLength} farmers waiting</div>
          </div>

          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md">
            <div className="text-xs text-slate-400 font-medium">Current Wait Time</div>
            <div className="text-2xl font-bold text-amber-400 mt-2">{centreStatus.currentWaitMinutes} Mins</div>
            <div className="text-xs text-slate-500 mt-2">Target SLA: 20 Mins</div>
          </div>

          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md">
            <div className="text-xs text-slate-400 font-medium">Predictive Wait (30 & 60 Min)</div>
            <div className="text-2xl font-bold text-indigo-400 mt-2">
              {centreStatus.predictedWait30Min} / {centreStatus.predictedWait60Min} Min
            </div>
            <div className="text-xs text-indigo-300 mt-2 flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Congestion risk increasing</span>
            </div>
          </div>

          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md">
            <div className="text-xs text-slate-400 font-medium">Current Primary Bottleneck</div>
            <div className="text-2xl font-bold text-rose-300 mt-2">{centreStatus.bottleneckStage}</div>
            <div className="text-xs text-slate-500 mt-2">Stage 3 of 6</div>
          </div>
        </div>
      )}

      {/* Cross-Centre Load Balancing Section */}
      {loadBalancing?.needLoadBalancing && (
        <div className="bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/30 p-5 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-bold text-white">Cross-Centre Load Balancing Recommended</h3>
              <p className="text-xs text-amber-200 mt-0.5">
                Redistributing {loadBalancing.suggestedRedistributedBookingsCount} future bookings will reduce Mandi wait times by ~{loadBalancing.expectedWaitReductionMinutes} minutes.
              </p>
              <div className="flex items-center space-x-4 mt-2 text-xs text-slate-300">
                {loadBalancing.recommendedDestinationCentres?.map((dest: any, idx: number) => (
                  <span key={idx} className="bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700 text-slate-200 font-medium">
                    {dest.centreName} ({dest.currentWaitMinutes}m wait - {dest.state})
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => alert('Load balancing redistribution initiated with District Admin approval')}
            className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition"
          >
            Execute Load Redistribution
          </button>
        </div>
      )}

      {/* 6-Stage Operational Bottleneck Analysis */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <span>Stage-Level Operational Delay Analysis</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {bottlenecks.map((b) => (
            <div
              key={b.stage}
              className={`p-4 rounded-xl border ${b.isBottleneck ? 'bg-rose-950/40 border-rose-500/50 shadow-rose-900/20' : 'bg-slate-800/40 border-slate-800'}`}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className={b.isBottleneck ? 'text-rose-300' : 'text-slate-400'}>{b.stage}</span>
                {b.isBottleneck && <span className="bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded text-[10px]">BOTTLENECK</span>}
              </div>

              <div className="text-xl font-bold text-white mt-2">{Math.round(b.avgSec / 60)} m</div>
              <div className="text-[11px] text-slate-400 mt-0.5">P95: {Math.round(b.p95Sec / 60)} m</div>

              <div className="mt-3 text-[11px] text-slate-300 border-t border-slate-700/50 pt-2 line-clamp-2">
                <span className="font-semibold text-slate-400">Cause: </span>
                {b.contributor}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Human Override Modal */}
      {overrideModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <RotateCcw className="w-5 h-5 text-indigo-400" />
              <span>Record Human Operational Override</span>
            </h3>
            <p className="text-xs text-slate-400">
              Override an automated AI recommendation or status calculation. Action and rationale will be stored immutably in the intelligence decision audit ledger.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New Manager Action</label>
              <input
                type="text"
                value={overrideAction}
                onChange={(e) => setOverrideAction(e.target.value)}
                placeholder="e.g. Manually set Mandi status to NORMAL"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Audit Reason / Rationale</label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Describe operational rationale for override..."
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 h-24 resize-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setOverrideModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyOverride}
                disabled={!overrideReason || !overrideAction}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-xl text-xs transition"
              >
                Save Override to Audit Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
