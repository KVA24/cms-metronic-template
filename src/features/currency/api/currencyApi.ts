import axiosInstance, { getErrorMessage } from '@/shared/lib/api';
import logger from '@/shared/lib/logger';

export interface Currency {
  id: string;
  code: string;
  name: string;
  quantity?: number | null;
  sourceType: 'INTERNAL' | 'EXTERNAL';
  isPoint: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CurrencyListResponse {
  pageInfo: {
    pageNo: number;
    pageSize: number;
    totalCount: number;
    totalPage: number;
  };
  data: Currency[];
}

export interface CurrencyCreateDto {
  code: string;
  name: string;
  sourceType: 'INTERNAL' | 'EXTERNAL';
  isPoint: boolean;
  otpCode: string;
}

export interface CurrencyUpdateDto extends Partial<CurrencyCreateDto> {}

export interface CurrencySearchParams {
  page?: number;
  size?: number;
  search?: string;
  id?: string;
  name?: string;
  sourceType?: 'INTERNAL' | 'EXTERNAL';
  isPoint?: boolean;
}

export interface ItemDeleteParams {
  sign?: string;
  otpCode?: string;
}

/**
 * Item API Service
 */
export const currencyApi = {
  /**
   * Get all internal currencies (for dropdowns)
   */
  getAllInternal: async (): Promise<Currency[]> => {
    try {
      const response = await axiosInstance.get<Currency[]>(
        '/api/config/b/currencies/internal/all',
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get all external currencies (for dropdowns)
   */
  getAllExternal: async (): Promise<Currency[]> => {
    try {
      const response = await axiosInstance.get<Currency[]>(
        '/api/config/b/currencies/external/all',
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getListAll: async (
    params?: CurrencySearchParams,
  ): Promise<CurrencyListResponse> => {
    try {
      const response = await axiosInstance.get<CurrencyListResponse>(
        '/api/config/b/currencies',
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
   * Get list of currencies with search filters (no pagination)
   */
  getList: async (
    params?: CurrencySearchParams,
  ): Promise<CurrencyListResponse> => {
    try {
      const response = await axiosInstance.get<CurrencyListResponse>(
        '/api/config/b/currencies/search',
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
   * Get item detail by ID
   */
  getDetail: async (id: string): Promise<Currency> => {
    try {
      const response = await axiosInstance.get<{ data: Currency }>(
        `/api/config/b/currencies/${id}`,
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Create new item
   */
  create: async (data: CurrencyCreateDto): Promise<Currency> => {
    try {
      logger.log('API create called:', { data });

      const response = await axiosInstance.post<Currency>(
        `/api/config/b/currencies`,
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
   * Update existing item
   */
  update: async (
    id: string,
    data: CurrencyUpdateDto,
  ): Promise<Currency> => {
    try {
      logger.log('API update called:', { id, data });

      const response = await axiosInstance.put<Currency>(
        `/api/config/b/currencies/${id}`,
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
   * Delete item
   */
  delete: async (id: string, params: ItemDeleteParams): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/config/b/currencies/${id}`, { params });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

export default currencyApi;
