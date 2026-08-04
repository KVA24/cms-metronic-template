import type { PlatformException } from '../../../../shared/contracts';
import { mockData } from '../../../../shared/mocks/mock-data';
import {
  hasPermission,
  type AdminRoleCode,
} from '../../../../shared/permissions';
import {
  validateExceptionDateRange,
  type AdminExceptionQuery,
} from '../model/admin-exception';

function assertPermission(
  roleCode: AdminRoleCode,
  permission: 'exceptions.view' | 'exceptions.export' | 'exceptions.retry',
) {
  if (!hasPermission(roleCode, permission)) throw new Error('FORBIDDEN');
}

function filtered(query: AdminExceptionQuery) {
  if (Object.keys(validateExceptionDateRange(query)).length)
    throw new Error('DATE_RANGE_INVALID');
  const keyword = query.keyword.trim().toLowerCase();
  return mockData.exceptions.filter((item) => {
    if (
      keyword &&
      ![item.id, item.orderId, item.brandOrderId].some((value) =>
        value?.toLowerCase().includes(keyword),
      )
    )
      return false;
    if (query.tenantId && item.tenantId !== query.tenantId) return false;
    if (query.brandId && item.brandId !== query.brandId) return false;
    if (query.group !== 'ALL' && item.group !== query.group) return false;
    if (query.status !== 'ALL' && item.status !== query.status) return false;
    if (query.dateFrom && item.createdAt < `${query.dateFrom}T00:00:00.000Z`)
      return false;
    if (query.dateTo && item.createdAt > `${query.dateTo}T23:59:59.999Z`)
      return false;
    return true;
  });
}

function listItem(item: (typeof mockData.exceptions)[number]) {
  const tenant = mockData.tenants.find(({ id }) => id === item.tenantId);
  const brand = mockData.brands.find(({ id }) => id === item.brandId);
  return {
    ...item,
    details: undefined,
    tenantName: tenant?.name ?? null,
    brandName: brand?.name ?? null,
  };
}

export const adminExceptionService = {
  async list(query: AdminExceptionQuery, roleCode: AdminRoleCode) {
    assertPermission(roleCode, 'exceptions.view');
    const items = filtered(query).sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
    const page = Math.min(query.page, totalPages);
    const start = (page - 1) * query.pageSize;
    return structuredClone({
      items: items.slice(start, start + query.pageSize).map(listItem),
      page,
      pageSize: query.pageSize,
      totalItems,
      totalPages,
      canExport: hasPermission(roleCode, 'exceptions.export'),
      canRetry: hasPermission(roleCode, 'exceptions.retry'),
    });
  },

  async getFilterOptions(roleCode: AdminRoleCode) {
    assertPermission(roleCode, 'exceptions.view');
    return structuredClone({
      tenants: mockData.tenants,
      brands: mockData.brands,
    });
  },

  async getDetail(exceptionId: string, roleCode: AdminRoleCode) {
    assertPermission(roleCode, 'exceptions.view');
    const exception = mockData.exceptions.find(({ id }) => id === exceptionId);
    if (!exception) throw new Error('EXCEPTION_NOT_FOUND');
    const tenant = exception.tenantId
      ? (mockData.tenants.find(({ id }) => id === exception.tenantId) ?? null)
      : null;
    const brand = exception.brandId
      ? (mockData.brands.find(({ id }) => id === exception.brandId) ?? null)
      : null;
    const relatedTransaction = exception.orderId
      ? (mockData.transactions.find(({ id }) => id === exception.orderId) ??
        null)
      : null;
    return structuredClone({
      exception,
      tenant,
      brand,
      relatedTransaction,
      canRetry:
        exception.status === 'OPEN' &&
        hasPermission(roleCode, 'exceptions.retry'),
    });
  },

  async retry(
    exceptionId: string,
    roleCode: AdminRoleCode,
    actorId: string,
    outcome: 'SUCCESS' | 'FAILED',
  ) {
    assertPermission(roleCode, 'exceptions.retry');
    const exception = mockData.exceptions.find(({ id }) => id === exceptionId);
    if (!exception) throw new Error('EXCEPTION_NOT_FOUND');
    if (exception.status === 'RESOLVED') throw new Error('ALREADY_RESOLVED');
    const before = structuredClone(exception) as PlatformException;
    exception.retryCount += 1;
    if (outcome === 'SUCCESS') {
      exception.status = 'RESOLVED';
      exception.resolvedAt = '2026-08-03T22:45:00.000Z';
    }
    mockData.auditRecords.push({
      id: `audit-exception-${mockData.auditRecords.length + 1}`,
      actorId,
      action: `RETRY_EXCEPTION_${outcome}`,
      entityType: 'EXCEPTION',
      entityId: exception.id,
      occurredAt: '2026-08-03T22:45:00.000Z',
      before,
      after: structuredClone(exception),
    });
    return structuredClone(exception);
  },

  async requestExport(
    query: AdminExceptionQuery,
    roleCode: AdminRoleCode,
    actorId: string,
  ) {
    assertPermission(roleCode, 'exceptions.export');
    const rows = filtered(query).map(listItem);
    const sequence = mockData.exportRequests.length + 1;
    const request = {
      id: `exception-export-${sequence}`,
      type: 'EXCEPTION' as const,
      status: 'PROCESSING' as const,
      fileName: `cms-exception-export-20260803-${String(sequence).padStart(2, '0')}.xlsx`,
      rowCount: rows.length,
      requestedBy: actorId,
      requestedAt: '2026-08-03T22:30:00.000Z',
    };
    mockData.exportRequests.push(request);
    return structuredClone(request);
  },

  async completeExport(requestId: string, roleCode: AdminRoleCode) {
    assertPermission(roleCode, 'exceptions.export');
    const request = mockData.exportRequests.find(
      ({ id }) => id === requestId && id.startsWith('exception-export-'),
    );
    if (!request) throw new Error('EXPORT_NOT_FOUND');
    request.status = 'COMPLETED';
    return structuredClone(request);
  },
};
