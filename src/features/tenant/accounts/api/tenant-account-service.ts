import type {
  AuthSession,
  MockAuthAccount,
  TenantRole,
} from '../../../../shared/contracts';
import { mockData } from '../../../../shared/mocks/mock-data';
import type { SystemRoleCode } from '../../../../shared/permissions';
import type {
  TenantAccountCreateInput,
  TenantAccountDetail,
  TenantAccountListItem,
  TenantAccountListResult,
  TenantAccountQuery,
  TenantAccountRoleOption,
  TenantAccountUpdateInput,
} from '../model/tenant-account';
import {
  tenantAccountCreateSchema,
  tenantAccountUpdateSchema,
} from '../model/tenant-account';

function assertAccess(session: AuthSession) {
  if (
    session.portalType !== 'TENANT' ||
    !session.tenantId ||
    !session.permissions.includes('users.view')
  ) {
    throw new Error('FORBIDDEN');
  }
  const tenant = mockData.tenants.find(({ id }) => id === session.tenantId);
  if (!tenant || tenant.status !== 'ACTIVE') throw new Error('FORBIDDEN');
}

function assertMutationAccess(
  session: AuthSession,
  permission: 'users.create' | 'users.edit' | 'users.delete_disable',
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

function tenantAccounts(session: AuthSession) {
  return mockData.authAccounts.filter(
    ({ portalType, tenantId }) =>
      portalType === 'TENANT' && tenantId === session.tenantId,
  );
}

function tenantRoles(session: AuthSession) {
  return mockData.tenantRoles.filter(
    ({ tenantId }) => tenantId === session.tenantId,
  );
}

function resolveRole(
  session: AuthSession,
  account: MockAuthAccount,
): TenantRole {
  const role = tenantRoles(session).find(
    ({ id, code }) =>
      id === account.tenantRoleId ||
      (!account.tenantRoleId && code === account.roleCode),
  );
  if (!role) throw new Error('ACCOUNT_NOT_FOUND');
  return role;
}

function findAccount(session: AuthSession, accountId: string) {
  const account = tenantAccounts(session).find(({ id }) => id === accountId);
  if (!account) throw new Error('ACCOUNT_NOT_FOUND');
  return account;
}

function findActiveRole(session: AuthSession, roleId: string) {
  const role = tenantRoles(session).find(
    ({ id, status }) => id === roleId && status === 'ACTIVE',
  );
  if (!role) throw new Error('ROLE_NOT_ACTIVE');
  return role;
}

function legacyRoleCode(role: TenantRole): SystemRoleCode {
  return role.type === 'SYSTEM'
    ? (role.code as SystemRoleCode)
    : 'TENANT_VIEWER';
}

function isActiveTenantAdmin(session: AuthSession, account: MockAuthAccount) {
  return (
    account.status === 'ACTIVE' &&
    resolveRole(session, account).code === 'TENANT_ADMIN'
  );
}

function hasOtherActiveAdmin(session: AuthSession, accountId: string) {
  return tenantAccounts(session).some(
    (account) =>
      account.id !== accountId && isActiveTenantAdmin(session, account),
  );
}

function project(
  session: AuthSession,
  account: MockAuthAccount,
): TenantAccountListItem {
  const role = resolveRole(session, account);
  return {
    id: account.id,
    username: account.username,
    fullName: account.displayName,
    email: account.email,
    roleId: role.id,
    roleName: role.name,
    roleActive: role.status === 'ACTIVE',
    status: account.status,
    canEdit: session.permissions.includes('users.edit'),
  };
}

function safeAuditSnapshot(account: MockAuthAccount) {
  return {
    id: account.id,
    tenantId: account.tenantId,
    username: account.username,
    displayName: account.displayName,
    email: account.email,
    phone: account.phone,
    tenantRoleId: account.tenantRoleId,
    status: account.status,
    failedLoginCount: account.failedLoginCount,
    version: account.version,
  };
}

function audit(
  session: AuthSession,
  action: string,
  account: MockAuthAccount,
  before?: ReturnType<typeof safeAuditSnapshot>,
) {
  mockData.auditRecords.push({
    id: `audit-tenant-account-${mockData.auditRecords.length + 1}`,
    actorId: session.user.id,
    action,
    entityType: 'TENANT_ACCOUNT',
    entityId: account.id,
    occurredAt: account.updatedAt,
    before,
    after: safeAuditSnapshot(account),
  });
}

export const tenantAccountService = {
  async list(
    session: AuthSession,
    query: TenantAccountQuery,
  ): Promise<TenantAccountListResult> {
    assertAccess(session);
    const keyword = query.search?.trim().toLocaleLowerCase() ?? '';
    const items: TenantAccountListItem[] = [];
    for (const account of tenantAccounts(session)) {
      const item = project(session, account);
      if (
        keyword &&
        ![item.username, item.fullName, item.email].some((value) =>
          value.toLocaleLowerCase().includes(keyword),
        )
      )
        continue;
      if (query.roleId && item.roleId !== query.roleId) continue;
      if (query.status && item.status !== query.status) continue;
      items.push(item);
    }
    items.sort((left, right) => {
      const leftAccount = mockData.authAccounts.find(
        ({ id }) => id === left.id,
      )!;
      const rightAccount = mockData.authAccounts.find(
        ({ id }) => id === right.id,
      )!;
      return rightAccount.createdAt.localeCompare(leftAccount.createdAt);
    });
    const pageSize = Math.max(1, query.pageSize);
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const page = Math.min(Math.max(1, query.page), totalPages);
    const start = (page - 1) * pageSize;
    return structuredClone({
      items: items.slice(start, start + pageSize),
      page,
      pageSize,
      totalItems: items.length,
      totalPages,
    });
  },

  async getDetail(
    session: AuthSession,
    accountId: string,
  ): Promise<TenantAccountDetail> {
    assertAccess(session);
    const account = findAccount(session, accountId);
    return structuredClone({
      ...project(session, account),
      phone: account.phone,
      passwordMask: '••••••••••••',
      failedLoginCount: account.failedLoginCount,
      createdBy: account.createdBy,
      createdAt: account.createdAt,
      updatedBy: account.updatedBy,
      updatedAt: account.updatedAt,
      version: account.version,
    });
  },

  async getRoleOptions(
    session: AuthSession,
  ): Promise<TenantAccountRoleOption[]> {
    assertAccess(session);
    return structuredClone(
      tenantRoles(session).map(({ id, name, status }) => ({
        id,
        name,
        active: status === 'ACTIVE',
      })),
    );
  },

  async create(
    session: AuthSession,
    input: TenantAccountCreateInput,
  ): Promise<TenantAccountDetail> {
    assertMutationAccess(session, 'users.create');
    const parsed = tenantAccountCreateSchema.parse(input);
    const normalizedUsername = parsed.username.toLocaleLowerCase();
    if (
      tenantAccounts(session).some(
        ({ username }) =>
          username.trim().toLocaleLowerCase() === normalizedUsername,
      )
    )
      throw new Error('USERNAME_DUPLICATE');
    const role = findActiveRole(session, parsed.roleId);
    const sequence = mockData.authAccounts.length + 1;
    const at = `2026-08-03T${String(sequence).padStart(2, '0')}:30:00.000Z`;
    const roleCode = legacyRoleCode(role);
    const account: MockAuthAccount = {
      id: `tenant-user-${session.tenantId!.replace('tenant-', '')}-${sequence}`,
      tenantId: session.tenantId,
      portalType: 'TENANT',
      username: parsed.username,
      displayName: parsed.fullName,
      email: parsed.email,
      phone: parsed.phone,
      status: parsed.status,
      password: parsed.password,
      roleCode,
      tenantRoleId: role.id,
      roles: [{ roleCode, roleName: role.name }],
      failedLoginCount: 0,
      lockedAt: parsed.status === 'LOCKED' ? at : null,
      sessionRevokedAt: parsed.status === 'ACTIVE' ? null : at,
      createdSource: 'TENANT_PORTAL',
      createdBy: session.user.id,
      createdAt: at,
      updatedBy: session.user.id,
      updatedAt: at,
      version: 1,
    };
    mockData.authAccounts.push(account);
    audit(session, 'CREATE_TENANT_ACCOUNT', account);
    return this.getDetail(session, account.id);
  },

  async update(
    session: AuthSession,
    accountId: string,
    input: TenantAccountUpdateInput,
  ): Promise<TenantAccountDetail> {
    assertMutationAccess(session, 'users.edit');
    const account = findAccount(session, accountId);
    const parsed = tenantAccountUpdateSchema.parse(input);
    if (account.version !== parsed.version)
      throw new Error('ACCOUNT_VERSION_CONFLICT');
    const role = findActiveRole(session, parsed.roleId);
    const removingFinalAdmin =
      isActiveTenantAdmin(session, account) &&
      (role.code !== 'TENANT_ADMIN' || parsed.status !== 'ACTIVE');
    if (removingFinalAdmin && !hasOtherActiveAdmin(session, account.id))
      throw new Error('LAST_ACTIVE_ADMIN');
    const before = safeAuditSnapshot(account);
    const securityChanged =
      account.tenantRoleId !== role.id ||
      account.status !== parsed.status ||
      Boolean(parsed.password);
    const roleCode = legacyRoleCode(role);
    account.displayName = parsed.fullName;
    account.email = parsed.email;
    account.phone = parsed.phone;
    account.tenantRoleId = role.id;
    account.roleCode = roleCode;
    account.roles = [{ roleCode, roleName: role.name }];
    account.status = parsed.status;
    if (parsed.password) account.password = parsed.password;
    if (parsed.status === 'ACTIVE') {
      account.failedLoginCount = 0;
      account.lockedAt = null;
    } else if (parsed.status === 'LOCKED') {
      account.lockedAt = '2026-08-03T22:30:00.000Z';
    }
    account.updatedBy = session.user.id;
    account.updatedAt = `2026-08-03T${String(account.version + 18).padStart(2, '0')}:30:00.000Z`;
    account.version += 1;
    if (securityChanged) account.sessionRevokedAt = account.updatedAt;
    audit(
      session,
      securityChanged
        ? 'UPDATE_TENANT_ACCOUNT_AND_REVOKE_SESSION'
        : 'UPDATE_TENANT_ACCOUNT',
      account,
      before,
    );
    return this.getDetail(session, account.id);
  },

  async disable(
    session: AuthSession,
    accountId: string,
  ): Promise<TenantAccountDetail> {
    assertMutationAccess(session, 'users.delete_disable');
    const account = findAccount(session, accountId);
    if (
      isActiveTenantAdmin(session, account) &&
      !hasOtherActiveAdmin(session, account.id)
    )
      throw new Error('LAST_ACTIVE_ADMIN');
    if (account.status === 'INACTIVE')
      return this.getDetail(session, account.id);
    const before = safeAuditSnapshot(account);
    account.status = 'INACTIVE';
    account.updatedBy = session.user.id;
    account.updatedAt = `2026-08-03T${String(account.version + 18).padStart(2, '0')}:45:00.000Z`;
    account.version += 1;
    account.sessionRevokedAt = account.updatedAt;
    audit(session, 'DISABLE_TENANT_ACCOUNT', account, before);
    return this.getDetail(session, account.id);
  },

  async unlock(
    session: AuthSession,
    accountId: string,
  ): Promise<TenantAccountDetail> {
    assertMutationAccess(session, 'users.delete_disable');
    const account = findAccount(session, accountId);
    if (account.status !== 'LOCKED') throw new Error('ACCOUNT_NOT_LOCKED');
    const before = safeAuditSnapshot(account);
    account.status = 'ACTIVE';
    account.failedLoginCount = 0;
    account.lockedAt = null;
    account.updatedBy = session.user.id;
    account.updatedAt = `2026-08-03T${String(account.version + 18).padStart(2, '0')}:50:00.000Z`;
    account.version += 1;
    account.sessionRevokedAt = account.updatedAt;
    audit(session, 'UNLOCK_TENANT_ACCOUNT', account, before);
    return this.getDetail(session, account.id);
  },
};
