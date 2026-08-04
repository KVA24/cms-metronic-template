import type { PortalType } from '../contracts';
import { storage } from './storage';

const STORAGE_KEY = 'remembered_username';
const LEGACY_CREDENTIALS_KEY = 'rm_creds';

function getPortalStorageKey(portalType: PortalType): string {
  return `${STORAGE_KEY}_${portalType.toLowerCase()}`;
}

export function saveRememberedUsername(
  portalType: PortalType,
  username: string,
): void {
  storage.setItem(getPortalStorageKey(portalType), username);
  storage.removeItem(STORAGE_KEY);
  storage.removeItem(LEGACY_CREDENTIALS_KEY);
}

export function loadRememberedUsername(portalType: PortalType): string | null {
  storage.removeItem(LEGACY_CREDENTIALS_KEY);
  const portalUsername = storage.getItem(getPortalStorageKey(portalType));

  if (portalUsername) return portalUsername;

  const legacyUsername = storage.getItem(STORAGE_KEY);
  if (legacyUsername) {
    saveRememberedUsername(portalType, legacyUsername);
  }

  return legacyUsername;
}

export function clearRememberedUsername(portalType: PortalType): void {
  storage.removeItem(getPortalStorageKey(portalType));
  storage.removeItem(STORAGE_KEY);
  storage.removeItem(LEGACY_CREDENTIALS_KEY);
}
