import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { adminDashboardService } from '../src/features/admin/dashboard/api/admin-dashboard-service';
import { readAdminDashboardQuery } from '../src/features/admin/dashboard/model/admin-dashboard';

const query = {
  fromDate: '2026-07-01',
  toDate: '2026-07-24',
};

describe('ADMIN dashboard service', () => {
  it('restores defaults when dashboard URL filters are removed', () => {
    assert.deepEqual(readAdminDashboardQuery(new URLSearchParams()), query);
    assert.deepEqual(
      readAdminDashboardQuery(
        new URLSearchParams('tenantId=tenant-bamboo&orderStatus=CONFIRMED'),
      ),
      {
        ...query,
        tenantId: 'tenant-bamboo',
        orderStatus: 'CONFIRMED',
      },
    );
  });

  it('returns the complete financial projection for Finance', async () => {
    const view = await adminDashboardService.getDashboard(query, 'CMS_FINANCE');

    assert.equal(view.metrics.validClicks > 0, true);
    assert.equal(view.financial.grossCommission, 1_240_000_000);
    assert.equal(view.financial.tenantShare, 743_800_000);
    assert.equal(view.financial.affiliateKeep, 496_200_000);
    assert.equal(view.trend.length, 7);
    assert.equal(view.topBrands.length > 0, true);
  });

  it('removes Affiliate keep from the Operation projection', async () => {
    const view = await adminDashboardService.getDashboard(
      query,
      'CMS_OPERATION',
    );

    assert.equal(view.financial.grossCommission, 1_240_000_000);
    assert.equal(view.financial.tenantShare, 743_800_000);
    assert.equal('affiliateKeep' in view.financial, false);
  });

  it('rejects roles without dashboard access', async () => {
    await assert.rejects(
      adminDashboardService.getDashboard(query, 'CMS_CSKH'),
      { message: 'FORBIDDEN' },
    );
  });

  it('returns an empty view for a deterministic no-match filter', async () => {
    const view = await adminDashboardService.getDashboard(
      { ...query, tenantId: 'missing-tenant' },
      'CMS_ADMIN',
    );

    assert.equal(view.metrics.validClicks, 0);
    assert.deepEqual(view.trend, []);
    assert.deepEqual(view.topBrands, []);
  });

  it('returns export metadata without generating a client file', async () => {
    const result = await adminDashboardService.exportDashboard(
      query,
      'CMS_FINANCE',
    );

    assert.equal(
      result.fileName,
      'admin-dashboard-2026-07-01-to-2026-07-24.xlsx',
    );
    assert.equal(
      result.contentType,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    assert.equal(result.downloadUrl, undefined);
  });

  it('provides typed filter options to keep mock data out of the page', async () => {
    const options = await adminDashboardService.getFilterOptions();

    assert.equal(options.tenants.length, 2);
    assert.equal(options.brands.length, 3);
    assert.equal(options.categories.length > 0, true);
    assert.equal(options.offers.length, 3);
  });
});
