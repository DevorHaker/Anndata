import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowLeft, 
  FileText, 
  CheckCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Hash
} from 'lucide-react';

interface TraceabilityStep {
  stepIndex: number;
  stepKey: string;
  title: string;
  description: string;
  completed: boolean;
  timestamp: string;
  actor: string;
  details: Record<string, any>;
  cryptographicHash: string;
}

interface TraceabilityData {
  procurementId: string;
  procurementReferenceId: string;
  farmerName: string;
  centreName: string;
  cropName: string;
  overallStatus: 'COMPLETED' | 'IN_PROGRESS';
  batchFingerprint: string;
  completedStepsCount: number;
  totalStepsCount: number;
  steps: TraceabilityStep[];
}

export const TraceabilityPage: React.FC = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<TraceabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  useEffect(() => {
    // Simulated fetch of 14-step traceability timeline
    setTimeout(() => {
      setData({
        procurementId: identifier || 'proc-8871-wheat',
        procurementReferenceId: 'PR-2026-00012984',
        farmerName: 'Ramesh Kumar (F-2026-9081)',
        centreName: 'Karnal Central Procurement Mandi',
        cropName: 'Sharbati Wheat (Grade A)',
        overallStatus: 'COMPLETED',
        batchFingerprint: 'SHA256:7f8a9b2c3d4e5f6a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b2c3d4e5f6a',
        completedStepsCount: 14,
        totalStepsCount: 14,
        steps: [
          {
            stepIndex: 1,
            stepKey: 'FARMER_REGISTRATION',
            title: '1. Farmer Registration & Identity Verification',
            description: 'Farmer identity authenticated via Aadhar e-KYC and land holding verification.',
            completed: true,
            timestamp: '2026-09-10T08:30:00Z',
            actor: 'System Auto-Verification',
            details: { farmerId: 'farmer-001-ramesh', aadharVerified: true, landRecords: '2.5 Hectares verified' },
            cryptographicHash: '0x8a91b...29f1'
          },
          {
            stepIndex: 2,
            stepKey: 'PRODUCE_DECLARATION',
            title: '2. Produce & Quantity Self-Declaration',
            description: 'Declared estimated harvest quantity of Sharbati Wheat.',
            completed: true,
            timestamp: '2026-09-12T10:15:00Z',
            actor: 'Ramesh Kumar',
            details: { cropType: 'Wheat', declaredQuantityKg: 2000 },
            cryptographicHash: '0x3c7e1...90a2'
          },
          {
            stepIndex: 3,
            stepKey: 'SLOT_BOOKING',
            title: '3. Mandi Slot Booking & Schedule Confirmation',
            description: 'Booked non-congested procurement slot at Karnal Mandi.',
            completed: true,
            timestamp: '2026-09-12T10:16:00Z',
            actor: 'SmartProcure Engine',
            details: { bookingRef: 'BK-2026-000129', scheduledDate: '2026-09-13', slotWindow: '10:00 - 11:00 AM' },
            cryptographicHash: '0x992fa...11c4'
          },
          {
            stepIndex: 4,
            stepKey: 'TOKEN_GENERATION',
            title: '4. Digital Token Generation & QR Issuance',
            description: 'Encrypted QR procurement token generated for expedited gate entry.',
            completed: true,
            timestamp: '2026-09-12T10:16:05Z',
            actor: 'Token Dispatcher',
            details: { tokenCode: 'T-KRN-8812', qrPayload: 'ENCRYPTED_JWT' },
            cryptographicHash: '0x718ab...88d2'
          },
          {
            stepIndex: 5,
            stepKey: 'GATE_CHECKIN',
            title: '5. Mandi Gate Check-in & Security Verification',
            description: 'Vehicle arrived at gate, scanned QR token, and verified driver.',
            completed: true,
            timestamp: '2026-09-13T09:45:00Z',
            actor: 'Gate Security Staff',
            details: { vehicleNo: 'HR-05-AB-1234', gateNo: 'Gate 2' },
            cryptographicHash: '0x126ea...44f9'
          },
          {
            stepIndex: 6,
            stepKey: 'QUEUE_ASSIGNMENT',
            title: '6. Real-Time Dynamic Queue Allocation',
            description: 'Assigned to Weighbridge #1 line based on vehicle load density.',
            completed: true,
            timestamp: '2026-09-13T09:47:00Z',
            actor: 'Queue Dispatch Engine',
            details: { assignedWeighbridge: 'WB-01', estimatedWaitMinutes: 8 },
            cryptographicHash: '0xbb18d...33e1'
          },
          {
            stepIndex: 7,
            stepKey: 'INTAKE_UNLOADING',
            title: '7. Mandi Intake Bay Unloading',
            description: 'Produce unloaded onto Mandi platform bay for weighment.',
            completed: true,
            timestamp: '2026-09-13T10:02:00Z',
            actor: 'Intake Bay Supervisor',
            details: { bayNo: 'Bay B-04' },
            cryptographicHash: '0x5511c...77a8'
          },
          {
            stepIndex: 8,
            stepKey: 'GROSS_WEIGHMENT',
            title: '8. Digital Weighbridge Gross Weight Capture',
            description: 'Automated digital weighbridge recorded gross vehicle + produce weight.',
            completed: true,
            timestamp: '2026-09-13T10:10:00Z',
            actor: 'Digital Weighbridge WB-01',
            details: { grossWeightKg: 4200, unit: 'KG' },
            cryptographicHash: '0xa1b2c...3d4e'
          },
          {
            stepIndex: 9,
            stepKey: 'TARE_WEIGHMENT',
            title: '9. Vehicle Tare Weight & Net Quantity Audit',
            description: 'Empty vehicle weighed. Calculated exact Net Produce Weight: 1,920 kg.',
            completed: true,
            timestamp: '2026-09-13T10:25:00Z',
            actor: 'Digital Weighbridge WB-01',
            details: { tareWeightKg: 2280, netWeightKg: 1920 },
            cryptographicHash: '0xf8e7d...6c5b'
          },
          {
            stepIndex: 10,
            stepKey: 'QUALITY_INSPECTION',
            title: '10. Crop Quality Inspection & Parameter Testing',
            description: 'Laboratory testing recorded moisture 11.2% and foreign matter 0.4%. Passed Grade A.',
            completed: true,
            timestamp: '2026-09-13T10:35:00Z',
            actor: 'Quality Inspector User #402',
            details: { grade: 'GRADE_A', moisture: '11.2%', deductionKg: 0, status: 'PASSED' },
            cryptographicHash: '0x44332...1100'
          },
          {
            stepIndex: 11,
            stepKey: 'FINANCIAL_VALUATION',
            title: '11. Server-Side MSP Valuation & Deduction Calc',
            description: 'Authoritative calculation applied Government MSP rate of ₹2,425/quintal.',
            completed: true,
            timestamp: '2026-09-13T10:36:00Z',
            actor: 'Valuation Math Engine',
            details: { ratePerQuintal: 2425, grossAmount: 46560, netPayableAmount: 46560 },
            cryptographicHash: '0x99887...7766'
          },
          {
            stepIndex: 12,
            stepKey: 'TRANSACTION_FINALIZATION',
            title: '12. Mandi Officer Procurement Finalization',
            description: 'Procurement officer signed off transaction. Payment handoff triggered.',
            completed: true,
            timestamp: '2026-09-13T10:40:00Z',
            actor: 'Procurement Officer (Karnal Mandi)',
            details: { officerId: 'user-officer-karnal-001', paymentReady: true },
            cryptographicHash: '0x55443...2211'
          },
          {
            stepIndex: 13,
            stepKey: 'DBT_PAYMENT_CREATION',
            title: '13. DBT Bank Account Validation & Payment Order',
            description: 'Payment record created, destination bank account (SBI A/C 4521) verified.',
            completed: true,
            timestamp: '2026-09-13T10:41:00Z',
            actor: 'DBT Payment Engine',
            details: { paymentRef: 'PAY-20260913-9081', bank: 'State Bank of India', ifsc: 'SBIN0001234' },
            cryptographicHash: '0xaa998...8877'
          },
          {
            stepIndex: 14,
            stepKey: 'DISBURSEMENT_SETTLEMENT',
            title: '14. Banking Gateway Settlement & Immutable Lock',
            description: 'Direct Benefit Transfer executed. Banking UTR reference generated and audit locked.',
            completed: true,
            timestamp: '2026-09-13T10:42:00Z',
            actor: 'Banking Gateway Adapter',
            details: { utrRef: 'UTR-20260913-9988112233', status: 'SETTLED_COMPLETED' },
            cryptographicHash: '0x77665...4433'
          }
        ]
      });
      setLoading(false);
    }, 500);
  }, [identifier]);

  if (loading) {
    return (
      <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm max-w-5xl mx-auto my-8">
        <RefreshCw className="w-8 h-8 text-[#0d6e48] animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading 14-step cryptographic traceability timeline...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm max-w-5xl mx-auto my-8">
        <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold font-serif-header text-slate-900">Traceability Record Not Found</h3>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-[#0d6e48] hover:bg-[#095235] text-white text-xs font-bold rounded-xl shadow-md transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0d6e48]" />
                <h1 className="text-xl font-bold font-serif-header text-slate-900">End-to-End Farm-Gate to Payment Traceability</h1>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5 font-bold">Procurement ID: {data.procurementReferenceId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#e6f7ef] border border-[#b2e8cf] px-3.5 py-1.5 rounded-full text-xs text-[#0d6e48] font-bold">
            <CheckCheck className="w-4 h-4" /> 100% Fully Audited Journey (14 / 14 Steps)
          </div>
        </div>

        {/* Summary Info Header */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Farmer Identity</p>
            <p className="font-bold text-slate-900">{data.farmerName}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Procurement Mandi</p>
            <p className="font-bold text-slate-900">{data.centreName}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Crop Commodity</p>
            <p className="font-bold text-slate-900">{data.cropName}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Batch Cryptographic Fingerprint</p>
            <p className="font-mono text-[11px] text-[#0d6e48] font-bold truncate">{data.batchFingerprint}</p>
          </div>
        </div>
      </div>

      {/* 14-Step Vertical Timeline */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Hash className="w-4 h-4 text-[#0d6e48]" /> Complete 14-Step Event Ledger &amp; Audit Trail
        </h2>

        <div className="relative border-l-2 border-[#b2e8cf] ml-4 space-y-6 pl-6">
          {data.steps.map((step) => {
            const isExpanded = expandedStep === step.stepIndex;

            return (
              <div key={step.stepIndex} className="relative group">
                {/* Timeline Bullet Dot */}
                <div className="absolute -left-[31px] top-1 w-5 h-5 rounded-full bg-[#0d6e48] text-white flex items-center justify-center font-bold text-[10px] ring-4 ring-white shadow-md">
                  ✓
                </div>

                <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 hover:border-[#b2e8cf] transition space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold font-serif-header text-slate-900">{step.title}</h3>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-slate-500">
                      {new Date(step.timestamp).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium">{step.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px] font-medium">
                    <span className="text-slate-500">Actor: <strong className="text-slate-900">{step.actor}</strong></span>
                    <button
                      onClick={() => setExpandedStep(isExpanded ? null : step.stepIndex)}
                      className="text-[#0d6e48] hover:text-[#095235] font-bold flex items-center gap-1"
                    >
                      {isExpanded ? 'Hide Metadata' : 'View Audit Metadata'}
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Expanded Metadata */}
                  {isExpanded && (
                    <div className="mt-3 p-3.5 bg-white rounded-xl border border-slate-200 text-xs space-y-2 font-mono shadow-sm">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Structured Audit Metadata</p>
                      <pre className="text-[#0d6e48] font-bold text-[11px] overflow-x-auto p-3 bg-slate-50 rounded-xl border border-slate-200">
                        {JSON.stringify(step.details, null, 2)}
                      </pre>
                      <p className="text-[10px] text-slate-500">
                        Cryptographic Hash: <span className="text-slate-900 font-bold">{step.cryptographicHash}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
