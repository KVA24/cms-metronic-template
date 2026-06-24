import axiosInstance, { getErrorMessage } from '@/shared/lib/api';

export interface RedemptionTransaction {
  id: number;
  userId: number;
  referenceId?: string;
  cardNumber?: string;
  rewardCatalogId: number;
  rewardCatalogName: string;
  rewardCodeId: number;
  pointCostSnapshot: number;
  ledgerEntryRef: string;
  idempotencyKey: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  createdAt: string;
}

export interface RedemptionTransactionMetadata {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  next?: string | number;
  prev?: string | number;
  pageSize: number;
}

export interface RedemptionTransactionListResponse {
  data: RedemptionTransaction[];
  metadata: RedemptionTransactionMetadata;
}

export interface RedemptionTransactionSearchParams {
  page?: number;
  pageSize?: number;
  userId?: string;
  referenceId?: string;
  cardNumber?: string;
  rewardCatalogId?: string;
  status?: string;
  transactionId?: string;
  fromDate?: string;
  toDate?: string;
  cursor?: string | number;
  direction?: 'NEXT' | 'PREV';
}

export interface RedemptionTransactionExportParams {
  referenceId?: string;
  cardNumber?: string;
  rewardCatalogId?: string;
  status?: string;
  transactionId?: string;
  fromDate?: string;
  toDate?: string;
}

/**
 * Redemption Transaction API Service
 */
export const redemptionTransactionApi = {
  /**
   * Get list of redemption transactions with pagination
   */
  getList: async (
    params?: RedemptionTransactionSearchParams,
  ): Promise<RedemptionTransactionListResponse> => {
    try {
      const response = await axiosInstance.post<RedemptionTransactionListResponse>(
        '/api/reward/b/admin/reward-transactions/search',
        params || {},
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Export redemption transactions to Excel
   */
  exportToExcel: async (
    params?: RedemptionTransactionExportParams,
  ): Promise<Blob> => {
    try {
      const response = await axiosInstance.post<Blob>(
        '/api/reward/b/reward-transaction/export',
        params || {},
        {
          responseType: 'blob',
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

export default redemptionTransactionApi;
