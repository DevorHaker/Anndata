export type UserRole = 
  | 'FARMER' 
  | 'PROCUREMENT_OFFICER' 
  | 'CENTRE_MANAGER' 
  | 'DISTRICT_ADMIN' 
  | 'SYSTEM_ADMIN' 
  | 'ADMIN';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'DISABLED';

export interface User {
  id: string;
  mobileNumber: string;
  role: UserRole;
  roleName: string;
  status: UserStatus;
  farmerId?: string | null;
  farmerReferenceId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  failedLoginAttempts?: number;
  permissions: string[];
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface OtpRequestResponse {
  success: boolean;
  message: string;
  cooldownSeconds: number;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
