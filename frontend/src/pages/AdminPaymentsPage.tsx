import React, { useEffect, useState } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Building2, 
  FileText, 
  Search,
  SlidersHorizontal,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PaymentRecord {
  id: string;
  paymentReferenceId: string;
  procurementId: string;
  procurementReferenceId: string;
  farmerId: string;
  farmerName: string;
  centreName: string;
  acceptedQuantityKg: number;
  ratePerQuintal: number;
  grossAmount: number;
  deductionsAmount: number;
  netPayableAmount: number;
  status: 'PAYMENT_PENDING' | 'PAYMENT_VALIDATED' | 'PAYMENT_PROCESSING' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'PAYMENT_RETRY' | 'PAYMENT_REVERSED';
  providerTransactionRef?: string;
  destinationReference: string;
  bankName: string;
  ifscCode: string;
  retryCount: number;
  failureCode?: string;
  createdTimestamp: string;
  lastUpdatedTimestamp: string;
}

export const AdminPaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch of active payment records
    setTimeout(() => {
      setPayments([
        {
          id: 'pay-adm-101',
          paymentReferenceId: 'PAY-20260913-9081',
          procurementId: 'proc-8871-wheat',
          procurementReferenceId: 'PR-2026-00012984',
          farmerId: 'farmer-001-ramesh',
          farmerName: 'Ramesh Kumar',
          centreName: 'Karnal Central Procurement Mandi',
          acceptedQuantityKg: 1920,
          ratePerQuintal: 2425,
          grossAmount: 46560,
          deductionsAmount: 486,
          netPayableAmount: 46074,
          status: 'PAYMENT_PENDING',
          destinationReference: 'XXXX XXXX 4521',
          bankName: 'State Bank of India',
          ifscCode: 'SBIN0001234',
          retryCount: 0,
          createdTimestamp: new Date().toISOString(),
          lastUpdatedTimestamp: new Date().toISOString()
        },
        {
          id: 'pay-adm-102',
          paymentReferenceId: 'PAY-20260913-9082',
          procurementId: 'proc-8872-wheat',
          procurementReferenceId: 'PR-2026-00012985',
          farmerId: 'farmer-002-suresh',
          farmerName: 'Suresh Patel',
          centreName: 'Karnal Central Procurement Mandi',
          acceptedQuantityKg: 2400,
          ratePerQuintal: 2425,
          grossAmount: 58200,
          deductionsAmount: 0,
          netPayableAmount: 58200,
          status: 'PAYMENT_RETRY',
          failureCode: 'PROVIDER_TIMEOUT',
          destinationReference: 'XXXX XXXX 9988',
          bankName: 'Punjab National Bank',
          ifscCode: 'PUNB0123400',
          retryCount: 1,
          createdTimestamp: new Date(Date.now() - 7200000).toISOString(),
          lastUpdatedTimestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'pay-adm-103',
          paymentReferenceId: 'PAY-20260913-9080',
          procurementId: 'proc-8870-wheat',
          procurementReferenceId: 'PR-2026-00012983',
          farmerId: 'farmer-003-anita',
          farmerName: 'Anita Devi',
          centreName: 'Karnal Central Procurement Mandi',
          acceptedQuantityKg: 3100,
          ratePerQuintal: 2425,
          grossAmount: 75175,
          deductionsAmount: 0,
          netPayableAmount: 75175,
          status: 'PAYMENT_SUCCESS',
          providerTransactionRef: 'UTR-20260913-8877665544',
          destinationReference: 'XXXX XXXX 1122',
          bankName: 'HDFC Bank',
          ifscCode: 'HDFC0000123',
          retryCount: 0,
          createdTimestamp: new Date(Date.now() - 86400000).toISOString(),
          lastUpdatedTimestamp: new Date(Date.now() - 85000000).toISOString()
        }
      ]);
      setLoading(false);
    }, 600);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleValidateAccount = (paymentId: string) => {
    setProcessingId(paymentId);
    setTimeout(() => {
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, status: 'PAYMENT_VALIDATED' } : p))
      );
      setProcessingId(null);
      showToast('Bank Destination Account & IFSC validated successfully.');
    }, 500);
  };

  const handleProcessDisbursement = (paymentId: string) => {
    setProcessingId(paymentId);
    setTimeout(() => {
      const utr = `UTR-20260913-${Math.floor(10000000 + Math.random() * 90000000)}`;
      setPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId
            ? { ...p, status: 'PAYMENT_SUCCESS', providerTransactionRef: utr }
            : p
        )
      );
      setProcessingId(null);
      showToast(`Disbursement completed! Banking UTR reference generated: ${utr}`);
    }, 700);
  };

  const handleRetryDisbursement = (paymentId: string) => {
    setProcessingId(paymentId);
    setTimeout(() => {
      const utr = `UTR-20260913-RETRY-${Math.floor(10000000 + Math.random() * 90000000)}`;
      setPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId
            ? {
                ...p,
                status: 'PAYMENT_SUCCESS',
                providerTransactionRef: utr,
                retryCount: p.retryCount + 1,
                failureCode: undefined
              }
            : p
        )
      );
      setProcessingId(null);
      showToast(`Disbursement retry succeeded! New UTR: ${utr}`);
    }, 700);
  };

  const filteredPayments = payments.filter((p) => {
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    const matchesSearch =
      p.paymentReferenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.procurementReferenceId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: PaymentRecord['status']) => {
    switch (status) {
      case 'PAYMENT_SUCCESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Disbursed
          </span>
        );
      case 'PAYMENT_PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold rounded-full">
            <Clock className="w-3.5 h-3.5 animate-pulse" /> Pending Validation
          </span>
        );
      case 'PAYMENT_VALIDATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" /> Ready to Process
          </span>
        );
      case 'PAYMENT_RETRY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-full">
            <AlertCircle className="w-3.5 h-3.5" /> Retrying (Timeout)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel p-4 rounded-xl border border-emerald-500/40 bg-slate-900/90 text-emerald-300 text-xs font-medium shadow-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Payment & Disbursement Management Console</h1>
            <p className="text-xs text-slate-400">Phase 10 — Mandi Officer & Admin Authorization, DBT Validation & Retry Controls</p>
          </div>
        </div>

        <button
          onClick={() => setPayments([...payments])}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
        </button>
      </div>

      {/* Filter Controls */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search Farmer Name, Payment Ref, or Procurement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-400 font-medium">Status Filter:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAYMENT_PENDING">Pending Validation</option>
            <option value="PAYMENT_VALIDATED">Ready to Process</option>
            <option value="PAYMENT_RETRY">Retry Pending</option>
            <option value="PAYMENT_SUCCESS">Disbursed (Settled)</option>
          </select>
        </div>
      </div>

      {/* Admin Table */}
      {loading ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading disbursement queue...</p>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No Records Match</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">Adjust filters or search parameters.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Payment Ref</th>
                  <th className="py-3 px-4">Farmer Details</th>
                  <th className="py-3 px-4">Procurement & Weight</th>
                  <th className="py-3 px-4">Net Amount</th>
                  <th className="py-3 px-4">Bank Destination</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-200">
                      {p.paymentReferenceId}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-200">{p.farmerName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{p.farmerId}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-mono text-slate-300">{p.procurementReferenceId}</p>
                      <p className="text-[11px] text-slate-400">{p.acceptedQuantityKg} kg @ ₹{p.ratePerQuintal}/Q</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-emerald-400 text-sm">₹{p.netPayableAmount.toLocaleString('en-IN')}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-200 font-medium">{p.bankName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{p.destinationReference}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(p.status)}
                      {p.providerTransactionRef && (
                        <p className="text-[10px] font-mono text-emerald-400 mt-1">UTR: {p.providerTransactionRef}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.status === 'PAYMENT_PENDING' && (
                          <button
                            disabled={processingId === p.id}
                            onClick={() => handleValidateAccount(p.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold transition"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" /> Validate
                          </button>
                        )}

                        {p.status === 'PAYMENT_VALIDATED' && (
                          <button
                            disabled={processingId === p.id}
                            onClick={() => handleProcessDisbursement(p.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition shadow-lg"
                          >
                            {processingId === p.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current" />
                            )}
                            Disburse DBT
                          </button>
                        )}

                        {p.status === 'PAYMENT_RETRY' && (
                          <button
                            disabled={processingId === p.id}
                            onClick={() => handleRetryDisbursement(p.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Retry Disbursement
                          </button>
                        )}

                        {p.status === 'PAYMENT_SUCCESS' && (
                          <span className="text-[11px] text-slate-500 font-mono">Audited & Locked</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
