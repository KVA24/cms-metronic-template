import type {
  AssetMetadata,
  Brand,
  ContentLocale,
  EntityStatus,
  PageResult,
} from '../../../../shared/contracts';
import { z } from 'zod';

export type AdminBrandStatusFilter = EntityStatus | 'ALL';
export type AdminBrandSortBy = 'updatedAt' | 'code' | 'name' | 'createdAt';

export interface AdminBrandQuery {
  page: number;
  pageSize: number;
  keyword: string;
  status: AdminBrandStatusFilter;
  categoryId: string;
  createdFrom: string;
  createdTo: string;
  sortBy: AdminBrandSortBy;
  sortDirection: 'asc' | 'desc';
}

export interface AdminBrandListItem {
  id: string;
  code: string;
  name: string;
  resolvedLocale: ContentLocale;
  websiteUrl: string;
  logo: AssetMetadata | null;
  status: EntityStatus;
  categories: Array<{ id: string; name: string }>;
  offerCount: number;
  tenantAssignmentCount: number;
  updatedAt: string;
  canEdit: boolean;
  canDeactivate: boolean;
}

export type AdminBrandListResult = PageResult<AdminBrandListItem>;

export interface BrandDependencySummary {
  offerCount: number;
  assignmentCount: number;
  mappingCount: number;
  transactionCount: number;
  canHardDelete: boolean;
}

export interface AdminBrandDetailView {
  brand: Brand;
  dependencies: BrandDependencySummary;
  codeLocked: boolean;
  canEdit: boolean;
  canDeactivate: boolean;
}

const assetMetadataSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/svg+xml']),
  sizeBytes: z.number().int().nonnegative(),
  url: z.string(),
});

const optionalEmail = z.union([
  z.literal(''),
  z.string().trim().email('CONTACT_EMAIL_INVALID'),
]);

export const adminBrandSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, 'BRAND_CODE_REQUIRED')
      .max(50, 'BRAND_CODE_LENGTH')
      .regex(/^[A-Za-z0-9_-]+$/, 'BRAND_CODE_INVALID')
      .transform((value) => value.toUpperCase()),
    legalName: z.string().trim().max(255, 'LEGAL_NAME_LENGTH'),
    websiteUrl: z
      .string()
      .trim()
      .min(1, 'WEBSITE_REQUIRED')
      .url('WEBSITE_INVALID')
      .refine((value) => /^https?:\/\//i.test(value), 'WEBSITE_INVALID'),
    logo: assetMetadataSchema.nullable(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT']),
    defaultLocale: z.enum(['vi-VN', 'en-US']),
    pendingDays: z
      .number()
      .int('PENDING_DAYS_INVALID')
      .min(0, 'PENDING_DAYS_INVALID'),
    contactName: z.string().trim().max(120, 'CONTACT_NAME_LENGTH'),
    contactEmail: optionalEmail,
    contactPhone: z
      .string()
      .trim()
      .max(30, 'CONTACT_PHONE_INVALID')
      .refine(
        (value) => !value || /^[0-9+()\-\s]+$/.test(value),
        'CONTACT_PHONE_INVALID',
      ),
    notes: z.string().trim().max(1000, 'NOTES_LENGTH'),
    viDisplayName: z.string().trim().max(120, 'DISPLAY_NAME_LENGTH'),
    viTagline: z.string().trim().max(160, 'TAGLINE_LENGTH'),
    viShortDescription: z
      .string()
      .trim()
      .max(500, 'SHORT_DESCRIPTION_LENGTH'),
    viTerms: z.string().trim().max(2000, 'TERMS_LENGTH'),
    enDisplayName: z.string().trim().max(120, 'DISPLAY_NAME_LENGTH'),
    enTagline: z.string().trim().max(160, 'TAGLINE_LENGTH'),
    enShortDescription: z
      .string()
      .trim()
      .max(500, 'SHORT_DESCRIPTION_LENGTH'),
    enTerms: z.string().trim().max(2000, 'TERMS_LENGTH'),
  })
  .superRefine((value, context) => {
    const field =
      value.defaultLocale === 'vi-VN' ? 'viDisplayName' : 'enDisplayName';
    if (!value[field]) {
      context.addIssue({
        code: 'custom',
        path: [field],
        message: 'DEFAULT_DISPLAY_NAME_REQUIRED',
      });
    }
  });

export type AdminBrandInput = z.input<typeof adminBrandSchema>;

export interface BrandLogoUploadInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export const ADMIN_BRAND_DEFAULT_QUERY: AdminBrandQuery = {
  page: 1,
  pageSize: 5,
  keyword: '',
  status: 'ALL',
  categoryId: '',
  createdFrom: '',
  createdTo: '',
  sortBy: 'updatedAt',
  sortDirection: 'desc',
};

const statuses: readonly AdminBrandStatusFilter[] = [
  'ALL',
  'ACTIVE',
  'INACTIVE',
  'DRAFT',
];
const sorts: readonly AdminBrandSortBy[] = [
  'updatedAt',
  'createdAt',
  'code',
  'name',
];

function positiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function readAdminBrandQuery(params: URLSearchParams): AdminBrandQuery {
  const status = params.get('status') as AdminBrandStatusFilter | null;
  const sortBy = params.get('sortBy') as AdminBrandSortBy | null;
  const pageSize = positiveInteger(params.get('pageSize'), 5);
  return {
    page: positiveInteger(params.get('page'), 1),
    pageSize: [5, 10, 20].includes(pageSize) ? pageSize : 5,
    keyword: params.get('keyword')?.trim() ?? '',
    status: status && statuses.includes(status) ? status : 'ALL',
    categoryId: params.get('categoryId') ?? '',
    createdFrom: params.get('createdFrom') ?? '',
    createdTo: params.get('createdTo') ?? '',
    sortBy: sortBy && sorts.includes(sortBy) ? sortBy : 'updatedAt',
    sortDirection: params.get('sortDirection') === 'asc' ? 'asc' : 'desc',
  };
}

export function writeAdminBrandQuery(query: AdminBrandQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.page !== 1) params.set('page', String(query.page));
  if (query.pageSize !== 5) params.set('pageSize', String(query.pageSize));
  if (query.keyword) params.set('keyword', query.keyword.trim());
  if (query.status !== 'ALL') params.set('status', query.status);
  if (query.categoryId) params.set('categoryId', query.categoryId);
  if (query.createdFrom) params.set('createdFrom', query.createdFrom);
  if (query.createdTo) params.set('createdTo', query.createdTo);
  if (query.sortBy !== 'updatedAt') params.set('sortBy', query.sortBy);
  if (query.sortDirection !== 'desc') {
    params.set('sortDirection', query.sortDirection);
  }
  return params;
}

export const ADMIN_BRAND_EMPTY_INPUT: AdminBrandInput = {
  code: '',
  legalName: '',
  websiteUrl: '',
  logo: null,
  status: 'DRAFT',
  defaultLocale: 'vi-VN',
  pendingDays: 0,
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  notes: '',
  viDisplayName: '',
  viTagline: '',
  viShortDescription: '',
  viTerms: '',
  enDisplayName: '',
  enTagline: '',
  enShortDescription: '',
  enTerms: '',
};

export function brandToInput(brand: Brand): AdminBrandInput {
  const vi = brand.contents.find(({ locale }) => locale === 'vi-VN');
  const en = brand.contents.find(({ locale }) => locale === 'en-US');
  return {
    code: brand.code,
    legalName: brand.legalName,
    websiteUrl: brand.websiteUrl,
    logo: brand.logo,
    status: brand.status,
    defaultLocale: brand.defaultLocale,
    pendingDays: brand.pendingDays,
    contactName: brand.contactName,
    contactEmail: brand.contactEmail,
    contactPhone: brand.contactPhone,
    notes: brand.notes,
    viDisplayName: vi?.displayName ?? '',
    viTagline: vi?.tagline ?? '',
    viShortDescription: vi?.shortDescription ?? '',
    viTerms: vi?.terms ?? '',
    enDisplayName: en?.displayName ?? '',
    enTagline: en?.tagline ?? '',
    enShortDescription: en?.shortDescription ?? '',
    enTerms: en?.terms ?? '',
  };
}
