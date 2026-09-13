import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  ArrowUpRight, 
  Building2, 
  FileText, 
  ChevronRight,
  ShieldCheck,
  Search,
  SlidersHorizontal
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
  createdTimestamp: string;
  lastUpdatedTimestamp: string;
}

export const FarmerPaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  useEffect(() => {
    // Simulated fetching payments for farmer from backend
    setTimeout(() => {
      setPayments([
        {
          id: 'pay-001-dbt',
          paymentReferenceId: 'PAY-20260913-9081',
          procurementId: 'proc-8871-wheat',
          procurementReferenceId: 'PR-2026-00012984',
          farmerId: user?.farmerId || 'farmer-001',
          farmerName: 'Ramesh Kumar',
          centreName: 'Karnal Central Procurement Mandi',
          acceptedQuantityKg: 1920,
          ratePerQuintal: 2425,
          grossAmount: 46560,
          deductionsAmount: 486,
          netPayableAmount: 46074,
          status: 'PAYMENT_SUCCESS',
          providerTransactionRef: 'UTR-20260913-9988112233',
          destinationReference: 'XXXX XXXX 4521',
          bankName: 'State Bank of India',
          ifscCode: 'SBIN0001234',
          createdTimestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          lastUpdatedTimestamp: new Date(Date.now() - 3600000 * 23).toISOString()
        },
        {
          id: 'pay-002-dbt',
          paymentReferenceId: 'PAY-20260913-9082',
          procurementId: 'proc-8872-wheat',
          procurementReferenceId: 'PR-2026-00012985',
          farmerId: user?.farmerId || 'farmer-001',
          farmerName: 'Ramesh Kumar',
          centreName: 'Karnal Central Procurement Mandi',
          acceptedQuantityKg: 1500,
          ratePerQuintal: 2425,
          grossAmount: 36375,
          deductionsAmount: 0,
          netPayableAmount: 36375,
          status: 'PAYMENT_PENDING',
          destinationReference: 'XXXX XXXX 4521',
          bankName: 'State Bank of India',
          ifscCode: 'SBIN0001234',
          createdTimestamp: new Date().toISOString(),
          lastUpdatedTimestamp: new Date().toISOString()
        }
      ]);
      setLoading(false);
    }, 600);
  }, [user]);

  const filteredPayments = payments.filter((p) => {
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    const matchesSearch = 
      p.paymentReferenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.procurementReferenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.bankName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalDisbursed = payments
    .filter((p) => p.status === 'PAYMENT_SUCCESS')
    .reduce((sum, p) => sum + p.netPayableAmount, 0);

  const totalPending = payments
    .filter((p) => p.status === 'PAYMENT_PENDING' || p.status === 'PAYMENT_VALIDATED' || p.status === 'PAYMENT_PROCESSING' || p.status === 'PAYMENT_RETRY')
    .reduce((sum, p) => sum + p.netPayableAmount, 0);

  const getStatusBadge = (status: PaymentRecord['status']) => {
    switch (status) {
      case 'PAYMENT_SUCCESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Disbursed (Settled)
          </span>
        );
      case 'PAYMENT_PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold rounded-full">
            <Clock className="w-3.5 h-3.5 animate-pulse" /> Pending Mandi Approval
          </span>
        );
      case 'PAYMENT_VALIDATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" /> Account Verified
          </span>
        );
      case 'PAYMENT_PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold rounded-full">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Banking Processing
          </span>
        );
      case 'PAYMENT_RETRY':
      case 'PAYMENT_FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-full">
            <AlertCircle className="w-3.5 h-3.5" /> Disbursement Retrying
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Farmer Direct Benefit Transfer (DBT) Disbursements</h1>
              <p className="text-xs text-slate-400">Phase 10 — Authoritative MSP Calculations, Verified Bank Credits & 14-Step Traceability</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setPayments([...payments])}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Payments
        </button>
      </div>

      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Disbursed (Settled)</p>
            <h2 className="text-2xl font-bold text-emerald-400 mt-1">₹{totalDisbursed.toLocaleString('en-IN')}</h2>
            <p className="text-[11px] text-slate-500 mt-1">Directly credited to linked Aadhar bank account</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pending Disbursement</p>
            <h2 className="text-2xl font-bold text-amber-400 mt-1">₹{totalPending.toLocaleString('en-IN')}</h2>
            <p className="text-[11px] text-slate-500 mt-1">In verification or banking gateway processing</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">DBT Bank Destination</p>
            <h2 className="text-sm font-semibold text-slate-200 mt-1">State Bank of India</h2>
            <p className="text-xs font-mono text-slate-400 mt-0.5">A/C: XXXX XXXX 4521 | IFSC: SBIN0001234</p>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Controls & Filters */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Payment Ref or Procurement Ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-400 font-medium">Status Filter:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAYMENT_SUCCESS">Disbursed (Settled)</option>
            <option value="PAYMENT_PENDING">Pending Approval</option>
            <option value="PAYMENT_VALIDATED">Account Verified</option>
            <option value="PAYMENT_PROCESSING">Banking Processing</option>
          </select>
        </div>
      </div>

      {/* Disbursement Cards List */}
      {loading ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading DBT payment records from secure vault...</p>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No DBT Payments Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            No payment disbursements match your filter. Completed Mandi procurements automatically generate DBT payment orders.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-100 font-mono">{payment.paymentReferenceId}</span>
                    {getStatusBadge(payment.status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span>Procurement Ref: <strong className="text-slate-200 font-mono">{payment.procurementReferenceId}</strong></span>
                    <span>Centre: <strong className="text-slate-200">{payment.centreName}</strong></span>
                    <span>Quantity: <strong className="text-slate-200">{payment.acceptedQuantityKg} kg</strong></span>
                    <span>MSP Rate: <strong className="text-slate-200">₹{payment.ratePerQuintal}/quintal</strong></span>
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 border-slate-800/80 pt-3 lg:pt-0">
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400 uppercase font-medium">Net Disbursed Amount</p>
                    <p className="text-xl font-bold text-emerald-400">₹{payment.netPayableAmount.toLocaleString('en-IN')}</p>
                    {payment.deductionsAmount > 0 && (
                      <p className="text-[10px] text-amber-400">Includes ₹{payment.deductionsAmount} quality deduction</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/traceability/${payment.procurementId}`)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> 14-Step Traceability
                    </button>
                    <button
                      onClick={() => setSelectedPayment(payment)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" /> Payment Breakdown & Banking UTR
              </h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800 font-mono">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Payment Reference</p>
                  <p className="text-slate-200 font-semibold">{selectedPayment.paymentReferenceId}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Procurement Reference</p>
                  <p className="text-slate-200 font-semibold">{selectedPayment.procurementReferenceId}</p>
                </div>
              </div>

              <div className="space-y-1.5 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                <div className="flex justify-between text-slate-400">
                  <span>Gross Quantity (Acceptable):</span>
                  <span className="text-slate-200 font-medium">{selectedPayment.acceptedQuantityKg} kg ({selectedPayment.acceptedQuantityKg / 100} quintals)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Government MSP Rate:</span>
                  <span className="text-slate-200 font-medium">₹{selectedPayment.ratePerQuintal} / quintal</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Gross Value:</span>
                  <span className="text-slate-200 font-medium">₹{selectedPayment.grossAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-amber-400">
                  <span>Quality Moisture Deductions:</span>
                  <span>- ₹{selectedPayment.deductionsAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-slate-100 text-sm">
                  <span>Net Direct Benefit Credit:</span>
                  <span className="text-emerald-400">₹{selectedPayment.netPayableAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/20 space-y-1">
                <p className="text-[10px] text-emerald-400 uppercase font-semibold">Verified Bank Credit Destination</p>
                <p className="text-slate-200 font-semibold">{selectedPayment.bankName}</p>
                <p className="text-slate-400 font-mono">Account: {selectedPayment.destinationReference} | IFSC: {selectedPayment.ifscCode}</p>
                {selectedPayment.providerTransactionRef && (
                  <p className="text-emerald-300 font-mono text-[11px] pt-1">
                    Banking UTR Ref: <strong>{selectedPayment.providerTransactionRef}</strong>
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  const procId = selectedPayment.procurementId;
                  setSelectedPayment(null);
                  navigate(`/traceability/${procId}`);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2"
              >
                <ArrowUpRight className="w-4 h-4" /> View Full 14-Step Traceability Journey
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
