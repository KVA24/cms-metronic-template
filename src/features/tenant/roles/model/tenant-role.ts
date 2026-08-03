import type {
  PageQuery,
  PageResult,
  PermissionCode,
  TenantRole,
} from '../../../../shared/contracts';

export interface TenantRoleQuery extends PageQuery {
  status?: TenantRole['status'];
}

export interface TenantRoleListItem {
  id: string;
  code: string;
  name: string;
  description: string;
  type: TenantRole['type'];
  status: TenantRole['status'];
  assignedUsers: number;
  permissionCoverage: number;
  canEdit: boolean;
  canDelete: boolean;
  canManagePermissions: boolean;
}

export type TenantRoleListResult = PageResult<TenantRoleListItem>;

export interface TenantRoleDetail extends TenantRoleListItem {
  permissions: PermissionCode[];
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  version: number;
}

export const TENANT_ROLE_DEFAULT_QUERY: TenantRoleQuery = {
  page: 1,
  pageSize: 5,
  sortBy: 'code',
  sortDirection: 'asc',
};
