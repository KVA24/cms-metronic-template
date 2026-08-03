import type {
  AssetMetadata,
  Category,
  CategoryDependencySummary,
  ContentLocale,
  EntityStatus,
  PageResult,
} from '../../../../shared/contracts';
import { z } from 'zod';

export type CategoryStatusFilter = EntityStatus | 'ALL';
export type CategoryLandingFilter = 'ALL' | 'VISIBLE' | 'HIDDEN';
export type CategorySortBy = 'displayOrder' | 'code' | 'name' | 'updatedAt';

export interface AdminCategoryQuery {
  page: number;
  pageSize: number;
  keyword: string;
  status: CategoryStatusFilter;
  landing: CategoryLandingFilter;
  sortBy: CategorySortBy;
  sortDirection: 'asc' | 'desc';
}

export interface AdminCategoryListItem {
  id: string;
  code: string;
  name: string;
  resolvedLocale: ContentLocale;
  icon: AssetMetadata | null;
  displayOrder: number;
  status: EntityStatus;
  landingVisible: boolean;
  updatedBy: string;
  updatedAt: string;
  canEdit: boolean;
  canInactive: boolean;
}

export type AdminCategoryListResult = PageResult<AdminCategoryListItem>;

const assetMetadataSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/svg+xml']),
  sizeBytes: z.number().int().nonnegative(),
  url: z.string(),
});

export const adminCategorySchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, 'CATEGORY_CODE_LENGTH')
      .max(50, 'CATEGORY_CODE_LENGTH')
      .regex(/^[A-Za-z0-9_-]+$/, 'CATEGORY_CODE_INVALID')
      .transform((value) => value.toUpperCase()),
    displayOrder: z
      .number()
      .int('DISPLAY_ORDER_INVALID')
      .min(0, 'DISPLAY_ORDER_INVALID')
      .max(9999, 'DISPLAY_ORDER_INVALID'),
    status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT']),
    icon: assetMetadataSchema.nullable(),
    viName: z
      .string()
      .trim()
      .min(1, 'VI_NAME_REQUIRED')
      .max(80, 'CATEGORY_NAME_LENGTH'),
    viDescription: z.string().trim().max(500, 'DESCRIPTION_LENGTH'),
    enName: z.string().trim().max(80, 'CATEGORY_NAME_LENGTH'),
    enDescription: z.string().trim().max(500, 'DESCRIPTION_LENGTH'),
  })
  .superRefine((value, context) => {
    if (value.enDescription && !value.enName) {
      context.addIssue({
        code: 'custom',
        path: ['enName'],
        message: 'EN_NAME_REQUIRED',
      });
    }
  });

export type AdminCategoryInput = z.input<typeof adminCategorySchema>;

export interface AdminCategoryDetailView {
  category: Category;
  dependency: CategoryDependencySummary;
  codeLocked: boolean;
  canEdit: boolean;
  canInactive: boolean;
}

export interface CategoryIconUploadInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export const ADMIN_CATEGORY_EMPTY_INPUT: AdminCategoryInput = {
  code: '',
  displayOrder: 0,
  status: 'DRAFT',
  icon: null,
  viName: '',
  viDescription: '',
  enName: '',
  enDescription: '',
};

export function categoryToInput(category: Category): AdminCategoryInput {
  const vi = category.contents.find(({ locale }) => locale === 'vi-VN');
  const en = category.contents.find(({ locale }) => locale === 'en-US');
  return {
    code: category.code,
    displayOrder: category.displayOrder,
    status: category.status,
    icon: category.icon,
    viName: vi?.name ?? '',
    viDescription: vi?.description ?? '',
    enName: en?.name ?? '',
    enDescription: en?.description ?? '',
  };
}

export const ADMIN_CATEGORY_DEFAULT_QUERY: AdminCategoryQuery = {
  page: 1,
  pageSize: 5,
  keyword: '',
  status: 'ALL',
  landing: 'ALL',
  sortBy: 'displayOrder',
  sortDirection: 'asc',
};

const statusValues: readonly CategoryStatusFilter[] = [
  'ALL',
  'ACTIVE',
  'INACTIVE',
  'DRAFT',
];
const landingValues: readonly CategoryLandingFilter[] = [
  'ALL',
  'VISIBLE',
  'HIDDEN',
];
const sortValues: readonly CategorySortBy[] = [
  'displayOrder',
  'code',
  'name',
  'updatedAt',
];

function positiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function readAdminCategoryQuery(
  params: URLSearchParams,
): AdminCategoryQuery {
  const status = params.get('status') as CategoryStatusFilter | null;
  const landing = params.get('landing') as CategoryLandingFilter | null;
  const sortBy = params.get('sortBy') as CategorySortBy | null;
  const sortDirection = params.get('sortDirection');
  const requestedPageSize = positiveInteger(
    params.get('pageSize'),
    ADMIN_CATEGORY_DEFAULT_QUERY.pageSize,
  );

  return {
    page: positiveInteger(params.get('page'), 1),
    pageSize: [5, 10, 20].includes(requestedPageSize)
      ? requestedPageSize
      : ADMIN_CATEGORY_DEFAULT_QUERY.pageSize,
    keyword: params.get('keyword')?.trim() ?? '',
    status: status && statusValues.includes(status) ? status : 'ALL',
    landing:
      landing && landingValues.includes(landing) ? landing : 'ALL',
    sortBy: sortBy && sortValues.includes(sortBy) ? sortBy : 'displayOrder',
    sortDirection: sortDirection === 'desc' ? 'desc' : 'asc',
  };
}

export function writeAdminCategoryQuery(query: AdminCategoryQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.page !== 1) params.set('page', String(query.page));
  if (query.pageSize !== 5) params.set('pageSize', String(query.pageSize));
  if (query.keyword) params.set('keyword', query.keyword.trim());
  if (query.status !== 'ALL') params.set('status', query.status);
  if (query.landing !== 'ALL') params.set('landing', query.landing);
  if (query.sortBy !== 'displayOrder') params.set('sortBy', query.sortBy);
  if (query.sortDirection !== 'asc') {
    params.set('sortDirection', query.sortDirection);
  }
  return params;
}
