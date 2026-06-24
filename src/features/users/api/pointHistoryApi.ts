import axiosInstance, { getErrorMessage } from '@/shared/lib/api';

export type PointEventType =
  | 'EARN'
  | 'SPEND'
  | 'EXPIRE'
  | 'ADJUST'
  | 'TRANSFER'
  | 'REVERSAL';

export interface PointHistorySource {
  sourceType: string;
  sourceReference: string;
  sourceSubReference: string;
}

export interface PointHistoryEntry {
  entryId: number;
  occurredAt: string;
  eventType: PointEventType;
  businessContext: string;
  entryDirection: 'CREDIT' | 'DEBIT';
  points: number;
  idempotencyKey: string;
  sourceType: string;
  sourceReference: string;
  sourceSubReference: string;
  source: PointHistorySource;
  note: string;
  metadata: Record<string, unknown>;
  snapshotPoints: number;
}

export interface PointHistoryPageInfo {
  pageNo: number;
  pageSize: number;
  totalCount: number;
  totalPage: number;
}

export interface PointHistorySummary {
  availablePoints: number;
  accumulatedPoints: number;
  expiredPoints: number;
  usedPoints: number;
}

export interface PointHistoryResponse {
  data: PointHistorySummary & {
    pagePointHistory: {
      pageInfo: PointHistoryPageInfo;
      data: PointHistoryEntry[];
    };
  };
}

export interface PointHistoryParams {
  customerId?: string;
  accountId?: string;
  eventTypes?: PointEventType[];
  from?: string;
  to?: string;
  pageSize?: number;
  pageNo?: number;
}

export const pointHistoryApi = {
  getList: async (
    params?: PointHistoryParams,
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
};

export default pointHistoryApi;
