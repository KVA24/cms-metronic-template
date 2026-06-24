import axiosInstance, { getErrorMessage } from '@/shared/lib/api';
import logger from '@/shared/lib/logger';

export interface ValidationRule {
  id: string;
  name: string;
  description?: string;
  rule: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PageInfo {
  pageNo: number;
  pageSize: number;
  totalCount: number;
  totalPage: number;
}

export interface ValidationRuleListResponse {
  pageInfo: PageInfo;
  data: ValidationRule[];
}

export interface ValidationRuleCreateDto {
  name: string;
  description?: string;
  rule: string;
}

export interface ValidationRuleUpdateDto extends Partial<ValidationRuleCreateDto> {}

export interface ValidationRuleSearchParams {
  page?: number;
  size?: number;
  search?: string;
  id?: string;
  name?: string;
}

export interface ItemDeleteParams {
  sign?: string;
  otpCode?: string;
}

/**
 * Validation Rule API Service
 */
export const validationRuleApi = {
  /**
   * Get list of validation rules with search filters (no pagination)
   */
  getList: async (
    params?: ValidationRuleSearchParams,
  ): Promise<ValidationRuleListResponse> => {
    try {
      const response = await axiosInstance.get<ValidationRuleListResponse>(
        '/api/config/b/validation-rules/search',
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
   * Get all validation rules without pagination
   */
  getListAll: async (): Promise<ValidationRuleListResponse> => {
    try {
      const response = await axiosInstance.get<ValidationRuleListResponse>(
        '/api/config/b/validation-rules',
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get validation rule detail by ID
   */
  getDetail: async (id: string): Promise<ValidationRule> => {
    try {
      const response = await axiosInstance.get<{ data: ValidationRule }>(
        `/api/config/b/validation-rules/${id}`,
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Create new validation rule
   */
  create: async (
    data: ValidationRuleCreateDto,
  ): Promise<ValidationRule> => {
    try {
      logger.log('API create called:', { data });

      const response = await axiosInstance.post<ValidationRule>(
        `/api/config/b/validation-rules`,
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
   * Update existing validation rule
   */
  update: async (
    id: string,
    data: ValidationRuleUpdateDto,
  ): Promise<ValidationRule> => {
    try {
      logger.log('API update called:', { id, data });

      const response = await axiosInstance.put<ValidationRule>(
        `/api/config/b/validation-rules/${id}`,
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
   * Delete validation rule
   */
  delete: async (id: string, params: ItemDeleteParams): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/config/b/validation-rules/${id}`, {
        params,
      });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

export default validationRuleApi;
