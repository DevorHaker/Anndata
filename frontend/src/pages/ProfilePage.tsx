import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import {
  Phone,
  Shield,
  Calendar,
  LogOut,
  CheckCircle2,
  Building2,
  Inbox,
  Sparkles,
  WifiOff,
  CreditCard,
  Layers,
  ArrowRight
} from 'lucide-react';
import { getUserDisplayInfo } from '../utils/userDisplay';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const displayInfo = getUserDisplayInfo(user);
  const isManager = user.role === 'CENTRE_MANAGER' || user.role === 'PROCUREMENT_OFFICER';
  const isAdmin = user.role === 'SYSTEM_ADMIN' || user.role === 'ADMIN' || user.role === 'DISTRICT_ADMIN';

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'SYSTEM_ADMIN':
      case 'ADMIN':
        return 'error';
      case 'CENTRE_MANAGER':
      case 'DISTRICT_ADMIN':
        return 'warning';
      case 'PROCUREMENT_OFFICER':
        return 'info';
      default:
        return 'success';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif-header text-slate-900 tracking-tight">
            {isManager ? 'Centre Manager Control Profile' : 'User Account Profile'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {isManager
              ? 'Manage your Mandi station credentials, operational jurisdiction, and quick command shortcuts.'
              : 'Manage your personal identity, system credentials, and active permissions'}
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={logout}>
          <LogOut className="w-4 h-4 mr-2" />
          <span>Sign Out</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: User / Manager ID Card */}
        <Card className="md:col-span-1 p-6 text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#0d6e48] text-white flex items-center justify-center font-bold text-2xl border-4 border-emerald-100 shadow-md">
            {displayInfo.initial}
          </div>
          <div>
            <h2 className="text-lg font-bold font-serif-header text-slate-900">
              {displayInfo.displayName}
            </h2>
            <div className="mt-2 flex items-center justify-center gap-2">
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {displayInfo.roleBadgeLabel}
              </Badge>
              <Badge variant={user.status === 'ACTIVE' ? 'success' : 'error'}>
                {user.status}
              </Badge>
            </div>
          </div>

          {displayInfo.idValue && (
            <div className="p-3 bg.emerald-50 bg-[#e6f7ef] border border-[#b2e8cf] rounded-2xl text-xs space-y-1">
              <div className="text-[#0d6e48] font-bold uppercase tracking-wider">{displayInfo.idLabel}</div>
              <div className="font-mono font-bold text-slate-900 text-sm">{displayInfo.idValue}</div>
            </div>
          )}

          {isManager && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <Building2 className="w-4 h-4 text-[#0d6e48]" />
                Assigned Mandi Centre
              </div>
              <p className="text-slate-700 font-semibold leading-snug">
                APMC Karnal Central Procurement Hub
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Code: PC-KARNAL-001 • District: Karnal
              </p>
            </div>
          )}
        </Card>

        {/* Right Column: Manager Operational Metrics & Quick Actions */}
        <div className="md:col-span-2 space-y-6">
          {/* Manager Specific Operational Banner */}
          {isManager && (
            <Card className="p-6 bg-gradient-to-br from-[#063b26] via-[#0d6e48] to-slate-900 text-white border-none shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-700/60 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-sm font-serif-header uppercase tracking-wider text-emerald-200">
                    Mandi Operational Command Dashboard
                  </span>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-mono font-bold rounded-full">
                  Live Station Active
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-300 block">Pending Requests</span>
                  <span className="text-lg font-mono font-bold text-amber-300">12 Pending</span>
                </div>
                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-300 block">Vehicles in Queue</span>
                  <span className="text-lg font-mono font-bold text-white">45 Active</span>
                </div>
                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-300 block">Today's Tonnage</span>
                  <span className="text-lg font-mono font-bold text-emerald-300">340 MT</span>
                </div>
                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-300 block">MSP Approved</span>
                  <span className="text-lg font-mono font-bold text-amber-300">₹78.50 L</span>
                </div>
              </div>

              {/* Quick Actions Grid for Centre Manager */}
              <div className="pt-2">
                <p className="text-xs font-bold text-emerald-200 uppercase tracking-wider mb-2.5">
                  Manager Quick Controls
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => navigate('/centre')}
                    className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl text-left transition-all border border-white/10 text-xs font-bold text-white group"
                  >
                    <span className="flex items-center gap-2">
                      <Inbox className="w-4 h-4 text-amber-400" /> Farmer Requests Inbox
                    </span>
                    <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/centre/queue')}
                    className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl text-left transition-all border border-white/10 text-xs font-bold text-white group"
                  >
                    <span className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-400" /> Mandi Gate Queue Control
                    </span>
                    <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/intelligence/staff')}
                    className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl text-left transition-all border border-white/10 text-xs font-bold text-white group"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300" /> Operations & AI Control
                    </span>
                    <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/admin/payments')}
                    className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl text-left transition-all border border-white/10 text-xs font-bold text-white group"
                  >
                    <span className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-300" /> DBT Payment Disbursements
                    </span>
                    <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* User Account Credentials & Metadata */}
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                System Account Credentials & Metadata
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <dt className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Registered Mobile
                  </dt>
                  <dd className="font-bold text-slate-900">{user.mobileNumber}</dd>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <dt className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    Assigned System Role
                  </dt>
                  <dd className="font-bold text-slate-900">{user.role}</dd>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <dt className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Account Registration Date
                  </dt>
                  <dd className="font-bold text-slate-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </dd>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <dt className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0d6e48]" />
                    Security Verification
                  </dt>
                  <dd className="font-bold text-[#0d6e48]">Verified &amp; Authorized</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Granted Operational Permissions ({user.permissions?.length || 0})
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.permissions && user.permissions.length > 0 ? (
                  user.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="px-2.5 py-1 bg-slate-100 text-slate-700 font-mono text-xs rounded-lg border border-slate-200"
                    >
                      {perm}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">No custom module permissions assigned.</span>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
