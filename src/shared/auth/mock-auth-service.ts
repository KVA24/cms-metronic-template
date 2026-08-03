import type {
  AuthLoginInput,
  AuthSession,
  AuthUser,
  PortalType,
} from '@/shared/contracts';
import { safeRedirect } from '../lib/safe-redirect';
import { mockData } from '../mocks/mock-data';
import { getPermissionsForRole } from '../permissions';

function fail(code: string): never {
  throw new Error(code);
}

export const mockAuthService = {
  async login(input: AuthLoginInput): Promise<AuthSession> {
    const normalizedUsername = input.username.trim().toLowerCase();
    const account = mockData.authAccounts.find(
      (item) =>
        item.username.toLowerCase() === normalizedUsername &&
        item.portalType === input.portalType,
    );

    if (!account) {
      const belongsToOtherPortal = mockData.authAccounts.some((item) => item.username.toLowerCase() === normalizedUsername);
      fail(input.portalType === 'TENANT' && !belongsToOtherPortal ? 'USERNAME_NOT_FOUND' : 'INVALID_CREDENTIALS');
    }
    if (account.status === 'INACTIVE') fail('ACCOUNT_INACTIVE');
    if (account.status === 'LOCKED') fail('ACCOUNT_LOCKED');

    if (account.portalType === 'TENANT') {
      const tenant = mockData.tenants.find(
        (item) => item.id === account.tenantId,
      );
      if (!tenant || tenant.status !== 'ACTIVE') fail('TENANT_INACTIVE');
      const role = mockData.tenantRoles.find(
        (item) => item.tenantId === account.tenantId && item.code === account.roleCode,
      );
      if (!role || role.status !== 'ACTIVE') fail('ROLE_INACTIVE');
      if (account.password !== input.password) {
        account.failedLoginCount += 1;
        if (account.failedLoginCount >= 5) {
          account.status = 'LOCKED';
          account.lockedAt = '2026-08-03T23:00:00.000Z';
          account.sessionRevokedAt = account.lockedAt;
          mockData.auditRecords.push({ id: `audit-auth-${mockData.auditRecords.length + 1}`, actorId: account.id, action: 'LOCK_TENANT_ACCOUNT', entityType: 'TENANT_ACCOUNT', entityId: account.id, occurredAt: account.lockedAt });
          fail('ACCOUNT_LOCKED');
        }
        fail('INVALID_PASSWORD');
      }
      account.failedLoginCount = 0;
    } else if (account.password !== input.password) {
      fail('INVALID_CREDENTIALS');
    }

    const user: AuthUser = {
      id: account.id,
      username: account.username,
      displayName: account.displayName,
      email: account.email,
      status: account.status,
      tenantId: account.tenantId,
      roles: account.roles,
    };

    return {
      portalType: input.portalType,
      user,
      roleCode: account.roleCode,
      permissions: [...getPermissionsForRole(account.roleCode)],
      tenantId: account.tenantId,
      locale: 'en',
    };
  },
};

export function getSafePortalRedirect(
  path: string | null,
  portalType: PortalType,
  fallbackPath?: string,
): string {
  const portalRoot = portalType === 'ADMIN' ? '/admin' : '/tenant';
  const fallback = fallbackPath ?? `${portalRoot}/dashboard`;
  const safePath = safeRedirect(path);

  return safePath === portalRoot || safePath.startsWith(`${portalRoot}/`)
    ? safePath
    : fallback;
}
