import type {
  AuthSession,
  MockAuthAccount,
  TenantRole,
} from '../../../../shared/contracts';
import { mockData } from '../../../../shared/mocks/mock-data';
import type {
  TenantAccountDetail,
  TenantAccountListItem,
  TenantAccountListResult,
  TenantAccountQuery,
  TenantAccountRoleOption,
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
    const account = tenantAccounts(session).find(({ id }) => id === accountId);
    if (!account) throw new Error('ACCOUNT_NOT_FOUND');
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
      tenantRoles(session).map(({ id, name }) => ({ id, name })),
    );
  },
};
