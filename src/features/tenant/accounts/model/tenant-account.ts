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
}

export const TENANT_ACCOUNT_DEFAULT_QUERY: TenantAccountQuery = {
  page: 1,
  pageSize: 5,
  sortBy: 'createdAt',
  sortDirection: 'desc',
};
