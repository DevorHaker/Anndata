import React from 'react';
import { ProcurementRecordUI } from '../../services/procurement.service';

interface FarmerProcurementStatusCardProps {
  procurement: ProcurementRecordUI;
}

export const FarmerProcurementStatusCard: React.FC<FarmerProcurementStatusCardProps> = ({ procurement }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-full">COMPLETED (PAYMENT READY)</span>;
      case 'REJECTED':
        return <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-full">REJECTED</span>;
      case 'PARTIALLY_ACCEPTED':
      case 'ACCEPTED':
      case 'UNDER_REVIEW':
        return <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-semibold rounded-full">INSPECTION ACCEPTED</span>;
      case 'WEIGHING':
        return <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-semibold rounded-full">AT WEIGHBRIDGE</span>;
      default:
        return <span className="px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold rounded-full">{status}</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg text-slate-100 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-200 font-mono">
              {procurement.procurementReferenceId}
            </span>
            {procurement.tokenCode && (
              <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">
                {procurement.tokenCode}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400">
            Started: {new Date(procurement.startedAt).toLocaleString()}
          </span>
        </div>
        <div>{getStatusBadge(procurement.status)}</div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-center mb-4">
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Declared Weight</span>
          <span className="text-sm font-mono font-bold text-slate-200">{procurement.declaredQuantityKg} KG</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Measured Net</span>
          <span className="text-sm font-mono font-bold text-amber-400">
            {procurement.measuredNetWeightKg ? `${procurement.measuredNetWeightKg} KG` : 'Pending'}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Quality Grade</span>
          <span className="text-sm font-mono font-bold text-cyan-400">
            {procurement.qualityGrade || 'Pending'}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Final Accepted</span>
          <span className="text-sm font-mono font-bold text-emerald-400">
            {procurement.finalAcceptedWeightKg ? `${procurement.finalAcceptedWeightKg} KG` : 'Pending'}
          </span>
        </div>
      </div>

      {/* Financial Payout Summary */}
      {procurement.netPayableAmount > 0 && (
        <div className="flex items-center justify-between bg-emerald-950/30 border border-emerald-800/40 p-3 rounded-lg">
          <div>
            <span className="text-xs text-emerald-400 font-semibold block">Net Payable Amount (MSP ₹{procurement.ratePerQuintal}/q)</span>
            {procurement.qualityDeductionKg > 0 && (
              <span className="text-[11px] text-amber-400">
                (Reflects {procurement.qualityDeductionKg} KG quality deduction)
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="text-lg font-mono font-bold text-emerald-400">
              ₹{procurement.netPayableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
