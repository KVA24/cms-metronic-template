import assert from 'node:assert/strict';
import test from 'node:test';
import { tenantAssignedBrandService } from '../src/features/tenant/assigned-brands/api/tenant-assigned-brand-service.ts';
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

const query = { page: 1, pageSize: 5 };

test('AC-TP-BRAND-001-01/02 lists one row per current-Tenant assignment only', async () => {
  const result = await tenantAssignedBrandService.list(await login(), query);
  assert.equal(result.totalItems, 1);
  assert.equal(result.items[0].code, 'FOODNEST');
  assert.equal(
    result.items.some(({ code }) => code === 'TRAVELGO'),
    false,
  );
  assert.deepEqual(result.metrics, {
    assignedBrands: 1,
    visibleOnLanding: 1,
    landingCoverage: 100,
  });
});

test('AC-TP-BRAND-001-03 filters code, category and master status together', async () => {
  const session = await login();
  const result = await tenantAssignedBrandService.list(session, {
    ...query,
    search: ' foodnest ',
    categoryId: 'category-food-dining',
    brandStatus: 'ACTIVE',
  });
  assert.equal(result.totalItems, 1);
  const empty = await tenantAssignedBrandService.list(session, {
    ...query,
    categoryId: 'category-travel',
  });
  assert.equal(empty.totalItems, 0);
  assert.equal(empty.metrics.assignedBrands, 1);
});

test('AC-TP-BRAND-001-05/07 returns read-only Category and assigned Offer scope', async () => {
  const scope = await tenantAssignedBrandService.getScope(
    await login(),
    'brand-foodnest',
  );
  assert.equal(scope.categories.length, 1);
  assert.equal(scope.categories[0].brandCategory, 'FOOD');
  assert.equal(scope.offers.length, 1);
  assert.equal(scope.offers[0].code, 'NEWUSER');
  assert.equal(scope.offers[0].effectivelyVisible, true);
});

test('AC-TP-BRAND-001-01/11 hides unassigned and cross-Tenant direct IDs', async () => {
  const session = await login();
  await assert.rejects(
    tenantAssignedBrandService.getScope(session, 'brand-travelgo'),
    /ASSIGNED_BRAND_NOT_FOUND/,
  );
  await assert.rejects(
    tenantAssignedBrandService.getScope(session, 'brand-stylehub'),
    /ASSIGNED_BRAND_NOT_FOUND/,
  );
});

test('AC-TP-BRAND-001-12 enforces brands.view and projects edit permission', async () => {
  const viewer = await login('viewer@lotus.test');
  const view = await tenantAssignedBrandService.list(viewer, query);
  assert.equal(view.items[0].canEdit, false);
  const finance = await login('finance@bamboo.test');
  await assert.rejects(
    tenantAssignedBrandService.list(finance, query),
    /FORBIDDEN/,
  );
});

test('T12 reads ADMIN-managed shared assignment arrays without copying', async () => {
  const session = await login();
  mockData.tenantBrandAssignments[0].offerIds = [];
  const result = await tenantAssignedBrandService.list(session, query);
  assert.equal(result.items[0].offerCount, 0);
  const scope = await tenantAssignedBrandService.getScope(
    session,
    'brand-foodnest',
  );
  assert.equal(scope.offers.length, 0);
});
