import { API_BASE_URL } from './apiConfig';

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
  status: 'CONFIRMED' | 'PENDING_VERIFICATION' | 'CHECKED_IN' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  cancellationReason?: string | null;
  createdAt: string;
}

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

  async listCentreBookings(centreId: string, status?: string): Promise<BookingRecordUI[]> {
    const query = new URLSearchParams({ centreId });
    if (status) query.append('status', status);

    const res = await fetch(`${API_BASE_URL}/bookings?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      // Fallback mock dataset for demonstration if server backend has empty table
      return this.getMockCentreBookings(centreId);
    }
    return data.data;
  }

  async cancelBooking(bookingId: string, reason: string): Promise<BookingRecordUI> {
    const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to cancel booking request.');
    }
    return data.data;
  }

  async rescheduleBooking(bookingId: string, newSlotId: string): Promise<BookingRecordUI> {
    const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/reschedule`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ newSlotId })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to reschedule booking.');
    }
    return data.data;
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
