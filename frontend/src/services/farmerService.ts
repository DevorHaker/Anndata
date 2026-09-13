import {
  FarmerDetail,
  FarmerProfileData,
  FarmerProduceDetail,
  CropType,
  PaginatedResult,
  VerificationStatus,
  AccountStatus
} from '../types/domain';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

class FarmerService {
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

  async getMyProfile(): Promise<FarmerDetail> {
    const res = await fetch(`${API_BASE_URL}/farmers/me`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to fetch farmer profile.');
    }
    return data.data;
  }

  async updateMyProfile(payload: {
    firstName?: string;
    lastName?: string;
    gender?: string;
    profile?: Partial<FarmerProfileData>;
  }): Promise<FarmerDetail> {
    const res = await fetch(`${API_BASE_URL}/farmers/me`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to update profile.');
    }
    return data.data;
  }

  async getMyProduce(): Promise<FarmerProduceDetail[]> {
    const res = await fetch(`${API_BASE_URL}/farmers/me/produce`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to fetch produce declarations.');
    }
    return data.data;
  }

  async addMyProduce(payload: {
    cropTypeId: string;
    cropVarietyId?: string;
    harvestSeason: string;
    estimatedYieldKg: number;
    declaredQuantityKg: number;
  }): Promise<FarmerProduceDetail> {
    const res = await fetch(`${API_BASE_URL}/farmers/me/produce`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to declare produce.');
    }
    return data.data;
  }

  async getCropTypes(): Promise<CropType[]> {
    const res = await fetch(`${API_BASE_URL}/produce/crops`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to fetch crop master data.');
    }
    return data.data;
  }

  async searchFarmers(params: {
    page?: number;
    pageSize?: number;
    district?: string;
    verificationStatus?: string;
    status?: string;
    search?: string;
  }): Promise<PaginatedResult<FarmerDetail>> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params.district) query.append('district', params.district);
    if (params.verificationStatus) query.append('verificationStatus', params.verificationStatus);
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE_URL}/farmers?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to list farmer profiles.');
    }
    return data;
  }

  async updateFarmerStatus(farmerId: string, status: AccountStatus): Promise<FarmerDetail> {
    const res = await fetch(`${API_BASE_URL}/farmers/${farmerId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to update farmer status.');
    }
    return data.data;
  }

  async verifyFarmer(farmerId: string, verificationStatus: VerificationStatus): Promise<FarmerDetail> {
    const res = await fetch(`${API_BASE_URL}/farmers/${farmerId}/verify`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ verificationStatus })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to update verification status.');
    }
    return data.data;
  }
}

export const farmerService = new FarmerService();
