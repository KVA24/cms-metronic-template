import axiosInstance, { getErrorMessage } from '@/shared/lib/api';
import logger from '@/shared/lib/logger';

export enum RewardType {
  STAR = 'STAR',
  GOOD_LUCK = 'GOOD_LUCK',
}

export interface GameReward {
  id: string;
  rewardName: string;
  value: number;
  type: RewardType | string | '';
  imageId: string;
  externalId: string;
  isDefault: boolean;
  itemId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GameRewardListResponse {
  data: GameReward[];
  metadata: {
    total: number;
    totalPages: number;
  };
}

export interface GameRewardCreateDto {
  rewardName: string;
  value: number;
  type: RewardType | string;
  imageId: string;
  externalId: string;
  isDefault: boolean;
  itemId: string;
  otpCode: string;
}

export interface GameRewardUpdateDto extends Partial<GameRewardCreateDto> {}

export interface GameItem {
  id: string;
  name: string;
  [key: string]: any;
}

export interface GameItemListResponse {
  data: GameItem[];
}

export interface GameRewardSearchParams {
  page?: number;
  size?: number;
  search?: string;
  id?: string;
  rewardName?: string;
  type?: string;
}

export interface ItemDeleteParams {
  sign?: string;
  otpCode?: string;
}

/**
 * Game Rewards API Service
 */
export const gameRewardsApi = {
  /**
   * Get all game rewards (for dropdowns)
   */
  getAll: async (): Promise<GameReward[]> => {
    try {
      const response = await axiosInstance.get<{ data: GameReward[] }>(
        '/api/game/b/rewards/all',
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get list of game rewards with search filters (no pagination)
   */
  getList: async (
    params?: GameRewardSearchParams,
  ): Promise<GameRewardListResponse> => {
    try {
      const response = await axiosInstance.get<GameRewardListResponse>(
        '/api/game/b/rewards',
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
   * Get game reward detail by ID
   */
  getDetail: async (id: string): Promise<GameReward> => {
    try {
      const response = await axiosInstance.get<{ data: GameReward }>(
        `/api/game/b/rewards/${id}`,
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Create new game reward
   */
  create: async (
    data: GameRewardCreateDto,
  ): Promise<GameReward> => {
    try {
      logger.log('API create called:', { data });

      const response = await axiosInstance.post<GameReward>(
        `/api/game/b/rewards`,
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
   * Update existing game reward
   */
  update: async (
    id: string,
    data: GameRewardUpdateDto,
  ): Promise<GameReward> => {
    try {
      logger.log('API update called:', { id, data });

      const response = await axiosInstance.put<GameReward>(
        `/api/game/b/rewards/${id}`,
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
   * Delete game reward
   */
  delete: async (id: string, params: ItemDeleteParams): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/game/b/rewards/${id}`, { params });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

/**
 * Game Items API Service
 */
export const gameItemsApi = {
  /**
   * Get all game items
   */
  getAll: async (): Promise<GameItem[]> => {
    try {
      const response = await axiosInstance.get<GameItemListResponse>(
        '/api/game/b/items/all',
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

export default gameRewardsApi;
