import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { adminTransactionService } from '../src/features/admin/transactions/api/admin-transaction-service';
import { ADMIN_TRANSACTION_DEFAULT_QUERY } from '../src/features/admin/transactions/model/admin-transaction';
import { mockData, resetMockData } from '../src/shared/mocks/mock-data';

beforeEach(resetMockData);

describe('ADMIN Transaction list and export service', () => {
  it('lists deterministic financial projections from current item states', async () => {
    const result = await adminTransactionService.list(ADMIN_TRANSACTION_DEFAULT_QUERY, 'CMS_ADMIN');
    const pending = result.items.find(({ id }) => id === 'transaction-lotus-pending')!;
    assert.equal(pending.estimatedGrossCommission, 50_000);
    assert.equal(pending.estimatedTenantShare, 35_000);
    assert.equal(pending.actualGrossCommission, 30_000);
    assert.equal(pending.actualTenantShare, 21_000);
    const cancelled = result.items.find(({ id }) => id === 'transaction-lotus-cancelled')!;
    assert.equal(cancelled.estimatedGrossCommission, undefined);
    assert.equal(cancelled.actualTenantShare, undefined);
  });

  it('combines keyword, tenant, brand, status and inclusive date filters', async () => {
    const result = await adminTransactionService.list({ ...ADMIN_TRANSACTION_DEFAULT_QUERY, keyword: ' FN-2026 ', tenantId: 'tenant-lotus', brandId: 'brand-foodnest', status: 'PENDING', dateFrom: '2026-07-15', dateTo: '2026-07-15' }, 'CMS_ADMIN');
    assert.deepEqual(result.items.map(({ id }) => id), ['transaction-lotus-pending']);
  });

  it('rejects invalid date ranges before querying', async () => {
    await assert.rejects(() => adminTransactionService.list({ ...ADMIN_TRANSACTION_DEFAULT_QUERY, dateFrom: '2026-08-01', dateTo: '2026-07-01' }, 'CMS_ADMIN'), /DATE_RANGE_INVALID/);
  });

  it('projects financial fields by role and keeps CSKH non-financial', async () => {
    const operation = await adminTransactionService.list(ADMIN_TRANSACTION_DEFAULT_QUERY, 'CMS_OPERATION');
    assert.equal(operation.financialScope.affiliateKeep, false);
    assert.equal(operation.items[0]?.affiliateKeep, undefined);
    const cskh = await adminTransactionService.list(ADMIN_TRANSACTION_DEFAULT_QUERY, 'CMS_CSKH');
    assert.equal(cskh.items[0]?.estimatedGrossCommission, undefined);
    assert.equal(cskh.canExport, false);
  });

  it('sorts and paginates without changing the matching total', async () => {
    const result = await adminTransactionService.list({ ...ADMIN_TRANSACTION_DEFAULT_QUERY, pageSize: 1, sortBy: 'id', sortDirection: 'asc' }, 'CMS_ADMIN');
    assert.equal(result.totalItems, 3);
    assert.equal(result.totalPages, 3);
    assert.equal(result.items[0]?.id, 'transaction-bamboo-confirmed');
  });

  it('creates and completes an export request for all filtered rows, not the page', async () => {
    const request = await adminTransactionService.requestExport({ ...ADMIN_TRANSACTION_DEFAULT_QUERY, pageSize: 1 }, 'CMS_ADMIN', 'cms-admin');
    assert.equal(request.status, 'PROCESSING');
    assert.equal(request.rowCount, 3);
    assert.equal(request.fileName.endsWith('.xlsx'), true);
    const completed = await adminTransactionService.completeExport(request.id, 'CMS_ADMIN');
    assert.equal(completed.status, 'COMPLETED');
    assert.equal(mockData.exportRequests[0]?.status, 'COMPLETED');
  });

  it('enforces export permission independently from list permission', async () => {
    await assert.rejects(() => adminTransactionService.requestExport(ADMIN_TRANSACTION_DEFAULT_QUERY, 'CMS_CSKH', 'cms-cskh'), /FORBIDDEN/);
  });
});
