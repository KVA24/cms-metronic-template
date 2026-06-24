import axiosInstance, { getErrorMessage } from '@/shared/lib/api';

export interface TierHistoryEntry {
  fromTierId: number;
  fromTierName: string;
  toTierId: number;
  toTierName: string;
  changedAt: number;
  changeReason: 'UPGRADE' | 'DOWNGRADE' | 'MANUAL' | 'INITIAL';
}

export interface UserMembershipTier {
  tierId: number;
  tierName: string;
  effectiveAt: number;
  nextReviewAt: number;
  history: TierHistoryEntry[];
}

export interface UserMembershipTierResponse {
  data: UserMembershipTier;
}

export interface TierOption {
  id: string;
  name: string;
}

export interface TierListResponse {
  data: TierOption[];
}

export const membershipTierApi = {
  getUserTier: async (customerId: string): Promise<UserMembershipTier> => {
    try {
      const response = await axiosInstance.get<UserMembershipTierResponse>(
        `/api/membership/b/tiers/user/${customerId}`,
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getTierList: async (): Promise<TierOption[]> => {
    try {
      const response = await axiosInstance.get<TierListResponse>(
        '/api/membership/b/tiers',
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
