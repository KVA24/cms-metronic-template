import assert from 'node:assert/strict';
import test from 'node:test';
import { tenantEarnDisplayService } from '../src/features/tenant/earn-display/api/tenant-earn-display-service.ts';
import type { TenantEarnDisplayDraft } from '../src/features/tenant/earn-display/model/tenant-earn-display.ts';
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

const brandDraft: TenantEarnDisplayDraft = {
  brandId: 'brand-foodnest',
  targetType: 'BRAND',
  targetId: null,
  textEn: ' Updated English ',
  textVi: ' Nội dung mới ',
  displayStatus: 'ACTIVE',
  effectiveFrom: '2026-08-01',
  effectiveTo: null,
  expectedVersion: 1,
};

test('AC-TP-EARN-001-06/07/10-12 returns all target levels and priority metadata', async () => {
  const context = await tenantEarnDisplayService.getBrandContext(
    await login(),
    'brand-foodnest',
  );
  assert.equal(
    context.brandConfiguration?.textEn,
    'Earn up to 12% with FoodNest',
  );
  assert.equal(context.categories[0].code, 'FOOD_DINING');
  assert.equal(context.offers[0].code, 'NEWUSER');
  assert.deepEqual(context.resolutionPriority, ['OFFER', 'CATEGORY', 'BRAND']);
});

test('AC-TP-EARN-001-17/18/19 validates localized text, XOR and period atomically', async () => {
  const session = await login();
  await assert.rejects(
    tenantEarnDisplayService.save(session, { ...brandDraft, textEn: ' ' }),
    /TEXT_EN_REQUIRED/,
  );
  await assert.rejects(
    tenantEarnDisplayService.save(session, {
      ...brandDraft,
      textVi: 'x'.repeat(161),
    }),
    /TEXT_VI_TOO_LONG/,
  );
  await assert.rejects(
    tenantEarnDisplayService.save(session, { ...brandDraft, targetId: 'bad' }),
    /TARGET_XOR_INVALID/,
  );
  await assert.rejects(
    tenantEarnDisplayService.save(session, {
      ...brandDraft,
      effectiveTo: '2026-07-01',
    }),
    /EFFECTIVE_PERIOD_INVALID/,
  );
  assert.equal(
    mockData.earnDisplays.find(({ id }) => id === 'earn-lotus-foodnest-brand')
      ?.version,
    1,
  );
});

test('AC-TP-EARN-001-25/26 updates exactly one target, trims and audits old/new', async () => {
  const before = structuredClone(mockData.earnDisplays);
  const result = await tenantEarnDisplayService.save(await login(), brandDraft);
  assert.equal(result.textEn, 'Updated English');
  assert.equal(result.version, 2);
  assert.deepEqual(
    mockData.earnDisplays.filter(({ targetType }) => targetType !== 'BRAND'),
    before.filter(({ targetType }) => targetType !== 'BRAND'),
  );
  assert.equal(
    mockData.auditRecords.at(-1)?.action,
    'UPDATE_TENANT_EARN_DISPLAY',
  );
  assert.equal(mockData.auditRecords.at(-1)?.before?.version, 1);
});

test('AC-TP-EARN-001-16 creates one new target with an explicit typed payload', async () => {
  const index = mockData.earnDisplays.findIndex(
    ({ targetType }) => targetType === 'CATEGORY',
  );
  mockData.earnDisplays.splice(index, 1);
  const result = await tenantEarnDisplayService.save(await login(), {
    ...brandDraft,
    targetType: 'CATEGORY',
    targetId: 'category-food-dining',
    expectedVersion: null,
  });
  assert.equal(result.targetType, 'CATEGORY');
  assert.equal(result.version, 1);
});

test('AC-TP-EARN-001-14 rejects unassigned and cross-Tenant targets', async () => {
  const session = await login();
  await assert.rejects(
    tenantEarnDisplayService.save(session, {
      ...brandDraft,
      targetType: 'OFFER',
      targetId: 'offer-travelgo-summer',
    }),
    /TARGET_NOT_FOUND/,
  );
  await assert.rejects(
    tenantEarnDisplayService.save(session, {
      ...brandDraft,
      brandId: 'brand-travelgo',
    }),
    /EARN_BRAND_NOT_FOUND/,
  );
});

test('AC-TP-EARN-001-27/29 enforces version and mutation permission', async () => {
  await assert.rejects(
    tenantEarnDisplayService.save(await login(), {
      ...brandDraft,
      expectedVersion: 99,
    }),
    /VERSION_CONFLICT/,
  );
  await assert.rejects(
    tenantEarnDisplayService.save(await login('viewer@lotus.test'), brandDraft),
    /FORBIDDEN/,
  );
});

test('AC-TP-EARN-001-20/21/22 derives effective display without changing configured status', async () => {
  const session = await login();
  await tenantEarnDisplayService.save(session, {
    ...brandDraft,
    effectiveFrom: '2026-09-01',
  });
  let context = await tenantEarnDisplayService.getBrandContext(
    session,
    'brand-foodnest',
  );
  assert.equal(context.brandConfiguration?.displayStatus, 'ACTIVE');
  assert.equal(context.brandEffectivelyDisplayed, false);
  await tenantEarnDisplayService.save(session, {
    ...brandDraft,
    effectiveFrom: null,
    effectiveTo: null,
    expectedVersion: 2,
  });
  context = await tenantEarnDisplayService.getBrandContext(
    session,
    'brand-foodnest',
  );
  assert.equal(context.brandEffectivelyDisplayed, true);
});

test('AC-TP-EARN-001-30 never changes commission, revenue or transactions', async () => {
  const masters = structuredClone({
    mappings: mockData.brandCategoryMappings,
    offers: mockData.offers,
    revenue: mockData.tenantRevenueShares,
    transactions: mockData.transactions,
  });
  await tenantEarnDisplayService.save(await login(), brandDraft);
  assert.deepEqual(
    {
      mappings: mockData.brandCategoryMappings,
      offers: mockData.offers,
      revenue: mockData.tenantRevenueShares,
      transactions: mockData.transactions,
    },
    masters,
  );
});
