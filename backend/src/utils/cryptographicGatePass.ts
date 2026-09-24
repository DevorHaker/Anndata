import crypto from 'crypto';

export interface CryptographicGatePass {
  gatePassId: string;
  bookingReferenceId: string;
  farmerId: string;
  centreId: string;
  cropTypeId: string;
  declaredWeightKg: number;
  vehicleNumber?: string;
  vehicleType?: string;
  scheduledDate: string;
  slotWindow: string;
  floatingTransitBufferMinutes: number;
  qrPayload: string;
  hmacSignature: string;
  issuedAt: string;
}

const GATE_PASS_SECRET = process.env.GATE_PASS_SECRET || 'smartprocure_sih_2026_crypto_secret';

export const generateCryptographicGatePass = (params: {
  bookingId: string;
  bookingReferenceId: string;
  farmerId: string;
  centreId: string;
  cropTypeId: string;
  declaredWeightKg: number;
  vehicleNumber?: string;
  vehicleType?: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  estimatedServiceMinutes: number;
}): CryptographicGatePass => {
  const gatePassId = `GP-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  
  // Calculate 15% Floating Buffer to absorb transit delays
  const floatingTransitBufferMinutes = Math.max(5, Math.round(params.estimatedServiceMinutes * 0.15));

  const payloadToSign = `${gatePassId}:${params.bookingReferenceId}:${params.farmerId}:${params.centreId}:${params.declaredWeightKg}:${params.scheduledDate}:${params.startTime}`;

  const hmacSignature = crypto
    .createHmac('sha256', GATE_PASS_SECRET)
    .update(payloadToSign)
    .digest('hex');

  const qrData = {
    gatePassId,
    bookingRef: params.bookingReferenceId,
    farmerId: params.farmerId,
    centreId: params.centreId,
    weightKg: params.declaredWeightKg,
    vehicleNo: params.vehicleNumber || 'HR-05-AB-1234',
    date: params.scheduledDate,
    time: `${params.startTime} - ${params.endTime}`,
    transitBuffer: `${floatingTransitBufferMinutes} mins (15% floating buffer)`,
    sig: hmacSignature.substring(0, 16)
  };

  return {
    gatePassId,
    bookingReferenceId: params.bookingReferenceId,
    farmerId: params.farmerId,
    centreId: params.centreId,
    cropTypeId: params.cropTypeId,
    declaredWeightKg: params.declaredWeightKg,
    vehicleNumber: params.vehicleNumber || 'HR-05-AB-1234',
    vehicleType: params.vehicleType || 'Tractor-Trolley',
    scheduledDate: params.scheduledDate,
    slotWindow: `${params.startTime} - ${params.endTime}`,
    floatingTransitBufferMinutes,
    qrPayload: JSON.stringify(qrData),
    hmacSignature,
    issuedAt: new Date().toISOString()
  };
};
