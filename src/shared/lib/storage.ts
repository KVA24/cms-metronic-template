import logger from '@/shared/lib/logger';

export const storage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      logger.warn(`Failed to read from localStorage: ${key}`, error);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      logger.warn(`Failed to write to localStorage: ${key}`, error);
      return false;
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logger.warn(`Failed to remove from localStorage: ${key}`, error);
    }
  },

  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      logger.warn('Failed to clear localStorage', error);
    }
  },

  getJSON: <T = unknown>(key: string): T | null => {
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;

      try {
        return JSON.parse(data) as T;
      } catch {
        return data as T;
      }
    } catch (error) {
      logger.warn(`Failed to read JSON from localStorage: ${key}`, error);
      return null;
    }
  },

  setJSON: (key: string, value: unknown): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.warn(`Failed to write JSON to localStorage: ${key}`, error);
      return false;
    }
  },
};

export const getData = (key: string): unknown | undefined => {
  return storage.getJSON(key);
};

export const setData = (key: string, value: unknown): void => {
  storage.setJSON(key, value);
};
