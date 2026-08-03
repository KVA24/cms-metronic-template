import assert from 'node:assert/strict';
import test from 'node:test';
import { tenantDashboardService } from '../src/features/tenant/dashboard/api/tenant-dashboard-service.ts';
import { mockAuthService } from '../src/shared/auth/mock-auth-service.ts';
import { resetMockData } from '../src/shared/mocks/mock-data.ts';

test.beforeEach(() => resetMockData());

async function login(username: string) {
  return mockAuthService.login({
    portalType: 'TENANT',
    username,
    password: 'Tenant123!',
  });
}

test('AC-TP-DASH-001-01/02 scopes filters to the tenant session', async () => {
  const lotus = await login('admin@lotus.test');
  const view = await tenantDashboardService.getDashboard(lotus, {
    range: 'MONTH',
  });
  assert.equal(view.tenantName, 'Lotus Rewards');
  assert.deepEqual(view.brandOptions, [
    { id: 'brand-foodnest', name: 'FoodNest' },
  ]);
  await assert.rejects(
    tenantDashboardService.getDashboard(lotus, {
      range: 'MONTH',
      brandId: 'brand-travelgo',
    }),
    /INVALID_BRAND/,
  );
});

test('AC-TP-DASH-001-03/09/11 returns one snapshot with complete range buckets', async () => {
  const session = await login('admin@lotus.test');
  const month = await tenantDashboardService.getDashboard(session, {
    range: 'MONTH',
  });
  const week = await tenantDashboardService.getDashboard(session, {
    range: 'WEEK',
  });
  const year = await tenantDashboardService.getDashboard(session, {
    range: 'YEAR',
  });
  assert.equal(month.trend.length, 31);
  assert.equal(week.trend.length, 7);
  assert.equal(year.trend.length, 12);
  assert.ok(
    month.trend.every(
      ({ orders, pending, confirmed, cancelled }) =>
        orders === pending + confirmed + cancelled,
    ),
  );
  assert.equal(
    month.trend.reduce((total, { orders }) => total + orders, 0),
    month.metrics.attributedOrders,
  );
  assert.equal(
    month.trend.reduce((total, { revenue }) => total + (revenue ?? 0), 0),
    month.metrics.revenue,
  );
  assert.equal(
    month.trend.reduce(
      (total, { actualCommission }) => total + (actualCommission ?? 0),
      0,
    ),
    month.metrics.actualCommission,
  );
});

test('AC-TP-DASH-001-06/13/17/19 keeps commission totals consistent', async () => {
  const session = await login('admin@lotus.test');
  const view = await tenantDashboardService.getDashboard(session, {
    range: 'MONTH',
  });
  const distributionTotal = view.commissionDistribution!.reduce(
    (total, item) => total + item.amount,
    0,
  );
  assert.equal(distributionTotal, view.metrics.actualCommission);
  assert.deepEqual(
    view.commissionDistribution!.map(({ source }) => source),
    ['OFFER', 'CATEGORY', 'TENANT_BRAND_DEFAULT', 'ALL_TENANT_DEFAULT'],
  );
});

test('AC-TP-DASH-001-14 excludes financial fields for viewer role', async () => {
  const session = await login('viewer@lotus.test');
  const view = await tenantDashboardService.getDashboard(session, {
    range: 'MONTH',
  });
  assert.equal(view.hasFinancialAccess, false);
  assert.equal(view.metrics.revenue, undefined);
  assert.equal(view.metrics.actualCommission, undefined);
  assert.equal(view.commissionDistribution, undefined);
  assert.ok(view.trend.every(({ revenue }) => revenue === undefined));
});

test('AC-TP-DASH-001-16 returns a complete zero state without division errors', async () => {
  const session = await login('finance@bamboo.test');
  const view = await tenantDashboardService.getDashboard(session, {
    range: 'YEAR',
  });
  assert.equal(view.metrics.clickToOrderRate, 0);
  assert.equal(view.topBrands.length, 0);
  assert.equal(view.trend.length, 0);
  assert.ok(
    view.commissionDistribution!.every(
      ({ amount, percentage }) => amount === 0 && percentage === 0,
    ),
  );
});

test('AF-TP-DASH-001-01/02 rejects forbidden roles and invalid ranges', async () => {
  const marketing = await login('marketing@lotus.test');
  await assert.rejects(
    tenantDashboardService.getDashboard(marketing, { range: 'MONTH' }),
    /FORBIDDEN/,
  );
  const admin = await login('admin@lotus.test');
  await assert.rejects(
    tenantDashboardService.getDashboard(admin, { range: 'QUARTER' as never }),
    /INVALID_DATE_RANGE/,
  );
});
