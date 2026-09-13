import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthResponse } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithPassword: (mobile: string, passwordInput: string) => Promise<void>;
  loginWithOtp: (mobile: string, otp: string) => Promise<void>;
  registerFarmer: (params: { mobileNumber: string; password?: string; firstName?: string; lastName?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('smartprocure_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleAuthSuccess = (res: AuthResponse) => {
    setUser(res.user);
    setAccessToken(res.tokens.accessToken);
    localStorage.setItem('smartprocure_token', res.tokens.accessToken);
  };

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('smartprocure_token');
    if (!token) {
      setUser(null);
      setAccessToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const u = await authService.getCurrentUser(token);
      setUser(u);
      setAccessToken(token);
    } catch (err) {
      console.warn('Authentication token expired or invalid:', err);
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('smartprocure_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const loginWithPassword = async (mobile: string, passwordInput: string) => {
    setIsLoading(true);
    try {
      const res = await authService.loginWithPassword(mobile, passwordInput);
      handleAuthSuccess(res);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithOtp = async (mobile: string, otp: string) => {
    setIsLoading(true);
    try {
      const res = await authService.verifyOtp(mobile, otp);
      handleAuthSuccess(res);
    } finally {
      setIsLoading(false);
    }
  };

  const registerFarmer = async (params: { mobileNumber: string; password?: string; firstName?: string; lastName?: string }) => {
    setIsLoading(true);
    try {
      const res = await authService.registerFarmer(params);
      handleAuthSuccess(res);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('smartprocure_token');
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user && !!accessToken,
        isLoading,
        loginWithPassword,
        loginWithOtp,
        registerFarmer,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
