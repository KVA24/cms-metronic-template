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

const valid = {
  code: 'CAMPAIGN-MANAGER',
  name: 'Campaign Manager',
  description: 'Manages campaigns.',
  status: 'ACTIVE' as const,
};

test('AC-TP-ROLE-001-04/05/06 creates a normalized unique Custom Role with audit', async () => {
  const session = await login();
  const role = await tenantRoleService.create(session, {
    ...valid,
    code: ' campaign-manager ',
  });
  assert.equal(role.code, 'CAMPAIGN-MANAGER');
  assert.equal(role.type, 'CUSTOM');
  assert.deepEqual(role.permissions, []);
  assert.equal(mockData.auditRecords.at(-1)?.action, 'CREATE_TENANT_ROLE');
  await assert.rejects(
    tenantRoleService.create(session, valid),
    /ROLE_ID_EXISTS/,
  );
  await assert.rejects(
    tenantRoleService.create(session, { ...valid, code: 'bad code' }),
    /ROLE_ID_FORMAT/,
  );
});

test('AC-TP-ROLE-001-08/09 updates mutable fields with version and revokes assigned sessions', async () => {
  const session = await login();
  const seeded = mockData.tenantRoles.find(
    ({ id }) => id === 'role-lotus-content-editor',
  )!;
  const account = mockData.authAccounts.find(
    ({ id }) => id === 'tenant-viewer',
  )!;
  account.tenantRoleId = seeded.id;
  const role = await tenantRoleService.update(session, seeded.id, {
    name: 'Content Manager',
    description: 'Updated',
    status: 'INACTIVE',
    version: seeded.version,
  });
  assert.equal(role.code, 'CONTENT_EDITOR');
  assert.equal(role.status, 'INACTIVE');
  assert.equal(account.sessionRevokedAt, role.updatedAt);
  assert.equal(mockData.auditRecords.at(-1)?.action, 'UPDATE_TENANT_ROLE');
  await assert.rejects(
    tenantRoleService.update(session, seeded.id, {
      name: 'Again',
      description: '',
      status: 'ACTIVE',
      version: 1,
    }),
    /ROLE_VERSION_CONFLICT/,
  );
});

test('AC-TP-ROLE-001-15/17/18/19 deletes unused role and blocks role in use', async () => {
  const session = await login();
  const unusedId = 'role-lotus-content-editor';
  await tenantRoleService.delete(session, unusedId);
  assert.equal(
    mockData.tenantRoles.some(({ id }) => id === unusedId),
    false,
  );
  assert.equal(mockData.auditRecords.at(-1)?.action, 'DELETE_TENANT_ROLE');
  await assert.rejects(
    tenantRoleService.delete(session, 'role-lotus-viewer'),
    /SYSTEM_ROLE_IMMUTABLE/,
  );
  const custom = await tenantRoleService.create(session, valid);
  mockData.authAccounts.find(({ id }) => id === 'tenant-viewer')!.tenantRoleId =
    custom.id;
  await assert.rejects(
    tenantRoleService.delete(session, custom.id),
    /ROLE_IN_USE/,
  );
  assert.ok(mockData.tenantRoles.some(({ id }) => id === custom.id));
});

test('AC-TP-ROLE-001-14 enforces each mutation permission at service boundary', async () => {
  const marketing = await login('marketing@lotus.test');
  await assert.rejects(tenantRoleService.create(marketing, valid), /FORBIDDEN/);
  await assert.rejects(
    tenantRoleService.update(marketing, 'role-lotus-content-editor', {
      name: 'x',
      description: '',
      status: 'ACTIVE',
      version: 1,
    }),
    /FORBIDDEN/,
  );
  await assert.rejects(
    tenantRoleService.delete(marketing, 'role-lotus-content-editor'),
    /FORBIDDEN/,
  );
});

test('AC-TP-ROLE-001-31 rejects every System Role mutation', async () => {
  const session = await login();
  await assert.rejects(
    tenantRoleService.update(session, 'role-lotus-admin', {
      name: 'Changed',
      description: '',
      status: 'INACTIVE',
      version: 1,
    }),
    /SYSTEM_ROLE_IMMUTABLE/,
  );
  await assert.rejects(
    tenantRoleService.delete(session, 'role-lotus-admin'),
    /SYSTEM_ROLE_IMMUTABLE/,
  );
});
