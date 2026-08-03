import assert from 'node:assert/strict';
import test from 'node:test';
import { tenantAccountService } from '../src/features/tenant/accounts/api/tenant-account-service.ts';
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

test('TP-USER-001 lists only accounts in the current Tenant', async () => {
  const result = await tenantAccountService.list(await login(), query);
  assert.equal(result.totalItems, 3);
  assert.deepEqual(
    result.items.map(({ username }) => username).sort(),
    ['admin@lotus.test', 'marketing@lotus.test', 'viewer@lotus.test'],
  );
  assert.ok(result.items.every(({ roleName }) => roleName.endsWith('Tenant')));
});

test('TP-USER-001 combines keyword, role and status filters', async () => {
  const session = await login();
  const result = await tenantAccountService.list(session, {
    ...query,
    search: ' VIEWER ',
    roleId: 'role-lotus-viewer',
    status: 'ACTIVE',
  });
  assert.deepEqual(result.items.map(({ id }) => id), ['tenant-viewer']);
  const empty = await tenantAccountService.list(session, {
    ...query,
    roleId: 'role-bamboo-finance',
  });
  assert.equal(empty.totalItems, 0);
});

test('TP-USER-001 paginates and projects read-only detail without a password', async () => {
  const session = await login();
  const page = await tenantAccountService.list(session, {
    page: 2,
    pageSize: 2,
  });
  assert.equal(page.page, 2);
  assert.equal(page.totalPages, 2);
  assert.equal(page.items.length, 1);
  const detail = await tenantAccountService.getDetail(session, 'tenant-admin');
  assert.equal(detail.roleName, 'Admin Tenant');
  assert.equal(detail.passwordMask, '••••••••••••');
  assert.equal('password' in detail, false);
});

test('TP-USER-001 hides cross-Tenant IDs as not found', async () => {
  await assert.rejects(
    tenantAccountService.getDetail(await login(), 'tenant-finance'),
    /ACCOUNT_NOT_FOUND/,
  );
});

test('TP-USER-001 enforces users.view at the service boundary', async () => {
  const marketing = await login('marketing@lotus.test');
  await assert.rejects(tenantAccountService.list(marketing, query), /FORBIDDEN/);
});
