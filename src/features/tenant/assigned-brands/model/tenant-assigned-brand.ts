import type {
  EntityStatus,
  PageQuery,
  PageResult,
} from '../../../../shared/contracts';

export interface TenantAssignedBrandQuery extends PageQuery {
  categoryId?: string;
  brandStatus?: 'ACTIVE' | 'INACTIVE';
}

export interface TenantAssignedBrandItem {
  id: string;
  assignmentId: string;
  code: string;
  name: string;
  status: EntityStatus;
  categoryCount: number;
  offerCount: number;
  customizedOfferCount: number;
  showOnLanding: boolean;
  effectivelyVisible: boolean;
  isHot: boolean;
  earnConfigured: boolean;
  updatedBy: string;
  updatedAt: string;
  version: number;
  canEdit: boolean;
}

export interface TenantAssignedBrandMetrics {
  assignedBrands: number;
  visibleOnLanding: number;
  landingCoverage: number;
}

export interface TenantAssignedBrandListResult extends PageResult<TenantAssignedBrandItem> {
  metrics: TenantAssignedBrandMetrics;
  categoryOptions: Array<{ id: string; name: string }>;
}

export interface TenantAssignedCategoryView {
  id: string;
  brandCategory: string;
  affiliateCategory: string;
  commissionType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  commissionValue: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: EntityStatus;
}

export interface TenantAssignedOfferView {
  id: string;
  code: string;
  name: string;
  commissionType: 'PERCENTAGE' | 'FIXED_AMOUNT' | null;
  commissionValue: number | null;
  configuredVisibility: boolean;
  effectivelyVisible: boolean;
  customized: boolean;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  status: EntityStatus;
  canToggle: boolean;
  expired: boolean;
}

export interface TenantAssignedBrandScope {
  brand: TenantAssignedBrandItem;
  categories: TenantAssignedCategoryView[];
  offers: TenantAssignedOfferView[];
}

export const TENANT_ASSIGNED_BRAND_DEFAULT_QUERY: TenantAssignedBrandQuery = {
  page: 1,
  pageSize: 5,
  sortBy: 'name',
  sortDirection: 'asc',
};
