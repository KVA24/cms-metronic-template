import {
  CampaignAddBudgetParams,
  CampaignAnalyticsParams,
  campaignApi,
  CampaignCreateDto,
  CampaignSearchParams,
  CampaignStatus,
  CampaignTransactionExportParams,
  CampaignTransactionParams,
  CampaignUpdateDto,
} from '@/features/campaigns/api/campaignApi';
import { useExportWithId } from '@/shared/hooks/use-export';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Query keys
export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => ['campaigns', 'list'] as const,
  list: (params: CampaignSearchParams) => {
    const key: (string | number)[] = ['campaigns', 'list'];
    if (params.page !== undefined) {
      key.push('page');
      key.push(params.page);
    }
    if (params.size !== undefined) {
      key.push('size');
      key.push(params.size);
    }
    if (params.name) {
      key.push('name');
      key.push(params.name);
    }
    if (params.status) {
      key.push('status');
      key.push(params.status);
    }
    return key;
  },
  details: () => ['campaigns', 'detail'] as const,
  detail: (id: string) => ['campaigns', 'detail', id] as const,
  analytics: (campaignId: string, month: string) =>
    ['campaigns', 'analytics', campaignId, month] as const,
  transactions: (params: CampaignTransactionParams) => {
    const key: (string | number)[] = ['campaigns', 'transactions'];
    if (params.campaignId) {
      key.push('campaignId');
      key.push(params.campaignId);
    }
    if (params.transactionId) {
      key.push('transactionId');
      key.push(params.transactionId);
    }
    if (params.userId) {
      key.push('userId');
      key.push(params.userId);
    }
    if (params.referenceId) {
      key.push('referenceId');
      key.push(params.referenceId);
    }
    if (params.userName) {
      key.push('userName');
      key.push(params.userName);
    }
    if (params.cardNumber) {
      key.push('cardNumber');
      key.push(params.cardNumber);
    }
    if (params.gte !== undefined) {
      key.push('gte');
      key.push(params.gte);
    }
    if (params.lte !== undefined) {
      key.push('lte');
      key.push(params.lte);
    }
    if (params.next !== undefined) {
      key.push('next');
      key.push(params.next);
    }
    if (params.pre !== undefined) {
      key.push('pre');
      key.push(params.pre);
    }
    if (params.limit !== undefined) {
      key.push('limit');
      key.push(params.limit);
    }
    return key;
  },
  statistics: {
    activeUsers: (campaignId: string) =>
      ['campaigns', 'statistics', 'active-users', campaignId] as const,
    tier: (campaignId: string) =>
      ['campaigns', 'statistics', 'tier', campaignId] as const,
    pointsBudget: (campaignId: string) =>
      ['campaigns', 'statistics', 'points-budget', campaignId] as const,
    dashboardPoints: (campaignId: string, fromDate: string, toDate: string) =>
      [
        'campaigns',
        'statistics',
        'dashboard-points',
        campaignId,
        fromDate,
        toDate,
      ] as const,
    dashboardActiveUsers: (
      campaignId: string,
      fromDate: string,
      toDate: string,
    ) =>
      [
        'campaigns',
        'statistics',
        'dashboard-active-users',
        campaignId,
        fromDate,
        toDate,
      ] as const,
  },
};

/**
 * Hook to fetch campaign list with pagination and filters
 */
export function useCampaignList(params: CampaignSearchParams) {
  return useQuery({
    queryKey: campaignKeys.list(params),
    queryFn: () => campaignApi.getList(params),
    retry: false,
  });
}

/**
 * Hook to fetch campaign detail by ID
 */
export function useCampaignDetail(
  id?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: campaignKeys.detail(id!),
    queryFn: () => campaignApi.getDetail(id!),
    enabled: options?.enabled !== undefined ? options.enabled : !!id,
    retry: false,
  });
}

/**
 * Hook to create campaign
 */
export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      data,
    }: {
      data: CampaignCreateDto;
    }) => {
      return campaignApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      toast.success('Campaign created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create campaign');
    },
  });
}

/**
 * Hook to update campaign
 */
export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: CampaignUpdateDto;
    }) => {
      return campaignApi.update(id, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(data.id) });
      toast.success('Campaign updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update campaign');
    },
  });
}

/**
 * Hook to delete campaign
 */
export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      otpCode,
    }: {
      id: string;
      otpCode: string
    }) => {
      return campaignApi.delete(id, { otpCode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      toast.success('Campaign deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete campaign');
    },
  });
}

/**
 * Hook to update campaign status
 */
export function useUpdateCampaignStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      targetStatus,
    }: {
      id: string;
      targetStatus: CampaignStatus;
    }) => {
      return campaignApi.updateStatus(id, { targetStatus });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(data.id) });
      toast.success('Campaign status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update campaign status');
    },
  });
}

/**
 * Hook to add budget to campaign
 */
export function useAddCampaignBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      params,
    }: {
      params: CampaignAddBudgetParams;
    }) => {
      return campaignApi.addBudget(params);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(data.id) });
      toast.success('Budget added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add budget');
    },
  });
}

/**
 * Hook to fetch campaign transactions
 */
export function useCampaignTransactions(params: CampaignTransactionParams) {
  return useQuery({
    queryKey: campaignKeys.transactions(params),
    queryFn: () => campaignApi.getTransactions(params),
    enabled: !!params.campaignId,
    retry: false,
  });
}

/**
 * Hook to export campaign transactions to Excel
 */
export function useExportCampaignTransactions() {
  return useExportWithId<CampaignTransactionExportParams>({
    exportFn: (params) => campaignApi.exportTransactions(params),
    filenamePrefix: 'campaign-transactions',
    extension: 'xlsx',
    getId: (params) => params.campaignId,
    successMessage: 'Export completed successfully',
    errorMessage: 'Failed to export transactions',
  });
}

/**
 * Hook to fetch campaign analytics dashboard data
 */
export function useCampaignAnalytics(params: CampaignAnalyticsParams) {
  return useQuery({
    queryKey: campaignKeys.analytics(params.campaignId, params.month),
    queryFn: () => campaignApi.getAnalytics(params),
    enabled: !!params.campaignId && !!params.month,
    retry: false,
  });
}

/**
 * Hook to fetch active users statistics
 */
export function useActiveUsersStatistics(campaignId: string) {
  return useQuery({
    queryKey: campaignKeys.statistics.activeUsers(campaignId),
    queryFn: () => campaignApi.getActiveUsersStatistics(campaignId),
    enabled: !!campaignId,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
}

/**
 * Hook to fetch tier statistics
 */
export function useTierStatistics(campaignId: string) {
  return useQuery({
    queryKey: campaignKeys.statistics.tier(campaignId),
    queryFn: () => campaignApi.getTierStatistics(campaignId),
    enabled: !!campaignId,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
}

/**
 * Hook to fetch points and budget statistics
 */
export function usePointsBudgetStatistics(campaignId: string) {
  return useQuery({
    queryKey: campaignKeys.statistics.pointsBudget(campaignId),
    queryFn: () => campaignApi.getPointsBudgetStatistics(campaignId),
    enabled: !!campaignId,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
}

/**
 * Hook to fetch dashboard points with date range
 */
export function useDashboardPoints(
  campaignId: string,
  fromDate: string,
  toDate: string,
) {
  return useQuery({
    queryKey: campaignKeys.statistics.dashboardPoints(
      campaignId,
      fromDate,
      toDate,
    ),
    queryFn: () => campaignApi.getDashboardPoints(campaignId, fromDate, toDate),
    enabled: !!campaignId && !!fromDate && !!toDate,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
}

/**
 * Hook to fetch dashboard active users with date range
 */
export function useDashboardActiveUsers(
  campaignId: string,
  fromDate: string,
  toDate: string,
) {
  return useQuery({
    queryKey: campaignKeys.statistics.dashboardActiveUsers(
      campaignId,
      fromDate,
      toDate,
    ),
    queryFn: () =>
      campaignApi.getDashboardActiveUsers(campaignId, fromDate, toDate),
    enabled: !!campaignId && !!fromDate && !!toDate,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
}
