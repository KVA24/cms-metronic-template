import type { AuthSession, TenantRole } from '../../../../shared/contracts';
import { mockData } from '../../../../shared/mocks/mock-data';
import type { PermissionCode } from '../../../../shared/permissions';
import type {
  TenantRoleCreateInput,
  TenantRoleDetail,
  TenantRoleListItem,
  TenantRoleListResult,
  TenantRolePermissionInput,
  TenantRoleQuery,
  TenantRoleUpdateInput,
} from '../model/tenant-role';
import { tenantRoleCreateSchema } from '../model/tenant-role';
import {
  getAssignedUserCount,
  getPermissionCoverage,
  isValidTenantPermissionSet,
  wouldRemoveLastTenantAdministrator,
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

function assertMutationAccess(
  session: AuthSession,
  permission: 'roles.create' | 'roles.edit' | 'roles.delete_disable',
) {
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

function assertPermissionAccess(session: AuthSession) {
  if (
    session.portalType !== 'TENANT' ||
    !session.tenantId ||
    !session.permissions.includes('roles.permissions')
  ) {
    throw new Error('FORBIDDEN');
  }
  const tenant = mockData.tenants.find(({ id }) => id === session.tenantId);
  if (!tenant || tenant.status !== 'ACTIVE') throw new Error('FORBIDDEN');
}

function findCustomRole(session: AuthSession, roleId: string) {
  const role = mockData.tenantRoles.find(
    ({ id, tenantId }) => id === roleId && tenantId === session.tenantId,
  );
  if (!role) throw new Error('ROLE_NOT_FOUND');
  if (role.type === 'SYSTEM') throw new Error('SYSTEM_ROLE_IMMUTABLE');
  return role;
}

function writeAudit(
  session: AuthSession,
  action: string,
  roleId: string,
  before?: TenantRole,
  after?: TenantRole,
) {
  mockData.auditRecords.push({
    id: `audit-tenant-role-${mockData.auditRecords.length + 1}`,
    actorId: session.user.id,
    action,
    entityType: 'TENANT_ROLE',
    entityId: roleId,
    occurredAt: '2026-08-03T10:00:00.000Z',
    before: before ? { ...structuredClone(before) } : undefined,
    after: after ? { ...structuredClone(after) } : undefined,
  });
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
    const roles: TenantRole[] = [];
    for (const role of mockData.tenantRoles) {
      if (role.tenantId !== session.tenantId) continue;
      if (query.status && role.status !== query.status) continue;
      if (
        keyword &&
        ![role.code, role.name, role.description].some((value) =>
          value.toLocaleLowerCase().includes(keyword),
        )
      )
        continue;
      roles.push(role);
    }
    roles.sort((left, right) =>
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

  async create(
    session: AuthSession,
    input: TenantRoleCreateInput,
  ): Promise<TenantRoleDetail> {
    assertMutationAccess(session, 'roles.create');
    const parsed = tenantRoleCreateSchema.parse({
      ...input,
      code: input.code.trim().toUpperCase(),
    });
    if (
      mockData.tenantRoles.some(
        ({ tenantId, code }) =>
          tenantId === session.tenantId &&
          code.toLocaleLowerCase() === parsed.code.toLocaleLowerCase(),
      )
    ) {
      throw new Error('ROLE_ID_EXISTS');
    }
    const role: TenantRole = {
      id: `role-${session.tenantId!.replace('tenant-', '')}-${parsed.code.toLocaleLowerCase()}`,
      tenantId: session.tenantId!,
      code: parsed.code,
      name: parsed.name,
      description: parsed.description,
      type: 'CUSTOM',
      status: parsed.status,
      permissions: [] as PermissionCode[],
      createdBy: session.user.id,
      createdAt: '2026-08-03T10:00:00.000Z',
      updatedBy: session.user.id,
      updatedAt: '2026-08-03T10:00:00.000Z',
      version: 1,
    };
    mockData.tenantRoles.push(role);
    writeAudit(session, 'CREATE_TENANT_ROLE', role.id, undefined, role);
    return this.getDetail(session, role.id);
  },

  async update(
    session: AuthSession,
    roleId: string,
    input: TenantRoleUpdateInput,
  ): Promise<TenantRoleDetail> {
    assertMutationAccess(session, 'roles.edit');
    const role = findCustomRole(session, roleId);
    const parsed = tenantRoleCreateSchema.omit({ code: true }).parse(input);
    if (role.version !== input.version)
      throw new Error('ROLE_VERSION_CONFLICT');
    if (
      parsed.status === 'INACTIVE' &&
      wouldRemoveLastTenantAdministrator(
        role,
        [],
        mockData.tenantRoles,
        mockData.authAccounts,
      )
    ) {
      throw new Error('LAST_TENANT_ADMIN');
    }
    const before = structuredClone(role);
    Object.assign(role, {
      ...parsed,
      updatedBy: session.user.id,
      updatedAt: '2026-08-03T10:05:00.000Z',
      version: role.version + 1,
    });
    if (role.status === 'INACTIVE') {
      for (const account of mockData.authAccounts) {
        if (account.tenantRoleId === role.id) {
          account.sessionRevokedAt = role.updatedAt;
        }
      }
    }
    writeAudit(session, 'UPDATE_TENANT_ROLE', role.id, before, role);
    return this.getDetail(session, role.id);
  },

  async delete(session: AuthSession, roleId: string): Promise<void> {
    assertMutationAccess(session, 'roles.delete_disable');
    const role = findCustomRole(session, roleId);
    if (getAssignedUserCount(role.id, mockData.authAccounts) > 0) {
      throw new Error('ROLE_IN_USE');
    }
    mockData.tenantRoles.splice(mockData.tenantRoles.indexOf(role), 1);
    writeAudit(session, 'DELETE_TENANT_ROLE', role.id, role);
  },

  async savePermissions(
    session: AuthSession,
    roleId: string,
    input: TenantRolePermissionInput,
  ): Promise<TenantRoleDetail> {
    assertPermissionAccess(session);
    const role = findCustomRole(session, roleId);
    if (role.version !== input.version)
      throw new Error('ROLE_VERSION_CONFLICT');
    if (
      new Set(input.permissions).size !== input.permissions.length ||
      !isValidTenantPermissionSet(input.permissions) ||
      (input.permissions.includes('transactions.export') &&
        !input.permissions.includes('transactions.view'))
    ) {
      throw new Error('INVALID_PERMISSION_SELECTION');
    }
    if (
      wouldRemoveLastTenantAdministrator(
        role,
        input.permissions,
        mockData.tenantRoles,
        mockData.authAccounts,
      )
    ) {
      throw new Error('LAST_TENANT_ADMIN');
    }
    const before = structuredClone(role);
    role.permissions = [...input.permissions];
    role.updatedBy = session.user.id;
    role.updatedAt = '2026-08-03T10:10:00.000Z';
    role.version += 1;
    for (const account of mockData.authAccounts) {
      if (account.tenantRoleId === role.id) {
        account.sessionRevokedAt = role.updatedAt;
      }
    }
    writeAudit(
      session,
      'UPDATE_TENANT_ROLE_PERMISSIONS',
      role.id,
      before,
      role,
    );
    return this.getDetail(session, role.id);
  },
};
