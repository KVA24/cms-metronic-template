/**
 * Crypto utilities for secure credential storage
 * Sử dụng Web Crypto API để encrypt/decrypt credentials
 */

import { storage } from '@/shared/lib/storage';

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM

/**
 * Generate a key from a passphrase
 * Sử dụng machine ID hoặc một giá trị unique để tạo key
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  // Sử dụng một passphrase cố định kết hợp với browser fingerprint
  // Trong production, có thể sử dụng thêm device ID hoặc các yếu tố khác
  const passphrase = `remember-me-${navigator.userAgent}-${window.location.hostname}`;

  const encoder = new TextEncoder();
  const passphraseBuffer = encoder.encode(passphrase);

  // Hash passphrase để tạo key material
  const keyMaterial = await crypto.subtle.digest('SHA-256', passphraseBuffer);

  // Import key material as CryptoKey
  return crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypt data
 */
async function encrypt(data: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Encrypt
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      dataBuffer,
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data
 */
async function decrypt(encryptedData: string): Promise<string> {
  try {
    const key = await getEncryptionKey();

    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), (c) =>
      c.charCodeAt(0),
    );

    // Extract IV and encrypted data
    const iv = combined.slice(0, IV_LENGTH);
    const encryptedBuffer = combined.slice(IV_LENGTH);

    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encryptedBuffer,
    );

    // Convert to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Saved credentials interface
 */
export interface SavedCredentials {
  username: string;
  password: string;
}

const STORAGE_KEY = 'rm_creds'; // Remember Me Credentials

/**
 * Save credentials to storage (encrypted)
 */
export async function saveCredentials(
  credentials: SavedCredentials,
): Promise<void> {
  try {
    const json = JSON.stringify(credentials);
    const encrypted = await encrypt(json);
    storage.setItem(STORAGE_KEY, encrypted);
  } catch (error) {
    console.error('Failed to save credentials:', error);
    throw error;
  }
}

/**
 * Load credentials from storage (decrypted)
 */
export async function loadCredentials(): Promise<SavedCredentials | null> {
  try {
    const encrypted = storage.getItem(STORAGE_KEY);
    if (!encrypted) {
      return null;
    }

    const decrypted = await decrypt(encrypted);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Failed to load credentials:', error);
    // If decryption fails, clear the corrupted data
    clearCredentials();
    return null;
  }
}

/**
 * Clear saved credentials
 */
export function clearCredentials(): void {
  storage.removeItem(STORAGE_KEY);
}
