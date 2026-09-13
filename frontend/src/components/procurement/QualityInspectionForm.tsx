import React, { useState, useEffect } from 'react';

interface QualityInspectionFormProps {
  procurementId: string;
  measuredNetKg?: number;
  disabled?: boolean;
  onSubmitQuality: (data: {
    moisturePercentage: number;
    foreignMatterPercentage: number;
    damagedGrainsPercentage: number;
    brokenGrainsPercentage: number;
  }) => Promise<void>;
}

export const QualityInspectionForm: React.FC<QualityInspectionFormProps> = ({
  procurementId,
  measuredNetKg = 1950,
  disabled = false,
  onSubmitQuality
}) => {
  const [moisture, setMoisture] = useState<number>(12.0);
  const [foreignMatter, setForeignMatter] = useState<number>(0.5);
  const [damagedGrains, setDamagedGrains] = useState<number>(1.0);
  const [brokenGrains, setBrokenGrains] = useState<number>(0.0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic live quality threshold evaluation preview
  const evaluateLive = () => {
    let status = 'PASSED';
    let grade = 'GRADE_A';
    let deductionPct = 0;
    let reason = '';

    if (moisture > 14.0 || foreignMatter > 2.0 || damagedGrains > 4.0) {
      status = 'REJECTED';
      grade = 'REJECTED';
      reason = 'Parameter exceeds maximum allowable Govt KMS specification threshold.';
    } else if (moisture > 12.0) {
      status = 'PASSED_WITH_DEDUCTION';
      grade = 'GRADE_B';
      deductionPct = Math.round((moisture - 12.0) * 100) / 100;
    }

    const deductionKg = Math.round(((measuredNetKg * deductionPct) / 100) * 100) / 100;
    const acceptedKg = Math.max(0, Math.round((measuredNetKg - deductionKg) * 100) / 100);

    return { status, grade, deductionPct, deductionKg, acceptedKg, reason };
  };

  const preview = evaluateLive();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setSubmitting(true);
      await onSubmitQuality({
        moisturePercentage: Number(moisture),
        foreignMatterPercentage: Number(foreignMatter),
        damagedGrainsPercentage: Number(damagedGrains),
        brokenGrainsPercentage: Number(brokenGrains)
      });
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to submit quality inspection');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-cyan-400">
            <span>🔬</span> Dynamic Quality Inspection Engine
          </h3>
          <p className="text-xs text-slate-400">
            Govt KMS Specs: Max Moisture 14% (Deduction above 12%), Foreign Matter max 2.0%
          </p>
        </div>
        <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-semibold rounded-full">
          VERSION 2026-KMS-01
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Dynamic Quality Result Live Card */}
      <div
        className={`mb-6 p-4 rounded-xl border ${
          preview.status === 'REJECTED'
            ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
            : preview.status === 'PASSED_WITH_DEDUCTION'
            ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
            : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-semibold text-slate-400">Evaluation Outcome</span>
            <div className="text-xl font-bold flex items-center gap-2 mt-0.5">
              <span>{preview.status === 'REJECTED' ? '❌ REJECTED' : preview.status === 'PASSED_WITH_DEDUCTION' ? '⚠️ PASSED WITH DEDUCTION' : '✅ PASSED (GRADE A)'}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase font-semibold text-slate-400">Quality Grade</span>
            <div className="text-lg font-mono font-bold">{preview.grade}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/60 text-center text-xs">
          <div>
            <span className="text-slate-400">Measured Net Weight:</span>
            <div className="font-mono font-semibold text-slate-200 mt-0.5">{measuredNetKg} KG</div>
          </div>
          <div>
            <span className="text-slate-400">Calculated Deduction:</span>
            <div className="font-mono font-semibold text-amber-400 mt-0.5">
              -{preview.deductionKg} KG ({preview.deductionPct}%)
            </div>
          </div>
          <div>
            <span className="text-slate-400">Final Accepted Weight:</span>
            <div className="font-mono font-semibold text-emerald-400 mt-0.5">{preview.acceptedKg} KG</div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Moisture Slider + Input */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-medium text-slate-300">
              Moisture Content (%) <span className="text-cyan-400">*</span>
            </label>
            <span className={`text-xs font-mono font-bold ${moisture > 14 ? 'text-red-400' : moisture > 12 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {moisture}% {moisture > 14 ? '(REJECT (>14%))' : moisture > 12 ? `(${moisture - 12}% deduction)` : '(Optimal)'}
            </span>
          </div>
          <input
            type="range"
            min="8.0"
            max="18.0"
            step="0.1"
            value={moisture}
            onChange={(e) => setMoisture(parseFloat(e.target.value))}
            disabled={disabled || submitting}
            className="w-full accent-cyan-500 bg-slate-950"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-0.5 font-mono">
            <span>8%</span>
            <span>12% (Threshold)</span>
            <span>14% (Max Allowable)</span>
            <span>18%</span>
          </div>
        </div>

        {/* Foreign Matter & Damaged Grains */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Foreign Matter (%) <span className="text-cyan-400">*</span> (Max 2.0%)
            </label>
            <input
              type="number"
              step="0.1"
              value={foreignMatter}
              onChange={(e) => setForeignMatter(parseFloat(e.target.value) || 0)}
              disabled={disabled || submitting}
              placeholder="e.g. 0.5"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Damaged Grains (%) <span className="text-cyan-400">*</span> (Max 4.0%)
            </label>
            <input
              type="number"
              step="0.1"
              value={damagedGrains}
              onChange={(e) => setDamagedGrains(parseFloat(e.target.value) || 0)}
              disabled={disabled || submitting}
              placeholder="e.g. 1.0"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
            />
          </div>
        </div>

        {!disabled && (
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-cyan-900/20 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Evaluating Quality Inspection...
              </>
            ) : (
              <>
                <span>🔬</span> Submit Quality Inspection & Calculate Deductions
              </>
            )}
          </button>
        )}
      </form>
    </div>
  );
};
