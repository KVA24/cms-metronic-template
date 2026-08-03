import type { AuthSession, TenantRole } from '../../../../shared/contracts';
import { mockData } from '../../../../shared/mocks/mock-data';
import type {
  TenantRoleDetail,
  TenantRoleListItem,
  TenantRoleListResult,
  TenantRoleQuery,
} from '../model/tenant-role';
import {
  getAssignedUserCount,
  getPermissionCoverage,
} from '../model/tenant-role-permissions';

function assertAccess(session: AuthSession, permission: 'roles.view') {
  if (
    session.portalType !== 'TENANT' ||
    !session.tenantId ||
    !session.permissions.includes(permission)
  ) {
    throw new Error('FORBIDDEN');
  }
  const tenant = mockData.tenants.find(({ id }) => id === session.tenantId);
  if (!tenant || tenant.status !== 'ACTIVE') throw new Error('FORBIDDEN');
}

function project(session: AuthSession, role: TenantRole): TenantRoleListItem {
  const custom = role.type === 'CUSTOM';
  return {
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description,
    type: role.type,
    status: role.status,
    assignedUsers: getAssignedUserCount(role.id, mockData.authAccounts),
    permissionCoverage: getPermissionCoverage(role.permissions),
    canEdit: custom && session.permissions.includes('roles.edit'),
    canDelete: custom && session.permissions.includes('roles.delete_disable'),
    canManagePermissions:
      custom && session.permissions.includes('roles.permissions'),
  };
}

export const tenantRoleService = {
  async list(
    session: AuthSession,
    query: TenantRoleQuery,
  ): Promise<TenantRoleListResult> {
    assertAccess(session, 'roles.view');
    const keyword = query.search?.trim().toLocaleLowerCase() ?? '';
    const roles = mockData.tenantRoles
      .filter(({ tenantId }) => tenantId === session.tenantId)
      .filter((role) => !query.status || role.status === query.status)
      .filter(
        ({ code, name, description }) =>
          !keyword ||
          [code, name, description].some((value) =>
            value.toLocaleLowerCase().includes(keyword),
          ),
      )
      .sort((left, right) =>
        left.code.localeCompare(right.code, undefined, { sensitivity: 'base' }),
      );
    const page = Math.max(1, query.page);
    const pageSize = Math.max(1, query.pageSize);
    const totalPages = Math.max(1, Math.ceil(roles.length / pageSize));
    const start = (Math.min(page, totalPages) - 1) * pageSize;

    return structuredClone({
      items: roles
        .slice(start, start + pageSize)
        .map((role) => project(session, role)),
      page: Math.min(page, totalPages),
      pageSize,
      totalItems: roles.length,
      totalPages,
    });
  },

  async getDetail(
    session: AuthSession,
    roleId: string,
  ): Promise<TenantRoleDetail> {
    assertAccess(session, 'roles.view');
    const role = mockData.tenantRoles.find(
      ({ id, tenantId }) => id === roleId && tenantId === session.tenantId,
    );
    if (!role) throw new Error('ROLE_NOT_FOUND');
    return structuredClone({
      ...project(session, role),
      permissions: role.permissions,
      createdBy: role.createdBy,
      createdAt: role.createdAt,
      updatedBy: role.updatedBy,
      updatedAt: role.updatedAt,
      version: role.version,
    });
  },
};
