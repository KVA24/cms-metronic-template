import axiosInstance, { getErrorMessage } from '@/shared/lib/api';

// Customer Statistics
export interface CustomerStatisticsData {
  totalUsers: number;
  dailyNewUsers: number;
  monthlyNewUsers: number;
  newUsersGrowth: number;
}

export interface CustomerStatisticsResponse {
  serverTime: string;
  zoneInfo: string;
  service: string;
  sessionId: string;
  requestId: string;
  code: string;
  message: string;
  errorDesc: string;
  data: CustomerStatisticsData;
}

// Customer Dashboard
export interface DashboardDataPoint {
  date: string;
  total: number;
}

export interface CustomerDashboardData {
  data: DashboardDataPoint[];
}

export interface CustomerDashboardResponse {
  serverTime: string;
  zoneInfo: string;
  service: string;
  sessionId: string;
  requestId: string;
  code: string;
  message: string;
  errorDesc: string;
  data: CustomerDashboardData;
}

// Campaign Statistics
export interface CampaignItem {
  campaignId: number;
  campaignName: string;
  userCount: number;
  executionCount: number;
  pointsEarned: number;
  budget: number;
  budgetOrigin: number;
}

export interface CampaignStatisticsData {
  activeCampaigns: number;
  totalCampaigns: number;
  campaigns: CampaignItem[];
}

export interface CampaignStatisticsResponse {
  serverTime: string;
  zoneInfo: string;
  service: string;
  sessionId: string;
  requestId: string;
  code: string;
  message: string;
  errorDesc: string;
  data: CampaignStatisticsData;
}

// Point Statistics
export interface PointCardData {
  total: number;
  growth: number;
  avgPerUser: number;
  earnBurnRatio: number;
}

export interface PointStatisticData {
  dpeCard: PointCardData;
  mpeCard: PointCardData;
  dpdCard: PointCardData;
  mpdCard: PointCardData;
}

export interface PointStatisticResponse {
  serverTime: string;
  zoneInfo: string;
  service: string;
  sessionId: string;
  requestId: string;
  code: string;
  message: string;
  errorDesc: string;
  data: PointStatisticData;
}

// Point Chart
export interface PointChartDataPoint {
  label: string;
  earnTotal: number;
  burnTotal: number;
}

export interface PointChartData {
  data: PointChartDataPoint[];
}

export interface PointChartResponse {
  serverTime: string;
  zoneInfo: string;
  service: string;
  sessionId: string;
  requestId: string;
  code: string;
  message: string;
  errorDesc: string;
  data: PointChartData;
}

// Membership Tier Statistics
export interface TierItem {
  tierId: number;
  tierCode: string;
  tierName: string;
  totalUser: number;
  percentage: number;
}

export interface MembershipTierData {
  items: TierItem[];
  totalUser: number;
}

export interface MembershipTierResponse {
  serverTime: string;
  zoneInfo: string;
  service: string;
  sessionId: string;
  requestId: string;
  code: string;
  message: string;
  errorDesc: string;
  data: MembershipTierData;
}

// Dashboard Currency
export interface DashboardCurrency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isInternal: boolean;
  status: string;
}

export interface DashboardCurrenciesResponse {
  serverTime: string;
  zoneInfo: string;
  service: string;
  sessionId: string;
  requestId: string;
  code: string;
  message: string;
  errorDesc: string;
  data: DashboardCurrency[];
}

// Transaction Users Statistics (DTU/MTU)
export interface TransactionUsersCardData {
  count: number;
  growth: number;
  percentage: number;
}

export interface TransactionUsersData {
  dtuCount: number;
  dtuGrowth: number;
  dtuPercentage: number;
  mtuCount: number;
  mtuGrowth: number;
  mtuPercentage: number;
}

export interface TransactionUsersResponse {
  serverTime: string;
  zoneInfo: string;
  service: string;
  sessionId: string;
  requestId: string;
  code: string;
  message: string;
  errorDesc: string;
  data: TransactionUsersData;
}

// Top 100 Users
export interface Top100UserItem {
  rank: number;
  userId: string;
  partnerUserId: string;
  fullName: string;
  totalPoints: number;
}

export interface Top100UsersData {
  items: Top100UserItem[];
}

export interface Top100UsersResponse {
  serverTime: string;
  zoneInfo: string;
  service: string;
  sessionId: string;
  requestId: string;
  code: string;
  message: string;
  errorDesc: string;
  data: Top100UserItem[];
}

export const dashboardApi = {
  getCustomerStatistics: async (): Promise<CustomerStatisticsData> => {
    try {
      const response = await axiosInstance.get<CustomerStatisticsResponse>(
        '/api/ledger/b/customers/statistics',
      );
      return response.data.data || {
        totalUsers: 0,
        dailyNewUsers: 0,
        monthlyNewUsers: 0,
        newUsersGrowth: 0,
      };
    } catch (error) {
      // Return default values instead of throwing error
      return {
        totalUsers: 0,
        dailyNewUsers: 0,
        monthlyNewUsers: 0,
        newUsersGrowth: 0,
      };
    }
  },

  getCustomerDashboard: async (
    fromDate: string,
    toDate: string,
  ): Promise<DashboardDataPoint[]> => {
    try {
      const response = await axiosInstance.get<CustomerDashboardResponse>(
        '/api/ledger/b/customers/dashboard',
        {
          params: {
            fromDate,
            toDate,
          },
        },
      );
      return response.data.data?.data || [];
    } catch (error) {
      // Return empty array instead of throwing error
      return [];
    }
  },

  getCampaignStatistics: async (): Promise<CampaignStatisticsData> => {
    try {
      const response = await axiosInstance.get<CampaignStatisticsResponse>(
        '/api/campaign/b/campaigns/statistics',
      );
      return response.data.data || {
        activeCampaigns: 0,
        totalCampaigns: 0,
        campaigns: [],
      };
    } catch (error) {
      // Return default values instead of throwing error
      return {
        activeCampaigns: 0,
        totalCampaigns: 0,
        campaigns: [],
      };
    }
  },

  getMembershipTierStatistics: async (): Promise<MembershipTierData> => {
    try {
      const response = await axiosInstance.get<MembershipTierResponse>(
        '/api/membership/b/tiers/statistic',
      );
      return response.data.data || { items: [], totalUser: 0 };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getPointStatistic: async (currencyId?: string): Promise<PointStatisticData> => {
    try {
      const response = await axiosInstance.get<PointStatisticResponse>(
        '/api/ledger/b/point/statistic',
        {
          params: currencyId ? { currencyId } : undefined,
        },
      );
      return response.data.data || {
        dpeCard: { total: 0, growth: 0, avgPerUser: 0, earnBurnRatio: 0 },
        mpeCard: { total: 0, growth: 0, avgPerUser: 0, earnBurnRatio: 0 },
        dpdCard: { total: 0, growth: 0, avgPerUser: 0, earnBurnRatio: 0 },
        mpdCard: { total: 0, growth: 0, avgPerUser: 0, earnBurnRatio: 0 },
      };
    } catch (error) {
      // Return default values instead of throwing error
      return {
        dpeCard: { total: 0, growth: 0, avgPerUser: 0, earnBurnRatio: 0 },
        mpeCard: { total: 0, growth: 0, avgPerUser: 0, earnBurnRatio: 0 },
        dpdCard: { total: 0, growth: 0, avgPerUser: 0, earnBurnRatio: 0 },
        mpdCard: { total: 0, growth: 0, avgPerUser: 0, earnBurnRatio: 0 },
      };
    }
  },

  getDailyPointChart: async (
    fromDate: string,
    toDate: string,
    currencyId?: string,
  ): Promise<PointChartDataPoint[]> => {
    try {
      const response = await axiosInstance.get<PointChartResponse>(
        '/api/ledger/b/point/chart/daily',
        {
          params: {
            fromDate,
            toDate,
            ...(currencyId && { currencyId }),
          },
        },
      );
      return response.data.data?.data || [];
    } catch (error) {
      // Return empty array instead of throwing error
      return [];
    }
  },

  getMonthlyPointChart: async (
    fromDate: string,
    toDate: string,
    currencyId?: string,
  ): Promise<PointChartDataPoint[]> => {
    try {
      const response = await axiosInstance.get<PointChartResponse>(
        '/api/ledger/b/point/chart/monthly',
        {
          params: {
            fromDate,
            toDate,
            ...(currencyId && { currencyId }),
          },
        },
      );
      return response.data.data?.data || [];
    } catch (error) {
      // Return empty array instead of throwing error
      return [];
    }
  },

  getDashboardCurrencies: async (): Promise<DashboardCurrency[]> => {
    try {
      const response = await axiosInstance.get<DashboardCurrenciesResponse>(
        '/api/config/b/currencies',
      );
      return response.data.data || [];
    } catch (error) {
      // Return empty array instead of throwing error
      return [];
    }
  },

  getTransactionUsers: async (): Promise<TransactionUsersData> => {
    try {
      const response = await axiosInstance.get<TransactionUsersResponse>(
        '/api/ledger/b/transaction-users',
      );
      return response.data.data || {
        dtuCount: 0,
        dtuGrowth: 0,
        dtuPercentage: 0,
        mtuCount: 0,
        mtuGrowth: 0,
        mtuPercentage: 0,
      };
    } catch (error) {
      // Return default values instead of throwing error
      return {
        dtuCount: 0,
        dtuGrowth: 0,
        dtuPercentage: 0,
        mtuCount: 0,
        mtuGrowth: 0,
        mtuPercentage: 0,
      };
    }
  },

  getTop100Users: async (currencyId: string): Promise<Top100UserItem[]> => {
    try {
      const response = await axiosInstance.get<Top100UsersResponse>(
        '/api/ledger/b/customers/top-100',
        {
          params: {
            currencyId,
          },
        },
      );
      return response.data.data || [];
    } catch (error) {
      // Return empty array instead of throwing error
      return [];
    }
  },

  exportTop100Users: async (currencyId: string): Promise<Blob> => {
    try {
      const response = await axiosInstance.get(
        '/api/ledger/b/customers/top-100/export',
        {
          params: {
            currencyId,
          },
          responseType: 'blob',
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
