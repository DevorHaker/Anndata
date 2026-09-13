import React, { useState } from 'react';

interface WeighmentWidgetProps {
  procurementId: string;
  defaultGrossKg?: number;
  defaultTareKg?: number;
  disabled?: boolean;
  onSubmitWeighment: (data: { equipmentId: string; grossWeight: number; tareWeight: number; unit: string }) => Promise<void>;
}

export const WeighmentWidget: React.FC<WeighmentWidgetProps> = ({
  procurementId,
  defaultGrossKg = 2000,
  defaultTareKg = 100,
  disabled = false,
  onSubmitWeighment
}) => {
  const [equipmentId, setEquipmentId] = useState('eq-wb-001');
  const [grossWeight, setGrossWeight] = useState<number | string>(defaultGrossKg);
  const [tareWeight, setTareWeight] = useState<number | string>(defaultTareKg);
  const [unit, setUnit] = useState<'KG' | 'QUINTAL' | 'TONNE'>('KG');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grossNum = typeof grossWeight === 'number' ? grossWeight : parseFloat(grossWeight) || 0;
  const tareNum = typeof tareWeight === 'number' ? tareWeight : parseFloat(tareWeight) || 0;
  
  // Dynamic unit conversion for net display
  const calculateNetInKg = () => {
    let gKg = grossNum;
    let tKg = tareNum;
    if (unit === 'QUINTAL') {
      gKg = grossNum * 100;
      tKg = tareNum * 100;
    } else if (unit === 'TONNE') {
      gKg = grossNum * 1000;
      tKg = tareNum * 1000;
    }
    return Math.max(0, Math.round((gKg - tKg) * 100) / 100);
  };

  const netKg = calculateNetInKg();
  const netQuintals = Math.round((netKg / 100) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (grossNum <= 0) {
      setError('Gross weight must be greater than 0');
      return;
    }
    if (tareNum < 0) {
      setError('Tare weight cannot be negative');
      return;
    }
    if (tareNum >= grossNum) {
      setError('Tare weight must be strictly less than Gross weight');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmitWeighment({
        equipmentId,
        grossWeight: grossNum,
        tareWeight: tareNum,
        unit
      });
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to submit weighment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm font-sans">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div>
          <h3 className="text-base font-bold font-serif-header text-slate-900 flex items-center gap-2">
            <span>⚖️</span> Weighbridge Scale Operations
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Record digital tare &amp; gross weight measurements</p>
        </div>
        <span className="px-3 py-1 bg-[#e6f7ef] text-[#0d6e48] border border-[#b2e8cf] text-xs font-bold rounded-full">
          OPERATIONAL
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Weighbridge Scale Unit
            </label>
            <select
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              disabled={disabled || submitting}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#0d6e48] disabled:opacity-50"
            >
              <option value="eq-wb-001">Pitless Electronic Scale 01 (Operational - Calibrated)</option>
              <option value="eq-wb-002">Pitless Electronic Scale 02 (Operational - Calibrated)</option>
              <option value="eq-wb-maint">Platform Scale 03 (MAINTENANCE - Disabled)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Measurement Unit
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as any)}
              disabled={disabled || submitting}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#0d6e48] disabled:opacity-50"
            >
              <option value="KG">Kilograms (KG)</option>
              <option value="QUINTAL">Quintals (q) [1q = 100kg]</option>
              <option value="TONNE">Metric Tonnes (MT) [1MT = 1000kg]</option>
            </select>
          </div>
        </div>

        {/* Live Weight Gauge Display */}
        <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400">Gross Weight</span>
            <div className="text-lg font-bold text-slate-900 font-mono mt-1">
              {grossNum.toLocaleString()} <span className="text-xs text-slate-500">{unit}</span>
            </div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400">Tare (Vehicle)</span>
            <div className="text-lg font-bold text-amber-700 font-mono mt-1">
              {tareNum.toLocaleString()} <span className="text-xs text-slate-500">{unit}</span>
            </div>
          </div>
          <div className="p-3 bg-[#e6f7ef] rounded-xl border border-[#b2e8cf]">
            <span className="text-[10px] uppercase font-bold text-[#0d6e48]">Authoritative Net</span>
            <div className="text-lg font-bold text-[#0d6e48] font-mono mt-1">
              {netKg.toLocaleString()} <span className="text-xs text-[#0d6e48]">KG</span>
            </div>
            <span className="text-[10px] text-[#0d6e48] font-mono font-bold">
              ({netQuintals} q)
            </span>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Gross Weight ({unit}) <span className="text-[#0d6e48]">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={grossWeight}
              onChange={(e) => setGrossWeight(e.target.value)}
              disabled={disabled || submitting}
              placeholder="e.g. 2050"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-[#0d6e48] disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tare Weight ({unit}) <span className="text-[#0d6e48]">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={tareWeight}
              onChange={(e) => setTareWeight(e.target.value)}
              disabled={disabled || submitting}
              placeholder="e.g. 100"
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
                Recording Scale Weight...
              </>
            ) : (
              <>
                <span>⚖️</span> Confirm &amp; Record Official Weighment
              </>
            )}
          </button>
        )}
      </form>
    </div>
  );
};
