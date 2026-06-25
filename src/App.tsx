import { Toaster } from '@/shared/ui/atoms/sonner';
import { ErrorBoundary } from '@/shared/ui/molecules/error-boundary.tsx';
import { MotionConfig } from 'motion/react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { LoadingBarContainer } from 'react-top-loading-bar';
import { AppRouting } from '@/app/routing/app-routing';
import { AuthInitializer } from './app/auth/auth-initializer';
import { I18nProvider } from './app/providers/i18n-provider';
import { QueryProvider } from './app/providers/query-provider';
import { RecaptchaInitializer } from './app/providers/recaptcha-initializer';
import { SettingsProvider } from './app/providers/settings-provider';
import { ThemeProvider } from './app/providers/theme-provider';
import { TooltipsProvider } from './app/providers/tooltips-provider';
import { useApiLoading } from './shared/hooks/use-api-loading';
import './shared/i18n/i18n';
import { generalConfig } from '@/shared/config/general.config';

const { BASE_URL } = import.meta.env;

// Get reCAPTCHA key from window object (set by init.js) or fallback to env variable
const RECAPTCHA_SITE_KEY =
  generalConfig.GOOGLE_RECAPTCHA_KEY ||
  (import.meta.env.VITE_RECAPTCHA_SITE_KEY as string);

function AppContent() {
  useApiLoading(); // Track API loading

  return (
    <BrowserRouter basename={BASE_URL}>
      <GoogleReCaptchaProvider
        reCaptchaKey={RECAPTCHA_SITE_KEY}
        language="en-GB"
        useRecaptchaNet={true}
        useEnterprise={false}
        scriptProps={{
          async: false,
          defer: false,
          appendTo: 'head',
          nonce: undefined,
        }}
      >
        <RecaptchaInitializer>
          <Toaster position={'top-center'} duration={2000} />
          <AppRouting />
        </RecaptchaInitializer>
      </GoogleReCaptchaProvider>
    </BrowserRouter>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <AuthInitializer>
          <SettingsProvider>
            <ThemeProvider>
              <MotionConfig reducedMotion="user">
                <I18nProvider>
                  <HelmetProvider>
                    <TooltipsProvider>
                      <LoadingBarContainer>
                        <AppContent />
                      </LoadingBarContainer>
                    </TooltipsProvider>
                  </HelmetProvider>
                </I18nProvider>
              </MotionConfig>
            </ThemeProvider>
          </SettingsProvider>
        </AuthInitializer>
      </QueryProvider>
    </ErrorBoundary>
  );
}
