import { useEffect, useState } from 'react';
import logger from '@/shared/lib/logger';
import {
  clearRememberedUsername,
  loadRememberedUsername,
  saveRememberedUsername,
} from '@/shared/lib/remember-me';
import { safeRedirect } from '@/shared/lib/safe-redirect';
import {
  useAuthActions,
  useAuthStatus,
  useAuthUser,
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
  Check,
  Eye,
  EyeOff,
  LoaderCircleIcon,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getSigninSchema, SigninSchemaType } from '../forms/signin-schema';

export function SignInPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Zustand store
  const user = useAuthUser();
  const { isAuthenticated, isLoading } = useAuthStatus();
  const { login } = useAuthActions();

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(true);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const nextPath = safeRedirect(searchParams.get('next'));
      navigate(nextPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate, searchParams]);

  // Check for success message from password reset or error messages
  useEffect(() => {
    const pwdReset = searchParams.get('pwd_reset');
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (pwdReset === 'success') {
      setSuccessMessage(
        'Your password has been successfully reset. You can now sign in with your new password.',
      );
    }

    if (errorParam) {
      switch (errorParam) {
        case 'auth_callback_failed':
          setError(
            errorDescription || 'Authentication failed. Please try again.',
          );
          break;
        case 'auth_callback_error':
          setError(
            errorDescription ||
              'An error occurred during authentication. Please try again.',
          );
          break;
        case 'auth_token_error':
          setError(
            errorDescription ||
              'Failed to set authentication session. Please try again.',
          );
          break;
        default:
          setError(
            errorDescription || 'Authentication error. Please try again.',
          );
          break;
      }
    }
  }, [searchParams]);

  const form = useForm<SigninSchemaType>({
    resolver: zodResolver(getSigninSchema()),
    defaultValues: {
      username: '',
      password: '',
      otpCode: '',
      rememberMe: false,
    },
  });

  // Load the remembered username on mount. Passwords are never persisted.
  useEffect(() => {
    const rememberedUsername = loadRememberedUsername();
    if (rememberedUsername) {
      form.setValue('username', rememberedUsername);
      form.setValue('rememberMe', true);
    }
    setIsLoadingCredentials(false);
  }, [form]);

  async function onSubmit(values: SigninSchemaType) {
    try {
      setError(null);
      logger.log('Attempting to sign in with username:', values.username);

      // Sign in using Zustand store (which calls the API)
      // reCAPTCHA token is now automatically added by the axios interceptor
      await login({
        portalType: 'ADMIN',
        username: values.username,
        password: values.password,
      });

      // Handle Remember Me
      if (values.rememberMe) {
        saveRememberedUsername(values.username);
      } else {
        clearRememberedUsername();
      }

      // Get the 'next' parameter from URL if it exists
      const nextPath = safeRedirect(searchParams.get('next'));

      // Navigate to the next path
      navigate(nextPath, { replace: true });
    } catch (err) {
      logger.error('Sign-in error:', err);

      // Error is already set in store, but we also set local error for display
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again.',
      );
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="block w-full space-y-5"
      >
        <div className="text-center space-y-1 pb-3">
          <h1 className="text-2xl font-semibold tracking-tight">Sign In</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back! Log in with your credentials.
          </p>
        </div>

        {error && (
          <Alert
            variant="destructive"
            appearance="light"
            onClose={() => setError(null)}
          >
            <AlertIcon>
              <AlertCircle />
            </AlertIcon>
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        {successMessage && (
          <Alert appearance="light" onClose={() => setSuccessMessage(null)}>
            <AlertIcon>
              <Check />
            </AlertIcon>
            <AlertTitle>{successMessage}</AlertTitle>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your username"
                  type="text"
                  autoComplete="username"
                  disabled={isLoadingCredentials}
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
              <div className="flex justify-between items-center gap-2.5">
                <FormLabel>Password</FormLabel>
              </div>
              <div className="relative">
                <FormControl>
                  <Input
                    placeholder="Enter your password"
                    type={passwordVisible ? 'text' : 'password'}
                    autoComplete="current-password"
                    disabled={isLoadingCredentials}
                    {...field}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="ghost"
                  mode="icon"
                  aria-label={
                    passwordVisible ? 'Hide password' : 'Show password'
                  }
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                >
                  {passwordVisible ? (
                    <EyeOff className="text-muted-foreground" />
                  ) : (
                    <Eye className="text-muted-foreground" />
                  )}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="otpCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>OTP</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter OTP"
                  type="text"
                  autoComplete="one-time-code"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rememberMe"
          render={({ field }) => (
            <FormItem className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal cursor-pointer">
                    Remember me
                  </FormLabel>
                </div>
                {/*<Link*/}
                {/*  to="/auth/reset-password"*/}
                {/*  className="text-sm font-semibold text-foreground hover:text-primary"*/}
                {/*>*/}
                {/*  Forgot Password?*/}
                {/*</Link>*/}
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <LoaderCircleIcon className="h-4 w-4 animate-spin" /> Signing
              in...
            </span>
          ) : (
            'Sign In'
          )}
        </Button>

        {/*<div className="text-center text-sm text-muted-foreground">*/}
        {/*  Don't have an account?{' '}*/}
        {/*  <Link*/}
        {/*    to="/auth/signup"*/}
        {/*    className="text-sm font-semibold text-foreground hover:text-primary"*/}
        {/*  >*/}
        {/*    Sign Up*/}
        {/*  </Link>*/}
        {/*</div>*/}
      </form>
    </Form>
  );
}
