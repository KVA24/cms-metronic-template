import type {
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
  categoryCount: number;
  offerCount: number;
}

export const TENANT_EARN_DISPLAY_DEFAULT_QUERY: TenantEarnDisplayQuery = {
  page: 1,
  pageSize: 5,
  sortBy: 'name',
  sortDirection: 'asc',
};
