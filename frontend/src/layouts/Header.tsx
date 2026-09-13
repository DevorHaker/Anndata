import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Activity, User as UserIcon, LogOut } from 'lucide-react';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { AssistedModeToggle } from '../components/AssistedModeToggle';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800 px-6 py-3 text-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 bg-emerald-600/20 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
              SmartProcure
              <span className="text-xs font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-medium">
                SIH 2026 Phase 12 Active
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Farm Gate to Multilingual Payment Platform
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Farmer Accessibility & Language Selector */}
        <AssistedModeToggle />

        <Link to="/health" className="hidden lg:flex items-center gap-2">
          <Badge variant="success" size="md">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            Backend Ready
          </Badge>
        </Link>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
            <Link
              to="/profile"
              className="flex items-center gap-2 py-1 px-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                {user.firstName ? user.firstName[0].toUpperCase() : 'U'}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-semibold text-slate-200">
                  {user.firstName ? `${user.firstName} ${user.lastName}` : user.mobileNumber}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono font-medium">{user.role}</div>
              </div>
            </Link>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-sm transition-all"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
};
