import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Clock, 
  MapPin, 
  TrendingDown, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Info,
  Calendar,
  Layers
} from 'lucide-react';

export const FarmerIntelligencePage: React.FC = () => {
  const [selectedCrop, setSelectedCrop] = useState('crop-wheat');
  const [quantityKg, setQuantityKg] = useState(2500);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [etaData, setEtaData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecommendations();
    fetchLiveEta();
  }, [selectedCrop, quantityKg]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      // Mock API call simulation for responsive UI
      setTimeout(() => {
        setRecommendations({
          explanation: "Centre A (Karnal Mandi) is strongly recommended as it currently offers the lowest expected waiting time (18 mins) and 65% unallocated capacity.",
          weightsUsed: { waitingTime: 0.4, distance: 0.2, capacity: 0.15, utilization: 0.15, reliability: 0.10 },
          recommendedCentres: [
            {
              centreId: 'c-1',
              centreName: 'Karnal Central Procurement Mandi',
              overallScore: 92,
              estimatedWaitMinutes: 18,
              distanceKm: 3.2,
              capacityUtilizationPct: 35,
              state: 'NORMAL',
              confidence: 'HIGH',
              suggestedSlotWindow: '10:00 AM - 11:00 AM',
              pros: [
                '18 minutes estimated waiting time',
                '3.2 km close proximity',
                '65% unallocated mandi capacity',
                '2 active weighbridge counters operational'
              ],
              cons: ['Peak morning intake expected at 11:30 AM']
            },
            {
              centreId: 'c-2',
              centreName: 'Panipat Grain Procurement Market',
              overallScore: 78,
              estimatedWaitMinutes: 34,
              distanceKm: 8.5,
              capacityUtilizationPct: 62,
              state: 'BUSY',
              confidence: 'MEDIUM',
              suggestedSlotWindow: '02:00 PM - 03:00 PM',
              pros: ['Higher daily intake storage capacity', 'Multiple quality testing stations'],
              cons: ['34 minutes wait time', 'Moderate queue congestion']
            }
          ]
        });
        setLoading(false);
      }, 500);
    } catch (err) {
      setLoading(false);
    }
  };

  const fetchLiveEta = async () => {
    setEtaData({
      tokenCode: 'T-042',
      queuePosition: 3,
      estimatedWaitMinutes: 18,
      estimatedWaitRangeMinutes: { min: 14, max: 22 },
      expectedServiceStartTime: '10:48 AM',
      expectedProcurementCompletionTime: '11:12 AM',
      expectedPaymentInitiationTime: '11:15 AM',
      confidence: 'HIGH',
      calculationMethod: 'STATISTICAL_ENGINE',
      contributingFactors: [
        '3 digital queue tokens ahead at gate intake',
        '2 active digital weighbridge counters',
        'Average service turnaround: 8.5 mins/farmer'
      ]
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900/80 via-teal-900/70 to-slate-900 p-6 rounded-2xl border border-emerald-500/20 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm">
              <Sparkles className="w-5 h-5 animate-pulse text-emerald-300" />
              <span>SMARTPROCURE INTELLIGENCE ENGINE</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Intelligent Mandi & Live ETA Guidance
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              Real-time predictive AI orchestrates optimal procurement mandi selection, waiting time minimization, and live token service tracking.
            </p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 rounded-xl flex items-center space-x-3">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
            <div>
              <div className="text-xs text-emerald-300 font-medium">Confidence Level</div>
              <div className="text-lg font-bold text-white">94% HIGH</div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Parameters Control */}
      <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">PRODUCE CROP</label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="crop-wheat">Wheat (Kanak / Gehun)</option>
              <option value="crop-paddy">Paddy / Rice (Dhan)</option>
              <option value="crop-mustard">Mustard (Sarson)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">ESTIMATED QUANTITY (KG)</label>
            <input
              type="number"
              value={quantityKg}
              onChange={(e) => setQuantityKg(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 w-36"
            />
          </div>
        </div>

        <button
          onClick={fetchRecommendations}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition flex items-center space-x-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Recalculate Optimization</span>
        </button>
      </div>

      {/* Live Active Token ETA Tracker */}
      {etaData && (
        <div className="bg-slate-900/80 border border-teal-500/30 rounded-2xl p-6 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-lg">
                {etaData.tokenCode}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Active Queue Token Tracker</h3>
                <p className="text-xs text-slate-400">Real-time dynamic arrival & service prediction</p>
              </div>
            </div>
            <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-3 py-1 rounded-full text-xs font-semibold">
              {etaData.calculationMethod}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <div className="text-slate-400 text-xs font-medium">Queue Position</div>
              <div className="text-2xl font-bold text-teal-400 mt-1">{etaData.queuePosition} Ahead</div>
              <div className="text-xs text-slate-400 mt-1">In mandi queue line</div>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <div className="text-slate-400 text-xs font-medium">Estimated Waiting Time</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">~{etaData.estimatedWaitMinutes} Mins</div>
              <div className="text-xs text-slate-400 mt-1">Range: {etaData.estimatedWaitRangeMinutes.min}-{etaData.estimatedWaitRangeMinutes.max} min</div>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <div className="text-slate-400 text-xs font-medium">Expected Gate Service</div>
              <div className="text-2xl font-bold text-white mt-1">{etaData.expectedServiceStartTime}</div>
              <div className="text-xs text-slate-400 mt-1">Intake weighment start</div>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <div className="text-slate-400 text-xs font-medium">Expected Completion & Payment</div>
              <div className="text-2xl font-bold text-indigo-400 mt-1">{etaData.expectedProcurementCompletionTime}</div>
              <div className="text-xs text-slate-400 mt-1">DBT initiation: {etaData.expectedPaymentInitiationTime}</div>
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-300">
            <div className="font-semibold text-slate-400 mb-2 flex items-center space-x-1.5">
              <Info className="w-4 h-4 text-teal-400" />
              <span>Contributing Operational Factors</span>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {etaData.contributingFactors.map((factor: string, idx: number) => (
                <li key={idx} className="flex items-center space-x-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Recommended Mandi Centres List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-emerald-400" />
          <span>Intelligent Mandi Recommendations</span>
        </h2>

        {recommendations?.explanation && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl text-xs text-emerald-200 flex items-start space-x-3">
            <Sparkles className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-emerald-300">Engine Explanation: </span>
              {recommendations.explanation}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations?.recommendedCentres?.map((centre: any, idx: number) => (
            <div
              key={centre.centreId}
              className={`bg-slate-900/80 border ${idx === 0 ? 'border-emerald-500/50 shadow-emerald-900/20' : 'border-slate-800'} rounded-2xl p-6 shadow-lg backdrop-blur-md relative overflow-hidden`}
            >
              {idx === 0 && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-xs font-bold px-4 py-1 rounded-bl-xl shadow-md">
                  TOP MATCH (SCORE: {centre.overallScore}/100)
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{centre.centreName}</h3>
                  <div className="flex items-center space-x-4 text-xs text-slate-400 mt-1">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{centre.distanceKm} km away</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-teal-400" />
                      <span>~{centre.estimatedWaitMinutes} mins wait</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800">
                    <div className="text-xs text-slate-400">Queue State</div>
                    <div className="text-sm font-semibold text-emerald-400 mt-0.5">{centre.state}</div>
                  </div>

                  <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800">
                    <div className="text-xs text-slate-400">Capacity Utilization</div>
                    <div className="text-sm font-semibold text-white mt-0.5">{centre.capacityUtilizationPct}%</div>
                  </div>
                </div>

                {/* Pros & Cons */}
                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  <div className="text-xs font-semibold text-slate-400">Decision Factors</div>
                  <ul className="space-y-1 text-xs">
                    {centre.pros?.map((pro: string, pIdx: number) => (
                      <li key={pIdx} className="text-emerald-400 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{pro}</span>
                      </li>
                    ))}
                    {centre.cons?.map((con: string, cIdx: number) => (
                      <li key={cIdx} className="text-rose-400 flex items-center space-x-1.5">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button className="w-full mt-4 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-xl text-xs transition flex items-center justify-center space-x-2 border border-slate-700">
                  <span>Book Recommended Slot ({centre.suggestedSlotWindow})</span>
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
