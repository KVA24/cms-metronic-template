import assert from 'node:assert/strict';
import test from 'node:test';
import { tenantTransactionService } from '../src/features/tenant/transactions/api/tenant-transaction-service.ts';
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

const query = {
  page: 1,
  pageSize: 10,
  sortBy: 'createdAt',
  sortDirection: 'desc',
} as const;

test('AC-TP-TXN-001-01/02 lists and filters current-Tenant orders only', async () => {
  const session = await login();
  const result = await tenantTransactionService.list(session, query);
  assert.equal(result.totalItems, 2);
  assert.equal(
    result.items.some(({ id }) => id === 'transaction-bamboo-confirmed'),
    false,
  );
  const filtered = await tenantTransactionService.list(session, {
    ...query,
    search: ' fn-2026-001 ',
    brandId: 'brand-foodnest',
    status: 'PENDING',
    dateFrom: '2026-07-15',
    dateTo: '2026-07-15',
  });
  assert.deepEqual(
    filtered.items.map(({ id }) => id),
    ['transaction-lotus-pending'],
  );
});

test('AF-TP-TXN-001-02/03 rejects invalid dates and unassigned Brand filters', async () => {
  const session = await login();
  await assert.rejects(
    tenantTransactionService.list(session, {
      ...query,
      dateFrom: '2026-08-01',
      dateTo: '2026-07-01',
    }),
    /DATE_RANGE_INVALID/,
  );
  await assert.rejects(
    tenantTransactionService.list(session, {
      ...query,
      brandId: 'brand-travelgo',
    }),
    /BRAND_NOT_ASSIGNED/,
  );
});

test('AC-TP-TXN-001-04/05/06 returns safe detail and reconciled Tenant Share', async () => {
  const detail = await tenantTransactionService.getDetail(
    await login(),
    'transaction-lotus-pending',
  );
  assert.equal(
    detail.header.estimatedTenantShare,
    detail.items.reduce(
      (sum, item) => sum + (item.status === 'REFUNDED' ? 0 : item.tenantShare),
      0,
    ),
  );
  assert.equal(
    detail.header.actualTenantShare,
    detail.items.reduce(
      (sum, item) => sum + (item.status === 'CONFIRMED' ? item.tenantShare : 0),
      0,
    ),
  );
  assert.ok(detail.items.every((item) => 'tenantShareSource' in item));
});

test('AC-TP-TXN-001-07/08 keeps refunded history and confirmed contribution', async () => {
  const pending = await tenantTransactionService.getDetail(
    await login(),
    'transaction-lotus-pending',
  );
  assert.ok(pending.items.some(({ status }) => status === 'CONFIRMED'));
  assert.ok(pending.header.actualTenantShare > 0);
  const cancelled = await tenantTransactionService.getDetail(
    await login(),
    'transaction-lotus-cancelled',
  );
  const refunded = cancelled.items.find(({ status }) => status === 'REFUNDED')!;
  assert.equal(refunded.quantity, 0);
  assert.equal(refunded.finalAmount, 0);
  assert.equal(refunded.tenantShare, 0);
  assert.ok(refunded.originalAmount > 0);
});

test('AC-TP-TXN-001-09 never projects internal commission fields', async () => {
  const detail = await tenantTransactionService.getDetail(
    await login(),
    'transaction-lotus-pending',
  );
  const serialized = JSON.stringify(detail);
  for (const forbidden of [
    'grossCommission',
    'affiliateKeep',
    'brandCommissionSource',
    'brandCommissionValue',
    'brandMappingReference',
  ])
    assert.equal(serialized.includes(forbidden), false);
});

test('AC-TP-TXN-001-10/13-16 returns immutable chronological actual events', async () => {
  const before = structuredClone(mockData.transactionHistories);
  const detail = await tenantTransactionService.getDetail(
    await login(),
    'transaction-lotus-pending',
  );
  assert.deepEqual(
    detail.histories.map(({ eventAt }) => eventAt),
    [...detail.histories].map(({ eventAt }) => eventAt).sort(),
  );
  assert.ok(
    detail.histories.some(({ eventType }) => eventType === 'ORDER_RECORDED'),
  );
  assert.ok(
    detail.histories.some(({ eventType }) => eventType === 'ITEM_CONFIRMED'),
  );
  assert.deepEqual(mockData.transactionHistories, before);
});

test('AC-TP-TXN-001-11 export uses current scope/filter and permission', async () => {
  const session = await login();
  const request = await tenantTransactionService.requestExport(session, {
    ...query,
    status: 'PENDING',
  });
  assert.equal(request.rowCount, 1);
  assert.match(request.fileName, /^tenant-portal-transaction-export-/);
  const complete = await tenantTransactionService.completeExport(
    session,
    request.id,
  );
  assert.equal(complete.status, 'COMPLETED');
  await assert.rejects(
    tenantTransactionService.requestExport(
      await login('viewer@lotus.test'),
      query,
    ),
    /FORBIDDEN/,
  );
});

test('AC-TP-TXN-001-12 denies cross-Tenant details without revealing data', async () => {
  await assert.rejects(
    tenantTransactionService.getDetail(
      await login(),
      'transaction-bamboo-confirmed',
    ),
    /TRANSACTION_NOT_FOUND/,
  );
  await assert.rejects(
    tenantTransactionService.list(await login('marketing@lotus.test'), query),
    /FORBIDDEN/,
  );
});
