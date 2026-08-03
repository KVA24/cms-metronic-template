import { mockData } from '../../../../shared/mocks/mock-data';
import {
  canViewFinancialField,
  hasPermission,
  type AdminRoleCode,
} from '../../../../shared/permissions';
import {
  validateTransactionDateRange,
  type AdminTransactionQuery,
} from '../model/admin-transaction';

function assertView(roleCode: AdminRoleCode) {
  if (!hasPermission(roleCode, 'transactions.view')) throw new Error('FORBIDDEN');
}

function filteredTransactions(query: AdminTransactionQuery) {
  if (Object.keys(validateTransactionDateRange(query)).length) throw new Error('DATE_RANGE_INVALID');
  const keyword = query.keyword.trim().toLowerCase();
  return mockData.transactions.filter((transaction) => {
    if (keyword && ![transaction.id, transaction.brandOrderId].some((value) => value.toLowerCase().includes(keyword))) return false;
    if (query.tenantId && transaction.tenantId !== query.tenantId) return false;
    if (query.brandId && transaction.brandId !== query.brandId) return false;
    if (query.status !== 'ALL' && transaction.status !== query.status) return false;
    if (query.dateFrom && transaction.createdAt < `${query.dateFrom}T00:00:00.000Z`) return false;
    if (query.dateTo && transaction.createdAt > `${query.dateTo}T23:59:59.999Z`) return false;
    return true;
  });
}

function project(transaction: (typeof mockData.transactions)[number], roleCode: AdminRoleCode) {
  const tenant = mockData.tenants.find(({ id }) => id === transaction.tenantId)!;
  const brand = mockData.brands.find(({ id }) => id === transaction.brandId)!;
  const showGross = canViewFinancialField(roleCode, 'grossCommission');
  const showTenantShare = canViewFinancialField(roleCode, 'tenantShare');
  const showAffiliateKeep = canViewFinancialField(roleCode, 'affiliateKeep');
  const items = mockData.transactionItems.filter(({ transactionId }) => transactionId === transaction.id);
  const estimatedGrossCommission = items.reduce((sum, item) => sum + (item.status === 'REFUNDED' ? 0 : item.grossCommission), 0);
  const estimatedTenantShare = items.reduce((sum, item) => sum + (item.status === 'REFUNDED' ? 0 : item.tenantShare), 0);
  const actualGrossCommission = items.reduce((sum, item) => sum + (item.status === 'CONFIRMED' ? item.grossCommission : 0), 0);
  const actualTenantShare = items.reduce((sum, item) => sum + (item.status === 'CONFIRMED' ? item.tenantShare : 0), 0);
  return {
    ...transaction,
    tenant: { id: tenant.id, name: tenant.name },
    brand: { id: brand.id, name: brand.name },
    estimatedGrossCommission: showGross && transaction.status === 'PENDING' ? estimatedGrossCommission : undefined,
    estimatedTenantShare: showTenantShare && transaction.status === 'PENDING' ? estimatedTenantShare : undefined,
    actualGrossCommission: showGross && transaction.status !== 'CANCELLED' && actualGrossCommission ? actualGrossCommission : undefined,
    actualTenantShare: showTenantShare && transaction.status !== 'CANCELLED' && actualTenantShare ? actualTenantShare : undefined,
    affiliateKeep: showAffiliateKeep ? items.reduce((sum, item) => sum + item.affiliateKeep, 0) : undefined,
  };
}

export const adminTransactionService = {
  async list(query: AdminTransactionQuery, roleCode: AdminRoleCode) {
    assertView(roleCode);
    const items = filteredTransactions(query);
    items.sort((left, right) => {
      const comparison = String(left[query.sortBy]).localeCompare(String(right[query.sortBy]));
      return query.sortDirection === 'asc' ? comparison : -comparison;
    });
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
    const page = Math.min(query.page, totalPages);
    const start = (page - 1) * query.pageSize;
    return structuredClone({
      items: items.slice(start, start + query.pageSize).map((item) => project(item, roleCode)),
      page,
      pageSize: query.pageSize,
      totalItems,
      totalPages,
      canExport: hasPermission(roleCode, 'transactions.export'),
      financialScope: {
        grossCommission: canViewFinancialField(roleCode, 'grossCommission'),
        tenantShare: canViewFinancialField(roleCode, 'tenantShare'),
        affiliateKeep: canViewFinancialField(roleCode, 'affiliateKeep'),
      },
    });
  },

  async getFilterOptions(roleCode: AdminRoleCode) {
    assertView(roleCode);
    return structuredClone({ tenants: mockData.tenants, brands: mockData.brands });
  },

  async getDetail(transactionId: string, roleCode: AdminRoleCode) {
    assertView(roleCode);
    const transaction = mockData.transactions.find(({ id }) => id === transactionId);
    if (!transaction) throw new Error('NOT_FOUND');
    const header = project(transaction, roleCode);
    const showGross = canViewFinancialField(roleCode, 'grossCommission');
    const showTenantShare = canViewFinancialField(roleCode, 'tenantShare');
    const showAffiliateKeep = canViewFinancialField(roleCode, 'affiliateKeep');
    const items = mockData.transactionItems.flatMap((item) => item.transactionId === transactionId ? [{
        ...item,
        brandCommissionValue: showGross ? item.brandCommissionValue : undefined,
        grossCommission: showGross ? item.grossCommission : undefined,
        tenantShareValue: showTenantShare ? item.tenantShareValue : undefined,
        tenantShare: showTenantShare ? item.tenantShare : undefined,
        affiliateKeep: showAffiliateKeep ? item.affiliateKeep : undefined,
      }] : []);
    const histories = mockData.transactionHistories
      .filter((history) => history.transactionId === transactionId)
      .sort((left, right) => left.eventAt.localeCompare(right.eventAt));
    return structuredClone({ header, items, histories, financialScope: { grossCommission: showGross, tenantShare: showTenantShare, affiliateKeep: showAffiliateKeep } });
  },

  async requestExport(query: AdminTransactionQuery, roleCode: AdminRoleCode, actorId: string) {
    if (!hasPermission(roleCode, 'transactions.export')) throw new Error('FORBIDDEN');
    const rows = filteredTransactions(query).map((item) => project(item, roleCode));
    const id = `transaction-export-${mockData.exportRequests.length + 1}`;
    const request = {
      id,
      type: 'TRANSACTION' as const,
      status: 'PROCESSING' as const,
      fileName: `cms-transaction-export-20260803-${String(mockData.exportRequests.length + 1).padStart(2, '0')}.xlsx`,
      rowCount: rows.length,
      requestedBy: actorId,
      requestedAt: '2026-08-03T22:00:00.000Z',
    };
    mockData.exportRequests.push(request);
    return structuredClone(request);
  },

  async completeExport(requestId: string, roleCode: AdminRoleCode) {
    if (!hasPermission(roleCode, 'transactions.export')) throw new Error('FORBIDDEN');
    const request = mockData.exportRequests.find(({ id }) => id === requestId && requestId.startsWith('transaction-export-'));
    if (!request) throw new Error('EXPORT_NOT_FOUND');
    request.status = 'COMPLETED';
    return structuredClone({ ...request, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  },
};
