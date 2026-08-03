import type {
  AuthSession,
  MockAuthAccount,
} from '../../../../shared/contracts';
import { mockData } from '../../../../shared/mocks/mock-data';
import type {
  TenantProfilePasswordInput,
  TenantProfileUpdateInput,
  TenantProfileView,
} from '../model/tenant-profile';
import {
  tenantProfilePasswordSchema,
  tenantProfileUpdateSchema,
} from '../model/tenant-profile';

function assertAccess(
  session: AuthSession,
  permission: 'profile.view' | 'profile.edit',
) {
  if (
    session.portalType !== 'TENANT' ||
    !session.tenantId ||
    !session.permissions.includes(permission)
  )
    throw new Error('FORBIDDEN');
  const tenant = mockData.tenants.find(({ id }) => id === session.tenantId);
  const account = mockData.authAccounts.find(
    ({ id, portalType, tenantId }) =>
      id === session.user.id &&
      portalType === 'TENANT' &&
      tenantId === session.tenantId,
  );
  if (!tenant || tenant.status !== 'ACTIVE' || !account)
    throw new Error('FORBIDDEN');
  return account;
}

function resolveRoleName(session: AuthSession, account: MockAuthAccount) {
  const role = mockData.tenantRoles.find(
    ({ id, tenantId, code }) =>
      tenantId === session.tenantId &&
      (id === account.tenantRoleId ||
        (!account.tenantRoleId && code === account.roleCode)),
  );
  if (!role) throw new Error('FORBIDDEN');
  return role.name;
}

function project(
  session: AuthSession,
  account: MockAuthAccount,
): TenantProfileView {
  return {
    username: account.username,
    roleName: resolveRoleName(session, account),
    status: account.status,
    fullName: account.displayName,
    email: account.email,
    phone: account.phone,
    avatarFileName: account.avatarFileName ?? null,
    version: account.version,
  };
}

function snapshot(account: MockAuthAccount) {
  return {
    fullName: account.displayName,
    email: account.email,
    phone: account.phone,
    avatarFileName: account.avatarFileName ?? null,
    version: account.version,
  };
}

function audit(
  session: AuthSession,
  action: string,
  account: MockAuthAccount,
  before: ReturnType<typeof snapshot>,
) {
  mockData.auditRecords.push({
    id: `audit-tenant-profile-${mockData.auditRecords.length + 1}`,
    actorId: session.user.id,
    action,
    entityType: 'TENANT_ACCOUNT',
    entityId: account.id,
    occurredAt: account.updatedAt,
    before,
    after: snapshot(account),
  });
}

export const tenantProfileService = {
  async get(session: AuthSession): Promise<TenantProfileView> {
    const account = assertAccess(session, 'profile.view');
    return structuredClone(project(session, account));
  },

  async update(
    session: AuthSession,
    input: TenantProfileUpdateInput,
  ): Promise<TenantProfileView> {
    const account = assertAccess(session, 'profile.edit');
    const parsed = tenantProfileUpdateSchema.parse(input);
    if (account.version !== parsed.version)
      throw new Error('PROFILE_VERSION_CONFLICT');
    if (parsed.avatar) {
      if (
        !['image/jpeg', 'image/png', 'image/webp'].includes(
          parsed.avatar.type,
        ) ||
        parsed.avatar.size > 2 * 1024 * 1024
      )
        throw new Error('AVATAR_INVALID');
    }
    const before = snapshot(account);
    account.displayName = parsed.fullName;
    account.email = parsed.email;
    account.phone = parsed.phone;
    if (parsed.avatar) account.avatarFileName = parsed.avatar.name;
    account.version += 1;
    account.updatedBy = session.user.id;
    account.updatedAt = `2026-08-03T${String(account.version + 18).padStart(2, '0')}:55:00.000Z`;
    audit(session, 'UPDATE_TENANT_PROFILE', account, before);
    return structuredClone(project(session, account));
  },

  async changePassword(
    session: AuthSession,
    input: TenantProfilePasswordInput,
  ): Promise<void> {
    const account = assertAccess(session, 'profile.edit');
    const parsed = tenantProfilePasswordSchema.parse(input);
    if (account.version !== parsed.version)
      throw new Error('PROFILE_VERSION_CONFLICT');
    const before = snapshot(account);
    account.password = parsed.newPassword;
    account.version += 1;
    account.updatedBy = session.user.id;
    account.updatedAt = `2026-08-03T${String(account.version + 18).padStart(2, '0')}:59:00.000Z`;
    account.sessionRevokedAt = account.updatedAt;
    audit(session, 'CHANGE_TENANT_PROFILE_PASSWORD', account, before);
  },
};
