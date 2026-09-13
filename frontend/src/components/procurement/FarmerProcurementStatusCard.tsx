import React from 'react';
import { ProcurementRecordUI } from '../../services/procurement.service';

interface FarmerProcurementStatusCardProps {
  procurement: ProcurementRecordUI;
}

export const FarmerProcurementStatusCard: React.FC<FarmerProcurementStatusCardProps> = ({ procurement }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-3 py-1 bg-[#e6f7ef] text-[#0d6e48] border border-[#b2e8cf] text-xs font-bold rounded-full">COMPLETED (PAYMENT READY)</span>;
      case 'REJECTED':
        return <span className="px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold rounded-full">REJECTED</span>;
      case 'PARTIALLY_ACCEPTED':
      case 'ACCEPTED':
      case 'UNDER_REVIEW':
        return <span className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold rounded-full">INSPECTION ACCEPTED</span>;
      case 'WEIGHING':
        return <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-full">AT WEIGHBRIDGE</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-full">{status}</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm text-slate-900 mb-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 font-mono">
              {procurement.procurementReferenceId}
            </span>
            {procurement.tokenCode && (
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono font-bold">
                {procurement.tokenCode}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Started: {new Date(procurement.startedAt).toLocaleString()}
          </span>
        </div>
        <div>{getStatusBadge(procurement.status)}</div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center mb-4 font-medium">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Declared Weight</span>
          <span className="text-sm font-mono font-bold text-slate-900">{procurement.declaredQuantityKg} KG</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Measured Net</span>
          <span className="text-sm font-mono font-bold text-amber-700">
            {procurement.measuredNetWeightKg ? `${procurement.measuredNetWeightKg} KG` : 'Pending'}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Quality Grade</span>
          <span className="text-sm font-mono font-bold text-teal-700">
            {procurement.qualityGrade || 'Pending'}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Final Accepted</span>
          <span className="text-sm font-mono font-bold text-[#0d6e48]">
            {procurement.finalAcceptedWeightKg ? `${procurement.finalAcceptedWeightKg} KG` : 'Pending'}
          </span>
        </div>
      </div>

      {/* Financial Payout Summary */}
      {procurement.netPayableAmount > 0 && (
        <div className="flex items-center justify-between bg-[#e6f7ef] border border-[#b2e8cf] p-3.5 rounded-xl">
          <div>
            <span className="text-xs text-[#0d6e48] font-bold block">Net Payable Amount (MSP ₹{procurement.ratePerQuintal}/q)</span>
            {procurement.qualityDeductionKg > 0 && (
              <span className="text-[11px] text-amber-700 font-semibold">
                (Reflects {procurement.qualityDeductionKg} KG quality deduction)
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="text-lg font-mono font-bold text-[#0d6e48]">
              ₹{procurement.netPayableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
