import axiosInstance, { getErrorMessage } from '@/shared/lib/api';
import logger from '@/shared/lib/logger';

export interface CurrencyRate {
  id: string;
  baseCurrencyId: string;
  targetCurrencyId: string;
  baseCurrencyName: string;
  targetCurrencyName: string;
  buyRate: string;
  sellRate: string;
  roundingRule: 'FLOOR' | 'CEILING' | 'HALF_UP';
  startAt: string;
  endAt: string;
  createdAt?: string;
  updatedAt?: string;
  totalPartner?: number;
  totalService?: number;
}

export interface CurrencyRateListResponse {
  pageInfo: {
    pageNo: number;
    pageSize: number;
    totalCount: number;
    totalPage: number;
  };
  data: CurrencyRate[];
}

export interface CurrencyRateCreateDto {
  baseCurrencyId: string;
  targetCurrencyId: string;
  buyRate: string;
  sellRate: string;
  roundingRule:
    | 'HALF_UP'
    | 'HALF_DOWN'
    | 'HALF_EVEN'
    | 'UP'
    | 'DOWN'
    | 'CEILING'
    | 'FLOOR';
  startAt: string;
  endAt: string;
  otpCode: string;
}

export interface CurrencyRateUpdateDto extends Partial<CurrencyRateCreateDto> {}

export interface CurrencyRateSearchParams {
  page?: number;
  size?: number;
  search?: string;
  id?: string;
  baseCurrencyId?: string;
  targetCurrencyId?: string;
  roundingRule?: string;
}

export interface ItemDeleteParams {
  sign?: string;
  otpCode?: string;
}

/**
 * Currency Rate API Service
 */
export const currencyRateApi = {
  /**
   * Get list of currency rates with search filters and pagination
   */
  getList: async (
    params?: CurrencyRateSearchParams,
  ): Promise<CurrencyRateListResponse> => {
    try {
      const response = await axiosInstance.get<CurrencyRateListResponse>(
        '/api/config/b/currency-rates/search',
        {
          params,
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getAllActive: async (
    params?: CurrencyRateSearchParams,
  ): Promise<CurrencyRateListResponse> => {
    try {
      const response = await axiosInstance.get<CurrencyRateListResponse>(
        '/api/config/b/currency-rates',
        {
          params,
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get currency rate detail by ID
   */
  getDetail: async (id: string): Promise<CurrencyRate> => {
    try {
      const response = await axiosInstance.get<{ data: CurrencyRate }>(
        `/api/config/b/currency-rates/${id}`,
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Create new currency rate
   */
  create: async (
    data: CurrencyRateCreateDto,
  ): Promise<CurrencyRate> => {
    try {
      logger.log('API create called:', { data });

      const response = await axiosInstance.post<CurrencyRate>(
        `/api/config/b/currency-rates`,
        data,
      );
      logger.log('API create response:', response.data);
      return response.data;
    } catch (error) {
      logger.error('API create error:', error);
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Update existing currency rate
   */
  update: async (
    id: string,
    data: CurrencyRateUpdateDto,
  ): Promise<CurrencyRate> => {
    try {
      logger.log('API update called:', { id, data });

      const response = await axiosInstance.put<CurrencyRate>(
        `/api/config/b/currency-rates/${id}`,
        data,
      );
      logger.log('API update response:', response.data);
      return response.data;
    } catch (error) {
      logger.error('API update error:', error);
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Delete currency rate
   */
  delete: async (id: string, params: ItemDeleteParams): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/config/b/currency-rates/${id}`, {
        params,
      });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

export default currencyRateApi;
