import { z } from 'zod';
import type { AccountStatus } from '../../../../shared/contracts';

export interface TenantProfileView {
  username: string;
  roleName: string;
  status: AccountStatus;
  fullName: string;
  email: string;
  phone: string;
  avatarFileName: string | null;
  version: number;
}

export interface TenantAvatarInput {
  name: string;
  type: string;
  size: number;
}

const fullName = z
  .string()
  .trim()
  .min(1, 'FULL_NAME_REQUIRED')
  .max(150, 'FULL_NAME_LENGTH');
const email = z.union([
  z.literal(''),
  z.string().trim().max(254, 'EMAIL_INVALID').email('EMAIL_INVALID'),
]);
const phone = z
  .string()
  .trim()
  .max(20, 'PHONE_INVALID')
  .refine((value) => !value || /^[+()\- 0-9]+$/.test(value), 'PHONE_INVALID');
const validPassword = z
  .string()
  .min(8, 'PASSWORD_POLICY')
  .refine(
    (value) =>
      /[A-Z]/.test(value) &&
      /[a-z]/.test(value) &&
      /[0-9]/.test(value) &&
      /[^A-Za-z0-9]/.test(value),
    'PASSWORD_POLICY',
  );

export const tenantProfileUpdateSchema = z.object({
  fullName,
  email,
  phone,
  avatar: z
    .object({ name: z.string(), type: z.string(), size: z.number() })
    .nullable(),
  version: z.number().int().positive(),
});

export const tenantProfilePasswordSchema = z
  .object({
    newPassword: validPassword,
    confirmPassword: z.string().min(1, 'CONFIRM_PASSWORD_REQUIRED'),
    version: z.number().int().positive(),
  })
  .superRefine((value, context) => {
    if (value.newPassword !== value.confirmPassword)
      context.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'PASSWORD_MISMATCH',
      });
  });

export type TenantProfileUpdateInput = z.input<
  typeof tenantProfileUpdateSchema
>;
export type TenantProfilePasswordInput = z.input<
  typeof tenantProfilePasswordSchema
>;
