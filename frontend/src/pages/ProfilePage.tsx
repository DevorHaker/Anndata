import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Phone, Shield, Calendar, LogOut, CheckCircle2 } from 'lucide-react';
import { getUserDisplayInfo } from '../utils/userDisplay';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const displayInfo = getUserDisplayInfo(user);

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
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif-header text-slate-900 tracking-tight">User Account Profile</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Manage your personal identity, system credentials, and active permissions
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={logout}>
          <LogOut className="w-4 h-4 mr-2" />
          <span>Sign Out</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
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
            <div className="p-3 bg-[#e6f7ef] border border-[#b2e8cf] rounded-2xl text-xs space-y-1">
              <div className="text-[#0d6e48] font-bold uppercase tracking-wider">{displayInfo.idLabel}</div>
              <div className="font-mono font-bold text-slate-900 text-sm">{displayInfo.idValue}</div>
            </div>
          )}
        </Card>

        {/* Details Card */}
        <Card className="md:col-span-2 p-6 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Account Credentials &amp; Metadata
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <dt className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Mobile Number
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
                  Account Security Status
                </dt>
                <dd className="font-bold text-[#0d6e48]">Verified &amp; Active</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Granted Permissions ({user.permissions?.length || 0})
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
  );
};
