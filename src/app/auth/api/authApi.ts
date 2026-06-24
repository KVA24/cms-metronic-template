import axiosInstance, { ApiError, getErrorMessage } from '@/shared/lib/api';
import logger from '@/shared/lib/logger';
import { storage } from '@/shared/lib/storage';

export interface LoginCredentials {
  username: string;
  email?: string;
  password: string;
  otpCode?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface Role {
  roleId: string | number;
  roleCode: string;
  roleName: string;
}

export interface User {
  id: string;
  username: string;
  status: string;
  isLocked: boolean;
  failedLoginAttempts?: number;
  roles: Role[];
  email?: string;
  name?: string;
  avatar?: string;
  role?: string;
  state?: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordConfirm {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  otpCode: string;
}

/**
 * Auth API Service with enhanced error handling
 */
export const authApi = {
  /**
   * Login user with email and password
   */
  login: async (
    credentials: LoginCredentials,
  ): Promise<LoginResponse> => {
    try {
      const response = await axiosInstance.post<any>(
        `/api/auth/p/generate-token`,
        {
          ...credentials,
          code: credentials.otpCode,
        },
      );

      logger.log('🔍 Raw Login API Response:', response.data);

      // Store tokens first
      const accessToken =
        response.data.data.accessToken ||
        response.data.data.access_token ||
        response.data.data.token;
      const refreshToken =
        response.data.data.refreshToken || response.data.data.refresh_token;

      if (!accessToken) {
        throw new Error('Invalid response: missing access token');
      }

      // Save tokens to storage immediately
      storage.setItem('access_token', accessToken);
      if (refreshToken) {
        storage.setItem('refresh_token', refreshToken);
      }

      // Now fetch user profile using the token
      logger.log('🔍 Fetching user profile...');
      const user = await authApi.getProfile();

      logger.log('✅ User profile fetched:', user);

      const mappedResponse: LoginResponse = {
        accessToken,
        refreshToken,
        user,
      };

      return mappedResponse;
    } catch (error) {
      // Clear tokens if login fails
      storage.removeItem('access_token');
      storage.removeItem('refresh_token');

      if (error instanceof ApiError) {
        // Handle specific error codes
        if (error.status === 401) {
          throw new Error('Invalid email or password');
        } else if (error.status === 429) {
          throw new Error('Too many login attempts. Please try again later');
        }
      }
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Register new user
   */
  register: async (
    credentials: RegisterCredentials,
  ): Promise<LoginResponse> => {
    try {
      const response = await axiosInstance.post<LoginResponse>(
        '/api/auth/p/register',
        credentials,
      );

      // Store tokens
      if (response.data.accessToken) {
        storage.setItem('access_token', response.data.accessToken);
      }
      if (response.data.refreshToken) {
        storage.setItem('refresh_token', response.data.refreshToken);
      }
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          throw new Error('Email already exists');
        } else if (error.status === 422) {
          throw new Error('Invalid registration data');
        }
      }
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get current user profile
   * This is used to verify if the token is still valid
   */
  getProfile: async (): Promise<User> => {
    try {
      const response = await axiosInstance.get<any>('/api/auth/b/userinfo');
      // Handle wrapped response format: { code, message, data: User }
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    try {
      await axiosInstance.delete('/api/auth/b/revoke-token');
    } catch (error) {
      // Even if logout fails, we still clear local storage
      logger.error('Logout API error:', error);
    } finally {
      // Always clear local storage
      storage.removeItem('access_token');
      storage.removeItem('refresh_token');
      storage.removeItem('user');
    }
  },

  /**
   * Refresh token
   */
  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    try {
      const response = await axiosInstance.post<any>(
        `/api/auth/p/refresh-token?refreshToken=${refreshToken}`,
        {
          refreshToken: refreshToken,
        },
      );

      // Handle different response formats
      // Refresh token API returns: { token: "hash", refreshToken: "JWT", role: "ADMIN" }
      // We use refreshToken (JWT) as access token, token (hash) as refresh token
      const accessToken =
        response.data.data?.accessToken ||
        response.data.data?.access_token ||
        response.data.refreshToken;
      const newRefreshToken =
        response.data.data?.refreshToken || response.data.token;

      // Update tokens
      if (accessToken) {
        storage.setItem('access_token', accessToken);
      }
      if (newRefreshToken) {
        storage.setItem('refresh_token', newRefreshToken);
      }

      // Fetch updated user profile
      const user = await authApi.getProfile();

      return {
        accessToken,
        refreshToken: newRefreshToken,
        user,
      };
    } catch (error) {
      // Clear tokens on refresh failure
      storage.removeItem('access_token');
      storage.removeItem('refresh_token');
      storage.removeItem('user');
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Request password reset
   */
  requestPasswordReset: async (data: ResetPasswordRequest): Promise<void> => {
    try {
      await axiosInstance.post('/auth/reset-password', data);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Confirm password reset with token
   */
  confirmPasswordReset: async (data: ResetPasswordConfirm): Promise<void> => {
    try {
      await axiosInstance.post('/auth/reset-password/confirm', data);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 400) {
          throw new Error('Invalid or expired reset token');
        }
      }
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Change password for logged in user
   */
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    try {
      await axiosInstance.put('/api/auth/b/users/changePassword', {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
        otpCode: data.otpCode,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 400) {
          throw new Error('Invalid old password');
        } else if (error.status === 401) {
          throw new Error('Invalid OTP code');
        }
      }
      throw new Error(getErrorMessage(error));
    }
  },
};

export default authApi;
