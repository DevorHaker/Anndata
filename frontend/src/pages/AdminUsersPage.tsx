import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Select } from '../components/Select';
import { Spinner } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { authService } from '../services/authService';
import { User, UserRole, UserStatus } from '../types/auth';
import { Users, Shield, Filter, RefreshCw, CheckCircle, AlertTriangle, UserCheck, UserX } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.listUsers(page, 20, roleFilter || undefined, statusFilter || undefined);
      setUsers(res.users);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    setUpdatingUserId(userId);
    try {
      await authService.updateUserStatus(userId, newStatus);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingUserId(userId);
    try {
      await authService.updateUserRole(userId, newRole);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System User &amp; RBAC Management</h1>
          <p className="text-sm text-slate-600">
            Manage user accounts, assign operational roles, and enforce security status policies
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchUsers} isLoading={isLoading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          <span>Refresh List</span>
        </Button>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Filter by System Role"
            value={roleFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRoleFilter(e.target.value)}
            options={[
              { label: 'All System Roles', value: '' },
              { label: 'Farmer (FARMER)', value: 'FARMER' },
              { label: 'Procurement Officer', value: 'PROCUREMENT_OFFICER' },
              { label: 'Centre Manager', value: 'CENTRE_MANAGER' },
              { label: 'District Admin', value: 'DISTRICT_ADMIN' },
              { label: 'System Admin', value: 'SYSTEM_ADMIN' }
            ]}
          />

          <Select
            label="Filter by Account Status"
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
            options={[
              { label: 'All Account Statuses', value: '' },
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Suspended', value: 'SUSPENDED' },
              { label: 'Locked', value: 'LOCKED' },
              { label: 'Disabled', value: 'DISABLED' }
            ]}
          />

          <div className="flex items-end">
            <Button
              variant="outline"
              size="md"
              className="w-full"
              onClick={() => {
                setRoleFilter('');
                setStatusFilter('');
                setPage(1);
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 font-medium">{error}</div>
        ) : users.length === 0 ? (
          <EmptyState
            title="No Users Found"
            description="No user accounts match the current filter criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-xs">
                <tr>
                  <th className="py-3 px-4">Mobile Number</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Failed Logins</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{u.mobileNumber}</td>
                    <td className="py-3.5 px-4">
                      <select
                        value={u.role === 'ADMIN' ? 'SYSTEM_ADMIN' : u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        disabled={updatingUserId === u.id}
                        className="text-xs font-semibold px-2 py-1 bg-slate-100 border border-slate-300 rounded-lg outline-none"
                      >
                        <option value="FARMER">FARMER</option>
                        <option value="PROCUREMENT_OFFICER">PROCUREMENT_OFFICER</option>
                        <option value="CENTRE_MANAGER">CENTRE_MANAGER</option>
                        <option value="DISTRICT_ADMIN">DISTRICT_ADMIN</option>
                        <option value="SYSTEM_ADMIN">SYSTEM_ADMIN</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          u.status === 'ACTIVE' ? 'success' : u.status === 'SUSPENDED' ? 'warning' : 'error'
                        }
                      >
                        {u.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{u.failedLoginAttempts || 0}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {u.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(u.id, 'SUSPENDED')}
                          disabled={updatingUserId === u.id}
                          className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(u.id, 'ACTIVE')}
                          disabled={updatingUserId === u.id}
                          className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
