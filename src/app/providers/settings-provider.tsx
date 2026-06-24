'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { APP_SETTINGS } from '@/shared/config/settings.config';
import { Settings } from '@/shared/config/types';
import { storage } from '@/shared/lib/storage';

type Path = string;

type SettingsContextType = {
  getOption: <T = any>(path: Path) => T;
  setOption: <T = any>(path: Path, value: T) => void;
  storeOption: <T = any>(path: Path, value: T) => void;
  settings: Settings;
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

const LOCAL_STORAGE_PREFIX = 'app_settings_';

// Utility to safely access storage
const isBrowser = () => typeof window !== 'undefined';

function getFromPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

function setToPath(obj: any, path: string, value: any): Settings {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const lastObj = keys.reduce((acc, key) => (acc[key] ??= {}), obj);
  lastObj[lastKey] = value;
  return { ...obj };
}

function storeLeaf(path: string, value: unknown) {
  if (!isBrowser()) return;
  storage.setJSON(`${LOCAL_STORAGE_PREFIX}${path}`, value);
}

function getLeafFromStorage(path: string): any {
  if (!isBrowser()) return undefined;
  return storage.getJSON(`${LOCAL_STORAGE_PREFIX}${path}`);
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<Settings>(() => {
    const init = structuredClone(APP_SETTINGS);

    if (!isBrowser()) return init;

    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith(LOCAL_STORAGE_PREFIX))
        .forEach((key) => {
          const path = key.replace(LOCAL_STORAGE_PREFIX, '');
          const value = getLeafFromStorage(path);
          if (value !== undefined) {
            setToPath(init, path, value);
          }
        });
    } catch (err) {
      console.warn('Failed to load settings from storage:', err);
    }

    return init;
  });

  const getOption = useCallback(
    <T,>(path: string): T => {
      return getFromPath(settings, path) as T;
    },
    [settings],
  );

  const setOption = useCallback(<T,>(path: string, value: T) => {
    setSettings((prev) => setToPath({ ...prev }, path, value));
  }, []);

  const storeOption = useCallback(<T,>(path: string, value: T) => {
    setSettings((prev) => {
      const newSettings = setToPath({ ...prev }, path, value);
      storeLeaf(path, value);
      return newSettings;
    });
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ getOption, setOption, storeOption, settings }),
    [getOption, setOption, storeOption, settings],
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
};
