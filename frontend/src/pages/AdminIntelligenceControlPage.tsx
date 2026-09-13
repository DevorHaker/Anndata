import React, { useState } from 'react';
import { 
  Play, 
  Cpu, 
  BarChart3, 
  ShieldCheck, 
  Sliders, 
  CheckCircle2
} from 'lucide-react';

export const AdminIntelligenceControlPage: React.FC = () => {
  // Simulator State
  const [additionalArrivals, setAdditionalArrivals] = useState(25);
  const [staffDelta, setStaffDelta] = useState(-1);
  const [equipmentDelta, setEquipmentDelta] = useState(-1);
  const [redistributedBookings, setRedistributedBookings] = useState(5);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  const runSimulation = () => {
    setSimulating(true);
    setTimeout(() => {
      setSimulationResult({
        centreId: '33333333-3333-4000-8000-333333333333',
        baselineWaitMinutes: 20,
        simulatedWaitMinutes: 44,
        bottleneckShiftedTo: 'WEIGHING',
        queueLengthDelta: +18,
        recommendedMitigations: [
          'Open emergency intake counter 2 to absorb 15 additional arrivals',
          'Reassign 2 staff members from completed procurement archiving to weighbridge intake',
          'Deploy portable moisture sensor equipment to prevent quality bottlenecking'
        ],
        executionTimeMs: 142
      });
      setSimulating(false);
    }, 400);
  };

  const models = [
    { name: 'XGBoost ETA Estimator v2.1', type: 'ML_MODEL', mae: '3.4 min', rmse: '4.8 min', p95: '6.2 min', trainingWindow: 'Last 90 Days', status: 'ACTIVE' },
    { name: 'RandomForest Congestion Predictor v1.4', type: 'ML_MODEL', mae: '4.1 min', rmse: '5.9 min', p95: '7.8 min', trainingWindow: 'Last 60 Days', status: 'ACTIVE' },
    { name: 'Multi-Server Queueing Engine (M/M/c)', type: 'STATISTICAL_ENGINE', mae: '5.2 min', rmse: '6.7 min', p95: '9.1 min', trainingWindow: 'Deterministic', status: 'ACTIVE' },
    { name: 'Rule-Based Operational Fallback', type: 'RULE_BASED_FALLBACK', mae: '8.0 min', rmse: '11.2 min', p95: '14.5 min', trainingWindow: 'Static Fallback', status: 'STANDBY' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Admin Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#0d6e48] font-bold text-xs uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4 text-[#0d6e48]" />
            <span>District Intelligence & Control Engine</span>
          </div>
          <h1 className="text-2xl font-bold font-serif-header text-slate-900">What-If Operational Simulator & Model Governance</h1>
          <p className="text-slate-500 text-xs mt-1 font-medium">Discrete-event mandi simulations, predictive model accuracy metrics, and governance</p>
        </div>

        <div className="bg-[#e6f7ef] border border-[#b2e8cf] px-4 py-2.5 rounded-2xl flex items-center space-x-3">
          <ShieldCheck className="w-6 h-6 text-[#0d6e48]" />
          <span className="text-xs font-bold text-[#0d6e48]">Governance Status: Healthy</span>
        </div>
      </div>

      {/* Discrete Event Simulator */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-[#0d6e48]" />
            <h2 className="text-base font-bold font-serif-header text-slate-900">Discrete-Event What-If Simulator</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Simulate operational disruption, staff shift, or arrival spike scenarios</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">ADDITIONAL ARRIVALS (FARMERS)</label>
            <input
              type="number"
              value={additionalArrivals}
              onChange={(e) => setAdditionalArrivals(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#0d6e48]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">STAFF DELTA (STAFF SHIFT)</label>
            <input
              type="number"
              value={staffDelta}
              onChange={(e) => setStaffDelta(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#0d6e48]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">EQUIPMENT DELTA (WEIGHBRIDGE)</label>
            <input
              type="number"
              value={equipmentDelta}
              onChange={(e) => setEquipmentDelta(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#0d6e48]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">REDISTRIBUTED BOOKINGS</label>
            <input
              type="number"
              value={redistributedBookings}
              onChange={(e) => setRedistributedBookings(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#0d6e48]"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={runSimulation}
            disabled={simulating}
            className="bg-[#0d6e48] hover:bg-[#095235] disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition flex items-center space-x-2 shadow-md"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{simulating ? 'Simulating Scenario...' : 'Run Scenario Simulation'}</span>
          </button>
        </div>

        {/* Simulation Output Card */}
        {simulationResult && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold text-[#0d6e48] uppercase tracking-wider">Simulation Results Output</span>
              <span className="text-[11px] text-slate-500 font-mono">Execution time: {simulationResult.executionTimeMs} ms</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs text-slate-500 font-medium">Baseline Wait Time</div>
                <div className="text-xl font-bold font-serif-header text-slate-900 mt-1">{simulationResult.baselineWaitMinutes} Mins</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs text-slate-500 font-medium">Simulated Wait Time</div>
                <div className="text-xl font-bold font-serif-header text-rose-600 mt-1">{simulationResult.simulatedWaitMinutes} Mins</div>
                <div className="text-[10px] text-rose-600 font-semibold mt-1">+{simulationResult.simulatedWaitMinutes - simulationResult.baselineWaitMinutes}m increase</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs text-slate-500 font-medium">Primary Bottleneck Shift</div>
                <div className="text-xl font-bold font-serif-header text-amber-700 mt-1">{simulationResult.bottleneckShiftedTo}</div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-slate-900 flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4 text-[#0d6e48]" />
                <span>AI Recommended Mitigations</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                {simulationResult.recommendedMitigations.map((m: string, idx: number) => (
                  <li key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center space-x-2 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-[#0d6e48]"></span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Model Governance Registry Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-[#0d6e48]" />
            <h2 className="text-base font-bold font-serif-header text-slate-900">Prediction Engine Model Registry &amp; Drift Metrics</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Tiered Fallback: ML → Statistical → Rule-Based</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Model Name</th>
                <th className="p-3">Engine Type</th>
                <th className="p-3">MAE</th>
                <th className="p-3">RMSE</th>
                <th className="p-3">P95 Error</th>
                <th className="p-3">Training Window</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {models.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition">
                  <td className="p-3 font-bold text-slate-900">{m.name}</td>
                  <td className="p-3">
                    <span className="bg-[#e6f7ef] text-[#0d6e48] border border-[#b2e8cf] px-2 py-0.5 rounded-lg text-[10px] font-bold">
                      {m.type}
                    </span>
                  </td>
                  <td className="p-3 text-[#0d6e48] font-bold">{m.mae}</td>
                  <td className="p-3">{m.rmse}</td>
                  <td className="p-3 text-amber-700 font-semibold">{m.p95}</td>
                  <td className="p-3 text-slate-500">{m.trainingWindow}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${m.status === 'ACTIVE' ? 'bg-[#e6f7ef] text-[#0d6e48] border border-[#b2e8cf]' : 'bg-slate-100 text-slate-500'}`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
