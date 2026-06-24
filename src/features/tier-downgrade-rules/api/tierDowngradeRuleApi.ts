import axiosInstance from '@/shared/lib/api';

export interface TierDowngradeRuleConfig {
  id?: string;
  activeStartAt?: string;
  activeEndAt?: string;
  noEndDate?: boolean;
  enableUpgrade?: boolean;
  enableDowngrade?: boolean;
  windowTimeMonths?: number;
  reviewDay?: 'FIRST_DAY' | 'LAST_DAY';
  reviewMonths?: number[];
  tierExpirationMode?: 'IMMEDIATELY' | 'CUSTOM';
  gracePeriodMonths?: number;
  roundUpExpirationMode?: 'IMMEDIATELY' | 'EACH_MONTH';
  preReviewNotificationDays?: number;
}

export const tierDowngradeRuleApi = {
  getConfig: async (): Promise<TierDowngradeRuleConfig> => {
    const response = await axiosInstance.get<{ data: TierDowngradeRuleConfig }>(
      '/api/membership/b/tier-downgrade-config',
    );
    return response.data.data;
  },

  updateConfig: async (
    data: TierDowngradeRuleConfig,
    otpCode: string,
  ): Promise<TierDowngradeRuleConfig> => {
    const response = await axiosInstance.post(
      `/api/membership/b/tier-downgrade-config?otpCode=${otpCode}`,
      data,
    );
    return response.data;
  },
};
