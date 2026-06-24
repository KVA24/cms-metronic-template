import axiosInstance, { getErrorMessage } from '@/shared/lib/api';
import logger from '@/shared/lib/logger';

/**
 * Metadata Constraint Types
 */
export interface TextConstraints {
  minLength?: number;
  maxLength?: number;
  exactLength?: number;
  equalToAnyOf?: string[];
  notEqualToAnyOf?: string[];
}

export interface NumberConstraints {
  equal?: number;
  lessThan?: number;
  lessThanOrEqual?: number;
  greaterThan?: number;
  greaterThanOrEqual?: number;
  equalToAnyOf?: number[];
  notEqualToAnyOf?: number[];
}

export interface FlagConstraints {
  flag?: boolean;
}

export interface DateTimeConstraints {
  datetimeFormat?: string;
  dateFormat?: string;
}

export interface ImageConstraints {
  imageUrl?: string;
}

export interface ObjectConstraints {
  refSchemaId?: string;
}

export interface LocationConstraints {
  latitude?: number;
  longitude?: number;
}

export type MetadataConstraints =
  | TextConstraints
  | NumberConstraints
  | FlagConstraints
  | DateTimeConstraints
  | ImageConstraints
  | ObjectConstraints
  | LocationConstraints;

/**
 * Metadata Data Types
 */
export type MetadataDataType =
  | 'TEXT'
  | 'NUMBER'
  | 'FLAG'
  | 'DATE'
  | 'DATE_TIME'
  | 'IMAGE_URL'
  | 'OBJECT'
  | 'GEOPOINT';

/**
 * Metadata Property Definition
 */
export interface MetadataProperty {
  id?: string | number;
  name: string;
  isRequired: boolean;
  isMultipleValue: boolean;
  dataType: MetadataDataType;
  constraints?: MetadataConstraints;
  refSchemaId?: string;
  createdAt: number | Date;
  updatedAt: number | Date;
  description?: string;
}

/**
 * Metadata Schema DTO
 */
export interface MetadataSchemaDto {
  name: string;
  description?: string;
  level: number;
  metadata: MetadataProperty[];
}

/**
 * Metadata Schema Response
 */
export interface MetadataSchema extends MetadataSchemaDto {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export type MetadataListResponse = MetadataSchema[];

export interface MetadataListResponsePaginated {
  pageInfo: {
    pageNo: number;
    pageSize: number;
    totalCount: number;
    totalPage: number;
  };
  data: MetadataSchema[];
}

/**
 * Metadata Create DTO
 */
export interface MetadataCreateDto extends MetadataSchemaDto {
  otpCode: string;
}

/**
 * Metadata Update DTO
 */
export interface MetadataUpdateDto extends Partial<
  Omit<MetadataCreateDto, 'otpCode'>
> {
  otpCode: string;
}

/**
 * Metadata Search Parameters
 */
export interface MetadataSearchParams {
  page?: number;
  size?: number;
  id?: string;
  name?: string;
  level?: number;
}

/**
 * Metadata Delete Parameters
 */
export interface MetadataDeleteParams {
  sign?: string;
  otpCode?: string;
}

/**
 * Metadata API Service
 */
export const metadataApi = {
  /**
   * Get list of metadata schemas with search filters and pagination
   */
  getList: async (
    params?: MetadataSearchParams,
  ): Promise<MetadataListResponsePaginated> => {
    try {
      const response = await axiosInstance.get<MetadataListResponsePaginated>(
        '/api/config/b/metadata-schemas/search',
        {
          params,
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getListLevelTwo: async (
    params?: MetadataSearchParams,
  ): Promise<MetadataListResponsePaginated> => {
    try {
      const response = await axiosInstance.get<MetadataListResponsePaginated>(
        '/api/config/b/metadata-schemas',
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
   * Get metadata schema detail by ID
   */
  getDetail: async (id: string): Promise<MetadataSchema> => {
    try {
      const response = await axiosInstance.get<{ data: MetadataSchema }>(
        `/api/config/b/metadata-schemas/${id}`,
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Create new metadata schema
   */
  create: async (
    data: MetadataCreateDto,
  ): Promise<MetadataSchema> => {
    try {
      logger.log('API create metadata called:', { data });

      const response = await axiosInstance.post<MetadataSchema>(
        `/api/config/b/metadata-schemas`,
        data,
      );
      logger.log('API create metadata response:', response.data);
      return response.data;
    } catch (error) {
      logger.error('API create metadata error:', error);
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Update existing metadata schema
   */
  update: async (
    id: string,
    data: MetadataUpdateDto,
  ): Promise<MetadataSchema> => {
    try {
      logger.log('API update metadata called:', { id, data });

      const response = await axiosInstance.put<MetadataSchema>(
        `/api/config/b/metadata-schemas/${id}`,
        data,
      );
      logger.log('API update metadata response:', response.data);
      return response.data;
    } catch (error) {
      logger.error('API update metadata error:', error);
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Delete metadata schema
   */
  delete: async (id: string, params: MetadataDeleteParams): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/config/b/metadata-schemas/${id}`, {
        params,
      });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

export default metadataApi;
