import { z } from 'zod';

export const DEMO_RESET_OTP = '260803';

export const tenantResetEmailSchema = z.object({
  email: z.string().trim().email('EMAIL_INVALID'),
});

export const tenantResetOtpSchema = z.object({
  requestId: z.string().min(1, 'RESET_REQUEST_REQUIRED'),
  otp: z.string().regex(/^\d{6}$/, 'OTP_INVALID'),
});

const password = z.string().min(8, 'PASSWORD_POLICY').refine((value) => /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value), 'PASSWORD_POLICY');

export const tenantResetPasswordSchema = z.object({
  requestId: z.string().min(1, 'RESET_REQUEST_REQUIRED'),
  newPassword: password,
  confirmPassword: z.string().min(1, 'CONFIRM_PASSWORD_REQUIRED'),
}).superRefine((value, context) => {
  if (value.newPassword !== value.confirmPassword) context.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'PASSWORD_MISMATCH' });
});

export type TenantResetPasswordInput = z.input<typeof tenantResetPasswordSchema>;
