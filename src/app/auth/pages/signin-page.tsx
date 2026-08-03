import { useEffect, useState } from 'react';
import {
  getPortalFromSearchParam,
  getSafePortalRedirect,
  isPathAllowedForPortal,
} from '@/shared/auth';
import { getFirstPermittedPath } from '@/shared/config/menu.config';
import type { PortalType } from '@/shared/contracts';
import { useTranslations } from '@/shared/hooks/use-translations';
import { I18N_LANGUAGES } from '@/shared/i18n/config';
import logger from '@/shared/lib/logger';
import {
  useAuthActions,
  useAuthSession,
  useAuthStatus,
} from '@/shared/stores/auth-store';
import { Alert, AlertIcon, AlertTitle } from '@/shared/ui/atoms/alert';
import { Button } from '@/shared/ui/atoms/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/atoms/form';
import { Input } from '@/shared/ui/atoms/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, LoaderCircleIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/app/providers/i18n-provider';
import { getSigninSchema, SigninSchemaType } from '../forms/signin-schema';

const errorTranslationKeys: Record<string, string> = {
  INVALID_CREDENTIALS: 'AUTH.SIGNIN.ERROR.INVALID_CREDENTIALS',
  USERNAME_NOT_FOUND: 'AUTH.SIGNIN.ERROR.USERNAME_NOT_FOUND',
  INVALID_PASSWORD: 'AUTH.SIGNIN.ERROR.INVALID_PASSWORD',
  ACCOUNT_INACTIVE: 'AUTH.SIGNIN.ERROR.ACCOUNT_INACTIVE',
  ACCOUNT_LOCKED: 'AUTH.SIGNIN.ERROR.ACCOUNT_LOCKED',
  TENANT_INACTIVE: 'AUTH.SIGNIN.ERROR.TENANT_INACTIVE',
  ROLE_INACTIVE: 'AUTH.SIGNIN.ERROR.ROLE_INACTIVE',
};

export function SignInPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslations();
  const { currenLanguage, changeLanguage } = useLanguage();
  const session = useAuthSession();
  const { isAuthenticated, isLoading } = useAuthStatus();
  const { login } = useAuthActions();
  const portalType = getPortalFromSearchParam(searchParams.get('portal'));
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const schema = getSigninSchema({
    usernameRequired: t('AUTH.SIGNIN.ERROR.USERNAME_REQUIRED'),
    passwordRequired: t('AUTH.SIGNIN.ERROR.PASSWORD_REQUIRED'),
  });

  const form = useForm<SigninSchemaType>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  });

  useEffect(() => {
    if (isAuthenticated && session) {
      const fallbackPath = getFirstPermittedPath(
        session.portalType,
        session.permissions,
      );
      navigate(
        getSafePortalRedirect(
          searchParams.get('next'),
          session.portalType,
          fallbackPath,
        ),
        { replace: true },
      );
    }
  }, [isAuthenticated, navigate, searchParams, session]);

  const handlePortalChange = (value: string) => {
    const nextPortal = value as PortalType;
    const nextParams = new URLSearchParams(searchParams);
    const nextPath = nextParams.get('next');
    nextParams.set('portal', nextPortal.toLowerCase());
    if (nextPath && !isPathAllowedForPortal(nextPath, nextPortal)) {
      nextParams.delete('next');
    }
    setSearchParams(nextParams, { replace: true });
    setErrorCode(null);
    form.clearErrors();
  };

  async function onSubmit(values: SigninSchemaType) {
    try {
      setErrorCode(null);
      const authenticatedSession = await login({ portalType, ...values });
      const fallbackPath = getFirstPermittedPath(
        authenticatedSession.portalType,
        authenticatedSession.permissions,
      );
      navigate(
        getSafePortalRedirect(
          searchParams.get('next'),
          portalType,
          fallbackPath,
        ),
        { replace: true },
      );
    } catch (caughtError) {
      logger.error('Sign-in error:', caughtError);
      const code =
        caughtError instanceof Error ? caughtError.message : 'UNKNOWN';
      setErrorCode(code);
    }
  }

  return (
    <div className="space-y-5">
      <div
        className="flex items-center justify-end gap-1"
        aria-label={t('AUTH.SIGNIN.LANGUAGE')}
      >
        {I18N_LANGUAGES.map((language) => (
          <Button
            key={language.code}
            type="button"
            variant={
              currenLanguage.code === language.code ? 'secondary' : 'ghost'
            }
            size="sm"
            aria-pressed={currenLanguage.code === language.code}
            onClick={() => changeLanguage(language)}
          >
            {language.code.toUpperCase()}
          </Button>
        ))}
      </div>

      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('AUTH.SIGNIN.TITLE')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('AUTH.SIGNIN.DESCRIPTION')}
        </p>
      </div>

      <div
        className="grid w-full grid-cols-2 gap-2 rounded-lg bg-accent p-1"
        role="tablist"
        aria-label={t('AUTH.SIGNIN.PORTAL')}
      >
        {(['ADMIN', 'TENANT'] as const).map((portal) => (
          <Button
            key={portal}
            type="button"
            role="tab"
            aria-selected={portalType === portal}
            variant={portalType === portal ? 'secondary' : 'ghost'}
            className="text-foreground"
            onClick={() => handlePortalChange(portal)}
          >
            {t(`AUTH.SIGNIN.${portal}`)}
          </Button>
        ))}
      </div>

      {errorCode && (
        <Alert
          variant="destructive"
          appearance="light"
          onClose={() => setErrorCode(null)}
        >
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertTitle>
            {t(errorTranslationKeys[errorCode] ?? 'AUTH.SIGNIN.ERROR.DEFAULT')}
          </AlertTitle>
        </Alert>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('AUTH.SIGNIN.USERNAME')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('AUTH.SIGNIN.USERNAME_PLACEHOLDER')}
                    type="email"
                    autoComplete="username"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('AUTH.SIGNIN.PASSWORD')}</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      placeholder={t('AUTH.SIGNIN.PASSWORD_PLACEHOLDER')}
                      type={passwordVisible ? 'text' : 'password'}
                      autoComplete="current-password"
                      className="pr-10"
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    mode="icon"
                    aria-label={t(
                      passwordVisible
                        ? 'AUTH.SIGNIN.HIDE_PASSWORD'
                        : 'AUTH.SIGNIN.SHOW_PASSWORD',
                    )}
                    onClick={() => setPasswordVisible((visible) => !visible)}
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  >
                    {passwordVisible ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {portalType === 'TENANT' && (
            <div className="text-right">
              <Link
                className="text-sm font-medium text-primary hover:underline"
                to="/auth/tenant/forgot-password"
              >
                {t('AUTH.SIGNIN.FORGOT_PASSWORD')}
              </Link>
            </div>
          )}

          <Button
            type="submit"
            variant="mono"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                {t('AUTH.SIGNIN.SIGNING_IN')}
              </span>
            ) : (
              t('AUTH.SIGNIN.SUBMIT')
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
