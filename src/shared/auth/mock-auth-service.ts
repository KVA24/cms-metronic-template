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
        item.password === input.password &&
        item.portalType === input.portalType,
    );

    if (!account) fail('INVALID_CREDENTIALS');
    if (account.status === 'INACTIVE') fail('ACCOUNT_INACTIVE');
    if (account.status === 'LOCKED') fail('ACCOUNT_LOCKED');

    if (account.portalType === 'TENANT') {
      const tenant = mockData.tenants.find(
        (item) => item.id === account.tenantId,
      );
      if (!tenant || tenant.status !== 'ACTIVE') fail('TENANT_INACTIVE');
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
