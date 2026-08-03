import type {
  AssetMetadata,
  ContentLocale,
  EntityStatus,
  PageResult,
} from '../../../../shared/contracts';

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
