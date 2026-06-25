/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react';

type ReCaptchaInstance = {
  ready: (callback: () => void) => void;
  render: (
    container: HTMLElement,
    config: { sitekey: string; size: string; theme: string },
  ) => number;
  reset: (id: string) => void;
  getResponse: (id: string) => string;
};

const RECAPTCHA_SCRIPT_ID = 'recaptcha-v2-script';

// Use WeakMap to track script loading per window/document
const scriptLoadPromises = new WeakMap<Window, Promise<void>>();

function loadRecaptchaScript(): Promise<void> {
  const existingPromise = scriptLoadPromises.get(window);
  if (existingPromise) return existingPromise;

  const promise = new Promise<void>((resolve) => {
    // If script already exists and grecaptcha is loaded
    if (
      document.getElementById(RECAPTCHA_SCRIPT_ID) &&
      (window as any).grecaptcha
    ) {
      resolve();
      return;
    }

    // Set up the callback for when the script loads
    (window as any).onRecaptchaLoaded = () => {
      resolve();
      scriptLoadPromises.delete(window);
    };

    // Create and append the script
    const script = document.createElement('script');
    script.id = RECAPTCHA_SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoaded&render=explicit`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });

  scriptLoadPromises.set(window, promise);
  return promise;
}

export function useRecaptchaV2(siteKey: string) {
  const widgetId = useRef<any | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isRendered = useRef(false);
  const isInitializing = useRef(false);

  const initializeRecaptcha = async () => {
    // Prevent multiple simultaneous initialization attempts
    if (isInitializing.current) return;
    if (!containerRef.current || !siteKey) return;

    isInitializing.current = true;

    try {
      // Reset state
      if (widgetId.current !== null) {
        const grecaptcha = (window as any).grecaptcha as ReCaptchaInstance;
        if (grecaptcha) {
          try {
            grecaptcha.reset(widgetId.current);
          } catch (error) {
            console.error('Error resetting reCAPTCHA:', error);
          }
        }
        widgetId.current = null;
        isRendered.current = false;
      }

      // Load the script and wait for it to be ready
      await loadRecaptchaScript();

      // Additional check to ensure grecaptcha is available
      const grecaptcha = (window as any).grecaptcha as ReCaptchaInstance;
      if (!grecaptcha) {
        throw new Error('reCAPTCHA failed to load');
      }

      // Wait for grecaptcha to be fully ready
      await new Promise<void>((resolve) => {
        grecaptcha.ready(() => resolve());
      });

      // Render the widget
      if (containerRef.current && !isRendered.current) {
        widgetId.current = grecaptcha.render(containerRef.current, {
          sitekey: siteKey,
          size: 'normal',
          theme: 'light',
        });
        isRendered.current = true;
      }
    } catch (error) {
      console.error('Error initializing reCAPTCHA:', error);
    } finally {
      isInitializing.current = false;
    }
  };

  useEffect(() => {
    // @ts-ignore
    let isMounted = true;

    if (containerRef.current) {
      initializeRecaptcha();
    }

    return () => {
      isMounted = false;
      if (widgetId.current !== null) {
        const grecaptcha = (window as any).grecaptcha as ReCaptchaInstance;
        if (grecaptcha) {
          try {
            grecaptcha.reset(widgetId.current);
          } catch (error) {
            console.error('Error resetting reCAPTCHA:', error);
          }
        }
        widgetId.current = null;
        isRendered.current = false;
      }
    };
    // eslint-disable-next-line react-doctor/exhaustive-deps
  }, [siteKey]);

  const getToken = (): string => {
    const grecaptcha = (window as any).grecaptcha as ReCaptchaInstance;
    if (!grecaptcha || widgetId.current === null) {
      throw new Error('reCAPTCHA not initialized');
    }
    return grecaptcha.getResponse(widgetId.current);
  };

  const resetCaptcha = () => {
    const grecaptcha = (window as any).grecaptcha as ReCaptchaInstance;
    if (!grecaptcha || widgetId.current === null) return;

    try {
      grecaptcha.reset(widgetId.current);
      widgetId.current = null;
      isRendered.current = false;
    } catch (error) {
      console.error('Error resetting reCAPTCHA:', error);
    }
  };

  return {
    containerRef,
    getToken,
    resetCaptcha,
    initializeRecaptcha,
  };
}
