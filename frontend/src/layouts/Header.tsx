import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AssistedModeToggle } from '../components/AssistedModeToggle';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/#features' },
    { name: 'How it works', path: '/#how-it-works' },
    { name: 'Centres', path: '/centres' },
    { name: 'Innovation', path: '/intelligence' },
    { name: 'Registration', path: '/register' },
    { name: 'Demo', path: '/farmer' },
    { name: 'Help', path: '/health' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-emerald-100/80 px-4 md:px-8 py-3 text-slate-800 flex items-center justify-between shadow-sm">
      {/* Brand Section */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-[#0d6e48] rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shadow-emerald-950/20 group-hover:scale-105 transition-transform">
            AD
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 font-serif-header leading-tight flex items-center gap-2">
              Anndata
            </h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide">
              Intelligent Procurement Platform
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="hidden xl:flex items-center gap-6 text-xs font-semibold text-slate-600">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`transition-colors hover:text-[#0d6e48] ${
                isActive ? 'text-[#0d6e48] font-bold' : ''
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* Action Badges & Buttons */}
      <div className="flex items-center gap-3">
        {/* Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200/60">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Online</span>
        </div>

        {/* Language Selector */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-700 text-xs font-medium rounded-full border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <span>हिन्दी</span>
        </div>

        <AssistedModeToggle />

        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
            <Link
              to="/profile"
              className="flex items-center gap-2 py-1 px-3 bg-emerald-50 hover:bg-emerald-100/80 rounded-xl border border-emerald-200 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-[#0d6e48] text-white flex items-center justify-center font-bold text-xs">
                {user.firstName ? user.firstName[0].toUpperCase() : 'U'}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-semibold text-slate-900">
                  {user.firstName ? `${user.firstName} ${user.lastName}` : user.mobileNumber}
                </div>
                <div className="text-[10px] text-emerald-700 font-mono font-medium">{user.role}</div>
              </div>
            </Link>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/register"
              className="px-4 py-2 bg-[#e6f7ef] hover:bg-[#d1f2e2] text-[#0d6e48] font-semibold text-xs rounded-xl border border-[#b2e8cf] transition-all"
            >
              Register
            </Link>
            <Link
              to="/login"
              className="px-5 py-2 bg-[#0d6e48] hover:bg-[#095235] text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-950/10 transition-all"
            >
              Login
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
