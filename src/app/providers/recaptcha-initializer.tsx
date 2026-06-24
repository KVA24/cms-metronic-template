import { useEffect } from 'react';
import logger from '@/shared/lib/logger';
import { registerRecaptcha } from '@/shared/lib/recaptcha-manager';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

/**
 * Component to initialize reCAPTCHA globally
 * This should be placed inside GoogleReCaptchaProvider
 */
export function RecaptchaInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { executeRecaptcha } = useGoogleReCaptcha();

  useEffect(() => {
    if (executeRecaptcha) {
      registerRecaptcha(executeRecaptcha);
      logger.log('✅ reCAPTCHA initialized globally in RecaptchaInitializer');
    }
  }, [executeRecaptcha]);

  return <>{children}</>;
}
