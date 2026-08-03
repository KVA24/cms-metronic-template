import assert from 'node:assert/strict';
import test from 'node:test';
import { tenantRoleService } from '../src/features/tenant/roles/api/tenant-role-service.ts';
import { mockAuthService } from '../src/shared/auth/mock-auth-service.ts';
import { resetMockData } from '../src/shared/mocks/mock-data.ts';

test.beforeEach(() => resetMockData());

async function login(username = 'admin@lotus.test') {
  return mockAuthService.login({
    portalType: 'TENANT',
    username,
    password: 'Tenant123!',
  });
}

const query = { page: 1, pageSize: 5 };

test('AC-TP-ROLE-001-01 lists only roles in the session Tenant', async () => {
  const session = await login();
  const result = await tenantRoleService.list(session, query);
  assert.equal(result.totalItems, 5);
  assert.ok(result.items.every(({ id }) => id.startsWith('role-lotus-')));
  assert.ok(result.items.some(({ type }) => type === 'SYSTEM'));
  assert.ok(result.items.some(({ type }) => type === 'CUSTOM'));
  assert.deepEqual(
    result.items
      .filter(({ type }) => type === 'SYSTEM')
      .map(({ name }) => name)
      .sort(),
    [
      'Admin Tenant',
      'Finance Tenant',
      'Marketing/Ops Tenant',
      'Viewer Tenant',
    ].sort(),
  );
});

test('AC-TP-ROLE-001-02 filters keyword and status with pagination', async () => {
  const session = await login();
  const keyword = await tenantRoleService.list(session, {
    ...query,
    search: 'content editor',
  });
  assert.deepEqual(
    keyword.items.map(({ code }) => code),
    ['CONTENT_EDITOR'],
  );
  const inactive = await tenantRoleService.list(session, {
    ...query,
    status: 'INACTIVE',
  });
  assert.equal(inactive.totalItems, 0);
  const paged = await tenantRoleService.list(session, { page: 2, pageSize: 2 });
  assert.equal(paged.items.length, 2);
  assert.equal(paged.totalPages, 3);
});

test('AC-TP-ROLE-001-03/07 projects permitted actions and detail metadata', async () => {
  const session = await login();
  const system = await tenantRoleService.getDetail(session, 'role-lotus-admin');
  assert.equal(system.type, 'SYSTEM');
  assert.equal(system.canEdit, false);
  assert.equal(system.canDelete, false);
  assert.equal(system.canManagePermissions, false);
  assert.equal(system.permissionCoverage, 7);
  const custom = await tenantRoleService.getDetail(
    session,
    'role-lotus-content-editor',
  );
  assert.equal(custom.canEdit, true);
  assert.equal(custom.canDelete, true);
  assert.equal(custom.canManagePermissions, true);
  assert.ok(custom.permissions.includes('earn_display.edit'));
});

test('AC-TP-ROLE-001-01 denies cross-Tenant IDs without leaking detail', async () => {
  const session = await login();
  await assert.rejects(
    tenantRoleService.getDetail(session, 'role-bamboo-report-viewer'),
    /ROLE_NOT_FOUND/,
  );
});

test('AC-TP-ROLE-001-14 blocks users without roles.view at service boundary', async () => {
  const marketing = await login('marketing@lotus.test');
  await assert.rejects(tenantRoleService.list(marketing, query), /FORBIDDEN/);
});
