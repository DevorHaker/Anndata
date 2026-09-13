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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-400">
            <span>⚖️</span> Weighbridge Scale Operations
          </h3>
          <p className="text-xs text-slate-400">Record digital tare & gross weight measurements</p>
        </div>
        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-full">
          OPERATIONAL
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-medium">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Select Weighbridge Scale Unit
            </label>
            <select
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              disabled={disabled || submitting}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            >
              <option value="eq-wb-001">Pitless Electronic Scale 01 (Operational - Calibrated)</option>
              <option value="eq-wb-002">Pitless Electronic Scale 02 (Operational - Calibrated)</option>
              <option value="eq-wb-maint">Platform Scale 03 (MAINTENANCE - Disabled)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Measurement Unit
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as any)}
              disabled={disabled || submitting}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            >
              <option value="KG">Kilograms (KG)</option>
              <option value="QUINTAL">Quintals (q) [1q = 100kg]</option>
              <option value="TONNE">Metric Tonnes (MT) [1MT = 1000kg]</option>
            </select>
          </div>
        </div>

        {/* Live Weight Gauge Display */}
        <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-center">
          <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Gross Weight</span>
            <div className="text-xl font-bold text-slate-100 font-mono mt-1">
              {grossNum.toLocaleString()} <span className="text-xs text-slate-400">{unit}</span>
            </div>
          </div>
          <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Tare (Vehicle)</span>
            <div className="text-xl font-bold text-amber-400 font-mono mt-1">
              {tareNum.toLocaleString()} <span className="text-xs text-slate-400">{unit}</span>
            </div>
          </div>
          <div className="p-2 bg-emerald-950/40 rounded-lg border border-emerald-800/50">
            <span className="text-[10px] uppercase font-semibold text-emerald-400">Authoritative Net</span>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
              {netKg.toLocaleString()} <span className="text-xs text-emerald-500/80">KG</span>
            </div>
            <span className="text-[10px] text-emerald-400/70 font-mono font-medium">
              ({netQuintals} q)
            </span>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Gross Weight ({unit}) <span className="text-emerald-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={grossWeight}
              onChange={(e) => setGrossWeight(e.target.value)}
              disabled={disabled || submitting}
              placeholder="e.g. 2050"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Tare Weight ({unit}) <span className="text-emerald-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={tareWeight}
              onChange={(e) => setTareWeight(e.target.value)}
              disabled={disabled || submitting}
              placeholder="e.g. 100"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
          </div>
        </div>

        {!disabled && (
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-900/20 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Recording Scale Weight...
              </>
            ) : (
              <>
                <span>⚖️</span> Confirm & Record Official Weighment
              </>
            )}
          </button>
        )}
      </form>
    </div>
  );
};
