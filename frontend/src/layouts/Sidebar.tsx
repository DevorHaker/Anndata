import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  User,
  ShieldCheck,
  Lock,
  Users,
  Building2,
  Ticket,
  Calendar,
  Wheat,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  const getRoleNavItems = () => {
    const items = [
      { to: '/', label: 'Dashboard Overview', icon: LayoutDashboard, exact: true },
      { to: '/health', label: 'Health & Readiness', icon: Activity }
    ];

    if (!isAuthenticated || !user) {
      items.push({ to: '/login', label: 'Sign In / Register', icon: Lock });
      return items;
    }

    items.push({ to: '/profile', label: 'My Account Profile', icon: User });

    const role = user.role === 'ADMIN' ? 'SYSTEM_ADMIN' : user.role;

    if (role === 'FARMER') {
      items.push(
        { to: '/farmer/bookings', label: 'My Slot Bookings', icon: Calendar },
        { to: '/farmer/tokens', label: 'My Procurement Tokens', icon: Ticket },
        { to: '/payments', label: 'My DBT Payments', icon: CreditCard }
      );
    } else if (role === 'PROCUREMENT_OFFICER' || role === 'CENTRE_MANAGER') {
      items.push(
        { to: '/centre/queue', label: 'Mandi Gate Queue', icon: Building2 },
        { to: '/centre/checkin', label: 'Gate Token Check-in', icon: Ticket },
        { to: '/admin/payments', label: 'DBT Disbursements', icon: CreditCard }
      );
    } else if (role === 'SYSTEM_ADMIN' || role === 'DISTRICT_ADMIN') {
      items.push(
        { to: '/admin/users', label: 'User & RBAC Mgmt', icon: Users },
        { to: '/admin/payments', label: 'Payment Disbursements', icon: CreditCard },
        { to: '/admin/audit', label: 'Security Audit Logs', icon: ShieldCheck }
      );
    }

    return items;
  };

  const navItems = getRoleNavItems();

  return (
    <aside className="w-64 glass-panel border-r border-slate-800 p-4 flex flex-col justify-between hidden md:flex shrink-0">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Navigation Menu
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-150 ${
                      isActive
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-3 glass-card rounded-xl border border-slate-800 text-xs text-slate-400">
        <p className="font-semibold text-slate-300 mb-1 flex items-center justify-between">
          <span>Phase 5 Active</span>
          {user && (
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 font-mono rounded">
              {user.role}
            </span>
          )}
        </p>
        <p className="leading-relaxed text-[11px]">
          {isAuthenticated ? `Signed in as ${user?.mobileNumber}` : 'Unauthenticated Mode'}
        </p>
      </div>
    </aside>
  );
};
