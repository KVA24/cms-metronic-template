import { createElement, lazy } from 'react';
import { Navigate, RouteObject } from 'react-router-dom';
import { BrandedLayout } from './layouts/branded';
import { ClassicLayout } from './layouts/classic';

// Lazy load auth pages
const CallbackPage = lazy(() =>
  import('./pages/callback-page').then((m) => ({ default: m.CallbackPage })),
);
const CheckEmail = lazy(() =>
  import('./pages/extended/check-email').then((m) => ({
    default: m.CheckEmail,
  })),
);
const ResetPasswordChanged = lazy(() =>
  import('./pages/extended/reset-password-changed').then((m) => ({
    default: m.ResetPasswordChanged,
  })),
);
const ResetPasswordCheckEmail = lazy(() =>
  import('./pages/extended/reset-password-check-email').then((m) => ({
    default: m.ResetPasswordCheckEmail,
  })),
);
const TwoFactorAuth = lazy(() =>
  import('./pages/extended/tfa').then((m) => ({ default: m.TwoFactorAuth })),
);
const ResetPasswordPage = lazy(() =>
  import('./pages/reset-password-page').then((m) => ({
    default: m.ResetPasswordPage,
  })),
);
const SignInPage = lazy(() =>
  import('./pages/signin-page').then((m) => ({ default: m.SignInPage })),
);
const SignUpPage = lazy(() =>
  import('./pages/signup-page').then((m) => ({ default: m.SignUpPage })),
);
const TenantForgotPasswordPage = lazy(() =>
  import('@/features/tenant/auth/ui/tenant-forgot-password-page').then((m) => ({ default: m.TenantForgotPasswordPage })),
);
const TenantForgotPasswordOtpPage = lazy(() =>
  import('@/features/tenant/auth/ui/tenant-forgot-password-otp-page').then((m) => ({ default: m.TenantForgotPasswordOtpPage })),
);
const TenantForgotPasswordResetPage = lazy(() =>
  import('@/features/tenant/auth/ui/tenant-forgot-password-reset-page').then((m) => ({ default: m.TenantForgotPasswordResetPage })),
);
const TenantForgotPasswordSuccessPage = lazy(() =>
  import('@/features/tenant/auth/ui/tenant-forgot-password-success-page').then((m) => ({ default: m.TenantForgotPasswordSuccessPage })),
);

export const authRoutes: RouteObject[] = [
  {
    path: '',
    element: createElement(BrandedLayout),
    children: [
      {
        path: 'login',
        element: createElement(SignInPage),
      },
      { path: 'tenant/forgot-password', element: createElement(TenantForgotPasswordPage) },
      { path: 'tenant/forgot-password/otp', element: createElement(TenantForgotPasswordOtpPage) },
      { path: 'tenant/forgot-password/reset', element: createElement(TenantForgotPasswordResetPage) },
      { path: 'tenant/forgot-password/success', element: createElement(TenantForgotPasswordSuccessPage) },
      {
        path: 'signin',
        element: createElement(Navigate, {
          to: '/auth/login?portal=admin',
          replace: true,
        }),
      },
      {
        path: 'signup',
        element: createElement(SignUpPage),
      },
      {
        path: 'reset-password',
        element: createElement(ResetPasswordPage),
      },
      {
        path: '2fa',
        element: createElement(TwoFactorAuth),
      },
      {
        path: 'check-email',
        element: createElement(CheckEmail),
      },
      {
        path: 'reset-password/check-email',
        element: createElement(ResetPasswordCheckEmail),
      },
      {
        path: 'reset-password/changed',
        element: createElement(ResetPasswordChanged),
      },
    ],
  },
  {
    path: '',
    element: createElement(ClassicLayout),
    children: [
      {
        path: 'classic/signin',
        element: createElement(SignInPage),
      },
      {
        path: 'classic/signup',
        element: createElement(SignUpPage),
      },
      {
        path: 'classic/reset-password',
        element: createElement(ResetPasswordPage),
      },
      {
        path: 'classic/2fa',
        element: createElement(TwoFactorAuth),
      },
      {
        path: 'classic/check-email',
        element: createElement(CheckEmail),
      },
      {
        path: 'classic/reset-password/check-email',
        element: createElement(ResetPasswordCheckEmail),
      },
      {
        path: 'classic/reset-password/changed',
        element: createElement(ResetPasswordChanged),
      },
    ],
  },
  {
    path: 'callback',
    element: createElement(CallbackPage),
  },
];
