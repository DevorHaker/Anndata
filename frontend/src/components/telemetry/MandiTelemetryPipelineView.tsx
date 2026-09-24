import React, { useState } from 'react';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Input } from '../Input';
import {
  Truck,
  QrCode,
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Scale,
  FlaskConical,
  Package,
  FileCheck,
  Send,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Receipt,
  DollarSign
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export interface TelemetrySessionState {
  sessionId: string;
  bookingId: string;
  bookingRef: string;
  farmerId: string;
  farmerName: string;
  farmerMobile: string;
  cropTypeId: string;
  registeredVehicleNumber: string;
  anprLicensePlate: string;
  gateCheckInStatus: 'PASSED' | 'REROUTED_HELPDESK';
  helpdeskReason?: string;
  grossWeightKg?: number;
  telemetryBusAddress?: string;
  faqStatus?: 'PASSED' | 'REDIRECTED_DRYING_BAY';
  faqMetrics?: {
    moistureContentPct: number;
    foreignMatterPct: number;
    damagedGrainsPct: number;
  };
  dryingBayReason?: string;
  holdingBayNumber?: string;
  gunnyStagingArea?: string;
  tareWeightKg?: number;
  netWeightKg?: number;
  jForm?: {
    jFormId: string;
    grossWeightKg: number;
    tareWeightKg: number;
    netWeightKg: number;
    ratePerQuintalRs: number;
    totalAmountPayableRs: number;
    cryptographicLedgerHash: string;
    generatedAt: string;
  };
  dbtDisbursement?: {
    disbursementId: string;
    pfmsTxnId: string;
    farmerAadharBankRef: string;
    amountDisbursedRs: number;
    status: 'SUCCESS' | 'PENDING';
  };
  currentStep: string;
}

export const MandiTelemetryPipelineView: React.FC = () => {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<TelemetrySessionState | null>(null);

  // Form Inputs for Simulation
  const [vehicleNo, setVehicleNo] = useState('HR-05-AB-1234');
  const [anprPlate, setAnprPlate] = useState('HR-05-AB-1234');
  const [qrToken, setQrToken] = useState('GP-2026-9921-TOKEN');
  const [grossKg, setGrossKg] = useState(14500);
  const [moisture, setMoisture] = useState(14.2);
  const [foreignMatter, setForeignMatter] = useState(1.1);
  const [tareKg, setTareKg] = useState(4200);

  const pipelineSteps = [
    { title: 'Vehicle Arrives', desc: 'Handheld Gate Entry', icon: Truck },
    { title: 'QR Scan & ANPR Match', desc: 'License Plate Cross-Check', icon: Camera },
    { title: 'RS-232 Gross Weighing', desc: 'Anti-Tamper Modbus Telemetry', icon: Scale },
    { title: 'FAQ Quality Grading', desc: 'Moisture & Impurity Test', icon: FlaskConical },
    { title: 'Mandi Yard Discharge', desc: 'Holding Bay & Staging', icon: Package },
    { title: 'Tare Weight Logging', desc: 'Empty Vehicle Re-scan', icon: RotateCcw },
    { title: 'Net Weight Calculation', desc: 'Gross - Tare Weight', icon: FileCheck },
    { title: 'Digital J-Form Ledger', desc: 'Immutable Receipt', icon: Receipt },
    { title: 'PFMS DBT Disbursement', desc: 'Direct Bank Credit', icon: DollarSign }
  ];

  // 1. Gate Check-In & ANPR Match
  const handleStartGateCheckin = async (forceMismatch = false) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.post<any>('/mandi-telemetry/gate-checkin', {
        bookingId: 'BK-DEMO-991',
        bookingRef: 'BK-2026-HR-8821',
        scannedQrToken: qrToken,
        anprLicensePlate: forceMismatch ? 'HR-99-ZZ-0000' : anprPlate,
        registeredVehicleNumber: vehicleNo
      });
      setSession(resp.data);
      if (resp.data.gateCheckInStatus === 'PASSED') {
        setActiveStepIndex(2);
      } else {
        setActiveStepIndex(1);
      }
    } catch (err: any) {
      setError(err.message || 'Gate check-in failed');
    } finally {
      setLoading(false);
    }
  };

  // 2. Gross Weight Capture
  const handleCaptureGross = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.post<any>('/mandi-telemetry/gross-weighing', {
        telemetrySessionId: session.sessionId,
        modbusSerialPort: 'RS-232-COM1 (Modbus Anti-Tamper)',
        grossWeightKg: Number(grossKg)
      });
      setSession(resp.data);
      setActiveStepIndex(3);
    } catch (err: any) {
      setError(err.message || 'Gross weighing failed');
    } finally {
      setLoading(false);
    }
  };

  // 3. FAQ Quality Assessment
  const handleFaqGrading = async (forceFail = false) => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.post<any>('/mandi-telemetry/faq-grading', {
        telemetrySessionId: session.sessionId,
        moistureContentPct: forceFail ? 19.5 : Number(moisture),
        foreignMatterPct: forceFail ? 3.8 : Number(foreignMatter),
        damagedGrainsPct: 1.0
      });
      setSession(resp.data);
      if (resp.data.faqStatus === 'PASSED') {
        setActiveStepIndex(5);
      } else {
        setActiveStepIndex(3);
      }
    } catch (err: any) {
      setError(err.message || 'FAQ Quality assessment failed');
    } finally {
      setLoading(false);
    }
  };

  // 4. Tare Weight & Complete Settlement
  const handleCaptureTare = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.post<any>('/mandi-telemetry/tare-weighing', {
        telemetrySessionId: session.sessionId,
        modbusSerialPort: 'RS-232-COM1 (Modbus Anti-Tamper)',
        tareWeightKg: Number(tareKg)
      });
      setSession(resp.data);
      setActiveStepIndex(8);
    } catch (err: any) {
      setError(err.message || 'Tare weight logging failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-emerald-800/40">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Live Mandi Operational Telemetry</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-header text-white">
              Gate Security, RS-232 Weighing, FAQ & PFMS DBT Pipeline
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl font-light">
              End-to-end automated mandi workflow: ANPR camera license plate cross-matching, Modbus anti-tamper weighbridge telemetry, quality grading, digital J-Form, and direct DBT disbursement.
            </p>
          </div>

          <Button
            onClick={() => handleStartGateCheckin(false)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-lg shrink-0 flex items-center gap-2"
          >
            <Truck className="w-4 h-4" />
            Simulate New Vehicle Arrival
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stepper Pipeline Visual Bar */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-700" />
          Pipeline Stage Workflow Progress
        </h3>

        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
          {pipelineSteps.map((s, idx) => {
            const Icon = s.icon;
            const isCurrent = idx === activeStepIndex;
            const isPassed = idx < activeStepIndex;
            return (
              <div
                key={s.title}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between ${
                  isCurrent
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105'
                    : isPassed
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}
              >
                <div className="text-[10px] font-mono font-bold">0{idx + 1}</div>
                <Icon className="w-5 h-5 my-1" />
                <div className="text-[11px] font-bold leading-tight line-clamp-1">{s.title}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Pipeline Decision Controls & Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive Simulation Panel */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="p-6 space-y-5">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Telemetry Hardware Controls</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                ONLINE
              </span>
            </h3>

            {/* Inputs Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Registered Vehicle No."
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
              />
              <Input
                label="ANPR Scanned License Plate"
                value={anprPlate}
                onChange={(e) => setAnprPlate(e.target.value)}
              />
              <Input
                label="Scanned QR Gate-Pass"
                value={qrToken}
                onChange={(e) => setQrToken(e.target.value)}
              />
              <Input
                label="RS-232 Gross Weight (kg)"
                type="number"
                value={grossKg}
                onChange={(e) => setGrossKg(Number(e.target.value))}
              />
              <Input
                label="Moisture Content (%)"
                type="number"
                step="0.1"
                value={moisture}
                onChange={(e) => setMoisture(Number(e.target.value))}
              />
              <Input
                label="Tare Weight (kg)"
                type="number"
                value={tareKg}
                onChange={(e) => setTareKg(Number(e.target.value))}
              />
            </div>

            {/* Action Triggers */}
            <div className="space-y-3 pt-2">
              <div className="flex gap-2">
                <Button
                  onClick={() => handleStartGateCheckin(false)}
                  disabled={loading}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 rounded-xl"
                >
                  Step 1: Scan Gate-Pass & ANPR Match
                </Button>
                <Button
                  onClick={() => handleStartGateCheckin(true)}
                  disabled={loading}
                  variant="outline"
                  className="text-rose-700 border-rose-300 hover:bg-rose-50 text-xs font-bold py-2.5 rounded-xl"
                >
                  Simulate Mismatch Reroute
                </Button>
              </div>

              {session && session.gateCheckInStatus === 'PASSED' && (
                <Button
                  onClick={handleCaptureGross}
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2"
                >
                  <Scale className="w-4 h-4 text-emerald-400" />
                  Step 2: Capture RS-232 Gross Weight ({grossKg} kg)
                </Button>
              )}

              {session && session.grossWeightKg && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleFaqGrading(false)}
                    disabled={loading}
                    className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 rounded-xl"
                  >
                    Step 3: Grade FAQ (Moisture {moisture}%)
                  </Button>
                  <Button
                    onClick={() => handleFaqGrading(true)}
                    disabled={loading}
                    variant="outline"
                    className="text-amber-700 border-amber-300 hover:bg-amber-50 text-xs font-bold py-2.5 rounded-xl"
                  >
                    Simulate Drying Bay Redirection
                  </Button>
                </div>
              )}

              {session && session.faqStatus === 'PASSED' && (
                <Button
                  onClick={handleCaptureTare}
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  <FileCheck className="w-4 h-4" />
                  Step 4: Log Tare Weight & Trigger PFMS DBT Settlement
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Live Session Telemetry & Settlement Receipt */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="p-6 space-y-5">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Live Pipeline Session State</span>
              {session ? (
                <Badge variant={session.currentStep === 'COMPLETED' ? 'success' : 'info'}>
                  {session.currentStep}
                </Badge>
              ) : (
                <span className="text-xs text-slate-400 font-medium">No Session Active</span>
              )}
            </h3>

            {session ? (
              <div className="space-y-4">
                {/* Gate Check-In & ANPR Details */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center font-bold text-slate-800">
                    <span>ANPR & Gate Security Scan</span>
                    {session.gateCheckInStatus === 'PASSED' ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
                      </span>
                    ) : (
                      <span className="text-rose-700 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> REROUTED HELPDESK
                      </span>
                    )}
                  </div>
                  <div className="text-slate-600">
                    <div>Scanned Plate: <span className="font-mono font-bold text-slate-900">{session.anprLicensePlate}</span></div>
                    <div>Registered Vehicle: <span className="font-mono font-bold text-slate-900">{session.registeredVehicleNumber}</span></div>
                    {session.helpdeskReason && (
                      <div className="text-rose-600 font-semibold mt-1">Reason: {session.helpdeskReason}</div>
                    )}
                  </div>
                </div>

                {/* Gross & Tare Weight Results */}
                {session.grossWeightKg && (
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Gross Weight</div>
                      <div className="text-lg font-bold text-slate-900">{session.grossWeightKg} kg</div>
                    </div>
                    <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Tare Weight</div>
                      <div className="text-lg font-bold text-slate-900">{session.tareWeightKg || 0} kg</div>
                    </div>
                    <div className="bg-emerald-100 p-3 rounded-xl border border-emerald-300">
                      <div className="text-[10px] font-bold text-emerald-800 uppercase">Net Delivered</div>
                      <div className="text-lg font-bold text-emerald-950">{session.netWeightKg || 0} kg</div>
                    </div>
                  </div>
                )}

                {/* FAQ Quality Status */}
                {session.faqMetrics && (
                  <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-amber-900">
                      <span>FAQ Quality Inspection</span>
                      {session.faqStatus === 'PASSED' ? (
                        <span className="text-emerald-700">✓ PASSED</span>
                      ) : (
                        <span className="text-rose-700">REDIRECTED TO DRYING BAY</span>
                      )}
                    </div>
                    <div className="text-slate-600">
                      <div>Moisture: <span className="font-bold">{session.faqMetrics.moistureContentPct}%</span> (Max: 17.0%)</div>
                      <div>Foreign Matter: <span className="font-bold">{session.faqMetrics.foreignMatterPct}%</span> (Max: 2.0%)</div>
                      {session.dryingBayReason && (
                        <div className="text-rose-700 font-semibold mt-1">{session.dryingBayReason}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Digital J-Form Receipt */}
                {session.jForm && (
                  <div className="bg-white p-4 rounded-2xl border border-emerald-300 shadow-md space-y-2 text-xs">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="font-bold font-serif-header text-slate-900 text-sm flex items-center gap-1.5">
                        <Receipt className="w-4 h-4 text-emerald-700" />
                        Digital J-Form #{session.jForm.jFormId}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-md">
                        IMMUTABLE LEDGER
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      <div>Farmer: <span className="font-bold text-slate-900">{session.farmerName}</span></div>
                      <div>MSP Rate: <span className="font-bold text-slate-900">₹{session.jForm.ratePerQuintalRs}/q</span></div>
                      <div>Net Weight: <span className="font-bold text-slate-900">{session.jForm.netWeightKg} kg</span></div>
                      <div>Total Amount: <span className="font-extrabold text-emerald-700 text-sm">₹{session.jForm.totalAmountPayableRs.toLocaleString()}</span></div>
                    </div>

                    <div className="text-[10px] font-mono text-slate-400 truncate pt-1 border-t border-slate-100">
                      Hash: {session.jForm.cryptographicLedgerHash}
                    </div>
                  </div>
                )}

                {/* PFMS DBT Disbursement Result */}
                {session.dbtDisbursement && (
                  <div className="bg-emerald-950 p-4 rounded-2xl text-white space-y-2 text-xs shadow-lg">
                    <div className="flex justify-between items-center text-emerald-400 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Send className="w-4 h-4 text-emerald-400" />
                        PFMS DBT Webhook Disbursement
                      </span>
                      <span>SUCCESS</span>
                    </div>
                    <div className="text-slate-300 space-y-1">
                      <div>Disbursed Amount: <span className="font-bold text-white text-sm">₹{session.dbtDisbursement.amountDisbursedRs.toLocaleString()}</span></div>
                      <div>PFMS Txn Ref: <span className="font-mono text-emerald-300">{session.dbtDisbursement.pfmsTxnId}</span></div>
                      <div>Aadhaar Bank A/c: <span className="font-mono text-slate-200">{session.dbtDisbursement.farmerAadharBankRef}</span></div>
                      <div className="text-emerald-300 text-[11px] font-semibold pt-1">
                        ✓ Credit SMS Alert sent to farmer {session.farmerMobile}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                Click "Simulate New Vehicle Arrival" or execute Step 1 to run the Mandi Operational Telemetry & Settlement Pipeline.
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
};
