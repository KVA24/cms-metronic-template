import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  accountApi,
  AccountCreateDto,
  AccountListParams,
  AccountUpdateDto,
} from '../api/accountApi';

// Query keys
export const accountKeys = {
  all: ['accounts'] as const,
  lists: () => ['accounts', 'list'] as const,
  list: (params: AccountListParams) => {
    const key: (string | number)[] = ['accounts', 'list'];
    if (params.page !== undefined) {
      key.push('page');
      key.push(params.page);
    }
    if (params.size !== undefined) {
      key.push('size');
      key.push(params.size);
    }
    if (params.username) {
      key.push('username');
      key.push(params.username);
    }
    if (params.role) {
      key.push('role');
      key.push(params.role);
    }
    if (params.status) {
      key.push('state');
      key.push(params.status);
    }
    return key;
  },
  details: () => ['accounts', 'detail'] as const,
  detail: (username: string) => ['accounts', 'detail', username] as const,
  qrCode: (username: string) => ['accounts', 'qrcode', username] as const,
  resetSalt: (username: string) => ['accounts', 'resetSalt', username] as const,
  roles: ['accounts', 'roles'] as const,
};

/**
 * Hook to fetch available roles
 */
export function useAccountRoles() {
  return useQuery({
    queryKey: accountKeys.roles,
    queryFn: () => accountApi.getRoles(),
    staleTime: Infinity,
  });
}

/**
 * Hook to fetch account list with pagination and filters
 */
export function useAccountList(params: AccountListParams) {
  return useQuery({
    queryKey: accountKeys.list(params),
    queryFn: () => accountApi.getList(params),
    retry: false,
  });
}

/**
 * Hook to fetch account detail by username
 */
export function useAccountDetail(
  username?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: accountKeys.detail(username!),
    queryFn: () => accountApi.getDetail(username!),
    enabled: options?.enabled !== undefined ? options.enabled : !!username,
  });
}

/**
 * Hook to fetch QR code for account
 */
export function useAccountQRCode(
  username?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: accountKeys.qrCode(username!),
    queryFn: () => accountApi.getQRCode(username!),
    enabled: options?.enabled !== undefined ? options.enabled : !!username,
  });
}

/**
 * Hook to reset salt for account (mutation)
 */
export function useResetAccountSalt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ username }: { username: string }) =>
      accountApi.resetSalt(username),
    onSuccess: (_, variables) => {
      // Invalidate QR code query to refetch
      queryClient.invalidateQueries({
        queryKey: accountKeys.qrCode(variables.username),
      });
      toast.success('2FA reset successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reset 2FA');
    },
  });
}

/**
 * Hook to create new account
 */
export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: { data: AccountCreateDto }) =>
      accountApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      toast.success('Account created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create account');
    },
  });
}

/**
 * Hook to update existing account
 */
export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: AccountUpdateDto;
    }) => accountApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: accountKeys.detail(variables.id),
      });
      toast.success('Account updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update account');
    },
  });
}

/**
 * Hook to toggle account status between ACTIVE and INACTIVE
 */
export function useUpdateAccountStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      otpCode,
    }: {
      id: string;
      status: 'ACTIVE' | 'INACTIVE';
      otpCode?: string;
    }) => accountApi.updateStatus(id, status, otpCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      toast.success('Account status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update account status');
    },
  });
}

/**
 * Hook to delete account
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      otpCode,
      sign,
    }: {
      id: string;
      otpCode: string;
      sign?: string;
    }) => accountApi.delete(id, { otpCode, sign }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      toast.success('Account deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete account');
    },
  });
}
