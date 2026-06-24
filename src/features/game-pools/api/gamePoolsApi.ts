import axiosInstance, { getErrorMessage } from '@/shared/lib/api';
import logger from '@/shared/lib/logger';

export type PoolState = 'ACTIVE' | 'INACTIVE';
export type PeriodType =
  | 'ALL_THE_TIME'
  | 'UNLIMITED'
  | 'DAY'
  | 'WEEK'
  | 'MONTH';
export type PeriodTypeSchedule = 'MINUTE' | 'HOUR' | 'DAY';
export type ScheduleState = 'ACTIVE' | 'INACTIVE';

export interface PoolRewardSchedule {
  id?: number;
  poolRewardMapId?: number;
  periodType: PeriodTypeSchedule;
  quantity: number;
  startAt: string;
  endAt: string;
  state: ScheduleState;
}

export interface RewardMap {
  poolId?: number;
  rewardId: number;
  weight: number;
  periodType: PeriodType;
  periodNumber: number;
  periodValue: number;
  isUnlimited: boolean;
  isActivate: boolean;
  poolRewardSchedules: PoolRewardSchedule[];
  // display only
  rewardName?: string;
}

export interface GamePool {
  id: string;
  code: string;
  state: PoolState;
  rewardMaps: RewardMap[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GamePoolListResponse {
  data: GamePool[];
  metadata: {
    total: number;
    totalPages: number;
  };
}

export interface GamePoolCreateDto {
  code: string;
  state: PoolState;
  rewardMaps: RewardMap[];
  otpCode: string;
}

export interface GamePoolUpdateDto extends Partial<GamePoolCreateDto> {
  otpCode: string;
}

export interface GamePoolSearchParams {
  page?: number;
  size?: number;
  code?: string;
  state?: string;
}

export interface ItemDeleteParams {
  sign?: string;
  otpCode?: string;
}

export const gamePoolsApi = {
  getList: async (
    params?: GamePoolSearchParams,
  ): Promise<GamePoolListResponse> => {
    try {
      const response = await axiosInstance.get<GamePoolListResponse>(
        '/api/game/b/pools',
        { params },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getDetail: async (id: string): Promise<GamePool> => {
    try {
      const response = await axiosInstance.get<{ data: GamePool }>(
        `/api/game/b/pools/${id}`,
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  create: async (data: GamePoolCreateDto): Promise<GamePool> => {
    try {
      logger.log('gamePoolsApi.create:', { data });
      const response = await axiosInstance.post<GamePool>(
        '/api/game/b/pools',
        data,
      );
      return response.data;
    } catch (error) {
      logger.error('gamePoolsApi.create error:', error);
      throw new Error(getErrorMessage(error));
    }
  },

  update: async (
    id: string,
    data: GamePoolUpdateDto,
  ): Promise<GamePool> => {
    try {
      logger.log('gamePoolsApi.update:', { id, data });
      const response = await axiosInstance.put<GamePool>(
        `/api/game/b/pools/${id}`,
        data,
      );
      return response.data;
    } catch (error) {
      logger.error('gamePoolsApi.update error:', error);
      throw new Error(getErrorMessage(error));
    }
  },

  delete: async (id: string, params: ItemDeleteParams): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/game/b/pools/${id}`, { params });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

export default gamePoolsApi;
