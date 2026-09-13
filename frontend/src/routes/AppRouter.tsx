import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RootLayout } from '../layouts/RootLayout';
import { HomePage } from '../pages/HomePage';
import { HealthPage } from '../pages/HealthPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ProfilePage } from '../pages/ProfilePage';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { FarmerPage } from '../pages/FarmerPage';
import { CentrePage } from '../pages/CentrePage';
import { AdminPage } from '../pages/AdminPage';
import { FarmerPaymentsPage } from '../pages/FarmerPaymentsPage';
import { AdminPaymentsPage } from '../pages/AdminPaymentsPage';
import { TraceabilityPage } from '../pages/TraceabilityPage';
import { FarmerIntelligencePage } from '../pages/FarmerIntelligencePage';
import { StaffIntelligenceDashboardPage } from '../pages/StaffIntelligenceDashboardPage';
import { AdminIntelligenceControlPage } from '../pages/AdminIntelligenceControlPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { AuthProvider } from '../context/AuthContext';

export const AppRouter: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Full-Page Auth Routes (Outside RootLayout for un-distracted experience) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Authenticated / App Shell Layout Routes */}
        <Route path="/" element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="health" element={<HealthPage />} />

          {/* User Profile */}
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Admin RBAC Users Management */}
          <Route
            path="admin/users"
            element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'DISTRICT_ADMIN', 'ADMIN']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />

          {/* Farmer Module Routes */}
          <Route
            path="farmer/*"
            element={
              <ProtectedRoute allowedRoles={['FARMER', 'SYSTEM_ADMIN', 'ADMIN']}>
                <FarmerPage />
              </ProtectedRoute>
            }
          />

          {/* Centre Module Routes */}
          <Route
            path="centre/*"
            element={
              <ProtectedRoute allowedRoles={['PROCUREMENT_OFFICER', 'CENTRE_MANAGER', 'SYSTEM_ADMIN', 'ADMIN']}>
                <CentrePage />
              </ProtectedRoute>
            }
          />

          {/* Admin Dashboard */}
          <Route
            path="admin/*"
            element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'DISTRICT_ADMIN', 'ADMIN']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* Phase 10 Payment Management & Traceability Routes */}
          <Route
            path="payments"
            element={
              <ProtectedRoute>
                <FarmerPaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/payments"
            element={
              <ProtectedRoute allowedRoles={['PROCUREMENT_OFFICER', 'CENTRE_MANAGER', 'DISTRICT_ADMIN', 'SYSTEM_ADMIN', 'ADMIN']}>
                <AdminPaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="traceability/:identifier"
            element={
              <ProtectedRoute>
                <TraceabilityPage />
              </ProtectedRoute>
            }
          />

          {/* Phase 11 Real-Time Intelligence & Decision Engine Routes */}
          <Route
            path="intelligence/farmer"
            element={
              <ProtectedRoute>
                <FarmerIntelligencePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="intelligence/staff"
            element={
              <ProtectedRoute allowedRoles={['PROCUREMENT_OFFICER', 'CENTRE_MANAGER', 'DISTRICT_ADMIN', 'SYSTEM_ADMIN', 'ADMIN']}>
                <StaffIntelligenceDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="intelligence/admin"
            element={
              <ProtectedRoute allowedRoles={['DISTRICT_ADMIN', 'SYSTEM_ADMIN', 'ADMIN']}>
                <AdminIntelligenceControlPage />
              </ProtectedRoute>
            }
          />

          {/* 404 Catch All */}
          <Route path="404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
};
