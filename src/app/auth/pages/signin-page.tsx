import { useEffect, useState } from 'react';
import { getPortalFromSearchParam, getSafePortalRedirect } from '@/shared/auth';
import { getFirstPermittedPath } from '@/shared/config/menu.config';
import { useTranslations } from '@/shared/hooks/use-translations';
import { I18N_LANGUAGES } from '@/shared/i18n/config';
import logger from '@/shared/lib/logger';
import {
  clearRememberedUsername,
  loadRememberedUsername,
  saveRememberedUsername,
} from '@/shared/lib/remember-me';
import {
  useAuthActions,
  useAuthSession,
  useAuthStatus,
} from '@/shared/stores/auth-store';
import { Alert, AlertIcon, AlertTitle } from '@/shared/ui/atoms/alert';
import { Button } from '@/shared/ui/atoms/button';
import { Checkbox } from '@/shared/ui/atoms/checkbox';
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
import {
  AlertCircle,
  Eye,
  EyeOff,
  LoaderCircleIcon,
  LockKeyhole,
  Mail,
} from 'lucide-react';
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
  const [searchParams] = useSearchParams();
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
    defaultValues: { username: '', password: '', rememberMe: false },
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

  useEffect(() => {
    const rememberedUsername = loadRememberedUsername(portalType);

    form.reset({
      username: rememberedUsername ?? '',
      password: '',
      rememberMe: Boolean(rememberedUsername),
    });
    setPasswordVisible(false);
    setErrorCode(null);
  }, [form, portalType]);

  async function onSubmit(values: SigninSchemaType) {
    try {
      setErrorCode(null);
      const authenticatedSession = await login({
        portalType,
        username: values.username,
        password: values.password,
      });
      if (values.rememberMe) {
        saveRememberedUsername(portalType, values.username);
      } else {
        clearRememberedUsername(portalType);
      }
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
    <div className="space-y-6">
      <div
        className="flex items-center justify-end gap-0.5"
        aria-label={t('AUTH.SIGNIN.LANGUAGE')}
      >
        {I18N_LANGUAGES.map((language) => (
          <Button
            key={language.code}
            type="button"
            variant="ghost"
            size="sm"
            className={
              currenLanguage.code === language.code
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-500'
            }
            aria-pressed={currenLanguage.code === language.code}
            onClick={() => changeLanguage(language)}
          >
            {language.code.toUpperCase()}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.12em] text-[#095f78] uppercase">
          {t(`AUTH.SIGNIN.${portalType}`)}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          {t(`AUTH.SIGNIN.${portalType}_TITLE`)}
        </h1>
        <p className="text-sm leading-6 text-slate-500">
          {t(`AUTH.SIGNIN.${portalType}_DESCRIPTION`)}
        </p>
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
                  <div className="relative">
                    <Mail
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                    />
                    <Input
                      placeholder={t('AUTH.SIGNIN.USERNAME_PLACEHOLDER')}
                      type="email"
                      autoComplete="username"
                      className="h-11 pl-10"
                      {...field}
                    />
                  </div>
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
                  <LockKeyhole
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400"
                  />
                  <FormControl>
                    <Input
                      placeholder={t('AUTH.SIGNIN.PASSWORD_PLACEHOLDER')}
                      type={passwordVisible ? 'text' : 'password'}
                      autoComplete="current-password"
                      className="h-11 pr-10 pl-10"
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

          <div className="flex items-center justify-between gap-4">
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2.5">
                  <FormControl>
                    <Checkbox
                      size="sm"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  </FormControl>
                  <FormLabel className="cursor-pointer text-sm font-normal text-slate-600">
                    {t('AUTH.SIGNIN.REMEMBER_ME')}
                  </FormLabel>
                </FormItem>
              )}
            />

            {portalType === 'TENANT' && (
              <Link
                className="shrink-0 text-sm font-medium text-[#095f78] hover:underline"
                to="/auth/tenant/forgot-password"
              >
                {t('AUTH.SIGNIN.FORGOT_PASSWORD')}
              </Link>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            className="h-11 w-full bg-[#095f78] hover:bg-[#074759]"
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
