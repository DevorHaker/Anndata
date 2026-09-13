import {
  ProcurementCentreDetail,
  CentreCapacityConfig,
  CentreDisruptionDetail,
  CentreStaffAssignment,
  PaginatedResult,
  CentreOperationalStatus,
  DisruptionStatus,
  DisruptionSeverity
} from '../types/domain';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

class CentreService {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    const activeToken = localStorage.getItem('smartprocure_token');
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }
    return headers;
  }

  async listCentres(params: {
    page?: number;
    pageSize?: number;
    district?: string;
    state?: string;
    status?: string;
    search?: string;
  }): Promise<PaginatedResult<ProcurementCentreDetail>> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params.district) query.append('district', params.district);
    if (params.state) query.append('state', params.state);
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE_URL}/centres?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to list procurement centres.');
    }
    return data;
  }

  async getCentreDetails(id: string): Promise<ProcurementCentreDetail> {
    const res = await fetch(`${API_BASE_URL}/centres/${id}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to fetch centre details.');
    }
    return data.data;
  }

  async createCentre(payload: {
    centreCode: string;
    name: string;
    district: string;
    subDistrict: string;
    state: string;
    pincode: string;
    addressText: string;
    latitude: number;
    longitude: number;
    contactPhone?: string;
  }): Promise<ProcurementCentreDetail> {
    const res = await fetch(`${API_BASE_URL}/centres`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to register procurement centre.');
    }
    return data.data;
  }

  async updateCentreStatus(id: string, status: CentreOperationalStatus, reason: string): Promise<ProcurementCentreDetail> {
    const res = await fetch(`${API_BASE_URL}/centres/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status, reason })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to update operational status.');
    }
    return data.data;
  }

  async getCapacity(centreId: string): Promise<CentreCapacityConfig> {
    const res = await fetch(`${API_BASE_URL}/centres/${centreId}/capacity`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to fetch capacity configuration.');
    }
    return data.data;
  }

  async updateCapacity(centreId: string, payload: Partial<CentreCapacityConfig>): Promise<CentreCapacityConfig> {
    const res = await fetch(`${API_BASE_URL}/centres/${centreId}/capacity`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to update capacity.');
    }
    return data.data;
  }

  async listDisruptions(centreId: string): Promise<CentreDisruptionDetail[]> {
    const res = await fetch(`${API_BASE_URL}/centres/${centreId}/disruptions`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to list disruptions.');
    }
    return data.data;
  }

  async createDisruption(
    centreId: string,
    payload: {
      disruptionType: string;
      severity: DisruptionSeverity;
      title: string;
      description: string;
      expectedEndTime?: string;
    }
  ): Promise<CentreDisruptionDetail> {
    const res = await fetch(`${API_BASE_URL}/centres/${centreId}/disruptions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to report operational disruption.');
    }
    return data.data;
  }

  async updateDisruptionStatus(
    centreId: string,
    disruptionId: string,
    status: DisruptionStatus,
    resolutionNotes?: string
  ): Promise<CentreDisruptionDetail> {
    const res = await fetch(`${API_BASE_URL}/centres/${centreId}/disruptions/${disruptionId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status, resolutionNotes })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to update disruption status.');
    }
    return data.data;
  }

  async getStaff(centreId: string): Promise<CentreStaffAssignment[]> {
    const res = await fetch(`${API_BASE_URL}/centres/${centreId}/staff`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to fetch centre staff.');
    }
    return data.data;
  }

  async assignStaff(centreId: string, userId: string, role: string): Promise<CentreStaffAssignment> {
    const res = await fetch(`${API_BASE_URL}/centres/${centreId}/staff`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ userId, role })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to assign staff.');
    }
    return data.data;
  }
}

export const centreService = new CentreService();
