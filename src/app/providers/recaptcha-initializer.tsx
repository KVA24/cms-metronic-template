import { useEffect } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { registerRecaptcha } from '@/shared/lib/recaptcha-manager';
import logger from '@/shared/lib/logger';

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
