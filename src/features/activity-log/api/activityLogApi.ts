import axiosInstance, { getErrorMessage } from '@/shared/lib/api';

export interface ActionLog {
  id: string;
  username: string;
  accountRole: string;
  actionType: string;
  module: string;
  pathUri: string;
  ipClient: string;
  createdAt: number;
  description: string;
  detail: Record<string, any>;
}

export interface ActivityLogListParams {
  limit?: number;
  pre?: number;
  next?: number;
  username?: string;
  accountRole?: string;
  actionType?: string;
  gte?: string;
  lte?: string;
}

export interface ActivityLogListResponse {
  data: ActionLog[];
  metadata: {
    next: number | null;
    pre: number | null;
    hasNextPage: boolean;
    hasPrePage: boolean;
    pageSize: number;
  };
}

/**
 * Activity Log API Service
 */
export const activityLogApi = {
  /**
   * Get activity log list
   */
  getList: async (
    params: ActivityLogListParams,
  ): Promise<ActivityLogListResponse> => {
    try {
      const response = await axiosInstance.get<ActivityLogListResponse>(
        '/api/config/b/action-log',
        { params },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

export default activityLogApi;
