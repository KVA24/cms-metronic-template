import axiosInstance, { getErrorMessage } from '@/shared/lib/api';

export interface Service {
  id?: string;
  name?: string;
  code: string;
  currencyRateId: string;
  currencyName?: string;
  policyName?: string;
  maxEarnPointsPerDay: number;
  maxBurnPointsPerDay: number;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Partner {
  id: string;
  name: string;
  code: string;
  icon?: string;
  cover?: string;
  contactEmail: string;
  phone: string;
  apiKey?: string;
  apiSecret?: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  services: Service[];
  createdAt: number;
}

export interface PartnerListResponse {
  pageInfo: {
    pageNo: number;
    pageSize: number;
    totalCount: number;
    totalPage: number;
  };
  data: Partner[];
}

/**
 * Partner API for User Feature
 */
export const userPartnerApi = {
  /**
   * Get all active partners
   */
  getAllActive: async (): Promise<Partner[]> => {
    try {
      const response = await axiosInstance.get<PartnerListResponse>(
        '/api/config/b/partners/search',
        { params: { status: 'ACTIVE', size: 100 } },
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get partner detail by ID
   */
  getDetail: async (id: string): Promise<Partner> => {
    try {
      const response = await axiosInstance.get<{ data: Partner }>(
        `/api/config/b/partners/${id}`,
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
