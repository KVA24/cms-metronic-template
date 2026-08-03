import type { MockAuthAccount } from '../../../../shared/contracts';
import { mockData } from '../../../../shared/mocks/mock-data';
import {
  getPermissionsForRole,
  hasPermission,
  type AdminRoleCode,
} from '../../../../shared/permissions';
import {
  adminTenantAccountCreateSchema,
  adminTenantAccountEditSchema,
  isTenantRole,
  type AdminTenantAccountCreateInput,
  type AdminTenantAccountEditInput,
  type AdminTenantAccountListResult,
  type AdminTenantAccountQuery,
  type AdminTenantAccountView,
} from '../model/admin-tenant-account';

function assertTenant(tenantId: string) {
  if (!mockData.tenants.some(({ id }) => id === tenantId))
    throw new Error('TENANT_NOT_FOUND');
}

function assertPermission(
  roleCode: AdminRoleCode,
  permission:
    | 'tenants.accounts.view'
    | 'tenants.accounts.create'
    | 'tenants.accounts.edit'
    | 'tenants.accounts.delete',
) {
  if (!hasPermission(roleCode, permission)) throw new Error('FORBIDDEN');
}

function tenantAccounts(tenantId: string) {
  return mockData.authAccounts.filter(
    (account) => account.portalType === 'TENANT' && account.tenantId === tenantId,
  );
}

function getAccount(tenantId: string, accountId: string) {
  const account = tenantAccounts(tenantId).find(({ id }) => id === accountId);
  if (!account) throw new Error('ACCOUNT_NOT_FOUND');
  return account;
}

function hasActiveAdmin(tenantId: string, exceptAccountId?: string) {
  return tenantAccounts(tenantId).some(
    (account) =>
      account.id !== exceptAccountId &&
      account.roleCode === 'TENANT_ADMIN' &&
      account.status === 'ACTIVE',
  );
}

function toView(account: MockAuthAccount): AdminTenantAccountView {
  if (!account.tenantId || !isTenantRole(account.roleCode))
    throw new Error('ACCOUNT_NOT_FOUND');
  const primary = tenantAccounts(account.tenantId)[0]?.id === account.id;
  return {
    id: account.id,
    tenantId: account.tenantId,
    username: account.username,
    fullName: account.displayName,
    email: account.email,
    phone: account.phone,
    roleCode: account.roleCode,
    status: account.status,
    createdSource: account.createdSource,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
    version: account.version,
    primary,
    effectivePermissions: [...getPermissionsForRole(account.roleCode)],
  };
}

function audit(action: string, accountId: string, actorId: string, at: string) {
  mockData.auditRecords.push({
    id: `audit-account-${mockData.auditRecords.length + 1}`,
    actorId,
    action,
    entityType: 'TENANT_ACCOUNT',
    entityId: accountId,
    occurredAt: at,
  });
}

export const adminTenantAccountService = {
  async listAccounts(
    tenantId: string,
    query: AdminTenantAccountQuery,
    roleCode: AdminRoleCode,
  ): Promise<AdminTenantAccountListResult> {
    assertPermission(roleCode, 'tenants.accounts.view');
    assertTenant(tenantId);
    const keyword = query.keyword.trim().toLowerCase();
    const items = tenantAccounts(tenantId)
      .filter(
        (account) =>
          (!keyword ||
            [account.username, account.displayName, account.email].some((value) =>
              value.toLowerCase().includes(keyword),
            )) &&
          (query.roleCode === 'ALL' || account.roleCode === query.roleCode) &&
          (query.status === 'ALL' || account.status === query.status),
      )
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map(toView);
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
    const page = Math.min(query.page, totalPages);
    const start = (page - 1) * query.pageSize;
    return structuredClone({
      items: items.slice(start, start + query.pageSize),
      page,
      pageSize: query.pageSize,
      totalItems,
      totalPages,
      requiresFirstAdmin: !hasActiveAdmin(tenantId),
      canCreate: hasPermission(roleCode, 'tenants.accounts.create'),
      canEdit: hasPermission(roleCode, 'tenants.accounts.edit'),
    });
  },

  async getAccount(
    tenantId: string,
    accountId: string,
    roleCode: AdminRoleCode,
  ) {
    assertPermission(roleCode, 'tenants.accounts.view');
    assertTenant(tenantId);
    return structuredClone(toView(getAccount(tenantId, accountId)));
  },

  async createAccount(
    tenantId: string,
    input: AdminTenantAccountCreateInput,
    roleCode: AdminRoleCode,
    actorId: string,
  ) {
    assertPermission(roleCode, 'tenants.accounts.create');
    assertTenant(tenantId);
    const parsed = adminTenantAccountCreateSchema.parse(input);
    const normalizedUsername = parsed.username.toLowerCase();
    if (
      tenantAccounts(tenantId).some(
        ({ username }) => username.trim().toLowerCase() === normalizedUsername,
      )
    )
      throw new Error('USERNAME_DUPLICATE');
    if (!hasActiveAdmin(tenantId) && parsed.roleCode !== 'TENANT_ADMIN')
      throw new Error('FIRST_ACCOUNT_ADMIN_REQUIRED');
    const sequence = mockData.authAccounts.length + 1;
    const at = `2026-08-03T${String(sequence).padStart(2, '0')}:15:00.000Z`;
    const account: MockAuthAccount = {
      id: `tenant-account-${tenantId.replace('tenant-', '')}-${sequence}`,
      tenantId,
      portalType: 'TENANT',
      username: parsed.username,
      displayName: parsed.fullName,
      email: parsed.email,
      phone: parsed.phone,
      status: 'ACTIVE',
      password: parsed.password,
      roleCode: parsed.roleCode,
      tenantRoleId: mockData.tenantRoles.find(({ tenantId: roleTenantId, code }) => roleTenantId === tenantId && code === parsed.roleCode)?.id,
      roles: [{ roleCode: parsed.roleCode, roleName: parsed.roleCode }],
      failedLoginCount: 0,
      lockedAt: null,
      sessionRevokedAt: null,
      createdSource: 'CMS',
      createdBy: actorId,
      createdAt: at,
      updatedBy: actorId,
      updatedAt: at,
      version: 1,
    };
    mockData.authAccounts.push(account);
    audit('CREATE_TENANT_ACCOUNT', account.id, actorId, at);
    return structuredClone(toView(account));
  },

  async updateAccount(
    tenantId: string,
    accountId: string,
    input: AdminTenantAccountEditInput,
    expectedVersion: number,
    roleCode: AdminRoleCode,
    actorId: string,
  ) {
    assertPermission(roleCode, 'tenants.accounts.edit');
    assertTenant(tenantId);
    const account = getAccount(tenantId, accountId);
    if (account.version !== expectedVersion) throw new Error('VERSION_CONFLICT');
    const parsed = adminTenantAccountEditSchema.parse(input);
    const removingActiveAdmin =
      account.roleCode === 'TENANT_ADMIN' &&
      account.status === 'ACTIVE' &&
      (parsed.roleCode !== 'TENANT_ADMIN' || parsed.status !== 'ACTIVE');
    if (removingActiveAdmin && !hasActiveAdmin(tenantId, accountId))
      throw new Error('LAST_ACTIVE_ADMIN');
    const securityChanged =
      account.roleCode !== parsed.roleCode ||
      account.status !== parsed.status ||
      Boolean(parsed.password);
    account.displayName = parsed.fullName;
    account.email = parsed.email;
    account.phone = parsed.phone;
    account.roleCode = parsed.roleCode;
    account.tenantRoleId = mockData.tenantRoles.find(({ tenantId: roleTenantId, code }) => roleTenantId === tenantId && code === parsed.roleCode)?.id;
    account.roles = [{ roleCode: parsed.roleCode, roleName: parsed.roleCode }];
    account.status = parsed.status;
    if (parsed.status === 'ACTIVE') account.failedLoginCount = 0;
    if (parsed.password) account.password = parsed.password;
    account.updatedBy = actorId;
    account.updatedAt = `2026-08-03T${String(account.version + 16).padStart(2, '0')}:15:00.000Z`;
    account.version += 1;
    audit(
      securityChanged
        ? 'UPDATE_TENANT_ACCOUNT_AND_INVALIDATE_SESSION'
        : 'UPDATE_TENANT_ACCOUNT',
      account.id,
      actorId,
      account.updatedAt,
    );
    return structuredClone(toView(account));
  },

  async disableAccount(
    tenantId: string,
    accountId: string,
    roleCode: AdminRoleCode,
    actorId: string,
  ) {
    assertPermission(roleCode, 'tenants.accounts.delete');
    const account = getAccount(tenantId, accountId);
    return this.updateAccount(
      tenantId,
      accountId,
      {
        fullName: account.displayName,
        email: account.email,
        phone: account.phone,
        roleCode: account.roleCode as AdminTenantAccountEditInput['roleCode'],
        status: 'INACTIVE',
        password: '',
        confirmPassword: '',
      },
      account.version,
      roleCode,
      actorId,
    );
  },
};
