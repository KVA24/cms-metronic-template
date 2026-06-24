import axiosInstance, { getErrorMessage } from '@/shared/lib/api';

export interface GameTransaction {
  transId: string;
  createdAt: number;
  userId: number;
  externalId: string;
  mainIdentifier: string;
  fullName: string;
  itemId: string;
  rewardId: number;
  rewardName: string;
  amount: number;
  balance: number;
  referenceId: string;
  cardNumber: string;
}

export interface GameTransactionMetadata {
  next: number;
  pre: number;
  hasNextPage: boolean;
  hasPrePage: boolean;
  pageSize: number;
}

export interface GameTransactionResponse {
  data: GameTransaction[];
  metadata: GameTransactionMetadata;
}

export interface GameTransactionParams {
  userId?: string;
  transId?: string;
  rewardId?: string;
  cardNumber?: string;
  referenceId?: string;
  gte?: string;
  lte?: string;
  next?: number;
  pre?: number;
  limit?: number;
}

export const gameTransactionsApi = {
  getList: async (
    params?: GameTransactionParams,
  ): Promise<GameTransactionResponse> => {
    try {
      const response = await axiosInstance.get<GameTransactionResponse>(
        '/api/game/b/transactions/reward',
        { params },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

export default gameTransactionsApi;
