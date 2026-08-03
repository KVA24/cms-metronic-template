import assert from 'node:assert/strict';
import test from 'node:test';
import { tenantRoleService } from '../src/features/tenant/roles/api/tenant-role-service.ts';
import { mockAuthService } from '../src/shared/auth/mock-auth-service.ts';
import { mockData, resetMockData } from '../src/shared/mocks/mock-data.ts';

test.beforeEach(() => resetMockData());

async function login(username = 'admin@lotus.test') {
  return mockAuthService.login({
    portalType: 'TENANT',
    username,
    password: 'Tenant123!',
  });
}

test('AC-TP-ROLE-001-10/12/24/27 atomically replaces checked action permissions', async () => {
  const session = await login();
  const roleId = 'role-lotus-content-editor';
  const account = mockData.authAccounts.find(
    ({ id }) => id === 'tenant-viewer',
  )!;
  account.tenantRoleId = roleId;
  const role = await tenantRoleService.savePermissions(session, roleId, {
    permissions: ['dashboard.view', 'transactions.view', 'transactions.export'],
    version: 1,
  });
  assert.deepEqual(role.permissions, [
    'dashboard.view',
    'transactions.view',
    'transactions.export',
  ]);
  assert.equal(role.version, 2);
  assert.equal(account.sessionRevokedAt, role.updatedAt);
  assert.equal(
    mockData.auditRecords.at(-1)?.action,
    'UPDATE_TENANT_ROLE_PERMISSIONS',
  );
});

test('AC-TP-ROLE-001-11/28 rejects invalid selection without partial mutation', async () => {
  const session = await login();
  const role = mockData.tenantRoles.find(
    ({ id }) => id === 'role-lotus-content-editor',
  )!;
  const before = structuredClone(role.permissions);
  await assert.rejects(
    tenantRoleService.savePermissions(session, role.id, {
      permissions: ['configuration.edit' as never],
      version: role.version,
    }),
    /INVALID_PERMISSION_SELECTION/,
  );
  await assert.rejects(
    tenantRoleService.savePermissions(session, role.id, {
      permissions: ['transactions.export'],
      version: role.version,
    }),
    /INVALID_PERMISSION_SELECTION/,
  );
  assert.deepEqual(role.permissions, before);
});

test('AC-TP-ROLE-001-30/31 keeps System Role permissions immutable', async () => {
  const session = await login();
  const before = await tenantRoleService.getDetail(session, 'role-lotus-admin');
  await assert.rejects(
    tenantRoleService.savePermissions(session, before.id, {
      permissions: [],
      version: before.version,
    }),
    /SYSTEM_ROLE_IMMUTABLE/,
  );
  const after = await tenantRoleService.getDetail(session, before.id);
  assert.deepEqual(after.permissions, before.permissions);
});

test('AC-TP-ROLE-001-25 enforces Roles Permissions independently', async () => {
  const session = await login();
  session.permissions = session.permissions.filter(
    (permission) => permission !== 'roles.permissions',
  );
  await assert.rejects(
    tenantRoleService.savePermissions(session, 'role-lotus-content-editor', {
      permissions: ['roles.view'],
      version: 1,
    }),
    /FORBIDDEN/,
  );
});

test('AC-TP-ROLE-001-28 rejects conflicts and final-admin removal atomically', async () => {
  const session = await login();
  const custom = mockData.tenantRoles.find(
    ({ id }) => id === 'role-lotus-content-editor',
  )!;
  custom.permissions = ['roles.permissions', 'users.edit'];
  const adminAccount = mockData.authAccounts.find(
    ({ id }) => id === 'tenant-admin',
  )!;
  adminAccount.tenantRoleId = custom.id;
  mockData.tenantRoles.find(({ id }) => id === 'role-lotus-admin')!.status =
    'INACTIVE';
  const before = [...custom.permissions];
  await assert.rejects(
    tenantRoleService.savePermissions(session, custom.id, {
      permissions: ['dashboard.view'],
      version: custom.version,
    }),
    /LAST_TENANT_ADMIN/,
  );
  assert.deepEqual(custom.permissions, before);
  await assert.rejects(
    tenantRoleService.savePermissions(session, custom.id, {
      permissions: before,
      version: 99,
    }),
    /ROLE_VERSION_CONFLICT/,
  );
});
