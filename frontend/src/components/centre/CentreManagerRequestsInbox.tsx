import React, { useState, useEffect } from 'react';
import { bookingServiceUI, BookingRecordUI } from '../../services/bookingService';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Input } from '../Input';
import { Select } from '../Select';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Search,
  Filter,
  Wheat,
  User,
  Phone,
  Scale,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

interface CentreManagerRequestsInboxProps {
  centreId: string;
  centreName?: string;
  onNavigateCheckin?: () => void;
}

export const CentreManagerRequestsInbox: React.FC<CentreManagerRequestsInboxProps> = ({
  centreId,
  centreName,
  onNavigateCheckin
}) => {
  const [requests, setRequests] = useState<BookingRecordUI[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [selectedReq, setSelectedReq] = useState<BookingRecordUI | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRescheduleModal, setShowRescheduleModal] = useState<boolean>(false);
  const [newSlotTime, setNewSlotTime] = useState<string>('11:00 AM - 01:00 PM');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchRequests();
  }, [centreId, statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookingServiceUI.listCentreBookings(
        centreId,
        statusFilter === 'ALL' ? undefined : statusFilter
      );
      setRequests(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load procurement slot requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = (req: BookingRecordUI) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, status: 'CONFIRMED' } : r))
    );
    setActionSuccess(`Procurement slot request '${req.bookingReferenceId}' for ${req.farmerName} approved & gate pass token issued!`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    setIsSubmitting(true);
    try {
      await bookingServiceUI.cancelBooking(selectedReq.id, rejectReason || 'Rejected by Centre Manager');
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedReq.id
            ? { ...r, status: 'CANCELLED', cancellationReason: rejectReason }
            : r
        )
      );
      setShowRejectModal(false);
      setSelectedReq(null);
      setRejectReason('');
      setActionSuccess(`Request '${selectedReq.bookingReferenceId}' rejected.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    setIsSubmitting(true);
    try {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedReq.id
            ? { ...r, startTime: newSlotTime.split(' - ')[0], endTime: newSlotTime.split(' - ')[1] }
            : r
        )
      );
      setShowRescheduleModal(false);
      setSelectedReq(null);
      setActionSuccess(`Request '${selectedReq.bookingReferenceId}' rescheduled to ${newSlotTime}.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to reschedule slot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      r.bookingReferenceId.toLowerCase().includes(q) ||
      (r.farmerName && r.farmerName.toLowerCase().includes(q)) ||
      (r.farmerMobile && r.farmerMobile.includes(q)) ||
      (r.cropName && r.cropName.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = requests.filter((r) => r.status === 'PENDING_VERIFICATION').length;
  const confirmedCount = requests.filter((r) => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN').length;
  const totalTonnageKg = requests.reduce((acc, r) => acc + (r.declaredWeightKg || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge variant="success">Confirmed Slot</Badge>;
      case 'PENDING_VERIFICATION':
        return <Badge variant="warning">Pending Approval</Badge>;
      case 'CHECKED_IN':
        return <Badge variant="info">Checked-In at Gate</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Procurement Complete</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Rejected / Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block uppercase">Pending Approval</span>
            <span className="text-2xl font-bold font-serif-header text-amber-600">{pendingCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block uppercase">Confirmed Slots</span>
            <span className="text-2xl font-bold font-serif-header text-emerald-700">{confirmedCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block uppercase">Requested Tonnage</span>
            <span className="text-2xl font-bold font-serif-header text-slate-900">
              {(totalTonnageKg / 1000).toFixed(1)} MT
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-200">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block uppercase">Active Centre</span>
            <span className="text-xs font-bold text-slate-900 block truncate max-w-[140px]">
              {centreName || 'Procurement Hub'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Banners */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-[#e6f7ef] border border-[#b2e8cf] text-[#0d6e48] text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#0d6e48] shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search farmer name, mobile, crop, ref ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-[#0d6e48]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-[#0d6e48]"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_VERIFICATION">Pending Approval</option>
              <option value="CONFIRMED">Confirmed Slots</option>
              <option value="CHECKED_IN">Checked-In at Gate</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Rejected / Cancelled</option>
            </select>
          </div>

          <Button variant="outline" size="sm" onClick={fetchRequests} isLoading={loading}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* Incoming Requests Cards List */}
      <div className="space-y-4">
        {filteredRequests.map((req) => (
          <div
            key={req.id}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-4"
          >
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#e6f7ef] text-[#0d6e48] border border-[#b2e8cf] flex items-center justify-center font-bold text-sm shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 font-serif-header text-base flex items-center gap-2">
                    {req.farmerName || 'Farmer Request'}
                    <span className="text-xs font-mono text-[#0d6e48] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {req.farmerReferenceId || req.farmerId}
                    </span>
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-0.5">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {req.farmerMobile || '+91 Registered'}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-600">Ref: {req.bookingReferenceId}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getStatusBadge(req.status)}
              </div>
            </div>

            {/* Request Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-slate-500 font-medium block flex items-center gap-1.5 mb-1">
                  <Wheat className="w-3.5 h-3.5 text-[#0d6e48]" /> Crop Category
                </span>
                <span className="font-bold text-slate-900 text-sm">{req.cropName || 'Paddy / Grain'}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-slate-500 font-medium block flex items-center gap-1.5 mb-1">
                  <Scale className="w-3.5 h-3.5 text-[#0d6e48]" /> Declared Quantity
                </span>
                <span className="font-bold text-[#0d6e48] text-sm">
                  {(req.declaredWeightKg / 100).toFixed(1)} Quintals ({req.declaredWeightKg.toLocaleString()} KG)
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-slate-500 font-medium block flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> Scheduled Window
                </span>
                <span className="font-bold text-slate-900 text-xs block">
                  {req.scheduledDate} ({req.startTime} - {req.endTime})
                </span>
              </div>
            </div>

            {/* Manager Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-medium font-mono">
                Requested on: {new Date(req.createdAt).toLocaleString()}
              </span>

              <div className="flex items-center gap-2">
                {req.status === 'PENDING_VERIFICATION' && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleApproveRequest(req)}
                    className="bg-[#0d6e48] hover:bg-[#095235]"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve & Confirm Slot
                  </Button>
                )}

                {req.status !== 'CANCELLED' && req.status !== 'COMPLETED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedReq(req);
                      setShowRescheduleModal(true);
                    }}
                  >
                    <Calendar className="w-3.5 h-3.5 mr-1" /> Reschedule Slot
                  </Button>
                )}

                {req.status !== 'CANCELLED' && req.status !== 'COMPLETED' && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      setSelectedReq(req);
                      setShowRejectModal(true);
                    }}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Reject Request
                  </Button>
                )}

                {req.status === 'CONFIRMED' && onNavigateCheckin && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onNavigateCheckin}
                    className="text-[#0d6e48] border-[#b2e8cf] bg-emerald-50 hover:bg-emerald-100"
                  >
                    Gate Check-In <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredRequests.length === 0 && !loading && (
          <div className="bg-white p-10 rounded-3xl text-center border border-slate-200 text-slate-500 shadow-sm font-medium">
            <Inbox className="w-12 h-12 mx-auto text-slate-400 mb-2" />
            <p className="font-bold text-slate-900 font-serif-header text-base">No Farmer Procurement Requests Found</p>
            <p className="text-xs text-slate-500 mt-1">
              When farmers book procurement slots for this centre, their incoming requests will appear here for manager verification.
            </p>
          </div>
        )}
      </div>

      {/* Reject Request Modal */}
      {showRejectModal && selectedReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold font-serif-header text-slate-900 flex items-center gap-2 text-rose-600">
              <XCircle className="w-5 h-5" /> Reject Farmer Procurement Request
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              You are rejecting request <strong className="font-mono text-slate-900">{selectedReq.bookingReferenceId}</strong> from{' '}
              <strong>{selectedReq.farmerName}</strong>. Please state the operational reason:
            </p>
            <form onSubmit={handleConfirmReject} className="space-y-4">
              <Select
                label="Rejection Reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                options={[
                  { value: 'Moisture content exceeds maximum allowed spec (>14%)', label: 'High Moisture Content (>14%)' },
                  { value: 'Procurement centre daily storage capacity reached', label: 'Centre Daily Storage Capacity Full' },
                  { value: 'Foreign matter & discolored grains beyond tolerance', label: 'Quality / Foreign Matter Non-compliance' },
                  { value: 'Land registration documentation unverified', label: 'Documentation / Land Record Issue' }
                ]}
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedReq(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="danger" isLoading={isSubmitting}>
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Request Modal */}
      {showRescheduleModal && selectedReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold font-serif-header text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#0d6e48]" /> Reschedule Procurement Slot
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              Assign a new available time window for <strong>{selectedReq.farmerName}</strong> ({selectedReq.cropName}):
            </p>
            <form onSubmit={handleConfirmReschedule} className="space-y-4">
              <Select
                label="New Slot Time Window"
                value={newSlotTime}
                onChange={(e) => setNewSlotTime(e.target.value)}
                options={[
                  { value: '09:00 AM - 11:00 AM', label: 'Morning Slot (09:00 AM - 11:00 AM)' },
                  { value: '11:00 AM - 01:00 PM', label: 'Mid-day Slot (11:00 AM - 01:00 PM)' },
                  { value: '02:00 PM - 04:00 PM', label: 'Afternoon Slot (02:00 PM - 04:00 PM)' },
                  { value: '04:00 PM - 06:00 PM', label: 'Evening Slot (04:00 PM - 06:00 PM)' }
                ]}
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setSelectedReq(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  Save New Slot
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
