import { dashboardApi } from '@/features/dashboards/api/dashboardApi';
import { useQuery } from '@tanstack/react-query';
import { useExportWithTimestamp } from '@/shared/hooks/use-export';

// Query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  customerStatistics: () => ['dashboard', 'customerStatistics'] as const,
  customerDashboard: (fromDate: string, toDate: string) =>
    ['dashboard', 'customerDashboard', fromDate, toDate] as const,
  campaignStatistics: () => ['dashboard', 'campaignStatistics'] as const,
  membershipTierStatistics: () =>
    ['dashboard', 'membershipTierStatistics'] as const,
  pointStatistic: (currencyId?: string) => 
    ['dashboard', 'pointStatistic', currencyId] as const,
  dailyPointChart: (fromDate: string, toDate: string, currencyId?: string) =>
    ['dashboard', 'dailyPointChart', fromDate, toDate, currencyId] as const,
  monthlyPointChart: (fromDate: string, toDate: string, currencyId?: string) =>
    ['dashboard', 'monthlyPointChart', fromDate, toDate, currencyId] as const,
  currencies: () => ['dashboard', 'currencies'] as const,
  transactionUsers: () => ['dashboard', 'transactionUsers'] as const,
  top100Users: (currencyId?: string) => ['dashboard', 'top100Users', currencyId] as const,
};

/**
 * Hook to fetch customer statistics
 */
export function useCustomerStatistics() {
  return useQuery({
    queryKey: dashboardKeys.customerStatistics(),
    queryFn: () => dashboardApi.getCustomerStatistics(),
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

/**
 * Hook to fetch campaign statistics
 */
export function useCampaignStatistics() {
  return useQuery({
    queryKey: dashboardKeys.campaignStatistics(),
    queryFn: () => dashboardApi.getCampaignStatistics(),
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

/**
 * Hook to fetch membership tier statistics
 */
export function useMembershipTierStatistics() {
  return useQuery({
    queryKey: dashboardKeys.membershipTierStatistics(),
    queryFn: () => dashboardApi.getMembershipTierStatistics(),
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

/**
 * Hook to fetch customer dashboard data with date range
 */
export function useCustomerDashboard(fromDate: string, toDate: string) {
  return useQuery({
    queryKey: dashboardKeys.customerDashboard(fromDate, toDate),
    queryFn: () => dashboardApi.getCustomerDashboard(fromDate, toDate),
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

/**
 * Hook to fetch point statistic data (with optional currencyId)
 * Only fetches when currencyId is provided
 */
export function usePointStatistic(currencyId?: string) {
  return useQuery({
    queryKey: dashboardKeys.pointStatistic(currencyId),
    queryFn: () => dashboardApi.getPointStatistic(currencyId),
    retry: false,
    enabled: !!currencyId, // Only fetch when currencyId is available
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

/**
 * Hook to fetch daily point chart data with date range and optional currencyId
 * Only fetches when currencyId is provided
 */
export function useDailyPointChart(fromDate: string, toDate: string, currencyId?: string) {
  return useQuery({
    queryKey: dashboardKeys.dailyPointChart(fromDate, toDate, currencyId),
    queryFn: () => dashboardApi.getDailyPointChart(fromDate, toDate, currencyId),
    retry: false,
    enabled: !!currencyId,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

/**
 * Hook to fetch monthly point chart data with date range and optional currencyId
 * Only fetches when currencyId is provided
 */
export function useMonthlyPointChart(fromDate: string, toDate: string, currencyId?: string) {
  return useQuery({
    queryKey: dashboardKeys.monthlyPointChart(fromDate, toDate, currencyId),
    queryFn: () => dashboardApi.getMonthlyPointChart(fromDate, toDate, currencyId),
    retry: false,
    enabled: !!currencyId, // Only fetch when currencyId is available
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

/**
 * Hook to fetch dashboard currencies
 */
export function useDashboardCurrencies() {
  return useQuery({
    queryKey: dashboardKeys.currencies(),
    queryFn: () => dashboardApi.getDashboardCurrencies(),
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

/**
 * Hook to fetch transaction users statistics (DTU and MTU)
 */
export function useTransactionUsers() {
  return useQuery({
    queryKey: dashboardKeys.transactionUsers(),
    queryFn: () => dashboardApi.getTransactionUsers(),
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

/**
 * Hook to fetch top 100 users
 * Only fetches when currencyId is provided
 */
export function useTop100Users(currencyId?: string) {
  return useQuery({
    queryKey: dashboardKeys.top100Users(currencyId),
    queryFn: () => dashboardApi.getTop100Users(currencyId || ''),
    retry: false,
    enabled: !!currencyId, // Only fetch when currencyId is available
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

/**
 * Hook to export top 100 users to Excel
 */
export function useExportTop100Users() {
  return useExportWithTimestamp({
    exportFn: (currencyId: string) => dashboardApi.exportTop100Users(currencyId),
    filenamePrefix: 'top-100-users',
    extension: 'xlsx',
    successMessage: 'Top 100 users exported successfully',
    errorMessage: 'Failed to export top 100 users',
  });
}
