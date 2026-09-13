import React, { useState } from 'react';
import { QRCodeSvg } from '../common/QRCodeSvg';
import { DigitalToken, QRPayload } from '../../services/tokenQueue.service';
import { QrCode, ShieldCheck, Clock, MapPin, Calendar, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';

interface DigitalTokenCardProps {
  token: DigitalToken;
  qrPayload?: QRPayload | null;
  centreName?: string;
  scheduledDate?: string;
  startTime?: string;
}

export const DigitalTokenCard: React.FC<DigitalTokenCardProps> = ({
  token,
  qrPayload,
  centreName = 'APMC Central Procurement Hub',
  scheduledDate = 'Today',
  startTime = '09:00 AM'
}) => {
  const [copied, setCopied] = useState(false);

  const qrString = qrPayload ? JSON.stringify(qrPayload) : token.tokenCode;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(token.tokenCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = () => {
    switch (token.status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Check-In
          </span>
        );
      case 'USED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Checked In / Processed
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" /> Token Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {token.status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-w-md w-full transition-all hover:shadow-2xl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white text-center relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 opacity-10">
          <QrCode className="w-36 h-36" />
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold uppercase tracking-widest bg-emerald-800/60 px-3 py-1 rounded-full backdrop-blur-sm border border-emerald-500/30">
            Digital Token
          </span>
          {getStatusBadge()}
        </div>
        <p className="text-xs text-emerald-100 font-medium">Token Sequence Number</p>
        <div className="flex justify-center items-center gap-2 mt-1">
          <h2 className="text-4xl font-extrabold tracking-wider font-mono">{token.tokenCode}</h2>
          <button
            onClick={handleCopyCode}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Copy Token Number"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* QR Code & Information Area */}
      <div className="p-6 space-y-6">
        <div className="flex flex-col items-center justify-center space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <QRCodeSvg value={qrString} size={180} />
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>HMAC-SHA256 Signed Opaque QR (No PII)</span>
          </div>
        </div>

        {/* Schedule & Location details */}
        <div className="space-y-3 text-sm border-t border-slate-100 pt-4">
          <div className="flex items-start gap-3 text-slate-700">
            <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">{centreName}</p>
              <p className="text-xs text-slate-500">Scan at Entry Gate Security Counter</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-700">
            <Calendar className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <span className="font-medium text-slate-900">{scheduledDate}</span>
              <span className="text-xs text-slate-500 ml-2">({startTime})</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-700">
            <Clock className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="text-xs text-slate-500">
              Issued: {new Date(token.issuedAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
