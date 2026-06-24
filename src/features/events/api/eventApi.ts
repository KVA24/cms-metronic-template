import axiosInstance, { getErrorMessage } from '@/shared/lib/api';
import logger from '@/shared/lib/logger';

export type EventPropertyDataType =
  | 'TEXT'
  | 'NUMBER'
  | 'DATE'
  | 'DATE_TIME'
  | 'FLAG'
  | 'IMAGE_URL'
  | 'OBJECT'
  | 'GEOPOINT';

export interface EventSchemaProperty {
  id?: string | number;
  name: string;
  dataType: string;
  isRequired: boolean;
}

export interface Event {
  id: string;
  name: string;
  properties: EventSchemaProperty[];
  createdAt?: string;
  updatedAt?: string;
}

export interface EventListResponse {
  pageInfo: {
    pageNo: number;
    pageSize: number;
    totalCount: number;
    totalPage: number;
  };
  data: Event[];
}

export interface EventCreateDto {
  name: string;
  properties: EventSchemaProperty[];
  otpCode: string;
}

export interface EventUpdateDto extends Partial<
  Omit<EventCreateDto, 'otpCode'>
> {
  otpCode: string;
}

export interface EventSearchParams {
  page?: number;
  size?: number;
  id?: string;
  name?: string;
}

export interface EventDeleteParams {
  sign?: string;
  otpCode?: string;
}

/**
 * Event API Service
 */
export const eventApi = {
  /**
   * Get list of events with search filters and pagination
   */
  getList: async (params?: EventSearchParams): Promise<EventListResponse> => {
    try {
      const response = await axiosInstance.get<EventListResponse>(
        '/api/config/b/event-schemas/search',
        {
          params,
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getListALL: async (
    params?: EventSearchParams,
  ): Promise<EventListResponse> => {
    try {
      const response = await axiosInstance.get<EventListResponse>(
        '/api/config/b/event-schemas',
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
   * Get event detail by ID
   */
  getDetail: async (id: string): Promise<Event> => {
    try {
      const response = await axiosInstance.get<{ data: Event }>(
        `/api/config/b/event-schemas/${id}`,
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Create new event
   */
  create: async (data: EventCreateDto): Promise<Event> => {
    try {
      logger.log('API create event called:', { data });

      const response = await axiosInstance.post<Event>(
        `/api/config/b/event-schemas`,
        data,
      );
      logger.log('API create event response:', response.data);
      return response.data;
    } catch (error) {
      logger.error('API create event error:', error);
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Update existing event
   */
  update: async (
    id: string,
    data: EventUpdateDto,
  ): Promise<Event> => {
    try {
      logger.log('API update event called:', { id, data });

      const response = await axiosInstance.put<Event>(
        `/api/config/b/event-schemas/${id}`,
        data,
      );
      logger.log('API update event response:', response.data);
      return response.data;
    } catch (error) {
      logger.error('API update event error:', error);
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Delete event
   */
  delete: async (id: string, params: EventDeleteParams): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/config/b/event-schemas/${id}`, {
        params,
      });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

export default eventApi;
