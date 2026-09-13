import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '../components/auth/RegisterForm';
import { ShieldCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f4fbf7] text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0d6e48] text-white shadow-xl shadow-emerald-950/20 font-bold text-xl font-serif-header">
          AD
        </div>
        <h2 className="text-3xl font-bold font-serif-header text-slate-900 tracking-tight">Farmer Registration</h2>
        <p className="text-xs text-slate-500 font-semibold tracking-wide uppercase">
          Create your Anndata account to book procurement slots and track DBT payouts
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-200/80 sm:px-10">
          <RegisterForm
            onSuccess={handleSuccess}
            onNavigateLogin={() => navigate('/login')}
          />
        </div>

        <div className="mt-6 text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#0d6e48]" />
          <span>Verified Government Procurement Protocol (SIH 2026)</span>
        </div>
      </div>
    </div>
  );
};
