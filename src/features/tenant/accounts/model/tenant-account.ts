import { z } from 'zod';
import type {
  AccountStatus,
  PageQuery,
  PageResult,
} from '../../../../shared/contracts';

export interface TenantAccountQuery extends PageQuery {
  roleId?: string;
  status?: AccountStatus;
}

export interface TenantAccountListItem {
  id: string;
  username: string;
  fullName: string;
  email: string;
  roleId: string;
  roleName: string;
  roleActive: boolean;
  status: AccountStatus;
  canEdit: boolean;
}

export type TenantAccountListResult = PageResult<TenantAccountListItem>;

export interface TenantAccountDetail extends TenantAccountListItem {
  phone: string;
  passwordMask: string;
  failedLoginCount: number;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  version: number;
}

export interface TenantAccountRoleOption {
  id: string;
  name: string;
  active: boolean;
}

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
const email = z.union([
  z.literal(''),
  z.string().trim().max(254, 'EMAIL_INVALID').email('EMAIL_INVALID'),
]);
const phone = z
  .string()
  .trim()
  .max(20, 'PHONE_INVALID')
  .refine((value) => !value || /^\+?[0-9]+$/.test(value), 'PHONE_INVALID');
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

export const tenantAccountCreateSchema = z
  .object({
    username,
    fullName,
    email,
    phone,
    roleId: z.string().trim().min(1, 'ROLE_REQUIRED'),
    status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']),
    password: z.string().min(1, 'PASSWORD_REQUIRED').pipe(validPassword),
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

export const tenantAccountUpdateSchema = z
  .object({
    fullName,
    email,
    phone,
    roleId: z.string().trim().min(1, 'ROLE_REQUIRED'),
    status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']),
    password: z.union([z.literal(''), validPassword]),
    confirmPassword: z.string(),
    version: z.number().int().positive(),
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

export type TenantAccountCreateInput = z.input<
  typeof tenantAccountCreateSchema
>;
export type TenantAccountUpdateInput = z.input<
  typeof tenantAccountUpdateSchema
>;

export const TENANT_ACCOUNT_DEFAULT_QUERY: TenantAccountQuery = {
  page: 1,
  pageSize: 5,
  sortBy: 'createdAt',
  sortDirection: 'desc',
};
