import axiosInstance, { getErrorMessage } from '@/shared/lib/api';

export interface UploadResponse {
  url: string;
  filename?: string;
  size?: number;
}

/**
 * Upload API Service
 */
export const uploadApi = {
  /**
   * Upload a file (image)
   */
  uploadFile: async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axiosInstance.post<UploadResponse>(
        `/api/config/b/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      return response.data.url;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
