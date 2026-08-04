import type { PortalType } from '../contracts';
import { storage } from './storage';

export interface RememberedCredentials {
  username: string;
  password: string;
}

const CREDENTIALS_KEY = 'remembered_credentials';
const USERNAME_KEY = 'remembered_username';
const LEGACY_CREDENTIALS_KEY = 'rm_creds';

function getPortalKey(prefix: string, portalType: PortalType): string {
  return `${prefix}_${portalType.toLowerCase()}`;
}

function isRememberedCredentials(
  value: unknown,
): value is RememberedCredentials {
  if (!value || typeof value !== 'object') return false;

  const credentials = value as Record<string, unknown>;
  return (
    typeof credentials.username === 'string' &&
    typeof credentials.password === 'string'
  );
}

// DEMO ONLY: remove password persistence when real authentication is connected.
export function saveRememberedCredentials(
  portalType: PortalType,
  credentials: RememberedCredentials,
): void {
  storage.setJSON(getPortalKey(CREDENTIALS_KEY, portalType), credentials);
  storage.removeItem(getPortalKey(USERNAME_KEY, portalType));
  storage.removeItem(USERNAME_KEY);
  storage.removeItem(LEGACY_CREDENTIALS_KEY);
}

export function loadRememberedCredentials(
  portalType: PortalType,
): RememberedCredentials | null {
  storage.removeItem(LEGACY_CREDENTIALS_KEY);

  const portalKey = getPortalKey(CREDENTIALS_KEY, portalType);
  const storedCredentials = storage.getJSON<unknown>(portalKey);
  if (isRememberedCredentials(storedCredentials)) return storedCredentials;
  if (storedCredentials !== null) storage.removeItem(portalKey);

  const portalUsernameKey = getPortalKey(USERNAME_KEY, portalType);
  const legacyUsername =
    storage.getItem(portalUsernameKey) ?? storage.getItem(USERNAME_KEY);

  if (!legacyUsername) return null;

  const migratedCredentials = { username: legacyUsername, password: '' };
  saveRememberedCredentials(portalType, migratedCredentials);
  return migratedCredentials;
}

export function clearRememberedCredentials(portalType: PortalType): void {
  storage.removeItem(getPortalKey(CREDENTIALS_KEY, portalType));
  storage.removeItem(getPortalKey(USERNAME_KEY, portalType));
  storage.removeItem(USERNAME_KEY);
  storage.removeItem(LEGACY_CREDENTIALS_KEY);
}
