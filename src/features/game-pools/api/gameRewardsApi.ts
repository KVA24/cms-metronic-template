import axiosInstance, { getErrorMessage } from '@/shared/lib/api';

/**
 * Game Rewards API for game-pools feature
 * Isolated copy to avoid cross-feature dependencies
 */

export enum RewardType {
  MB = 'MB',
  POINT = 'POINT',
  DIAMOND = 'DIAMOND',
  MIX = 'MIX',
  HAMMER = 'HAMMER',
  JACKFRUIT = 'JACKFRUIT',
  VALI_TURN = 'VALI_TURN',
  BONUS_MILES = 'BONUS_MILES',
  STAR = 'STAR',
  QUIZ_TURN = 'QUIZ_TURN',
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

export const gameRewardsApi = {
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
};

export default gameRewardsApi;
