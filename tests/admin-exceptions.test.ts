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

describe('ADMIN Exception detail and retry service', () => {
  it('returns each discriminated detail layout with resolved references', async () => {
    const ids = [
      'exception-auth-001',
      'exception-click-001',
      'exception-brand-commission-001',
      'exception-tenant-share-001',
      'exception-cancel-refund-001',
      'exception-persistence-001',
    ];
    const details = await Promise.all(ids.map((id) => adminExceptionService.getDetail(id, 'CMS_ADMIN')));
    assert.deepEqual(details.map(({ exception }) => exception.group), EXCEPTION_GROUPS);
    assert.equal(details[0]?.exception.group === 'REQUEST_AUTHENTICATION' && details[0].exception.details.endpoint, 'POST /orders/success');
    assert.equal(details[1]?.exception.group === 'CLICK_ELIGIBILITY' && details[1].exception.details.checks.length, 3);
    assert.equal(details[2]?.exception.group === 'BRAND_COMMISSION' && details[2].exception.details.items[0]?.validationResult, 'FAILED');
    assert.equal(details[3]?.exception.group === 'TENANT_SHARE' && details[3].exception.details.items[0]?.validationResult, 'PASS');
    assert.equal(details[4]?.exception.group === 'CANCEL_REFUND' && details[4].relatedTransaction?.id, 'transaction-lotus-pending');
    assert.equal(details[5]?.exception.group === 'TRANSACTION_PERSISTENCE' && details[5].exception.details.failureCode, 'DB_COMMIT_TIMEOUT');
    assert.equal(details[2]?.tenant?.name, 'Lotus Rewards');
    assert.equal(details[0]?.brand?.name, 'FoodNest');
  });

  it('rejects unknown details and unauthorized roles', async () => {
    await assert.rejects(() => adminExceptionService.getDetail('missing', 'CMS_ADMIN'), /EXCEPTION_NOT_FOUND/);
    await assert.rejects(() => adminExceptionService.getDetail('exception-auth-001', 'CMS_OPERATION'), /FORBIDDEN/);
  });

  it('simulates failed retry without changing transaction output', async () => {
    const before = structuredClone(mockData.transactions);
    const result = await adminExceptionService.retry('exception-cancel-refund-001', 'CMS_ADMIN', 'cms-admin', 'FAILED');
    assert.equal(result.status, 'OPEN');
    assert.equal(result.retryCount, 3);
    assert.deepEqual(mockData.transactions, before);
    assert.equal(mockData.auditRecords.at(-1)?.action, 'RETRY_EXCEPTION_FAILED');
  });

  it('simulates successful retry and records resolution without creating a transaction', async () => {
    const transactionCount = mockData.transactions.length;
    const result = await adminExceptionService.retry('exception-persistence-001', 'CMS_ADMIN', 'cms-admin', 'SUCCESS');
    assert.equal(result.status, 'RESOLVED');
    assert.equal(result.retryCount, 1);
    assert.equal(result.resolvedAt, '2026-08-03T22:45:00.000Z');
    assert.equal(mockData.transactions.length, transactionCount);
    assert.equal(mockData.auditRecords.at(-1)?.action, 'RETRY_EXCEPTION_SUCCESS');
  });

  it('does not retry an already resolved exception and enforces retry permission', async () => {
    await assert.rejects(() => adminExceptionService.retry('exception-tenant-share-001', 'CMS_ADMIN', 'cms-admin', 'SUCCESS'), /ALREADY_RESOLVED/);
    await assert.rejects(() => adminExceptionService.retry('exception-auth-001', 'CMS_FINANCE', 'cms-finance', 'SUCCESS'), /FORBIDDEN/);
  });
});
