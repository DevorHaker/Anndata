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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#e6f7ef] border border-[#b2e8cf] text-[#0d6e48] text-xs font-bold rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0d6e48]" /> Disbursed (Settled)
          </span>
        );
      case 'PAYMENT_PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-full">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" /> Pending Mandi Approval
          </span>
        );
      case 'PAYMENT_VALIDATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Account Verified
          </span>
        );
      case 'PAYMENT_PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold rounded-full">
            <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin" /> Banking Processing
          </span>
        );
      case 'PAYMENT_RETRY':
      case 'PAYMENT_FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-full">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Disbursement Retrying
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#e6f7ef] border border-[#b2e8cf] text-[#0d6e48] rounded-2xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-serif-header text-slate-900">Farmer Direct Benefit Transfer (DBT) Disbursements</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Authoritative MSP Calculations, Verified Bank Credits &amp; 14-Step Traceability</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setPayments([...payments])}
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 shadow-sm transition w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#0d6e48]" /> Refresh Payments
        </button>
      </div>

      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Disbursed (Settled)</p>
            <h2 className="text-2xl font-bold text-[#0d6e48] font-serif-header mt-1">₹{totalDisbursed.toLocaleString('en-IN')}</h2>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Directly credited to linked Aadhar bank account</p>
          </div>
          <div className="p-3 bg-[#e6f7ef] text-[#0d6e48] rounded-2xl border border-[#b2e8cf]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Disbursement</p>
            <h2 className="text-2xl font-bold text-amber-700 font-serif-header mt-1">₹{totalPending.toLocaleString('en-IN')}</h2>
            <p className="text-[11px] text-slate-500 font-medium mt-1">In verification or banking gateway processing</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-200">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">DBT Bank Destination</p>
            <h2 className="text-sm font-bold text-slate-900 font-serif-header mt-1">State Bank of India</h2>
            <p className="text-xs font-mono text-slate-500 mt-0.5">A/C: XXXX XXXX 4521 | IFSC: SBIN0001234</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl border border-blue-200">
            <Building2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Controls & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Payment Ref or Procurement Ref..."
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
            <option value="PAYMENT_SUCCESS">Disbursed (Settled)</option>
            <option value="PAYMENT_PENDING">Pending Approval</option>
            <option value="PAYMENT_VALIDATED">Account Verified</option>
            <option value="PAYMENT_PROCESSING">Banking Processing</option>
          </select>
        </div>
      </div>

      {/* Disbursement Cards List */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm">
          <RefreshCw className="w-8 h-8 text-[#0d6e48] animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Loading DBT payment records from secure vault...</p>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm">
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold font-serif-header text-slate-900">No DBT Payments Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 font-medium">
            No payment disbursements match your filter. Completed Mandi procurements automatically generate DBT payment orders.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:border-[#b2e8cf] transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-900 font-mono">{payment.paymentReferenceId}</span>
                    {getStatusBadge(payment.status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                    <span>Procurement Ref: <strong className="text-slate-900 font-mono">{payment.procurementReferenceId}</strong></span>
                    <span>Centre: <strong className="text-slate-900">{payment.centreName}</strong></span>
                    <span>Quantity: <strong className="text-slate-900">{payment.acceptedQuantityKg} kg</strong></span>
                    <span>MSP Rate: <strong className="text-slate-900">₹{payment.ratePerQuintal}/quintal</strong></span>
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 border-slate-100 pt-3 lg:pt-0">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Net Disbursed Amount</p>
                    <p className="text-xl font-bold text-[#0d6e48] font-serif-header">₹{payment.netPayableAmount.toLocaleString('en-IN')}</p>
                    {payment.deductionsAmount > 0 && (
                      <p className="text-[10px] text-amber-700 font-semibold">Includes ₹{payment.deductionsAmount} quality deduction</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/traceability/${payment.procurementId}`)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#e6f7ef] hover:bg-[#d0f2e2] text-[#0d6e48] border border-[#b2e8cf] rounded-xl text-xs font-bold transition"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> 14-Step Traceability
                    </button>
                    <button
                      onClick={() => setSelectedPayment(payment)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg p-6 rounded-3xl border border-slate-200 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold font-serif-header text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#0d6e48]" /> Payment Breakdown &amp; Banking UTR
              </h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 font-mono">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Payment Reference</p>
                  <p className="text-slate-900 font-bold">{selectedPayment.paymentReferenceId}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Procurement Reference</p>
                  <p className="text-slate-900 font-bold">{selectedPayment.procurementReferenceId}</p>
                </div>
              </div>

              <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200 font-medium">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Quantity (Acceptable):</span>
                  <span className="text-slate-900 font-bold">{selectedPayment.acceptedQuantityKg} kg ({selectedPayment.acceptedQuantityKg / 100} quintals)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Government MSP Rate:</span>
                  <span className="text-slate-900 font-bold">₹{selectedPayment.ratePerQuintal} / quintal</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Gross Value:</span>
                  <span className="text-slate-900 font-bold">₹{selectedPayment.grossAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>Quality Moisture Deductions:</span>
                  <span>- ₹{selectedPayment.deductionsAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
                  <span>Net Direct Benefit Credit:</span>
                  <span className="text-[#0d6e48] font-serif-header">₹{selectedPayment.netPayableAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="bg-[#e6f7ef] p-3.5 rounded-2xl border border-[#b2e8cf] space-y-1">
                <p className="text-[10px] text-[#0d6e48] uppercase font-bold">Verified Bank Credit Destination</p>
                <p className="text-slate-900 font-bold text-sm">{selectedPayment.bankName}</p>
                <p className="text-slate-600 font-mono text-xs">Account: {selectedPayment.destinationReference} | IFSC: {selectedPayment.ifscCode}</p>
                {selectedPayment.providerTransactionRef && (
                  <p className="text-[#0d6e48] font-mono text-[11px] pt-1">
                    Banking UTR Ref: <strong>{selectedPayment.providerTransactionRef}</strong>
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  const procId = selectedPayment.procurementId;
                  setSelectedPayment(null);
                  navigate(`/traceability/${procId}`);
                }}
                className="w-full py-3 bg-[#0d6e48] hover:bg-[#095235] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md"
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
