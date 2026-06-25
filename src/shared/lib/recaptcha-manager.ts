import logger from '@/shared/lib/logger';

/**
 * Global reCAPTCHA Manager
 * Allows automatic reCAPTCHA token retrieval from anywhere in the app
 * without needing to use the useGoogleReCaptcha hook
 */

let executeRecaptchaFn: (() => Promise<string>) | null = null;

/**
 * Register the executeRecaptcha function from the hook
 * Call this once when app initializes (e.g., in ReCaptchaProvider wrapper)
 */
export const registerRecaptcha = (fn: () => Promise<string>) => {
  logger.log('✅ reCAPTCHA registered globally');
  executeRecaptchaFn = fn;
};

/**
 * Get reCAPTCHA token - can be called from anywhere
 * Returns null if reCAPTCHA is not initialized
 */
export const getRecaptchaToken = async (): Promise<string | null> => {
  if (!executeRecaptchaFn) {
    logger.warn('⚠️ reCAPTCHA not initialized, skipping token generation');
    return null;
  }

  try {
    const token = await executeRecaptchaFn();
    logger.log('✅ reCAPTCHA token generated successfully');
    return token;
  } catch (error) {
    logger.error('❌ Failed to get reCAPTCHA token:', error);
    return null;
  }
};
