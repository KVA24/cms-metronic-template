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

function assignment() {
  return mockData.tenantBrandAssignments.find(
    ({ tenantId, brandId }) =>
      tenantId === 'tenant-lotus' && brandId === 'brand-foodnest',
  )!;
}

test('AC-TP-BRAND-002-01/02 changes landing visibility and automatically removes Hot', async () => {
  const session = await login();
  assignment().isHot = true;
  const updated = await tenantAssignedBrandService.setBrandVisibility(
    session,
    'brand-foodnest',
    false,
    1,
  );
  assert.equal(updated.showOnLanding, false);
  assert.equal(updated.isHot, false);
  assert.equal(assignment().version, 2);
  assert.equal(
    mockData.auditRecords.at(-1)?.action,
    'SET_TENANT_BRAND_VISIBILITY',
  );
});

test('AC-TP-BRAND-002-03 rejects enabling an ineligible Brand', async () => {
  const session = await login();
  const brand = mockData.brands.find(({ id }) => id === 'brand-foodnest')!;
  brand.status = 'INACTIVE';
  assignment().showOnLanding = false;
  await assert.rejects(
    tenantAssignedBrandService.setBrandVisibility(
      session,
      'brand-foodnest',
      true,
      1,
    ),
    /BRAND_NOT_ELIGIBLE/,
  );
});

test('AC-TP-BRAND-002-04/05 changes Hot only for a visible eligible Brand', async () => {
  const session = await login();
  const updated = await tenantAssignedBrandService.setHot(
    session,
    'brand-foodnest',
    true,
    1,
  );
  assert.equal(updated.isHot, true);
  assignment().showOnLanding = false;
  await assert.rejects(
    tenantAssignedBrandService.setHot(session, 'brand-foodnest', true, 2),
    /BRAND_NOT_VISIBLE/,
  );
});

test('AC-TP-BRAND-002-06/07 changes only an assigned eligible Offer visibility', async () => {
  const session = await login();
  const updated = await tenantAssignedBrandService.setOfferVisibility(
    session,
    'brand-foodnest',
    'offer-foodnest-new-user',
    false,
    1,
  );
  assert.equal(updated.offers[0].configuredVisibility, false);
  assert.equal(
    assignment().offerVisibility?.['offer-foodnest-new-user'],
    false,
  );
  assert.equal(mockData.offers[0].status, 'ACTIVE');
  await assert.rejects(
    tenantAssignedBrandService.setOfferVisibility(
      session,
      'brand-foodnest',
      'offer-travelgo-summer',
      false,
      2,
    ),
    /OFFER_NOT_ASSIGNED/,
  );
});

test('AC-TP-BRAND-002-08 enforces permission, Tenant scope and optimistic version', async () => {
  const viewer = await login('viewer@lotus.test');
  await assert.rejects(
    tenantAssignedBrandService.setHot(viewer, 'brand-foodnest', true, 1),
    /FORBIDDEN/,
  );
  const session = await login();
  await assert.rejects(
    tenantAssignedBrandService.setHot(session, 'brand-travelgo', true, 1),
    /ASSIGNED_BRAND_NOT_FOUND/,
  );
  await assert.rejects(
    tenantAssignedBrandService.setHot(session, 'brand-foodnest', true, 99),
    /VERSION_CONFLICT/,
  );
});

test('T13 writes the shared assignment that ADMIN manages without changing masters', async () => {
  const session = await login();
  const brandBefore = structuredClone(mockData.brands);
  const categoryBefore = structuredClone(mockData.categories);
  const offerBefore = structuredClone(mockData.offers);
  await tenantAssignedBrandService.setBrandVisibility(
    session,
    'brand-foodnest',
    false,
    1,
  );
  assert.equal(assignment().showOnLanding, false);
  assert.deepEqual(mockData.brands, brandBefore);
  assert.deepEqual(mockData.categories, categoryBefore);
  assert.deepEqual(mockData.offers, offerBefore);
});
