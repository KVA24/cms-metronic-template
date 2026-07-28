import { storage } from '@/shared/lib/storage';

const STORAGE_KEY = 'remembered_username';
const LEGACY_CREDENTIALS_KEY = 'rm_creds';

export function saveRememberedUsername(username: string): void {
  storage.setItem(STORAGE_KEY, username);
  storage.removeItem(LEGACY_CREDENTIALS_KEY);
}

export function loadRememberedUsername(): string | null {
  storage.removeItem(LEGACY_CREDENTIALS_KEY);
  return storage.getItem(STORAGE_KEY);
}

export function clearRememberedUsername(): void {
  storage.removeItem(STORAGE_KEY);
  storage.removeItem(LEGACY_CREDENTIALS_KEY);
}
