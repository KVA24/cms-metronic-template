import axiosInstance, { getErrorMessage } from '@/shared/lib/api';

export interface CustomerLocation {
  regionId?: string;
  regionName?: string;
  provinceId?: string;
  provinceName?: string;
  districtId?: string;
  districtName?: string;
  wardId?: string;
  wardName?: string;
  address?: string;
  lat?: string;
  lng?: string;
}

export interface CurrencyDetail {
  id: number;
  name: string;
  code: string;
  sourceType: string;
  isPoint: boolean;
}

export interface AccountBalance {
  customerId: string;
  accountId: number;
  currencyId: number;
  availablePoints: number;
  holdPoints: number;
  pendingPoints: number;
  asOf: string;
  status: string;
  currencyDetail?: CurrencyDetail;
}

export interface Customer {
  customerId: string;
  referenceId: string;
  fullName: string;
  status: 'ACTIVE' | 'INACTIVE';
  customerTier: string;
  cardNumber: string;
  createdAt: string;
}

export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';

export interface CustomerStatusUpdateParams {
  customerId: string;
  status: CustomerStatus;
  otpCode: string;
}

export interface UserListParams {
  pageSize?: number;
  next?: string | number;
  pre?: string | number;
  id?: string;
  fullName?: string;
  cardNumber?: string;
  tierId?: number;
}

export interface PointHistoryParams {
  customerId: string;
  pageNo?: number;
  pageSize?: number;
  eventTypes?: string[];
  from?: string;
  to?: string;
}

export interface PointHistoryResponse {
  data: {
    pageInfo: PageInfo;
    data: import('@/features/users/api/pointHistoryApi').PointHistoryEntry[];
  };
}

export interface PageInfo {
  pageNo: number;
  pageSize: number;
  totalCount: number;
  totalPage: number;
}

export interface Metadata {
  pageSize: number;
  hasNextPage?: boolean;
  hasPrePage?: boolean;
  next?: string | number;
  pre?: string | number;
}

export interface UserListResponse {
  data: {
    metadata: Metadata;
    data: Customer[];
  };
}

export interface AdjustPointPayload {
  customerId: string;
  accountId: string;
  entryDirection: 'CREDIT' | 'DEBIT';
  note: string;
  idempotencyKey: string;
  points: number;
  partnerId: string;
  serviceId: string;
  otpCode: string;
}

/**
 * User Management API Service
 */
export const userApi = {
  /**
   * Get customer list
   */
  getList: async (params: UserListParams): Promise<UserListResponse> => {
    try {
      const response = await axiosInstance.get<UserListResponse>(
        '/api/ledger/b/customers',
        { params },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Update customer status
   */
  updateStatus: async (
    params: CustomerStatusUpdateParams,
  ): Promise<void> => {
    try {
      await axiosInstance.put('/api/ledger/b/customers/status', null, {
        params: {
          customerId: params.customerId,
          status: params.status,
        },
      });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get single customer by ID
   */
  getCustomerById: async (customerId: string): Promise<Customer> => {
    try {
      const response = await axiosInstance.get<{ data: Customer }>(
        `/api/ledger/b/customers/${customerId}`,
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get customer account balances
   */
  getDetailBalance: async (customerId: string): Promise<AccountBalance[]> => {
    try {
      const response = await axiosInstance.get<{ data: AccountBalance[] }>(
        `/api/ledger/b/accounts/balances/points`,
        { params: { customerId } },
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get point history
   */
  getPointHistory: async (
    params: PointHistoryParams,
  ): Promise<PointHistoryResponse> => {
    try {
      const { eventTypes, ...rest } = params || {};

      const parts: string[] = Object.entries(rest)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);

      if (eventTypes?.length) {
        parts.push(`eventTypes=${eventTypes.join(',')}`);
      }

      const qs = parts.length ? `?${parts.join('&')}` : '';
      const response = await axiosInstance.get<PointHistoryResponse>(
        `/api/ledger/b/customers/point/histories${qs}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Export customers to Excel
   */
  exportToExcel: async (params: UserListParams): Promise<Blob> => {
    try {
      const response = await axiosInstance.get(
        '/api/ledger/b/customers/export-excel',
        { params, responseType: 'blob' },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Adjust user points
   */
  adjustPoint: async (
    payload: AdjustPointPayload,
  ): Promise<void> => {
    try {
      await axiosInstance.post(
        `/api/ledger/b/accounts/point-adjustments`,
        payload,
      );
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

export default userApi;
