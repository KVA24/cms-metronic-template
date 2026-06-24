import {
  tierDowngradeRuleApi,
  type TierDowngradeRuleConfig,
} from '@/features/tier-downgrade-rules/api/tierDowngradeRuleApi';
import { useMutation, useQuery } from '@tanstack/react-query';

export const useTierDowngradeRuleConfig = () => {
  return useQuery({
    queryKey: ['tierDowngradeRuleConfig'],
    queryFn: () => tierDowngradeRuleApi.getConfig(),
  });
};

export const useUpdateTierDowngradeRuleConfig = () => {
  return useMutation({
    mutationFn: ({
      data,
      otpCode,
    }: {
      data: TierDowngradeRuleConfig;
      otpCode: string;
    }) => tierDowngradeRuleApi.updateConfig(data, otpCode),
  });
};
