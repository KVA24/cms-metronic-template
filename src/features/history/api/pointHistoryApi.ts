import axiosInstance, { getErrorMessage } from '@/shared/lib/api';

export type PointType = 'DIAMOND' | 'GOLD' | 'SILVER';

export interface PointTransaction {
  id: number;
  customerId: string;
  fullName: string;
  cardNumber: string;
  partnerId: string;
  partnerName: string;
  serviceCode: string;
  entryDirection: 'CREDIT' | 'DEBIT';
  points: number;
  pointType: PointType;
  occurred_at: string;
  note: string;
}

export interface PointTransactionMetadata {
  next: string;
  pre: string;
  hasNextPage: boolean;
  hasPrePage: boolean;
  pageSize: number;
}

export interface PointTransactionResponse {
  data: PointTransaction[];
  metadata: PointTransactionMetadata;
}

export interface PointTransactionParams {
  partnerId?: string;
  serviceCode?: string;
  entryDirection?: 'CREDIT' | 'DEBIT';
  from?: string;
  to?: string;
  keyword?: string;
  next?: string;
  pre?: string;
  pageSize?: number;
}

export interface PointTransactionExportParams {
  partnerId?: string;
  serviceCode?: string;
  entryDirection?: 'CREDIT' | 'DEBIT';
  from?: string;
  to?: string;
  keyword?: string;
}

export const pointHistoryApi = {
  getList: async (
    params?: PointTransactionParams,
  ): Promise<PointTransactionResponse> => {
    try {
      const parts: string[] = Object.entries(params || {})
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);

      const qs = parts.length ? `?${parts.join('&')}` : '';

      const response = await axiosInstance.get<{
        data: PointTransactionResponse;
      }>(`/api/ledger/b/point/transactions${qs}`);
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  exportToExcel: async (
    params?: PointTransactionExportParams,
  ): Promise<Blob> => {
    try {
      const response = await axiosInstance.get(
        '/api/ledger/b/point/transactions/export-excel',
        {
          params,
          responseType: 'blob',
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

export default pointHistoryApi;
