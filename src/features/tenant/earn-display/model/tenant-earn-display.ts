import type {
  EarnDisplayTargetType,
  EntityStatus,
  PageQuery,
  PageResult,
  TenantEarnDisplay,
} from '../../../../shared/contracts';

export type EarnConfigurationStatus = 'CONFIGURED' | 'NOT_CONFIGURED';

export interface TenantEarnDisplayQuery extends PageQuery {
  configurationStatus?: EarnConfigurationStatus;
}

export interface TenantEarnDisplayListItem {
  brandId: string;
  code: string;
  name: string;
  logoUrl: string | null;
  brandStatus: EntityStatus;
  textEn: string | null;
  textVi: string | null;
  configurationStatus: EarnConfigurationStatus;
  canConfigure: boolean;
}

export type TenantEarnDisplayListResult = PageResult<TenantEarnDisplayListItem>;

export interface TenantEarnBrandContext {
  brand: TenantEarnDisplayListItem;
  brandConfiguration: TenantEarnDisplay | null;
  brandEffectivelyDisplayed: boolean;
  categoryCount: number;
  offerCount: number;
  categories: TenantEarnTargetView[];
  offers: TenantEarnTargetView[];
  resolutionPriority: EarnDisplayTargetType[];
}

export interface TenantEarnTargetView {
  targetType: 'CATEGORY' | 'OFFER';
  targetId: string;
  code: string;
  name: string;
  masterStatus: EntityStatus;
  configuration: TenantEarnDisplay | null;
  canConfigure: boolean;
  unavailableReason: 'INACTIVE' | 'EXPIRED' | null;
  isEffectivelyDisplayed: boolean;
}

export interface TenantEarnDisplayDraft {
  brandId: string;
  targetType: EarnDisplayTargetType;
  targetId: string | null;
  textEn: string;
  textVi: string;
  displayStatus: 'ACTIVE' | 'INACTIVE';
  effectiveFrom: string | null;
  effectiveTo: string | null;
  expectedVersion: number | null;
}

export const TENANT_EARN_DISPLAY_DEFAULT_QUERY: TenantEarnDisplayQuery = {
  page: 1,
  pageSize: 5,
  sortBy: 'name',
  sortDirection: 'asc',
};
