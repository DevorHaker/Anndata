import React from 'react';
import { ProcurementRecordUI } from '../../services/procurement.service';

interface ProcurementValueCardProps {
  procurement: ProcurementRecordUI;
  onFinalize?: () => Promise<void>;
  onCalculateValue?: () => Promise<void>;
  submitting?: boolean;
}

export const ProcurementValueCard: React.FC<ProcurementValueCardProps> = ({
  procurement,
  onFinalize,
  onCalculateValue,
  submitting = false
}) => {
  const isCompleted = procurement.status === 'COMPLETED';
  const isRejected = procurement.status === 'REJECTED';
  const acceptedQuintals = Math.round((procurement.finalAcceptedWeightKg / 100) * 100) / 100;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-400">
            <span>💰</span> Financial Valuation & MSP Settlement
          </h3>
          <p className="text-xs text-slate-400">
            Government Minimum Support Price (MSP) Rate Matrix 2026
          </p>
        </div>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full border ${
            isCompleted
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : isRejected
              ? 'bg-red-500/10 text-red-400 border-red-500/30'
              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
          }`}
        >
          {isCompleted ? 'COMPLETED (PAYMENT READY)' : isRejected ? 'REJECTED' : procurement.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Authoritative Govt MSP Rate
          </span>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            ₹{procurement.ratePerQuintal.toLocaleString()}{' '}
            <span className="text-xs text-slate-400 font-sans">/ Quintal</span>
          </div>
          <span className="text-xs text-slate-500 font-mono mt-1 block">
            (Equivalent to ₹{procurement.ratePerKg} / KG | Version: {procurement.rateVersion || '2026-MSP-01'})
          </span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Accepted Produce Quantity
          </span>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {procurement.finalAcceptedWeightKg.toLocaleString()} <span className="text-xs text-emerald-500 font-sans">KG</span>
          </div>
          <span className="text-xs text-slate-400 font-mono mt-1 block">
            ({acceptedQuintals} Quintals accepted after {procurement.qualityDeductionKg} KG quality deduction)
          </span>
        </div>
      </div>

      {/* Financial Breakdown Table */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 mb-6 space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">Gross Procurement Amount ({acceptedQuintals} q @ ₹{procurement.ratePerQuintal}/q)</span>
          <span className="font-mono font-semibold text-slate-200">
            ₹{procurement.grossPayableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm border-t border-slate-800/80 pt-2">
          <span className="text-slate-400">Quality & Logistics Deductions</span>
          <span className="font-mono font-semibold text-amber-400">
            -₹{procurement.totalDeductionsAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between items-center text-base border-t border-slate-800 pt-3 font-bold">
          <span className="text-slate-100 flex items-center gap-1.5">
            <span>💳</span> Net Payable Amount (Direct Benefit Transfer):
          </span>
          <span className="font-mono text-xl text-emerald-400">
            ₹{procurement.netPayableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Phase 10 Payment Ready Handoff Status */}
      {procurement.paymentReady && (
        <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
              ✓
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-300">Phase 10 Payment-Ready Handoff Established</h4>
              <p className="text-xs text-emerald-400/80">
                Procurement session finalized. Record queued for Direct Benefit Transfer (DBT) bank payout.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-3 py-1 bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 rounded-lg">
            DBT-QUEUED
          </span>
        </div>
      )}

      {/* Actions */}
      {!isCompleted && !isRejected && (
        <div className="flex flex-col sm:flex-row gap-3">
          {onCalculateValue && procurement.status !== 'UNDER_REVIEW' && (
            <button
              onClick={onCalculateValue}
              disabled={submitting}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm border border-slate-700 disabled:opacity-50"
            >
              <span>🧮</span> Calculate Authoritative Value
            </button>
          )}

          {onFinalize && (
            <button
              onClick={onFinalize}
              disabled={submitting}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-900/20 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Finalizing Procurement Session...
                </>
              ) : (
                <>
                  <span>🔒</span> Finalize Session & Handoff to Payment Engine
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
