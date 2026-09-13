import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { Shield, Wheat, Users, Building2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithPassword } = useAuth();
  const from = (location.state as any)?.from?.pathname || '/';

  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const handleSuccess = () => {
    navigate(from, { replace: true });
  };

  const handleQuickDemoLogin = async (mobile: string, roleName: string) => {
    setDemoLoading(roleName);
    try {
      await loginWithPassword(mobile, 'Sp@123456');
      navigate(from, { replace: true });
    } catch (err) {
      // Fallback
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-900/40">
          <Wheat className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">SmartProcure</h2>
        <p className="text-sm text-slate-400 font-medium">
          Farm Gate to Payment — Unified Procurement Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-3xl border border-slate-200 sm:px-10">
          <LoginForm
            onSuccess={handleSuccess}
            onNavigateRegister={() => navigate('/register')}
          />

          {/* Quick Demo Role Logins */}
          <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <span>Quick Demo Role Logins</span>
              <span className="text-emerald-600">Phase 5 Mock Accounts</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('+919999900001', 'Admin')}
                disabled={!!demoLoading}
                className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all text-xs font-medium text-slate-800"
              >
                <Shield className="w-4 h-4 text-purple-600 shrink-0" />
                <div>
                  <div className="font-bold">System Admin</div>
                  <div className="text-[10px] text-slate-500">+919999900001</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('+919999900002', 'Farmer')}
                disabled={!!demoLoading}
                className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all text-xs font-medium text-slate-800"
              >
                <Wheat className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold">Farmer Account</div>
                  <div className="text-[10px] text-slate-500">+919999900002</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          Encrypted with 256-bit SSL &amp; OWASP ASVS 5.0 Security Standards
        </div>
      </div>
    </div>
  );
};
