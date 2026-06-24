import axiosInstance, { getErrorMessage } from '@/shared/lib/api';
import axios from 'axios';
import logger from '@/shared/lib/logger';
import { generalConfig } from '@/shared/config/general.config';
import { storage } from '@/shared/lib/storage';

export interface RedemptionPackage {
  id: number;
  code: string;
  name: string;
  icon: string;
  sortOrder: number;
  externalId: string;
  rewardType: string;
  serviceCode: string;
  pointCost: number;
  status: string;
  availableStock: number;
  totalStock: number;
  redeemedQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface RedemptionPackageListResponse {
  totalPages: number;
  totalElements: number;
  size: number;
  content: RedemptionPackage[];
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  pageable: {
    offset: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    unpaged: boolean;
    paged: boolean;
    pageNumber: number;
    pageSize: number;
  };
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface RedemptionPackageCreateDto {
  code: string;
  name: string;
  externalId: string;
  description: string;
  rewardType: string;
  serviceCode: string;
  pointCost: number;
  icon: string;
  sortOrder: number;
  status: string;
  otpCode: string;
}

export interface RedemptionPackageUpdateDto extends Partial<RedemptionPackageCreateDto> {}

export interface RedemptionPackageSearchParams {
  page?: number;
  size?: number;
  search?: string;
  id?: string;
  name?: string;
  status?: string;
}

export interface RewardCatalog {
  id: number;
  code: string;
  name: string;
  externalId: string;
  rewardType: string;
  serviceCode: string;
  pointCost: number;
  status: string;
  availableStock: number;
  redeemedQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface ItemDeleteParams {
  sign?: string;
  otpCode?: string;
}

export interface RewardCodeInventory {
  id: number;
  codeValue: string;
  status: string;
  userId: number;
  createdAt: string;
  expiredAt: string;
}

export interface RewardCodeInventoryListResponse {
  totalPages: number;
  totalElements: number;
  size: number;
  content: RewardCodeInventory[];
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  pageable: {
    offset: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    unpaged: boolean;
    paged: boolean;
    pageNumber: number;
    pageSize: number;
  };
  first: boolean;
  last: boolean;
  empty: boolean;
}

/**
 * Redemption Package API Service
 */
export const redemptionPackageApi = {
  /**
   * Get list of redemption packages with pagination
   */
  getList: async (
    params?: RedemptionPackageSearchParams,
  ): Promise<RedemptionPackageListResponse> => {
    try {
      const response = await axiosInstance.get<RedemptionPackageListResponse>(
        '/api/reward/b/reward-catalog/search',
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
   * Get all reward catalogs (for dropdowns)
   */
  getAll: async (): Promise<RewardCatalog[]> => {
    try {
      const response = await axiosInstance.get<{ content: RewardCatalog[] }>(
        '/api/reward/b/reward-catalog/search?size=100',
      );
      return response.data.content;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get redemption package detail by ID
   */
  getDetail: async (id: string): Promise<RedemptionPackage> => {
    try {
      const response = await axiosInstance.get<RedemptionPackage>(
        `/api/reward/b/reward-catalog/${id}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Create new redemption package
   */
  create: async (data: RedemptionPackageCreateDto): Promise<RedemptionPackage> => {
    try {
      logger.log('API create called:', { data });

      const response = await axiosInstance.post<RedemptionPackage>(
        `/api/reward/b/reward-catalog/create`,
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
   * Update existing redemption package
   */
  update: async (
    id: string,
    data: RedemptionPackageUpdateDto,
  ): Promise<RedemptionPackage> => {
    try {
      logger.log('API update called:', { id, data });

      const response = await axiosInstance.put<RedemptionPackage>(
        `/api/reward/b/reward-catalog/${id}`,
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
   * Delete redemption package
   */
  delete: async (id: string, params: ItemDeleteParams): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/reward/b/reward-catalog/${id}`, { params });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get reward code inventory
   */
  getInventory: async (
    rewardCatalogId: string,
    params?: { page?: number; size?: number },
  ): Promise<RewardCodeInventoryListResponse> => {
    try {
      const response = await axiosInstance.get<RewardCodeInventoryListResponse>(
        '/api/reward/b/reward-code-inventory',
        {
          params: {
            rewardCatalogId,
            ...params,
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Import reward codes
   * Returns error file if import fails with validation errors
   */
  importCodes: async (
    rewardCatalogId: string,
    file: File,
  ): Promise<{ errorFile?: Blob; errorMessage?: string }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = storage.getItem('access_token');
      const headers: any = {
        'Content-Type': 'multipart/form-data',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // First attempt: try with blob response type
      try {
        const response = await axios.post(
          `${generalConfig.API_URL}/api/reward/b/reward-code-inventory/import?rewardCatalogId=${rewardCatalogId}`,
          formData,
          {
            headers,
            validateStatus: () => true,
            responseType: 'blob',
          },
        );

        // Success case
        if (response.status === 200 || response.status === 201) {
          return {};
        }

        // Error case - check if response is blob (error file)
        if (response.status === 400 && response.data instanceof Blob && response.data.size > 0) {
          return {
            errorFile: response.data,
            errorMessage: 'Import failed with validation errors. Check the downloaded file.',
          };
        }

        // If blob is empty or not a file, try to parse as JSON
        if (response.status === 400) {
          try {
            const text = await response.data.text();
            const errorData = JSON.parse(text);
            const errorMessage = errorData?.message || errorData?.error || 'Import failed with validation errors';
            throw new Error(errorMessage);
          } catch (parseError) {
            throw new Error('Import failed with validation errors');
          }
        }

        // Other error cases
        throw new Error(`Import failed with status ${response.status}`);
      } catch (error: any) {
        // If blob response fails, try with JSON response
        if (error.message?.includes('responseType')) {
          const response = await axios.post(
            `${generalConfig.API_URL}/api/reward/b/reward-code-inventory/import?rewardCatalogId=${rewardCatalogId}`,
            formData,
            {
              headers,
              validateStatus: () => true,
            },
          );

          if (response.status === 200 || response.status === 201) {
            return {};
          }

          if (response.status === 400) {
            const errorMessage = response.data?.message || response.data?.error || 'Import failed with validation errors';
            throw new Error(errorMessage);
          }

          throw new Error(`Import failed with status ${response.status}`);
        }
        throw error;
      }
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

export default redemptionPackageApi;
