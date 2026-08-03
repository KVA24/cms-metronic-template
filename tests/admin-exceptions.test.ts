import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { adminExceptionService } from '../src/features/admin/exceptions/api/admin-exception-service';
import { ADMIN_EXCEPTION_DEFAULT_QUERY, EXCEPTION_GROUPS } from '../src/features/admin/exceptions/model/admin-exception';
import { mockData, resetMockData } from '../src/shared/mocks/mock-data';

beforeEach(resetMockData);

describe('ADMIN Exception list and export service', () => {
  it('seeds every canonical detail group plus the list screen', async () => {
    const result = await adminExceptionService.list(ADMIN_EXCEPTION_DEFAULT_QUERY, 'CMS_ADMIN');
    assert.equal(result.items.length, 6);
    assert.deepEqual(new Set(result.items.map(({ group }) => group)), new Set(EXCEPTION_GROUPS));
  });

  it('combines keyword, tenant, brand, group, status and date filters', async () => {
    const result = await adminExceptionService.list({ ...ADMIN_EXCEPTION_DEFAULT_QUERY, keyword: ' FN-2026-001 ', tenantId: 'tenant-lotus', brandId: 'brand-foodnest', group: 'TENANT_SHARE', status: 'RESOLVED', dateFrom: '2026-07-20', dateTo: '2026-07-20' }, 'CMS_ADMIN');
    assert.deepEqual(result.items.map(({ id }) => id), ['exception-tenant-share-001']);
  });

  it('rejects invalid date ranges and strips variant detail from list rows', async () => {
    await assert.rejects(() => adminExceptionService.list({ ...ADMIN_EXCEPTION_DEFAULT_QUERY, dateFrom: '2026-08-01', dateTo: '2026-07-01' }, 'CMS_ADMIN'), /DATE_RANGE_INVALID/);
    const result = await adminExceptionService.list(ADMIN_EXCEPTION_DEFAULT_QUERY, 'CMS_ADMIN');
    assert.equal(result.items[0]?.details, undefined);
  });

  it('paginates in newest-first order', async () => {
    const result = await adminExceptionService.list({ ...ADMIN_EXCEPTION_DEFAULT_QUERY, pageSize: 2 }, 'CMS_ADMIN');
    assert.equal(result.totalItems, 6);
    assert.equal(result.totalPages, 3);
    assert.deepEqual(result.items.map(({ id }) => id), ['exception-persistence-001', 'exception-cancel-refund-001']);
  });

  it('exports all filtered rows through a mock request lifecycle', async () => {
    const request = await adminExceptionService.requestExport({ ...ADMIN_EXCEPTION_DEFAULT_QUERY, pageSize: 1, status: 'OPEN' }, 'CMS_ADMIN', 'cms-admin');
    assert.equal(request.status, 'PROCESSING');
    assert.equal(request.rowCount, 5);
    const completed = await adminExceptionService.completeExport(request.id, 'CMS_ADMIN');
    assert.equal(completed.status, 'COMPLETED');
    assert.equal(mockData.exportRequests[0]?.type, 'EXCEPTION');
  });

  it('enforces view and export permissions in the service', async () => {
    await assert.rejects(() => adminExceptionService.list(ADMIN_EXCEPTION_DEFAULT_QUERY, 'CMS_OPERATION'), /FORBIDDEN/);
    await assert.rejects(() => adminExceptionService.requestExport(ADMIN_EXCEPTION_DEFAULT_QUERY, 'CMS_FINANCE', 'cms-finance'), /FORBIDDEN/);
  });
});
