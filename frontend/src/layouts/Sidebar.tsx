import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  Users,
  Building2,
  Ticket,
  Calendar,
  CreditCard,
  Sparkles,
  Bell,
  WifiOff,
  GitCompare,
  Inbox
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserDisplayInfo } from '../utils/userDisplay';
import { notificationServiceUI } from '../services/notificationService';

export const Sidebar: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const displayInfo = user ? getUserDisplayInfo(user) : null;
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchCount = async () => {
      if (!user) return;
      try {
        const count = await notificationServiceUI.getUnreadCount(user.role, user.id);
        if (isMounted) {
          setUnreadCount(count);
        }
      } catch (err) {
        // Fallback
      }
    };

    fetchCount();
    const unsub = notificationServiceUI.subscribe(fetchCount);
    const timer = setInterval(fetchCount, 5000);

    return () => {
      isMounted = false;
      unsub();
      clearInterval(timer);
    };
  }, [user]);

  const getRoleNavItems = () => {
    const items: { to: string; label: string; icon: any; exact?: boolean }[] = [];

    if (!isAuthenticated || !user) {
      return items;
    }

    items.push({ to: '/profile', label: 'My Account Profile', icon: User });
    items.push({ to: '/notifications', label: 'Notifications Inbox', icon: Bell });

    const role = user.role === 'ADMIN' ? 'SYSTEM_ADMIN' : user.role;

    if (role === 'FARMER') {
      items.push(
        { to: '/intelligence/farmer', label: 'AI Mandi & Live ETA', icon: Sparkles },
        { to: '/farmer/bookings', label: 'My Slot Bookings', icon: Calendar },
        { to: '/farmer/tokens', label: 'My Procurement Tokens', icon: Ticket },
        { to: '/payments', label: 'My DBT Payments', icon: CreditCard }
      );
    } else if (role === 'PROCUREMENT_OFFICER' || role === 'CENTRE_MANAGER') {
      items.push(
        { to: '/centre', label: 'Centre Manager Dashboard', icon: Inbox, exact: true },
        { to: '/intelligence/staff', label: 'Operations & AI Control', icon: Sparkles },
        { to: '/centre/offline', label: 'Offline Mandi Ops', icon: WifiOff },
        { to: '/admin/sync-conflicts', label: 'Sync Conflicts', icon: GitCompare },
        { to: '/centre/queue', label: 'Mandi Gate Queue', icon: Building2 },
        { to: '/admin/payments', label: 'DBT Disbursements', icon: CreditCard }
      );
    } else if (role === 'SYSTEM_ADMIN' || role === 'DISTRICT_ADMIN') {
      items.push(
        { to: '/intelligence/admin', label: 'What-If & AI Engine', icon: Sparkles },
        { to: '/admin/sync-conflicts', label: 'Sync Conflicts', icon: GitCompare },
        { to: '/centre/offline', label: 'Offline Mandi Ops', icon: WifiOff },
        { to: '/admin/users', label: 'User & RBAC Mgmt', icon: Users },
        { to: '/admin/payments', label: 'Payment Disbursements', icon: CreditCard },
        { to: '/admin/audit', label: 'Security Audit Logs', icon: ShieldCheck }
      );
    }

    return items;
  };

  const navItems = getRoleNavItems();

  if (navItems.length === 0) {
    return null;
  }

  return (
    <aside className="w-64 bg-white/80 backdrop-blur-md border-r border-emerald-100/80 p-4 flex flex-col justify-between hidden md:flex shrink-0">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Navigation Menu
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isNotif = item.to === '/notifications';
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition duration-150 ${
                      isActive
                        ? 'bg-[#e6f7ef] text-[#0d6e48] border border-[#b2e8cf]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <div className="relative flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                    {isNotif && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                      </span>
                    )}
                  </div>
                  <span>{item.label}</span>
                  {isNotif && unreadCount > 0 && (
                    <span className="ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-600 text-white shadow-sm animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-3 bg-[#e6f7ef]/50 rounded-2xl border border-[#b2e8cf]/60 text-xs text-slate-600">
        <p className="font-semibold text-slate-900 mb-1 flex items-center justify-between">
          <span>{displayInfo ? `${displayInfo.sessionBadgeLabel} Active` : 'SmartProcure Active'}</span>
          {user && (
            <span className="text-[10px] px-1.5 py-0.5 bg-[#0d6e48] text-white font-mono rounded-md font-bold">
              {displayInfo ? displayInfo.roleBadgeLabel : user.role}
            </span>
          )}
        </p>
        <p className="leading-relaxed text-[11px] text-slate-500">
          {isAuthenticated ? `Signed in as ${user?.mobileNumber}` : 'Unauthenticated Mode'}
        </p>
      </div>
    </aside>
  );
};
