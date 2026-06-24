/**
 * Shared feature module
 * Exports common APIs and hooks used across multiple features
 */

// API exports
export {
  sharedApi,
  type Currency,
  type CurrencyListResponse,
  type CurrencySearchParams,
  type ExpiryPolicy,
  type ExpiryPolicyListResponse,
  type ExpiryPolicySearchParams,
  type ExpiryPolicyType,
  type ExpiryPolicyStatus,
  type Category,
  type CategoryListResponse,
  type CategorySearchParams,
  type CategoryStatus,
  type Event,
  type EventListResponse,
  type EventSearchParams,
  type EventSchemaProperty,
  type ValidationRule,
  type ValidationRuleListResponse,
  type TierMetric,
  type TierMetricListResponse,
} from './api/sharedApi';

// Hook exports
export {
  useSharedCurrencies,
  useSharedPointCurrencies,
  useSharedExpiryPoliciesByCurrency,
  useSharedExpiryPolicies,
  useSharedCategories,
  useSharedEvents,
  useSharedValidationRules,
  useSharedTierMetrics,
  sharedQueryKeys,
} from './hooks/use-shared-queries';
