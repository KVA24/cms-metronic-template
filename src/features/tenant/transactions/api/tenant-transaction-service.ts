import type { AuthSession, Transaction } from '../../../../shared/contracts';
import { mockData } from '../../../../shared/mocks/mock-data';
import {
  validateTenantTransactionDateRange,
  type TenantTransactionDetail,
  type TenantTransactionListItem,
  type TenantTransactionListResult,
  type TenantTransactionQuery,
} from '../model/tenant-transaction';

function assertView(session: AuthSession) {
  if (
    session.portalType !== 'TENANT' ||
    !session.tenantId ||
    !session.permissions.includes('transactions.view')
  )
    throw new Error('FORBIDDEN');
  const tenant = mockData.tenants.find(({ id }) => id === session.tenantId);
  if (!tenant || tenant.status !== 'ACTIVE') throw new Error('FORBIDDEN');
}

function assignedBrandIds(session: AuthSession) {
  const brandIds = new Set<string>();
  for (const assignment of mockData.tenantBrandAssignments) {
    if (assignment.tenantId === session.tenantId) {
      brandIds.add(assignment.brandId);
    }
  }
  return brandIds;
}

function transactionItems(transactionId: string) {
  return mockData.transactionItems.filter(
    ({ transactionId: id }) => id === transactionId,
  );
}

function project(transaction: Transaction): TenantTransactionListItem {
  const brand = mockData.brands.find(({ id }) => id === transaction.brandId)!;
  const items = transactionItems(transaction.id);
  const estimatedTenantShare = items.reduce(
    (sum, item) => sum + (item.status === 'REFUNDED' ? 0 : item.tenantShare),
    0,
  );
  const actualTenantShare = items.reduce(
    (sum, item) => sum + (item.status === 'CONFIRMED' ? item.tenantShare : 0),
    0,
  );
  return {
    id: transaction.id,
    brandOrderId: transaction.brandOrderId,
    memberRef: transaction.memberRef,
    brand: { id: brand.id, name: brand.name },
    status: transaction.status,
    finalAmount: transaction.finalAmount,
    currency: transaction.currency,
    estimatedTenantShare,
    actualTenantShare,
    commissionConfirmedAt:
      transaction.status === 'CONFIRMED'
        ? transaction.commissionConfirmedAt
        : null,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
}

function filtered(session: AuthSession, query: TenantTransactionQuery) {
  if (validateTenantTransactionDateRange(query))
    throw new Error('DATE_RANGE_INVALID');
  const allowedBrands = assignedBrandIds(session);
  if (query.brandId && !allowedBrands.has(query.brandId))
    throw new Error('BRAND_NOT_ASSIGNED');
  const keyword = query.search?.trim().toLocaleLowerCase() ?? '';
  return mockData.transactions.filter((transaction) => {
    if (transaction.tenantId !== session.tenantId) return false;
    if (
      keyword &&
      ![transaction.id, transaction.brandOrderId].some((value) =>
        value.toLocaleLowerCase().includes(keyword),
      )
    )
      return false;
    if (query.brandId && transaction.brandId !== query.brandId) return false;
    if (query.status && transaction.status !== query.status) return false;
    if (
      query.dateFrom &&
      transaction.createdAt < `${query.dateFrom}T00:00:00.000Z`
    )
      return false;
    if (query.dateTo && transaction.createdAt > `${query.dateTo}T23:59:59.999Z`)
      return false;
    return true;
  });
}

export const tenantTransactionService = {
  async list(
    session: AuthSession,
    query: TenantTransactionQuery,
  ): Promise<TenantTransactionListResult> {
    assertView(session);
    const rows = filtered(session, query);
    rows.sort((left, right) => {
      const compared = String(left[query.sortBy]).localeCompare(
        String(right[query.sortBy]),
      );
      return query.sortDirection === 'asc' ? compared : -compared;
    });
    const pageSize = Math.max(1, query.pageSize);
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    const page = Math.min(Math.max(1, query.page), totalPages);
    const start = (page - 1) * pageSize;
    const allowedBrands = assignedBrandIds(session);
    const brands: Array<{ id: string; name: string }> = [];
    for (const brand of mockData.brands) {
      if (allowedBrands.has(brand.id)) {
        brands.push({ id: brand.id, name: brand.name });
      }
    }
    return structuredClone({
      items: rows.slice(start, start + pageSize).map(project),
      page,
      pageSize,
      totalItems: rows.length,
      totalPages,
      canExport: session.permissions.includes('transactions.export'),
      brands,
    });
  },

  async getDetail(
    session: AuthSession,
    transactionId: string,
  ): Promise<TenantTransactionDetail> {
    assertView(session);
    const transaction = mockData.transactions.find(
      ({ id, tenantId }) =>
        id === transactionId && tenantId === session.tenantId,
    );
    if (!transaction) throw new Error('TRANSACTION_NOT_FOUND');
    const items = transactionItems(transaction.id).map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      originalAmount: item.originalAmount,
      finalAmount: item.finalAmount,
      offerCode: item.offerCode,
      categoryCode: item.categoryCode,
      tenantShareSource: item.tenantShareSource,
      tenantShareValue: item.tenantShareValue,
      tenantShareReference: item.tenantShareReference,
      tenantShare: item.status === 'REFUNDED' ? 0 : item.tenantShare,
      status: item.status,
      confirmedAt: item.confirmedAt,
      refundedAt: item.refundedAt,
    }));
    const histories = mockData.transactionHistories
      .filter(({ transactionId: id }) => id === transaction.id)
      .sort((left, right) => left.eventAt.localeCompare(right.eventAt))
      .map((history) => ({
        id: history.id,
        transactionItemId: history.transactionItemId,
        eventType: history.eventType,
        eventAt: history.eventAt,
        processingResult: history.processingResult,
        createdBy: history.createdBy,
      }));
    return structuredClone({
      header: {
        ...project(transaction),
        userId: transaction.userId,
        customerRef: transaction.customerRef,
      },
      items,
      histories,
    });
  },

  async requestExport(session: AuthSession, query: TenantTransactionQuery) {
    assertView(session);
    if (!session.permissions.includes('transactions.export'))
      throw new Error('FORBIDDEN');
    const rows = filtered(session, query).map(project);
    const sequence = mockData.exportRequests.length + 1;
    const request = {
      id: `tenant-transaction-export-${session.tenantId}-${sequence}`,
      type: 'TRANSACTION' as const,
      status: 'PROCESSING' as const,
      fileName: `tenant-portal-transaction-export-${String(sequence).padStart(2, '0')}.xlsx`,
      rowCount: rows.length,
      requestedBy: session.user.id,
      requestedAt: '2026-08-03T23:00:00.000Z',
    };
    mockData.exportRequests.push(request);
    return structuredClone(request);
  },

  async completeExport(session: AuthSession, requestId: string) {
    assertView(session);
    if (!session.permissions.includes('transactions.export'))
      throw new Error('FORBIDDEN');
    const request = mockData.exportRequests.find(
      ({ id, requestedBy }) =>
        id === requestId &&
        id.startsWith(`tenant-transaction-export-${session.tenantId}-`) &&
        requestedBy === session.user.id,
    );
    if (!request) throw new Error('EXPORT_NOT_FOUND');
    request.status = 'COMPLETED';
    return structuredClone({
      ...request,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  },
};
