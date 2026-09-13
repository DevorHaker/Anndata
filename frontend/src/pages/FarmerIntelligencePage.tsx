import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Info
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
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-[#0d6e48] font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 animate-pulse text-[#0d6e48]" />
              <span>SMARTPROCURE INTELLIGENCE ENGINE</span>
            </div>
            <h1 className="text-2xl font-bold font-serif-header text-slate-900 tracking-tight">
              Intelligent Mandi &amp; Live ETA Guidance
            </h1>
            <p className="text-slate-500 text-xs font-medium max-w-2xl">
              Real-time predictive AI orchestrates optimal procurement mandi selection, waiting time minimization, and live token service tracking.
            </p>
          </div>
          <div className="bg-[#e6f7ef] border border-[#b2e8cf] px-4 py-3 rounded-2xl flex items-center space-x-3 w-fit">
            <ShieldCheck className="w-8 h-8 text-[#0d6e48]" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Confidence Level</div>
              <div className="text-base font-bold text-[#0d6e48]">94% HIGH</div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Parameters Control */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">PRODUCE CROP</label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#0d6e48]"
            >
              <option value="crop-wheat">Wheat (Kanak / Gehun)</option>
              <option value="crop-paddy">Paddy / Rice (Dhan)</option>
              <option value="crop-mustard">Mustard (Sarson)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">ESTIMATED QUANTITY (KG)</label>
            <input
              type="number"
              value={quantityKg}
              onChange={(e) => setQuantityKg(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#0d6e48] w-36"
            />
          </div>
        </div>

        <button
          onClick={fetchRecommendations}
          className="bg-[#0d6e48] hover:bg-[#095235] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center space-x-2 shadow-md"
        >
          <Sparkles className="w-4 h-4" />
          <span>Recalculate Optimization</span>
        </button>
      </div>

      {/* Live Active Token ETA Tracker */}
      {etaData && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#e6f7ef] text-[#0d6e48] border border-[#b2e8cf] flex items-center justify-center font-bold text-base font-mono">
                {etaData.tokenCode}
              </div>
              <div>
                <h3 className="text-base font-bold font-serif-header text-slate-900">Active Queue Token Tracker</h3>
                <p className="text-xs text-slate-500 font-medium">Real-time dynamic arrival &amp; service prediction</p>
              </div>
            </div>
            <span className="bg-[#e6f7ef] text-[#0d6e48] border border-[#b2e8cf] px-3 py-1 rounded-full text-xs font-bold font-mono">
              {etaData.calculationMethod}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Queue Position</div>
              <div className="text-2xl font-bold font-serif-header text-[#0d6e48] mt-1">{etaData.queuePosition} Ahead</div>
              <div className="text-xs text-slate-500 font-medium mt-1">In mandi queue line</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Estimated Waiting Time</div>
              <div className="text-2xl font-bold font-serif-header text-[#0d6e48] mt-1">~{etaData.estimatedWaitMinutes} Mins</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Range: {etaData.estimatedWaitRangeMinutes.min}-{etaData.estimatedWaitRangeMinutes.max} min</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Expected Gate Service</div>
              <div className="text-2xl font-bold font-serif-header text-slate-900 mt-1">{etaData.expectedServiceStartTime}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Intake weighment start</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Expected Completion</div>
              <div className="text-2xl font-bold font-serif-header text-[#0d6e48] mt-1">{etaData.expectedProcurementCompletionTime}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">DBT: {etaData.expectedPaymentInitiationTime}</div>
            </div>
          </div>

          <div className="bg-[#e6f7ef] p-4 rounded-2xl border border-[#b2e8cf] text-xs text-[#0d6e48]">
            <div className="font-bold mb-2 flex items-center space-x-1.5">
              <Info className="w-4 h-4 text-[#0d6e48]" />
              <span>Contributing Operational Factors</span>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 font-medium">
              {etaData.contributingFactors.map((factor: string, idx: number) => (
                <li key={idx} className="flex items-center space-x-2 text-[#0d6e48]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0d6e48] flex-shrink-0" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Recommended Mandi Centres List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold font-serif-header text-slate-900 flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-[#0d6e48]" />
          <span>Intelligent Mandi Recommendations</span>
        </h2>

        {recommendations?.explanation && (
          <div className="bg-[#e6f7ef] border border-[#b2e8cf] p-4 rounded-2xl text-xs text-[#0d6e48] flex items-start space-x-3 shadow-sm">
            <Sparkles className="w-4 h-4 text-[#0d6e48] mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold">Engine Explanation: </span>
              {recommendations.explanation}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations?.recommendedCentres?.map((centre: any, idx: number) => (
            <div
              key={centre.centreId}
              className={`bg-white border ${idx === 0 ? 'border-[#b2e8cf] shadow-md' : 'border-slate-200/80 shadow-sm'} rounded-3xl p-6 relative overflow-hidden space-y-4`}
            >
              {idx === 0 && (
                <div className="absolute top-0 right-0 bg-[#0d6e48] text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm">
                  TOP MATCH (SCORE: {centre.overallScore}/100)
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold font-serif-header text-slate-900">{centre.centreName}</h3>
                  <div className="flex items-center space-x-4 text-xs text-slate-500 font-medium mt-1">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-[#0d6e48]" />
                      <span>{centre.distanceKm} km away</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-[#0d6e48]" />
                      <span>~{centre.estimatedWaitMinutes} mins wait</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Queue State</div>
                    <div className="text-xs font-bold text-[#0d6e48] mt-0.5">{centre.state}</div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Capacity Utilization</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">{centre.capacityUtilizationPct}%</div>
                  </div>
                </div>

                {/* Pros & Cons */}
                <div className="space-y-2 pt-2 border-t border-slate-100 font-medium text-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Decision Factors</div>
                  <ul className="space-y-1">
                    {centre.pros?.map((pro: string, pIdx: number) => (
                      <li key={pIdx} className="text-[#0d6e48] flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{pro}</span>
                      </li>
                    ))}
                    {centre.cons?.map((con: string, cIdx: number) => (
                      <li key={cIdx} className="text-rose-600 flex items-center space-x-1.5">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button className="w-full mt-4 bg-white hover:bg-slate-50 text-slate-900 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center space-x-2 border border-slate-200 shadow-sm">
                  <span>Book Recommended Slot ({centre.suggestedSlotWindow})</span>
                  <ArrowRight className="w-4 h-4 text-[#0d6e48]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
