import logger from '@/shared/lib/logger';
import { storage } from '@/shared/lib/storage';
import { AuthModel } from './models';

const AUTH_LOCAL_STORAGE_KEY = `${import.meta.env.VITE_APP_NAME}-auth-v${
  import.meta.env.VITE_APP_VERSION || '1.0'
}`;

/**
 * Get stored auth information from storage
 */
const getAuth = (): AuthModel | undefined => {
  try {
    const auth = storage.getJSON<AuthModel>(AUTH_LOCAL_STORAGE_KEY);
    return auth || undefined;
  } catch (error) {
    logger.error('AUTH STORAGE PARSE ERROR', error);
  }
};

/**
 * Save auth information to storage
 */
const setAuth = (auth: AuthModel) => {
  storage.setJSON(AUTH_LOCAL_STORAGE_KEY, auth);
};

/**
 * Remove auth information from storage
 */
const removeAuth = () => {
  try {
    storage.removeItem(AUTH_LOCAL_STORAGE_KEY);
  } catch (error) {
    logger.error('AUTH STORAGE REMOVE ERROR', error);
  }
};

export { AUTH_LOCAL_STORAGE_KEY, getAuth, removeAuth, setAuth };
