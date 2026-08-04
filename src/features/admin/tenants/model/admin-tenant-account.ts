import { z } from 'zod';
import type { AccountStatus, PageResult } from '../../../../shared/contracts';
import type { SystemRoleCode } from '../../../../shared/permissions';

export const TENANT_ACCOUNT_ROLES = [
  'TENANT_ADMIN',
  'TENANT_MARKETING_OPS',
  'TENANT_FINANCE',
  'TENANT_VIEWER',
] as const;
export type TenantAccountRoleCode = (typeof TENANT_ACCOUNT_ROLES)[number];

export interface AdminTenantAccountQuery {
  page: number;
  pageSize: number;
  keyword: string;
  roleCode: TenantAccountRoleCode | 'ALL';
  status: AccountStatus | 'ALL';
}

export interface AdminTenantAccountView {
  id: string;
  tenantId: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  roleCode: TenantAccountRoleCode;
  status: AccountStatus;
  createdSource: 'CMS' | 'TENANT_PORTAL';
  createdAt: string;
  updatedAt: string;
  version: number;
  primary: boolean;
  effectivePermissions: string[];
}

export type AdminTenantAccountListResult =
  PageResult<AdminTenantAccountView> & {
    requiresFirstAdmin: boolean;
    canCreate: boolean;
    canEdit: boolean;
  };

const username = z
  .string()
  .trim()
  .min(1, 'USERNAME_REQUIRED')
  .max(50, 'USERNAME_LENGTH')
  .regex(/^[A-Za-z0-9_]+$/, 'USERNAME_INVALID');
const fullName = z
  .string()
  .trim()
  .min(1, 'FULL_NAME_REQUIRED')
  .max(150, 'FULL_NAME_LENGTH');
const requiredEmail = z
  .string()
  .trim()
  .min(1, 'EMAIL_REQUIRED')
  .max(254, 'EMAIL_INVALID')
  .email('EMAIL_INVALID');
const optionalEmail = z.union([
  z.literal(''),
  z.string().trim().email('EMAIL_INVALID'),
]);
const phone = z
  .string()
  .trim()
  .max(20, 'PHONE_INVALID')
  .refine((value) => !value || /^\+?[0-9]+$/.test(value), 'PHONE_INVALID');
const password = z
  .string()
  .min(1, 'PASSWORD_REQUIRED')
  .min(8, 'PASSWORD_POLICY')
  .refine(
    (value) =>
      /[A-Z]/.test(value) &&
      /[a-z]/.test(value) &&
      /[0-9]/.test(value) &&
      /[^A-Za-z0-9]/.test(value),
    'PASSWORD_POLICY',
  );

export const adminTenantAccountCreateSchema = z
  .object({
    username,
    fullName,
    email: requiredEmail,
    phone,
    roleCode: z.enum(TENANT_ACCOUNT_ROLES),
    status: z.literal('ACTIVE'),
    password,
    confirmPassword: z.string().min(1, 'CONFIRM_PASSWORD_REQUIRED'),
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword)
      context.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'PASSWORD_MISMATCH',
      });
  });

export const adminTenantAccountEditSchema = z
  .object({
    fullName,
    email: optionalEmail,
    phone,
    roleCode: z.enum(TENANT_ACCOUNT_ROLES),
    status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']),
    password: z.union([z.literal(''), password]),
    confirmPassword: z.string(),
  })
  .superRefine((value, context) => {
    if (value.password && !value.confirmPassword)
      context.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'CONFIRM_PASSWORD_REQUIRED',
      });
    else if (value.password !== value.confirmPassword)
      context.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'PASSWORD_MISMATCH',
      });
  });

export type AdminTenantAccountCreateInput = z.input<
  typeof adminTenantAccountCreateSchema
>;
export type AdminTenantAccountEditInput = z.input<
  typeof adminTenantAccountEditSchema
>;

export const ADMIN_TENANT_ACCOUNT_DEFAULT_QUERY: AdminTenantAccountQuery = {
  page: 1,
  pageSize: 5,
  keyword: '',
  roleCode: 'ALL',
  status: 'ALL',
};

export function isTenantRole(
  roleCode: SystemRoleCode,
): roleCode is TenantAccountRoleCode {
  return TENANT_ACCOUNT_ROLES.includes(roleCode as TenantAccountRoleCode);
}
