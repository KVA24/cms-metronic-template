import axiosInstance, { getErrorMessage } from '@/shared/lib/api';
import logger from '@/shared/lib/logger';

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';
export type ExpireType = 'NO_EXPIRE' | 'EXPIRE_BY_PERIOD';
export type ExpirePeriodOption =
  | 'EVERY_MONTH'
  | 'EVERY_QUARTER'
  | 'EVERY_HALF_YEAR'
  | 'EVERY_YEAR'
  | 'FIX_MONTH';
export type PointEarnMethod = 'FIX_AMOUNT' | 'FORMULAR';
export type ValidationOperator = 'AND' | 'OR';
export type LimitationType = '' | 'DAYS' | 'DAYS_AND_HOURS';
export type PeriodUnit = 'UNSET' | 'DAY' | 'WEEK' | 'MONTH' | 'FOREVER';
export type CampaignStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'SCHEDULED'
  | 'ENDED'
  | 'PAUSED';

export interface TimeRange {
  hour: number;
  minute: number;
  second: number;
  nano: number;
}

export interface TimeLimitation {
  startTime: TimeRange | string;
  endTime: TimeRange | string;
  dayOfWeeks: DayOfWeek[];
}

export interface ValidationRule {
  validationRuleId: string;
  operator: ValidationOperator;
  ruleForm: string;
  ruleName?: string;
}

export interface EarningRule {
  name: string;
  eventId: string;
  pointEarnMethod: PointEarnMethod;
  fixAmount: number;
  formular: string;
  budget: number;
  budgetOrigin: number;
  isPendingPoint: boolean;
  pendingDay: number;
  validationRuleId: ValidationRule[];
}

export interface Campaign {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  mobileApp: string;
  metadata?: string;
  status: CampaignStatus;
  startAt: string;
  endAt: string;
  currencyId: string;
  policyId?: string;
  partnerId?: string;
  partnerServiceId?: string;
  limitationType: LimitationType;
  timeLimitations: TimeLimitation[];
  expireType: ExpireType;
  expirePeriodOption: ExpirePeriodOption;
  expirePeriodOptionExtra: number;
  periodUnit?: PeriodUnit;
  periodValue?: number;
  rule: EarningRule;
  rules: EarningRule[];
  createdAt: number;
  isNoEndDate: boolean;
  budget: number;
  budgetOrigin: number;
  totalPointAwarded: number;
  totalTransaction: number;
}

export interface PageInfo {
  pageNo: number;
  pageSize: number;
  totalCount: number;
  totalPage: number;
}

export interface CampaignListResponse {
  pageInfo: PageInfo;
  data: Campaign[];
}

export interface CampaignCreateDto {
  name: string;
  categoryId: string;
  description: string;
  mobileApp: string;
  metadata?: string;
  startAt: string;
  endAt?: string;
  partnerId: string;
  partnerServiceId: string;
  limitationType: LimitationType;
  timeLimitations: TimeLimitation[];
  expireType: ExpireType;
  expirePeriodOption: ExpirePeriodOption;
  expirePeriodOptionExtra: number;
  periodUnit?: PeriodUnit;
  periodValue?: number;
  rule: EarningRule;
}

export interface CampaignUpdateDto extends CampaignCreateDto {}

export interface CampaignSearchParams {
  page?: number;
  size?: number;
  name?: string;
  status?: CampaignStatus;
}

export interface CampaignDeleteParams {
  sign?: string;
  otpCode?: string;
}

export interface CampaignStatusUpdateParams {
  targetStatus: CampaignStatus;
}

export interface CampaignAddBudgetParams {
  campaignId: string;
  amount: number;
  otpCode: string;
}

export interface CampaignTransaction {
  transactionId: string;
  userId: string;
  referenceId: string;
  userName: string;
  cardNumber?: string;
  tierId: number;
  tierCode: string;
  tierName: string;
  occurredAt: number;
  createdAt: number;
  currencyId: number;
  points: number;
  note: string;
}

export interface CampaignTransactionMetadata {
  next: string | null;
  pre: string | null;
  hasNextPage: boolean;
  hasPrePage: boolean;
  pageSize: number;
}

export interface CampaignTransactionResponse {
  data: CampaignTransaction[];
  metadata: CampaignTransactionMetadata;
  totalTransactions?: number;
  totalPointsAwarded?: number;
}

export interface CampaignTransactionParams {
  campaignId: string;
  transactionId?: string;
  userId?: string;
  referenceId?: string;
  userName?: string;
  cardNumber?: string;
  gte?: string;
  lte?: string;
  next?: string;
  pre?: string;
  limit?: number;
}

export interface CampaignTransactionExportParams {
  campaignId: string;
  transactionId?: string;
  userId?: string;
  userName?: string;
  cardNumber?: string;
  gte?: string;
  lte?: string;
}

// Campaign Analytics - New API Types
export interface ActiveUsersStatistics {
  totalUniqueUsers: number;
  dauToday: number;
  dauYesterday: number;
  dauGrowthRate: number;
  mauThisMonth: number;
  mauLastMonth: number;
  mauGrowthRate: number;
}

export interface TierData {
  tierCode: string;
  tierName: string;
  count: number;
  percentage: number;
}

export interface TierStatistics {
  totalCount: number;
  tiers: TierData[];
}

export interface PointsBudgetStatistics {
  totalPoints: number;
  totalUniqueUsers: number;
  avgPointsPerUser: number;
  budget: number;
  budgetOrigin: number;
  budgetUsedRate: number;
}

export interface DailyPointsEntry {
  date: string;
  totalPoints: number;
}

export interface DashboardPointsStatistics {
  totalPoints: number;
  daily: DailyPointsEntry[];
}

export interface DailyUsersEntry {
  date: string;
  userCount: number;
}

export interface DashboardActiveUsersStatistics {
  totalUniqueUsers: number;
  daily: DailyUsersEntry[];
}

// Legacy types (for backward compatibility)
export interface CampaignAnalyticsDailyEntry {
  day: number;
  users?: number;
  points?: number;
}

export interface CampaignAnalyticsData {
  totalActiveUsers: number;
  totalGrowth: number;
  dau: { current: number; growth: number };
  mau: { current: number; growth: number };
  totalPointsEarned: number;
  pointsGrowth: number;
  budget: {
    total: number;
    used: number;
    percentage: number;
  };
  usersByTier: {
    [tierName: string]: { count: number; percentage: number };
  };
  dailyUsers: CampaignAnalyticsDailyEntry[];
  dailyPoints: CampaignAnalyticsDailyEntry[];
}

export interface CampaignAnalyticsParams {
  campaignId: string;
  month: string; // format: 'yyyy-MM'
}

/**
 * Campaign API Service
 */
export const campaignApi = {
  /**
   * Get list of campaigns with pagination and search
   */
  getList: async (
    params?: CampaignSearchParams,
  ): Promise<CampaignListResponse> => {
    try {
      const response = await axiosInstance.get<CampaignListResponse>(
        '/api/campaign/b/campaigns/search',
        {
          params,
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get campaign detail by ID
   */
  getDetail: async (id: string): Promise<Campaign> => {
    try {
      const response = await axiosInstance.get<{ data: Campaign }>(
        `/api/campaign/b/campaigns/${id}`,
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Create new campaign
   */
  create: async (data: CampaignCreateDto): Promise<Campaign> => {
    try {
      logger.log('API create campaign called:', { data });

      const response = await axiosInstance.post<Campaign>(
        `/api/campaign/b/campaigns`,
        data,
      );
      logger.log('API create campaign response:', response.data);
      return response.data;
    } catch (error) {
      logger.error('API create campaign error:', error);
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Update existing campaign
   */
  update: async (
    id: string,
    data: CampaignUpdateDto,
  ): Promise<Campaign> => {
    try {
      logger.log('API update campaign called:', { id, data });

      const response = await axiosInstance.put<Campaign>(
        `/api/campaign/b/campaigns/${id}`,
        data,
      );
      logger.log('API update campaign response:', response.data);
      return response.data;
    } catch (error) {
      logger.error('API update campaign error:', error);
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Update campaign status
   */
  updateStatus: async (
    id: string,
    params: CampaignStatusUpdateParams,
  ): Promise<Campaign> => {
    try {
      logger.log('API update campaign status called:', { id, params });

      const response = await axiosInstance.put<Campaign>(
        `/api/campaign/b/campaigns/${id}/status`,
        params,
      );
      logger.log('API update campaign status response:', response.data);
      return response.data;
    } catch (error) {
      logger.error('API update campaign status error:', error);
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Delete campaign
   */
  delete: async (id: string, params: CampaignDeleteParams): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/campaign/b/campaigns/${id}?id=${id}`, {
        params,
      });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Add budget to campaign
   */
  addBudget: async (
    params: CampaignAddBudgetParams,
  ): Promise<Campaign> => {
    try {
      logger.log('API add budget called:', { params });

      const response = await axiosInstance.post<Campaign>(
        `/api/campaign/b/campaigns/add-budget`,
        params,
      );
      logger.log('API add budget response:', response.data);
      return response.data;
    } catch (error) {
      logger.error('API add budget error:', error);
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get campaign transactions
   */
  getTransactions: async (
    params: CampaignTransactionParams,
  ): Promise<CampaignTransactionResponse> => {
    try {
      const response = await axiosInstance.get<{
        data: CampaignTransactionResponse;
      }>('/api/ledger/b/campaign/transactions', {
        params,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Export campaign transactions to Excel
   */
  exportTransactions: async (
    params: CampaignTransactionExportParams,
  ): Promise<Blob> => {
    try {
      const response = await axiosInstance.get(
        '/api/ledger/b/campaign/transactions/export-excel',
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

  /**
   * Get campaign analytics/dashboard data
   */
  getAnalytics: async (
    params: CampaignAnalyticsParams,
  ): Promise<CampaignAnalyticsData> => {
    try {
      const response = await axiosInstance.get<{ data: CampaignAnalyticsData }>(
        `/api/campaign/b/campaigns/${params.campaignId}/analytics`,
        { params: { month: params.month } },
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get active users statistics
   */
  getActiveUsersStatistics: async (
    campaignId: string,
  ): Promise<ActiveUsersStatistics> => {
    try {
      const response = await axiosInstance.get<{ data: ActiveUsersStatistics }>(
        `/api/campaign/b/campaigns/statistics/active-users`,
        { params: { campaignId } },
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get tier statistics
   */
  getTierStatistics: async (campaignId: string): Promise<TierStatistics> => {
    try {
      const response = await axiosInstance.get<{ data: TierStatistics }>(
        `/api/campaign/b/campaigns/statistics/tier`,
        { params: { campaignId } },
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get points and budget statistics
   */
  getPointsBudgetStatistics: async (
    campaignId: string,
  ): Promise<PointsBudgetStatistics> => {
    try {
      const response = await axiosInstance.get<{
        data: PointsBudgetStatistics;
      }>(`/api/campaign/b/campaigns/statistics/points-budget`, {
        params: { campaignId },
      });
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get dashboard points statistics with date range
   */
  getDashboardPoints: async (
    campaignId: string,
    fromDate: string,
    toDate: string,
  ): Promise<DashboardPointsStatistics> => {
    try {
      const response = await axiosInstance.get<{
        data: DashboardPointsStatistics;
      }>(`/api/campaign/b/campaigns/statistics/dashboard/points`, {
        params: { campaignId, fromDate, toDate },
      });
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get dashboard active users statistics with date range
   */
  getDashboardActiveUsers: async (
    campaignId: string,
    fromDate: string,
    toDate: string,
  ): Promise<DashboardActiveUsersStatistics> => {
    try {
      const response = await axiosInstance.get<{
        data: DashboardActiveUsersStatistics;
      }>(`/api/campaign/b/campaigns/statistics/dashboard/active-users`, {
        params: { campaignId, fromDate, toDate },
      });
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

export default campaignApi;
