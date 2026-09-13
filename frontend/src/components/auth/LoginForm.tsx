import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../Button';
import { Input } from '../Input';
import { OtpVerificationModal } from './OtpVerificationModal';
import { authService } from '../../services/authService';
import { Lock, Phone, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
  onNavigateRegister?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onNavigateRegister }) => {
  const { loginWithPassword, loginWithOtp } = useAuth();

  const [authMode, setAuthMode] = useState<'PASSWORD' | 'OTP'>('PASSWORD');
  const [mobileNumber, setMobileNumber] = useState<string>('9999900001'); // Demo admin default
  const [password, setPassword] = useState<string>('Sp@123456');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState<boolean>(false);

  const formatMobile = (val: string) => val.replace(/\D/g, '').slice(0, 10);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mobileNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setIsLoading(true);
    try {
      await loginWithPassword(`+91${mobileNumber}`, password);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mobileNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.requestOtp(`+91${mobileNumber}`);
      setIsOtpModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpSuccess = async (otp: string) => {
    await loginWithOtp(`+91${mobileNumber}`, otp);
    onSuccess?.();
  };

  return (
    <div className="w-full space-y-6">
      {/* Auth Method Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={() => {
            setAuthMode('PASSWORD');
            setError(null);
          }}
          className={`flex-1 py-2 text-xs md:text-sm font-medium rounded-lg transition-all ${
            authMode === 'PASSWORD'
              ? 'bg-white text-emerald-700 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Password Login
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMode('OTP');
            setError(null);
          }}
          className={`flex-1 py-2 text-xs md:text-sm font-medium rounded-lg transition-all ${
            authMode === 'OTP'
              ? 'bg-white text-emerald-700 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          OTP Verification
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {authMode === 'PASSWORD' ? (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Mobile Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
                <span className="ml-2 text-xs font-medium text-slate-500 border-r border-slate-300 pr-2">+91</span>
              </div>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(formatMobile(e.target.value))}
                placeholder="9876543210"
                className="w-full pl-16 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setAuthMode('OTP')}
                className="text-xs text-emerald-600 font-medium hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            isLoading={isLoading}
          >
            <span>Sign In to Platform</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>
      ) : (
        <form onSubmit={handleOtpRequestSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Registered Mobile Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
                <span className="ml-2 text-xs font-medium text-slate-500 border-r border-slate-300 pr-2">+91</span>
              </div>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(formatMobile(e.target.value))}
                placeholder="9876543210"
                className="w-full pl-16 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                required
              />
            </div>
            <p className="text-xs text-slate-500">
              We will send a 6-digit one-time code to verify your mobile identity.
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            isLoading={isLoading}
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            <span>Send One-Time Password</span>
          </Button>
        </form>
      )}

      {onNavigateRegister && (
        <div className="pt-4 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-600">
            Are you a farmer without an account?{' '}
            <button
              type="button"
              onClick={onNavigateRegister}
              className="text-emerald-600 font-semibold hover:underline underline-offset-2"
            >
              Register for SmartProcure
            </button>
          </p>
        </div>
      )}

      <OtpVerificationModal
        isOpen={isOtpModalOpen}
        mobileNumber={`+91${mobileNumber}`}
        onClose={() => setIsOtpModalOpen(false)}
        onVerifySuccess={handleVerifyOtpSuccess}
      />
    </div>
  );
};
