import React, { useState } from 'react';

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
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm font-sans">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div>
          <h3 className="text-base font-bold font-serif-header text-slate-900 flex items-center gap-2">
            <span>🔬</span> Dynamic Quality Inspection Engine
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Govt KMS Specs: Max Moisture 14% (Deduction above 12%), Foreign Matter max 2.0%
          </p>
        </div>
        <span className="px-3 py-1 bg-[#e6f7ef] text-[#0d6e48] border border-[#b2e8cf] text-xs font-bold rounded-full">
          VERSION 2026-KMS-01
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold">
          ⚠️ {error}
        </div>
      )}

      {/* Dynamic Quality Result Live Card */}
      <div
        className={`mb-6 p-5 rounded-2xl border ${
          preview.status === 'REJECTED'
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : preview.status === 'PASSED_WITH_DEDUCTION'
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-[#e6f7ef] border-[#b2e8cf] text-[#0d6e48]'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Evaluation Outcome</span>
            <div className="text-lg font-bold font-serif-header flex items-center gap-2 mt-0.5">
              <span>{preview.status === 'REJECTED' ? '❌ REJECTED' : preview.status === 'PASSED_WITH_DEDUCTION' ? '⚠️ PASSED WITH DEDUCTION' : '✅ PASSED (GRADE A)'}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Quality Grade</span>
            <div className="text-base font-mono font-bold">{preview.grade}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200/80 text-center text-xs font-medium">
          <div>
            <span className="text-slate-500">Measured Net Weight:</span>
            <div className="font-mono font-bold text-slate-900 mt-0.5">{measuredNetKg} KG</div>
          </div>
          <div>
            <span className="text-slate-500">Calculated Deduction:</span>
            <div className="font-mono font-bold text-amber-700 mt-0.5">
              -{preview.deductionKg} KG ({preview.deductionPct}%)
            </div>
          </div>
          <div>
            <span className="text-slate-500">Final Accepted Weight:</span>
            <div className="font-mono font-bold text-[#0d6e48] mt-0.5">{preview.acceptedKg} KG</div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Moisture Slider + Input */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold text-slate-700">
              Moisture Content (%) <span className="text-[#0d6e48]">*</span>
            </label>
            <span className={`text-xs font-mono font-bold ${moisture > 14 ? 'text-rose-600' : moisture > 12 ? 'text-amber-700' : 'text-[#0d6e48]'}`}>
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
            className="w-full accent-[#0d6e48] bg-slate-100"
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
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Foreign Matter (%) <span className="text-[#0d6e48]">*</span> (Max 2.0%)
            </label>
            <input
              type="number"
              step="0.1"
              value={foreignMatter}
              onChange={(e) => setForeignMatter(parseFloat(e.target.value) || 0)}
              disabled={disabled || submitting}
              placeholder="e.g. 0.5"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-[#0d6e48] disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Damaged Grains (%) <span className="text-[#0d6e48]">*</span> (Max 4.0%)
            </label>
            <input
              type="number"
              step="0.1"
              value={damagedGrains}
              onChange={(e) => setDamagedGrains(parseFloat(e.target.value) || 0)}
              disabled={disabled || submitting}
              placeholder="e.g. 1.0"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-[#0d6e48] disabled:opacity-50"
            />
          </div>
        </div>

        {!disabled && (
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#0d6e48] hover:bg-[#095235] text-white font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-md disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Evaluating Quality Inspection...
              </>
            ) : (
              <>
                <span>🔬</span> Submit Quality Inspection &amp; Calculate Deductions
              </>
            )}
          </button>
        )}
      </form>
    </div>
  );
};
