import { z } from 'zod';
import type {
  PageQuery,
  PageResult,
  TenantRole,
} from '../../../../shared/contracts';
import type { PermissionCode } from '../../../../shared/permissions';

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

export const tenantRoleCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'ROLE_ID_REQUIRED')
    .regex(/^[A-Z0-9-]+$/, 'ROLE_ID_FORMAT'),
  name: z
    .string()
    .trim()
    .min(1, 'ROLE_NAME_REQUIRED')
    .max(100, 'ROLE_NAME_MAX'),
  description: z.string().trim().max(500, 'ROLE_REMARK_MAX'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export type TenantRoleCreateInput = z.infer<typeof tenantRoleCreateSchema>;

export interface TenantRoleUpdateInput {
  name: string;
  description: string;
  status: TenantRole['status'];
  version: number;
}

export interface TenantRolePermissionInput {
  permissions: PermissionCode[];
  version: number;
}
