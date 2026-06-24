import axiosInstance, { getErrorMessage } from '@/shared/lib/api';

export interface Service {
  id?: string;
  name?: string;
  code: string;
  currencyId: string;
  policyId?: string;
  earnRate: number;
  burnRate: number;
  roundingRule: 'FLOOR' | 'CEILING' | 'HALF_UP';
  maxEarnPointsPerDay?: number | null;
  maxBurnPointsPerDay?: number | null;
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

export interface PartnerListParams {
  page?: number;
  size?: number;
  id?: string;
  name?: string;
  code?: string;
  status?: string;
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

export interface PartnerCreateDto {
  name: string;
  code: string;
  icon?: string;
  cover?: string;
  contactEmail: string;
  phone: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  services: Service[];
}

export interface PartnerUpdateDto extends Partial<PartnerCreateDto> {}

export interface PartnerDeleteParams {
  sign?: string;
  otpCode?: string;
}

export const partnerApi = {
  getList: async (params?: PartnerListParams): Promise<PartnerListResponse> => {
    try {
      const response = await axiosInstance.get<PartnerListResponse>(
        '/api/config/b/partners/search',
        { params },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

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

  create: async (data: PartnerCreateDto): Promise<Partner> => {
    try {
      const response = await axiosInstance.post<Partner>(
        `/api/config/b/partners`,
        data,
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  update: async (
    id: string,
    data: PartnerUpdateDto,
  ): Promise<Partner> => {
    try {
      const response = await axiosInstance.put<Partner>(
        `/api/config/b/partners/${id}`,
        data,
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  delete: async (id: string, params: PartnerDeleteParams): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/config/b/partners/${id}`, { params });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
