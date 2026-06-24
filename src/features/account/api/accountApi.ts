import axiosInstance, { ApiError, getErrorMessage } from '@/shared/lib/api';

export interface AccountRole {
  roleId: string;
  roleCode: string;
  roleName: string;
}

export interface AccountRoleOption {
  id: number;
  name: string;
  code: string;
}

export interface Account {
  id: string;
  username: string;
  role: 'ADMIN' | 'AGENCY' | 'SUPPORT';
  roles: AccountRole[];
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  avatarUrl?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AccountListResponse {
  pageInfo: {
    pageNo: number;
    pageSize: number;
    totalCount: number;
    totalPage: number;
  };
  data: Account[];
}

export interface AccountCreateDto {
  username: string;
  password: string;
  role: 'ADMIN' | 'AGENCY' | 'SUPPORT';
  roles?: AccountRole[];
  roleIds?: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  avatarUrl?: string;
  otpCode?: string;
}

export interface AccountUpdateDto {
  username?: string;
  role?: 'ADMIN' | 'AGENCY' | 'SUPPORT';
  roles?: AccountRole[];
  roleIds?: string[];
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  avatarUrl?: string;
  otpCode?: string;
}

export interface AccountListParams {
  page?: number;
  size?: number;
  username?: string;
  role?: string;
  status?: string;
}

export interface AccountDeleteDto {
  otpCode: string;
  sign?: string;
}

/**
 * Account API Service
 */
export const accountApi = {
  /**
   * Get list of available roles
   */
  getRoles: async (): Promise<AccountRoleOption[]> => {
    try {
      const response = await axiosInstance.get<{ data: AccountRoleOption[] }>(
        '/api/auth/b/users/role',
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get list of accounts with pagination and filters
   */
  getList: async (
    params: AccountListParams = {},
  ): Promise<AccountListResponse> => {
    try {
      const response = await axiosInstance.get<AccountListResponse>(
        '/api/auth/b/users',
        {
          params: {
            page: params.page || 0,
            size: params.size || 10,
            username: params.username,
            role: params.role,
            status: params.status,
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get account detail by ID
   */
  getDetail: async (id: string): Promise<Account> => {
    try {
      const response = await axiosInstance.get<{ data: Account }>(
        `/api/auth/b/users/${id}`,
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Create new account
   */
  create: async (data: AccountCreateDto): Promise<Account> => {
    try {
      const response = await axiosInstance.post<Account>(
        `/api/auth/b/users`,
        data,
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          throw new Error('Username already exists');
        } else if (error.status === 422) {
          throw new Error('Invalid account data');
        }
      }
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Update existing account
   */
  update: async (id: string, data: AccountUpdateDto): Promise<Account> => {
    try {
      const response = await axiosInstance.put<Account>(
        `/api/auth/b/users/${id}`,
        data,
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          throw new Error('Account not found');
        } else if (error.status === 409) {
          throw new Error('Username already exists');
        }
      }
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Delete account
   */
  delete: async (id: string, data: AccountDeleteDto): Promise<void> => {
    try {
      await axiosInstance.delete(
        `/api/auth/b/users/${id}?otpCode=${data.otpCode}`,
        {
          data: {
            otpCode: data.otpCode,
          },
        },
      );
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          throw new Error('Account not found');
        } else if (error.status === 403) {
          throw new Error('Invalid OTP code');
        }
      }
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get QR code for account
   */
  getQRCode: async (username: string): Promise<string> => {
    try {
      const response = await axiosInstance.get<string>(
        `/api/auth/b/2fa/qrcode/${username}`,
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          throw new Error('Account not found');
        }
      }
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Toggle account status between ACTIVE and INACTIVE
   */
  updateStatus: async (
    id: string,
    status: 'ACTIVE' | 'INACTIVE',
    otpCode?: string,
  ): Promise<void> => {
    try {
      await axiosInstance.put(`/api/auth/b/users/${id}/status`, {
        status,
        ...(otpCode && { otpCode }),
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new Error('Account not found');
      }
      throw new Error(getErrorMessage(error));
    }
  },

  resetSalt: async (username: string): Promise<string> => {
    try {
      const response = await axiosInstance.get<string>(
        `/api/auth/b/2fa/reset-salt/${username}`,
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          throw new Error('Account not found');
        }
      }
      throw new Error(getErrorMessage(error));
    }
  },
};

export default accountApi;
