import React, { useState } from 'react';
import { procurementServiceUI, ProcurementRecordUI, WeighmentRecordUI, QualityInspectionUI } from '../../services/procurement.service';
import { WeighmentWidget } from './WeighmentWidget';
import { QualityInspectionForm } from './QualityInspectionForm';
import { ProcurementValueCard } from './ProcurementValueCard';

interface ProcurementWorkflowStepperProps {
  initialBookingId?: string;
  centreId?: string;
  onComplete?: (record: ProcurementRecordUI) => void;
}

export const ProcurementWorkflowStepper: React.FC<ProcurementWorkflowStepperProps> = ({
  initialBookingId = '',
  centreId = '33333333-3333-4000-8000-333333333333',
  onComplete
}) => {
  const [bookingId, setBookingId] = useState(initialBookingId);
  const [procurement, setProcurement] = useState<ProcurementRecordUI | null>(null);
  const [weighment, setWeighment] = useState<WeighmentRecordUI | null>(null);
  const [quality, setQuality] = useState<QualityInspectionUI | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Start Session
  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId.trim()) {
      setError('Please enter or select a valid booking reference ID');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const record = await procurementServiceUI.startSession(bookingId.trim(), centreId);
      setProcurement(record);
      setCurrentStep(2);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm Produce Intake
  const handleConfirmIntake = async () => {
    if (!procurement) return;
    setError(null);
    setLoading(true);
    try {
      const record = await procurementServiceUI.confirmIntake(procurement.id);
      setProcurement(record);
      setCurrentStep(3);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to confirm intake');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Weighment Recorded
  const handleRecordWeighment = async (data: {
    equipmentId: string;
    grossWeight: number;
    tareWeight: number;
    unit: string;
  }) => {
    if (!procurement) return;
    const res = await procurementServiceUI.recordWeighment({
      procurementId: procurement.id,
      ...data
    });
    setProcurement(res.procurement);
    setWeighment(res.weighment);
    setCurrentStep(4);
  };

  // Step 4: Quality Inspection Submitted
  const handleRecordQuality = async (data: {
    moisturePercentage: number;
    foreignMatterPercentage: number;
    damagedGrainsPercentage: number;
    brokenGrainsPercentage: number;
  }) => {
    if (!procurement) return;
    const res = await procurementServiceUI.performQualityInspection({
      procurementId: procurement.id,
      ...data
    });
    setProcurement(res.procurement);
    setQuality(res.quality);
    setCurrentStep(5);
  };

  // Step 5 -> Step 6: Calculate MSP Value
  const handleCalculateValue = async () => {
    if (!procurement) return;
    setError(null);
    setLoading(true);
    try {
      const record = await procurementServiceUI.calculateValue(procurement.id);
      setProcurement(record);
      setCurrentStep(6);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to calculate value');
    } finally {
      setLoading(false);
    }
  };

  // Step 6 -> Step 7: Finalize Procurement Session
  const handleFinalize = async () => {
    if (!procurement) return;
    setError(null);
    setLoading(true);
    try {
      const record = await procurementServiceUI.finalizeProcurement(procurement.id);
      setProcurement(record);
      setCurrentStep(7);
      if (onComplete) onComplete(record);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to finalize procurement');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: 'Session Start' },
    { num: 2, label: 'Intake Receipt' },
    { num: 3, label: 'Weighbridge' },
    { num: 4, label: 'Quality Check' },
    { num: 5, label: 'Inspection Review' },
    { num: 6, label: 'MSP Valuation' },
    { num: 7, label: 'Finalization' }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur font-sans">
      {/* Header Stepper Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>🚜</span> Procurement Operations Workflow Stepper
          </h2>
          {procurement && (
            <span className="text-xs font-mono px-3 py-1 bg-slate-800 text-emerald-400 border border-slate-700 rounded-full font-semibold">
              REF: {procurement.procurementReferenceId}
            </span>
          )}
        </div>

        {/* Stepper Dots & Line */}
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-800 -z-0" />
          {steps.map((s) => {
            const isPassed = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div key={s.num} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all ${
                    isPassed
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : isCurrent
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isPassed ? '✓' : s.num}
                </div>
                <span className={`text-[11px] font-medium mt-1 hidden sm:block ${isCurrent ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* STEP 1: Session Start */}
      {currentStep === 1 && (
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
          <h3 className="text-base font-bold text-slate-200 mb-2">Step 1: Initiate Procurement Session</h3>
          <p className="text-xs text-slate-400 mb-4">
            Select or enter checked-in farmer booking reference ID to initiate state machine tracking.
          </p>

          <form onSubmit={handleStartSession} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Booking Reference ID / Token Code
              </label>
              <input
                type="text"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="e.g. bk-p9-test-001 or BK-2026-001"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
            >
              {loading ? 'Initiating Session...' : 'Start Session'}
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: Intake Confirmation */}
      {currentStep === 2 && procurement && (
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-slate-200">Step 2: Produce Intake Receipt Confirmation</h3>
          <p className="text-xs text-slate-400">
            Confirm physical produce arrival at the procurement yard entrance.
          </p>

          <div className="grid grid-cols-2 gap-4 bg-slate-900 p-4 rounded-lg border border-slate-800 text-sm">
            <div>
              <span className="text-xs text-slate-400 block">Farmer ID</span>
              <span className="font-mono text-slate-200 font-semibold">{procurement.farmerId}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Declared Produce Weight</span>
              <span className="font-mono text-emerald-400 font-semibold">{procurement.declaredQuantityKg} KG</span>
            </div>
          </div>

          <button
            onClick={handleConfirmIntake}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            {loading ? 'Confirming Intake...' : 'Confirm Produce Intake & Proceed to Weighbridge'}
          </button>
        </div>
      )}

      {/* STEP 3: Weighbridge Operations */}
      {currentStep === 3 && procurement && (
        <WeighmentWidget
          procurementId={procurement.id}
          defaultGrossKg={procurement.declaredQuantityKg + 100}
          defaultTareKg={100}
          onSubmitWeighment={handleRecordWeighment}
        />
      )}

      {/* STEP 4: Quality Inspection */}
      {currentStep === 4 && procurement && (
        <QualityInspectionForm
          procurementId={procurement.id}
          measuredNetKg={procurement.measuredNetWeightKg || 1950}
          onSubmitQuality={handleRecordQuality}
        />
      )}

      {/* STEP 5: Quality Review */}
      {currentStep === 5 && procurement && (
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-slate-200">Step 5: Quality Inspection Decision Review</h3>
          <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Quality Decision:</span>
              <span className="font-bold text-cyan-400">{procurement.qualityStatus} ({procurement.qualityGrade})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Measured Weight:</span>
              <span className="font-mono text-slate-200">{procurement.measuredNetWeightKg} KG</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Quality Deduction:</span>
              <span className="font-mono text-amber-400">-{procurement.qualityDeductionKg} KG</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-2 font-bold">
              <span className="text-slate-200">Final Accepted Weight:</span>
              <span className="font-mono text-emerald-400">{procurement.finalAcceptedWeightKg} KG</span>
            </div>
          </div>

          <button
            onClick={handleCalculateValue}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            {loading ? 'Calculating MSP Rates...' : 'Calculate MSP Rate & Financial Payable Amount'}
          </button>
        </div>
      )}

      {/* STEP 6 & 7: Valuation & Finalization */}
      {(currentStep === 6 || currentStep === 7) && procurement && (
        <ProcurementValueCard
          procurement={procurement}
          onFinalize={currentStep === 6 ? handleFinalize : undefined}
          submitting={loading}
        />
      )}
    </div>
  );
};
