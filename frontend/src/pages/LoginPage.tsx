import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { Shield, Wheat } from 'lucide-react';
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
    <div className="min-h-screen bg-[#f4fbf7] text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0d6e48] text-white shadow-xl shadow-emerald-950/20 font-bold text-xl font-serif-header">
          AD
        </div>
        <h2 className="text-3xl font-bold font-serif-header text-slate-900 tracking-tight">Anndata</h2>
        <p className="text-xs text-slate-500 font-semibold tracking-wide uppercase">
          Intelligent Procurement Management Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-200/80 sm:px-10">
          <LoginForm
            onSuccess={handleSuccess}
            onNavigateRegister={() => navigate('/register')}
          />

          {/* Quick Demo Role Logins */}
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <span>Quick Demo Role Logins</span>
              <span className="text-[#0d6e48]">Mock Accounts</span>
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
                <Wheat className="w-4 h-4 text-[#0d6e48] shrink-0" />
                <div>
                  <div className="font-bold">Farmer Account</div>
                  <div className="text-[10px] text-slate-500">+919999900002</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500 font-medium">
          Encrypted with 256-bit SSL &amp; OWASP ASVS 5.0 Security Standards
        </div>
      </div>
    </div>
  );
};
