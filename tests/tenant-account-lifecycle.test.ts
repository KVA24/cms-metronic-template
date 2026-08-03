import assert from 'node:assert/strict';
import test from 'node:test';
import { tenantAccountService } from '../src/features/tenant/accounts/api/tenant-account-service.ts';
import { mockAuthService } from '../src/shared/auth/mock-auth-service.ts';
import { mockData, resetMockData } from '../src/shared/mocks/mock-data.ts';

test.beforeEach(() => resetMockData());

async function login() {
  return mockAuthService.login({
    portalType: 'TENANT',
    username: 'admin@lotus.test',
    password: 'Tenant123!',
  });
}

const validCreate = {
  username: 'content_user',
  fullName: 'Content User',
  email: 'content@lotus.test',
  phone: '+84901234567',
  roleId: 'role-lotus-content-editor',
  status: 'ACTIVE' as const,
  password: 'Content123!',
  confirmPassword: 'Content123!',
};

test('AC-TP-USER-001-01/05/06 creates one account with an Active same-Tenant role', async () => {
  const session = await login();
  const account = await tenantAccountService.create(session, validCreate);
  assert.equal(account.roleName, 'Content Editor');
  assert.equal(account.status, 'ACTIVE');
  assert.ok(
    mockData.auditRecords.some(
      ({ action, entityId }) =>
        action === 'CREATE_TENANT_ACCOUNT' && entityId === account.id,
    ),
  );
  const customSession = await mockAuthService.login({
    portalType: 'TENANT',
    username: validCreate.username,
    password: validCreate.password,
  });
  assert.ok(customSession.permissions.includes('earn_display.edit'));
  assert.equal(customSession.permissions.includes('users.edit'), false);
});

test('AC-TP-USER-001-02/08 rejects duplicate, inactive and cross-Tenant roles', async () => {
  const session = await login();
  await tenantAccountService.create(session, validCreate);
  await assert.rejects(
    tenantAccountService.create(session, {
      ...validCreate,
      username: 'CONTENT_USER',
    }),
    /USERNAME_DUPLICATE/,
  );
  mockData.tenantRoles.find(({ id }) => id === validCreate.roleId)!.status =
    'INACTIVE';
  await assert.rejects(
    tenantAccountService.create(session, {
      ...validCreate,
      username: 'inactive_role_user',
    }),
    /ROLE_NOT_ACTIVE/,
  );
  await assert.rejects(
    tenantAccountService.create(session, {
      ...validCreate,
      username: 'cross_tenant_user',
      roleId: 'role-bamboo-report-viewer',
    }),
    /ROLE_NOT_ACTIVE/,
  );
});

test('AC-TP-USER-001-07/09/12 updates role and status with session revocation and audit', async () => {
  const session = await login();
  const before = await tenantAccountService.getDetail(session, 'tenant-viewer');
  const updated = await tenantAccountService.update(session, before.id, {
    fullName: 'Viewer Updated',
    email: 'viewer.updated@lotus.test',
    phone: '+84909999999',
    roleId: 'role-lotus-content-editor',
    status: 'INACTIVE',
    password: '',
    confirmPassword: '',
    version: before.version,
  });
  assert.equal(updated.roleName, 'Content Editor');
  assert.equal(updated.status, 'INACTIVE');
  const stored = mockData.authAccounts.find(({ id }) => id === updated.id)!;
  assert.equal(stored.sessionRevokedAt, stored.updatedAt);
  assert.ok(
    mockData.auditRecords.some(
      ({ action }) => action === 'UPDATE_TENANT_ACCOUNT_AND_REVOKE_SESSION',
    ),
  );
});

test('AC-TP-USER-001-14 unlocks a Locked account and resets failures', async () => {
  const session = await login();
  const account = mockData.authAccounts.find(
    ({ id }) => id === 'tenant-viewer',
  )!;
  account.status = 'LOCKED';
  account.failedLoginCount = 5;
  account.lockedAt = '2026-08-03T20:00:00.000Z';
  const unlocked = await tenantAccountService.unlock(session, account.id);
  assert.equal(unlocked.status, 'ACTIVE');
  assert.equal(unlocked.failedLoginCount, 0);
  assert.equal(account.lockedAt, null);
});

test('BR-TP-USER-001-02 protects the final Active Tenant Admin', async () => {
  const session = await login();
  await assert.rejects(
    tenantAccountService.disable(session, 'tenant-admin'),
    /LAST_ACTIVE_ADMIN/,
  );
});

test('AC-TP-USER-001-03 enforces create/edit/delete-disable independently', async () => {
  const session = await login();
  const base = {
    ...session,
    permissions: ['users.view'] as typeof session.permissions,
  };
  await assert.rejects(
    tenantAccountService.create(base, validCreate),
    /FORBIDDEN/,
  );
  await assert.rejects(
    tenantAccountService.disable(base, 'tenant-viewer'),
    /FORBIDDEN/,
  );
  const detail = await tenantAccountService.getDetail(session, 'tenant-viewer');
  await assert.rejects(
    tenantAccountService.update(base, detail.id, {
      fullName: detail.fullName,
      email: detail.email,
      phone: detail.phone,
      roleId: detail.roleId,
      status: detail.status,
      password: '',
      confirmPassword: '',
      version: detail.version,
    }),
    /FORBIDDEN/,
  );
});
