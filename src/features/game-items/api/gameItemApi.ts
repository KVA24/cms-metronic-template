import axiosInstance, { getErrorMessage } from '@/shared/lib/api';

export interface GameItem {
  id: string;
  itemId: string;
  code: string;
  name: string;
  type: string;
  // convertRate: number;
  sourceType: string;
  imageId?: string;
  externalId?: string;
  isDefault: boolean;
}

export interface GameItemListResponse {
  data: GameItem[];
  metadata: {
    total: number;
    totalPages: number;
  };
}

export interface GameItemCreateDto {
  code: string;
  name: string;
  type: string;
  // convertRate: number;
  sourceType: string;
  imageId?: string;
  externalId?: string;
  isDefault: boolean;
  otpCode: string;
}

export interface GameItemUpdateDto extends Partial<
  Omit<GameItemCreateDto, 'otpCode'>
> {
  otpCode: string;
}

export interface GameItemSearchParams {
  page?: number;
  size?: number;
  code?: string;
  name?: string;
  type?: string;
  sourceType?: string;
}

export interface GameItemDeleteParams {
  sign?: string;
  otpCode?: string;
}

export interface ItemCodeResponse {
  serverTime: string;
  zoneInfo: string;
  service: string;
  sessionId: string;
  requestId: string;
  code: string;
  message: string;
  data: string[];
}

export const gameItemApi = {
  getItemCodes: async (): Promise<string[]> => {
    try {
      const response = await axiosInstance.get<ItemCodeResponse>(
        '/api/game/b/items/item-code',
      );
      return response.data.data || [];
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getListAll: async (): Promise<GameItemListResponse> => {
    try {
      const response = await axiosInstance.get<GameItemListResponse>(
        '/api/game/b/items/all',
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getList: async (
    params?: GameItemSearchParams,
  ): Promise<GameItemListResponse> => {
    try {
      const response = await axiosInstance.get<GameItemListResponse>(
        '/api/game/b/items',
        { params },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getDetail: async (id: string): Promise<GameItem> => {
    try {
      const response = await axiosInstance.get<{ data: GameItem }>(
        `/api/game/b/items/${id}`,
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  create: async (data: GameItemCreateDto): Promise<GameItem> => {
    try {
      const response = await axiosInstance.post<GameItem>(
        '/api/game/b/items',
        data,
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  update: async (
    id: string,
    data: GameItemUpdateDto,
  ): Promise<GameItem> => {
    try {
      const response = await axiosInstance.put<GameItem>(
        `/api/game/b/items/${id}`,
        data,
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  delete: async (id: string, params: GameItemDeleteParams): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/game/b/items/${id}`, { params });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

export default gameItemApi;
