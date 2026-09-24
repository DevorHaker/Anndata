import { API_BASE_URL } from './apiConfig';
import { notificationServiceUI } from './notificationService';

export interface BookingRecordUI {
  id: string;
  bookingReferenceId: string;
  farmerId: string;
  farmerName?: string;
  farmerMobile?: string;
  farmerReferenceId?: string;
  centreId: string;
  centreName?: string;
  slotId: string;
  cropTypeId: string;
  cropName?: string;
  declaredWeightKg: number;
  estimatedServiceMinutes: number;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'PENDING_VERIFICATION' | 'CHECKED_IN' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  editableUntil?: string;
  cancellationReason?: string | null;
  createdAt: string;
}

const LOCAL_STORAGE_BOOKINGS_KEY = 'smartprocure_created_bookings';

class BookingServiceUI {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    const token = localStorage.getItem('smartprocure_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  getStoredCreatedBookings(): BookingRecordUI[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_BOOKINGS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  saveCreatedBookingLocally(booking: BookingRecordUI) {
    try {
      const existing = this.getStoredCreatedBookings();
      const updated = [booking, ...existing.filter((b) => b.id !== booking.id)];
      localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to store booking locally:', e);
    }
  }

  async createBooking(payload: {
    farmerId?: string;
    farmerName?: string;
    farmerMobile?: string;
    farmerReferenceId?: string;
    centreId: string;
    centreName?: string;
    slotId?: string;
    cropTypeId: string;
    cropName?: string;
    declaredWeightKg: number;
    harvestSeason?: string;
  }): Promise<BookingRecordUI> {
    const now = new Date();
    const editableUntil = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
    const newBooking: BookingRecordUI = {
      id: `bk-farmer-${Date.now()}`,
      bookingReferenceId: `BK-20260920-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      farmerId: payload.farmerId || 'frm-demo-001',
      farmerName: payload.farmerName || 'Ramesh Kumar',
      farmerMobile: payload.farmerMobile || '+91 9999900002',
      farmerReferenceId: payload.farmerReferenceId || 'FRM-2026-8812',
      centreId: payload.centreId,
      centreName: payload.centreName || 'Selected Mandi Hub',
      slotId: payload.slotId || 'slot-001',
      cropTypeId: payload.cropTypeId,
      cropName: payload.cropName || 'Declared Harvest Produce',
      declaredWeightKg: payload.declaredWeightKg,
      estimatedServiceMinutes: 35,
      scheduledDate: new Date().toISOString().split('T')[0],
      startTime: '09:00 AM',
      endTime: '11:00 AM',
      status: 'PENDING_CONFIRMATION',
      editableUntil,
      createdAt: now.toISOString()
    };

    // Dispatch notification to Centre Manager inbox
    notificationServiceUI.addNotification({
      roleTarget: 'CENTRE_MANAGER',
      title: 'New Procurement Request Received',
      message: `Farmer ${newBooking.farmerName} submitted procurement request (${newBooking.bookingReferenceId}) for ${newBooking.cropName} (${newBooking.declaredWeightKg.toLocaleString()} kg) at ${newBooking.centreName}.`
    });

    try {
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          farmerId: payload.farmerId || 'frm-demo-001',
          centreId: payload.centreId,
          slotId: payload.slotId || 'slot-001',
          cropTypeId: payload.cropTypeId,
          declaredWeightKg: payload.declaredWeightKg
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        const mergedApiBooking: BookingRecordUI = {
          ...newBooking,
          ...data.data,
          centreName: payload.centreName || data.data.centreName,
          farmerName: payload.farmerName || data.data.farmerName,
          cropName: payload.cropName || data.data.cropName,
          editableUntil
        };
        this.saveCreatedBookingLocally(mergedApiBooking);
        return mergedApiBooking;
      }
    } catch (e) {
      // API fallback
    }

    this.saveCreatedBookingLocally(newBooking);
    return newBooking;
  }

  async updateBooking(
    bookingId: string,
    updates: {
      centreId?: string;
      centreName?: string;
      cropTypeId?: string;
      cropName?: string;
      declaredWeightKg?: number;
    }
  ): Promise<BookingRecordUI | null> {
    const local = this.getStoredCreatedBookings();
    const target = local.find((b) => b.id === bookingId);
    if (target) {
      if (updates.centreId) target.centreId = updates.centreId;
      if (updates.centreName) target.centreName = updates.centreName;
      if (updates.cropTypeId) target.cropTypeId = updates.cropTypeId;
      if (updates.cropName) target.cropName = updates.cropName;
      if (updates.declaredWeightKg !== undefined) target.declaredWeightKg = updates.declaredWeightKg;
      this.saveCreatedBookingLocally(target);
      return target;
    }
    return null;
  }

  async confirmBooking(bookingId: string): Promise<BookingRecordUI | null> {
    const local = this.getStoredCreatedBookings();
    const target = local.find((b) => b.id === bookingId);
    if (target) {
      target.status = 'PENDING_VERIFICATION';
      this.saveCreatedBookingLocally(target);
      return target;
    }
    return null;
  }

  async listCentreBookings(centreId: string, status?: string): Promise<BookingRecordUI[]> {
    let baseList: BookingRecordUI[] = [];
    try {
      const query = new URLSearchParams({ centreId });
      if (status) query.append('status', status);

      const res = await fetch(`${API_BASE_URL}/bookings?${query.toString()}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data) && data.data.length > 0) {
        baseList = data.data;
      } else {
        baseList = this.getMockCentreBookings(centreId);
      }
    } catch (err) {
      baseList = this.getMockCentreBookings(centreId);
    }

    // Merge with user-created bookings stored in localStorage
    const localCreated = this.getStoredCreatedBookings();
    const matchingLocal = localCreated.filter(
      (b) => !centreId || b.centreId === centreId || b.centreId === '33333333-3333-4000-8000-333333333333'
    );

    const mergedMap = new Map<string, BookingRecordUI>();
    matchingLocal.forEach((b) => mergedMap.set(b.id, b));
    baseList.forEach((b) => {
      if (!mergedMap.has(b.id)) mergedMap.set(b.id, b);
    });

    let result = Array.from(mergedMap.values());
    if (status && status !== 'ALL') {
      result = result.filter((r) => r.status === status);
    }
    return result;
  }

  async approveBooking(bookingId: string, bookingDetails?: Partial<BookingRecordUI>): Promise<BookingRecordUI> {
    const local = this.getStoredCreatedBookings();
    let target = local.find((b) => b.id === bookingId);

    if (target) {
      target.status = 'CONFIRMED';
      this.saveCreatedBookingLocally(target);
    } else if (bookingDetails) {
      target = {
        id: bookingId,
        bookingReferenceId: bookingDetails.bookingReferenceId || `BK-${bookingId}`,
        farmerId: bookingDetails.farmerId || 'frm-001',
        farmerName: bookingDetails.farmerName || 'Farmer',
        centreId: bookingDetails.centreId || 'centre-001',
        centreName: bookingDetails.centreName || 'Procurement Centre',
        slotId: bookingDetails.slotId || 'slot-001',
        cropTypeId: bookingDetails.cropTypeId || 'crop-paddy',
        cropName: bookingDetails.cropName || 'Paddy (Grade A)',
        declaredWeightKg: bookingDetails.declaredWeightKg || 8000,
        estimatedServiceMinutes: 35,
        scheduledDate: bookingDetails.scheduledDate || new Date().toISOString().split('T')[0],
        startTime: bookingDetails.startTime || '09:00 AM',
        endTime: bookingDetails.endTime || '11:00 AM',
        status: 'CONFIRMED',
        createdAt: new Date().toISOString()
      };
      this.saveCreatedBookingLocally(target);
    }

    // Dispatch approval notification to Farmer inbox
    const refId = target?.bookingReferenceId || bookingDetails?.bookingReferenceId || bookingId;
    const cropName = target?.cropName || bookingDetails?.cropName || 'Produce';
    const weight = target?.declaredWeightKg || bookingDetails?.declaredWeightKg || 0;
    const centreName = target?.centreName || bookingDetails?.centreName || 'Procurement Hub';

    notificationServiceUI.addNotification({
      roleTarget: 'FARMER',
      title: 'Procurement Request Approved',
      message: `Your procurement request (${refId}) for ${cropName} (${weight.toLocaleString()} kg) at ${centreName} has been approved by the Centre Manager.`
    });

    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/approve`, {
        method: 'POST',
        headers: this.getHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return data.data;
      }
    } catch (err) {
      // Local fallback handled above
    }

    return target!;
  }

  async cancelBooking(bookingId: string, reason: string): Promise<BookingRecordUI> {
    const local = this.getStoredCreatedBookings();
    const target = local.find((b) => b.id === bookingId);
    if (target) {
      target.status = 'CANCELLED';
      target.cancellationReason = reason;
      this.saveCreatedBookingLocally(target);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return data.data;
      }
    } catch (err) {
      // Local fallback handled above
    }
    return target || {
      id: bookingId,
      bookingReferenceId: `BK-CANCELLED-${bookingId}`,
      farmerId: 'frm-001',
      centreId: 'centre-001',
      slotId: 'slot-001',
      cropTypeId: 'crop-001',
      declaredWeightKg: 8000,
      estimatedServiceMinutes: 30,
      scheduledDate: new Date().toISOString().split('T')[0],
      startTime: '09:00 AM',
      endTime: '11:00 AM',
      status: 'CANCELLED',
      cancellationReason: reason,
      createdAt: new Date().toISOString()
    };
  }

  async rescheduleBooking(bookingId: string, newSlotId: string): Promise<BookingRecordUI> {
    const local = this.getStoredCreatedBookings();
    const target = local.find((b) => b.id === bookingId);
    if (target) {
      target.slotId = newSlotId;
      this.saveCreatedBookingLocally(target);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ newSlotId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return data.data;
      }
    } catch (err) {
      // Local fallback handled above
    }
    return target || {
      id: bookingId,
      bookingReferenceId: `BK-RESCHEDULED-${bookingId}`,
      farmerId: 'frm-001',
      centreId: 'centre-001',
      slotId: newSlotId,
      cropTypeId: 'crop-001',
      declaredWeightKg: 8000,
      estimatedServiceMinutes: 30,
      scheduledDate: new Date().toISOString().split('T')[0],
      startTime: '11:00 AM',
      endTime: '01:00 PM',
      status: 'PENDING_VERIFICATION',
      createdAt: new Date().toISOString()
    };
  }

  private getMockCentreBookings(centreId: string): BookingRecordUI[] {
    return [
      {
        id: 'bk-req-101',
        bookingReferenceId: 'BK-20260917-A4F1',
        farmerId: 'frm-001',
        farmerName: 'Ramesh Kumar',
        farmerMobile: '+91 9876543210',
        farmerReferenceId: 'FRM-2026-8812',
        centreId,
        centreName: 'Karnal Grain Mandi No. 1',
        slotId: 'slot-001',
        cropTypeId: 'crop-paddy-a',
        cropName: 'Paddy (Grade A)',
        declaredWeightKg: 8500,
        estimatedServiceMinutes: 35,
        scheduledDate: '2026-09-18',
        startTime: '09:00 AM',
        endTime: '11:00 AM',
        status: 'PENDING_VERIFICATION',
        createdAt: new Date().toISOString()
      },
      {
        id: 'bk-req-102',
        bookingReferenceId: 'BK-20260917-B9E2',
        farmerId: 'frm-002',
        farmerName: 'Sukhwinder Singh',
        farmerMobile: '+91 9988776655',
        farmerReferenceId: 'FRM-2026-9043',
        centreId,
        centreName: 'Karnal Grain Mandi No. 1',
        slotId: 'slot-002',
        cropTypeId: 'crop-wheat',
        cropName: 'Sharbati Wheat',
        declaredWeightKg: 12000,
        estimatedServiceMinutes: 45,
        scheduledDate: '2026-09-18',
        startTime: '11:00 AM',
        endTime: '01:00 PM',
        status: 'CONFIRMED',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'bk-req-103',
        bookingReferenceId: 'BK-20260917-C3D4',
        farmerId: 'frm-003',
        farmerName: 'Ajay Rawat',
        farmerMobile: '+91 9999900002',
        farmerReferenceId: 'FRM-2026-1102',
        centreId,
        centreName: 'Karnal Grain Mandi No. 1',
        slotId: 'slot-001',
        cropTypeId: 'crop-mustard',
        cropName: 'Yellow Mustard (Sarson)',
        declaredWeightKg: 4500,
        estimatedServiceMinutes: 20,
        scheduledDate: '2026-09-18',
        startTime: '09:00 AM',
        endTime: '11:00 AM',
        status: 'CHECKED_IN',
        createdAt: new Date(Date.now() - 7200000).toISOString()
      }
    ];
  }
}

export const bookingServiceUI = new BookingServiceUI();
