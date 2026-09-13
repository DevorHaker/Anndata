import { AuthResponse, User, OtpRequestResponse, UserListResponse, UserStatus, UserRole } from '../types/auth';
import { API_BASE_URL } from './apiConfig';

class AuthService {
  private getHeaders(token?: string | null): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    const activeToken = token || localStorage.getItem('smartprocure_token');
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }
    return headers;
  }

  async loginWithPassword(mobileNumber: string, passwordInput: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ mobileNumber, password: passwordInput })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Login failed. Please check credentials.');
    }
    return data.data;
  }

  async registerFarmer(params: {
    mobileNumber: string;
    password?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        ...params,
        roleCode: 'FARMER'
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Registration failed.');
    }
    return data.data;
  }

  async requestOtp(mobileNumber: string): Promise<OtpRequestResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/otp/request`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ mobileNumber })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to dispatch OTP.');
    }
    return data.data;
  }

  async verifyOtp(mobileNumber: string, otp: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ mobileNumber, otp })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'OTP verification failed.');
    }
    return data.data;
  }

  async getCurrentUser(token?: string): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: this.getHeaders(token)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Session expired or unauthenticated.');
    }
    return data.data;
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders()
      });
    } catch (err) {
      // Ignore logout call failures
    } finally {
      localStorage.removeItem('smartprocure_token');
    }
  }

  async listUsers(page = 1, limit = 20, role?: string, status?: string): Promise<UserListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    if (role) params.append('role', role);
    if (status) params.append('status', status);

    const res = await fetch(`${API_BASE_URL}/admin/users?${params.toString()}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to fetch user list.');
    }
    return {
      users: data.data,
      total: data.meta.total,
      page: data.meta.page,
      limit: data.meta.limit,
      totalPages: data.meta.totalPages
    };
  }

  async updateUserStatus(userId: string, status: UserStatus): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to update user status.');
    }
  }

  async updateUserRole(userId: string, roleCode: UserRole): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ roleCode })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to update user role.');
    }
  }
}

export const authService = new AuthService();
