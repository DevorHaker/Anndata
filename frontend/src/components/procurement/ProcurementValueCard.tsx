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
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm font-sans">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div>
          <h3 className="text-base font-bold font-serif-header text-slate-900 flex items-center gap-2">
            <span>💰</span> Financial Valuation &amp; MSP Settlement
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Government Minimum Support Price (MSP) Rate Matrix 2026
          </p>
        </div>
        <span
          className={`px-3 py-1 text-xs font-bold rounded-full border ${
            isCompleted
              ? 'bg-[#e6f7ef] text-[#0d6e48] border-[#b2e8cf]'
              : isRejected
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
          }`}
        >
          {isCompleted ? 'COMPLETED (PAYMENT READY)' : isRejected ? 'REJECTED' : procurement.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Authoritative Govt MSP Rate
          </span>
          <div className="text-2xl font-bold font-serif-header text-slate-900 font-mono">
            ₹{procurement.ratePerQuintal.toLocaleString()}{' '}
            <span className="text-xs text-slate-500 font-sans">/ Quintal</span>
          </div>
          <span className="text-xs text-slate-500 font-mono font-medium mt-1 block">
            (Equivalent to ₹{procurement.ratePerKg} / KG | Version: {procurement.rateVersion || '2026-MSP-01'})
          </span>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Accepted Produce Quantity
          </span>
          <div className="text-2xl font-bold text-[#0d6e48] font-mono">
            {procurement.finalAcceptedWeightKg.toLocaleString()} <span className="text-xs text-[#0d6e48] font-sans">KG</span>
          </div>
          <span className="text-xs text-slate-500 font-mono font-medium mt-1 block">
            ({acceptedQuintals} Quintals accepted after {procurement.qualityDeductionKg} KG quality deduction)
          </span>
        </div>
      </div>

      {/* Financial Breakdown Table */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 mb-6 space-y-3 font-medium text-xs">
        <div className="flex justify-between items-center text-slate-700">
          <span>Gross Procurement Amount ({acceptedQuintals} q @ ₹{procurement.ratePerQuintal}/q)</span>
          <span className="font-mono font-bold text-slate-900">
            ₹{procurement.grossPayableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-700 border-t border-slate-200 pt-2">
          <span>Quality &amp; Logistics Deductions</span>
          <span className="font-mono font-bold text-amber-700">
            -₹{procurement.totalDeductionsAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between items-center border-t border-slate-200 pt-3 font-bold text-sm">
          <span className="text-slate-900 flex items-center gap-1.5 font-serif-header">
            <span>💳</span> Net Payable Amount (Direct Benefit Transfer):
          </span>
          <span className="font-mono text-xl text-[#0d6e48] font-bold">
            ₹{procurement.netPayableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Phase 10 Payment Ready Handoff Status */}
      {procurement.paymentReady && (
        <div className="mb-6 p-4 bg-[#e6f7ef] border border-[#b2e8cf] rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#0d6e48] text-white flex items-center justify-center font-bold text-sm">
              ✓
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#0d6e48] font-serif-header">Payment-Ready Handoff Established</h4>
              <p className="text-xs text-[#0d6e48] font-medium">
                Procurement session finalized. Record queued for Direct Benefit Transfer (DBT) bank payout.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-3 py-1 bg-white text-[#0d6e48] border border-[#b2e8cf] rounded-xl font-bold shadow-sm">
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
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 text-xs border border-slate-200 disabled:opacity-50"
            >
              <span>🧮</span> Calculate Authoritative Value
            </button>
          )}

          {onFinalize && (
            <button
              onClick={onFinalize}
              disabled={submitting}
              className="flex-1 bg-[#0d6e48] hover:bg-[#095235] text-white font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-md disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Finalizing Procurement Session...
                </>
              ) : (
                <>
                  <span>🔒</span> Finalize Session &amp; Handoff to Payment Engine
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
