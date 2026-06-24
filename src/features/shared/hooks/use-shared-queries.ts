import {
  CategorySearchParams,
  CurrencySearchParams,
  EventSearchParams,
  ExpiryPolicySearchParams,
  sharedApi,
} from '@/features/shared/api/sharedApi';
import { useQuery } from '@tanstack/react-query';

/**
 * Shared React Query hooks for common resources
 * These hooks centralize duplicate queries across features
 */

// ============================================================================
// Query Keys
// ============================================================================

export const sharedQueryKeys = {
  // Currency keys
  currencies: {
    all: ['shared', 'currencies'] as const,
    list: (params?: CurrencySearchParams) =>
      ['shared', 'currencies', 'list', params] as const,
    points: () => ['shared', 'currencies', 'points'] as const,
  },
  // Expiry Policy keys
  expiryPolicies: {
    all: ['shared', 'expiryPolicies'] as const,
    list: (params?: ExpiryPolicySearchParams) =>
      ['shared', 'expiryPolicies', 'list', params] as const,
    byCurrency: (currencyId: string) =>
      ['shared', 'expiryPolicies', 'byCurrency', currencyId] as const,
  },
  // Category keys
  categories: {
    all: ['shared', 'categories'] as const,
    list: (params?: CategorySearchParams) =>
      ['shared', 'categories', 'list', params] as const,
  },
  // Event keys
  events: {
    all: ['shared', 'events'] as const,
    list: (params?: EventSearchParams) =>
      ['shared', 'events', 'list', params] as const,
  },
  // Validation Rule keys
  validationRules: {
    all: ['shared', 'validationRules'] as const,
  },
  // Tier Metric keys
  tierMetrics: {
    all: ['shared', 'tierMetrics'] as const,
  },
};

// ============================================================================
// Currency Hooks
// ============================================================================

/**
 * Hook to fetch all currencies
 * Used across: partners, currency-rate, expiry-policy
 */
export function useSharedCurrencies(params?: CurrencySearchParams) {
  return useQuery({
    queryKey: sharedQueryKeys.currencies.list(params),
    queryFn: () => sharedApi.getCurrencies(params),
    retry: false,
  });
}

/**
 * Hook to fetch all point currencies (isPoint=true)
 * Used across: campaigns
 */
export function useSharedPointCurrencies() {
  return useQuery({
    queryKey: sharedQueryKeys.currencies.points(),
    queryFn: () => sharedApi.getPointCurrencies(),
    retry: false,
  });
}

// ============================================================================
// Expiry Policy Hooks
// ============================================================================

/**
 * Hook to fetch expiry policies by currency ID
 * Used across: partners, campaigns
 */
export function useSharedExpiryPoliciesByCurrency(
  currencyId?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: sharedQueryKeys.expiryPolicies.byCurrency(currencyId!),
    queryFn: () => sharedApi.getExpiryPoliciesByCurrency(currencyId!),
    enabled: options?.enabled !== undefined ? options.enabled : !!currencyId,
    retry: false,
  });
}

/**
 * Hook to fetch all expiry policies
 */
export function useSharedExpiryPolicies(params?: ExpiryPolicySearchParams) {
  return useQuery({
    queryKey: sharedQueryKeys.expiryPolicies.list(params),
    queryFn: () => sharedApi.getExpiryPolicies(params),
    retry: false,
  });
}

// ============================================================================
// Category Hooks
// ============================================================================

/**
 * Hook to fetch all active categories
 * Used across: campaigns
 */
export function useSharedCategories(params?: CategorySearchParams) {
  return useQuery({
    queryKey: sharedQueryKeys.categories.list(params),
    queryFn: () => sharedApi.getCategories(params),
    retry: false,
  });
}

// ============================================================================
// Event Hooks
// ============================================================================

/**
 * Hook to fetch all events
 * Used across: campaigns, tier-metrics, events
 */
export function useSharedEvents(params?: EventSearchParams) {
  return useQuery({
    queryKey: sharedQueryKeys.events.list(params),
    queryFn: () => sharedApi.getEvents(params),
    retry: false,
  });
}

// ============================================================================
// Validation Rule Hooks
// ============================================================================

/**
 * Hook to fetch all validation rules
 * Used across: campaigns, validation-rule
 */
export function useSharedValidationRules() {
  return useQuery({
    queryKey: sharedQueryKeys.validationRules.all,
    queryFn: () => sharedApi.getValidationRules(),
    retry: false,
  });
}

// ============================================================================
// Tier Metric Hooks
// ============================================================================

/**
 * Hook to fetch all tier metrics
 * Used across: tiers
 */
export function useSharedTierMetrics() {
  return useQuery({
    queryKey: sharedQueryKeys.tierMetrics.all,
    queryFn: () => sharedApi.getTierMetrics(),
    retry: false,
  });
}
