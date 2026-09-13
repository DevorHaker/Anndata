import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Layers, 
  RefreshCw, 
  TrendingUp, 
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
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Mandi Intelligence Monitor Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#0d6e48] font-bold text-xs uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4 text-[#0d6e48] animate-pulse" />
            <span>Real-time Operations Intelligence</span>
          </div>
          <h1 className="text-2xl font-bold font-serif-header text-slate-900">Mandi Operations &amp; Congestion Control</h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">Live stage bottleneck monitoring, predictive wait forecasting, and human decision overrides</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDashboardData}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-xl border border-slate-200 transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4 text-[#0d6e48]" />
          </button>
          <button
            onClick={() => setOverrideModalOpen(true)}
            className="bg-[#0d6e48] hover:bg-[#095235] text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-md transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Record Manager Override</span>
          </button>
        </div>
      </div>

      {/* Centre Congestion Status & Forecast Cards */}
      {centreStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Operational Status</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-bold font-serif-header text-rose-600">{centreStatus.state}</span>
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-2">Queue length: {centreStatus.currentQueueLength} farmers waiting</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Current Wait Time</div>
            <div className="text-2xl font-bold font-serif-header text-amber-700 mt-2">{centreStatus.currentWaitMinutes} Mins</div>
            <div className="text-xs text-slate-500 font-medium mt-2">Target SLA: 20 Mins</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Predictive Wait (30 &amp; 60 Min)</div>
            <div className="text-2xl font-bold font-serif-header text-[#0d6e48] mt-2">
              {centreStatus.predictedWait30Min} / {centreStatus.predictedWait60Min} Min
            </div>
            <div className="text-xs text-amber-700 font-semibold mt-2 flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Congestion risk increasing</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Current Primary Bottleneck</div>
            <div className="text-2xl font-bold font-serif-header text-rose-600 mt-2">{centreStatus.bottleneckStage}</div>
            <div className="text-xs text-slate-500 font-medium mt-2">Stage 3 of 6</div>
          </div>
        </div>
      )}

      {/* Cross-Centre Load Balancing Section */}
      {loadBalancing?.needLoadBalancing && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-bold font-serif-header text-amber-900">Cross-Centre Load Balancing Recommended</h3>
              <p className="text-xs text-amber-800 font-medium mt-0.5">
                Redistributing {loadBalancing.suggestedRedistributedBookingsCount} future bookings will reduce Mandi wait times by ~{loadBalancing.expectedWaitReductionMinutes} minutes.
              </p>
              <div className="flex items-center space-x-3 mt-2 text-xs text-slate-700 font-medium">
                {loadBalancing.recommendedDestinationCentres?.map((dest: any, idx: number) => (
                  <span key={idx} className="bg-white px-2.5 py-1 rounded-xl border border-amber-200 text-amber-900 font-bold shadow-sm">
                    {dest.centreName} ({dest.currentWaitMinutes}m wait - {dest.state})
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => alert('Load balancing redistribution initiated with District Admin approval')}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm"
          >
            Execute Load Redistribution
          </button>
        </div>
      )}

      {/* 6-Stage Operational Bottleneck Analysis */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold font-serif-header text-slate-900 flex items-center space-x-2">
          <Layers className="w-5 h-5 text-[#0d6e48]" />
          <span>Stage-Level Operational Delay Analysis</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {bottlenecks.map((b) => (
            <div
              key={b.stage}
              className={`p-4 rounded-2xl border ${b.isBottleneck ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className={b.isBottleneck ? 'text-rose-800' : 'text-slate-500'}>{b.stage}</span>
                {b.isBottleneck && <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded text-[10px]">BOTTLENECK</span>}
              </div>

              <div className="text-xl font-bold font-serif-header text-slate-900 mt-2">{Math.round(b.avgSec / 60)} m</div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">P95: {Math.round(b.p95Sec / 60)} m</div>

              <div className="mt-3 text-[11px] text-slate-600 border-t border-slate-200/80 pt-2 font-medium line-clamp-2">
                <span className="font-bold text-slate-500">Cause: </span>
                {b.contributor}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Human Override Modal */}
      {overrideModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 font-sans">
            <h3 className="text-lg font-bold font-serif-header text-slate-900 flex items-center space-x-2">
              <RotateCcw className="w-5 h-5 text-[#0d6e48]" />
              <span>Record Human Operational Override</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Override an automated AI recommendation or status calculation. Rationale will be stored immutably in the audit ledger.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">New Manager Action</label>
              <input
                type="text"
                value={overrideAction}
                onChange={(e) => setOverrideAction(e.target.value)}
                placeholder="e.g. Manually set Mandi status to NORMAL"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#0d6e48]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Audit Reason / Rationale</label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Describe operational rationale for override..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#0d6e48] h-24 resize-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setOverrideModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyOverride}
                disabled={!overrideReason || !overrideAction}
                className="bg-[#0d6e48] hover:bg-[#095235] disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-md"
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
