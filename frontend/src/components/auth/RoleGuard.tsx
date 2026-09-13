import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: string;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  requiredPermission,
  fallback = null
}) => {
  const { user } = useAuth();

  if (!user) return <>{fallback}</>;

  // System admin possesses global access
  if (user.role === 'SYSTEM_ADMIN' || user.role === 'ADMIN') {
    return <>{children}</>;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user.role as string) === 'ADMIN' ? 'SYSTEM_ADMIN' : user.role;
    const normalizedAllowed = allowedRoles.map((r) => ((r as string) === 'ADMIN' ? 'SYSTEM_ADMIN' : r));
    if (!normalizedAllowed.includes(userRole)) {
      return <>{fallback}</>;
    }
  }

  if (requiredPermission) {
    if (!user.permissions || !user.permissions.includes(requiredPermission)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};
