import type {
  EntityStatus,
  PageResult,
  Tenant,
} from '../../../../shared/contracts';
import { z } from 'zod';

export type AdminTenantStatusFilter = EntityStatus | 'ALL';
export type AdminTenantUpdatedPeriod = 'ALL' | '7_DAYS' | '30_DAYS';

export interface AdminTenantQuery {
  page: number;
  pageSize: number;
  keyword: string;
  status: AdminTenantStatusFilter;
  accountOwner: string;
  updatedPeriod: AdminTenantUpdatedPeriod;
}

export interface AdminTenantListItem extends Tenant {
  accountCount: number;
  brandCount: number;
  offerCount: number;
  revenueShareCount: number;
  canEdit: boolean;
}

export type AdminTenantListResult = PageResult<AdminTenantListItem>;

const optionalEmail = z.union([
  z.literal(''),
  z.string().trim().email('CONTACT_EMAIL_INVALID'),
]);

export const adminTenantSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'TENANT_CODE_REQUIRED')
    .max(50, 'TENANT_CODE_LENGTH')
    .regex(/^[A-Za-z0-9_-]+$/, 'TENANT_CODE_INVALID')
    .transform((value) => value.toUpperCase()),
  name: z
    .string()
    .trim()
    .min(1, 'TENANT_NAME_REQUIRED')
    .max(255, 'TENANT_NAME_LENGTH'),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']),
  accountOwner: z.string().trim().max(120, 'ACCOUNT_OWNER_LENGTH'),
  notes: z.string().trim().max(2000, 'NOTES_LENGTH'),
  contactName: z.string().trim().max(120, 'CONTACT_NAME_LENGTH'),
  contactTitle: z.string().trim().max(120, 'CONTACT_TITLE_LENGTH'),
  contactEmail: optionalEmail,
  contactPhone: z
    .string()
    .trim()
    .max(30, 'CONTACT_PHONE_INVALID')
    .refine(
      (value) => !value || /^[0-9+()\-\s]+$/.test(value),
      'CONTACT_PHONE_INVALID',
    ),
});

export type AdminTenantInput = z.input<typeof adminTenantSchema>;

export const ADMIN_TENANT_EMPTY_INPUT: AdminTenantInput = {
  code: '',
  name: '',
  status: 'DRAFT',
  accountOwner: '',
  notes: '',
  contactName: '',
  contactTitle: '',
  contactEmail: '',
  contactPhone: '',
};

export const ADMIN_TENANT_DEFAULT_QUERY: AdminTenantQuery = {
  page: 1,
  pageSize: 5,
  keyword: '',
  status: 'ALL',
  accountOwner: '',
  updatedPeriod: 'ALL',
};

const statuses: AdminTenantStatusFilter[] = [
  'ALL',
  'DRAFT',
  'ACTIVE',
  'INACTIVE',
];
const periods: AdminTenantUpdatedPeriod[] = ['ALL', '7_DAYS', '30_DAYS'];

function positiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function readAdminTenantQuery(
  params: URLSearchParams,
): AdminTenantQuery {
  const status = params.get('status') as AdminTenantStatusFilter | null;
  const updatedPeriod = params.get(
    'updatedPeriod',
  ) as AdminTenantUpdatedPeriod | null;
  const pageSize = positiveInteger(params.get('pageSize'), 5);
  return {
    page: positiveInteger(params.get('page'), 1),
    pageSize: [5, 10, 20].includes(pageSize) ? pageSize : 5,
    keyword: params.get('keyword')?.trim() ?? '',
    status: status && statuses.includes(status) ? status : 'ALL',
    accountOwner: params.get('accountOwner') ?? '',
    updatedPeriod:
      updatedPeriod && periods.includes(updatedPeriod) ? updatedPeriod : 'ALL',
  };
}

export function writeAdminTenantQuery(query: AdminTenantQuery) {
  const params = new URLSearchParams();
  if (query.page !== 1) params.set('page', String(query.page));
  if (query.pageSize !== 5) params.set('pageSize', String(query.pageSize));
  if (query.keyword) params.set('keyword', query.keyword.trim());
  if (query.status !== 'ALL') params.set('status', query.status);
  if (query.accountOwner) params.set('accountOwner', query.accountOwner);
  if (query.updatedPeriod !== 'ALL')
    params.set('updatedPeriod', query.updatedPeriod);
  return params;
}
