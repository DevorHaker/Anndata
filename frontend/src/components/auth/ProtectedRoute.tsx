import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import { Spinner } from '../Spinner';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-slate-500 font-medium animate-pulse">
          Verifying security credentials...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role === 'ADMIN' ? 'SYSTEM_ADMIN' : user.role;
    const normalizedAllowed = allowedRoles.map((r) => (r === 'ADMIN' ? 'SYSTEM_ADMIN' : r));

    if (!normalizedAllowed.includes(userRole)) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">403 - Access Denied</h2>
          <p className="mt-2 text-sm text-slate-600 max-w-md">
            Your user role <span className="font-mono font-semibold text-rose-700">[{user.role}]</span> is not authorized to access this platform module.
          </p>
          <a
            href="/"
            className="mt-6 px-4 py-2 bg-slate-900 text-white font-medium rounded-lg text-sm hover:bg-slate-800 transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      );
    }
  }

  return <>{children}</>;
};
