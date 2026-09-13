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
  ShieldCheck
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#e6f7ef] border border-[#b2e8cf] text-[#0d6e48] text-xs font-bold rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0d6e48]" /> Disbursed
          </span>
        );
      case 'PAYMENT_PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-full">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" /> Pending Validation
          </span>
        );
      case 'PAYMENT_VALIDATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Ready to Process
          </span>
        );
      case 'PAYMENT_RETRY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-full">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Retrying (Timeout)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl border border-[#b2e8cf] bg-[#e6f7ef] text-[#0d6e48] text-xs font-bold shadow-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#0d6e48] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#e6f7ef] border border-[#b2e8cf] text-[#0d6e48] rounded-2xl">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-serif-header text-slate-900">Payment &amp; Disbursement Management Console</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Mandi Officer &amp; Admin Authorization, DBT Validation &amp; Retry Controls</p>
          </div>
        </div>

        <button
          onClick={() => setPayments([...payments])}
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 shadow-sm transition w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#0d6e48]" /> Refresh Queue
        </button>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search Farmer Name, Payment Ref, or Procurement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#0d6e48]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Status Filter:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-[#0d6e48]"
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
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm">
          <RefreshCw className="w-8 h-8 text-[#0d6e48] animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Loading disbursement queue...</p>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm">
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold font-serif-header text-slate-900">No Records Match</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 font-medium">Adjust filters or search parameters.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Payment Ref</th>
                  <th className="py-3 px-4">Farmer Details</th>
                  <th className="py-3 px-4">Procurement &amp; Weight</th>
                  <th className="py-3 px-4">Net Amount</th>
                  <th className="py-3 px-4">Bank Destination</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0d6e48]">
                      {p.paymentReferenceId}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{p.farmerName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{p.farmerId}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-mono text-slate-700">{p.procurementReferenceId}</p>
                      <p className="text-[11px] text-slate-500">{p.acceptedQuantityKg} kg @ ₹{p.ratePerQuintal}/Q</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[#0d6e48] text-sm font-serif-header">₹{p.netPayableAmount.toLocaleString('en-IN')}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-900 font-bold">{p.bankName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{p.destinationReference}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(p.status)}
                      {p.providerTransactionRef && (
                        <p className="text-[10px] font-mono text-[#0d6e48] font-bold mt-1">UTR: {p.providerTransactionRef}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.status === 'PAYMENT_PENDING' && (
                          <button
                            disabled={processingId === p.id}
                            onClick={() => handleValidateAccount(p.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" /> Validate
                          </button>
                        )}

                        {p.status === 'PAYMENT_VALIDATED' && (
                          <button
                            disabled={processingId === p.id}
                            onClick={() => handleProcessDisbursement(p.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#0d6e48] hover:bg-[#095235] text-white rounded-xl text-xs font-bold transition shadow-md"
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
                            className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Retry Disbursement
                          </button>
                        )}

                        {p.status === 'PAYMENT_SUCCESS' && (
                          <span className="text-[11px] text-slate-400 font-mono">Audited &amp; Locked</span>
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
