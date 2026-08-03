import assert from 'node:assert/strict';
import test from 'node:test';
import { tenantEarnDisplayService } from '../src/features/tenant/earn-display/api/tenant-earn-display-service.ts';
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

const query = { page: 1, pageSize: 5 } as const;

test('AC-TP-EARN-001-01/05 lists one row per current-Tenant assigned Brand', async () => {
  const result = await tenantEarnDisplayService.list(await login(), query);
  assert.equal(result.totalItems, 1);
  assert.equal(result.items[0].code, 'FOODNEST');
  assert.equal(result.items[0].name, 'FoodNest');
  assert.equal(
    result.items.some(({ code }) => code === 'TRAVELGO'),
    false,
  );
});

test('AC-TP-EARN-001-02/03 combines trimmed keyword and configuration filter with pagination', async () => {
  const session = await login();
  const configured = await tenantEarnDisplayService.list(session, {
    ...query,
    search: ' food ',
    configurationStatus: 'CONFIGURED',
  });
  assert.equal(configured.totalItems, 1);
  const empty = await tenantEarnDisplayService.list(session, {
    ...query,
    configurationStatus: 'NOT_CONFIGURED',
  });
  assert.equal(empty.totalItems, 0);
});

test('AC-TP-EARN-001-08/09 derives Configured across all levels but shows Brand text only', async () => {
  const session = await login();
  mockData.earnDisplays.splice(
    0,
    mockData.earnDisplays.length,
    ...mockData.earnDisplays.filter(
      ({ targetType }) => targetType === 'CATEGORY',
    ),
  );
  const result = await tenantEarnDisplayService.list(session, query);
  assert.equal(result.items[0].configurationStatus, 'CONFIGURED');
  assert.equal(result.items[0].textEn, null);
  assert.equal(result.items[0].textVi, null);
});

test('AC-TP-EARN-001-04/29 projects Configure from master status and mutation permission', async () => {
  const admin = await tenantEarnDisplayService.list(await login(), query);
  assert.equal(admin.items[0].canConfigure, true);
  const viewer = await tenantEarnDisplayService.list(
    await login('viewer@lotus.test'),
    query,
  );
  assert.equal(viewer.items[0].canConfigure, false);
});

test('BR-TP-EARN-001-01 denies missing permission and never leaks another Tenant assignment', async () => {
  const finance = await login('finance@bamboo.test');
  await assert.rejects(
    tenantEarnDisplayService.list(finance, query),
    /FORBIDDEN/,
  );
  const session = await login();
  await assert.rejects(
    tenantEarnDisplayService.getBrandContext(session, 'brand-travelgo'),
    /EARN_BRAND_NOT_FOUND/,
  );
});
