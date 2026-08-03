import type { Tenant } from '../../../../shared/contracts';
import { mockData } from '../../../../shared/mocks/mock-data';
import {
  hasPermission,
  type AdminRoleCode,
} from '../../../../shared/permissions';
import {
  adminTenantSchema,
  type AdminTenantInput,
  type AdminTenantListItem,
  type AdminTenantListResult,
  type AdminTenantQuery,
} from '../model/admin-tenant';

const mockNow = new Date('2026-08-03T12:00:00.000Z');

function assertPermission(
  roleCode: AdminRoleCode,
  permission: 'tenants.view' | 'tenants.create',
) {
  if (!hasPermission(roleCode, permission)) throw new Error('FORBIDDEN');
}

function threshold(period: AdminTenantQuery['updatedPeriod']): string | null {
  if (period === 'ALL') return null;
  const days = period === '7_DAYS' ? 7 : 30;
  return new Date(mockNow.getTime() - days * 86_400_000).toISOString();
}

export const adminTenantService = {
  async listTenants(
    query: AdminTenantQuery,
    roleCode: AdminRoleCode,
  ): Promise<AdminTenantListResult> {
    assertPermission(roleCode, 'tenants.view');
    const keyword = query.keyword.trim().toLowerCase();
    const updatedAfter = threshold(query.updatedPeriod);
    const canEdit = hasPermission(roleCode, 'tenants.edit');
    const items = mockData.tenants.reduce<AdminTenantListItem[]>(
      (result, tenant) => {
        if (
          keyword &&
          ![tenant.id, tenant.code, tenant.name].some((value) =>
            value.toLowerCase().includes(keyword),
          )
        )
          return result;
        if (query.status !== 'ALL' && tenant.status !== query.status)
          return result;
        if (query.accountOwner && tenant.accountOwner !== query.accountOwner)
          return result;
        if (updatedAfter && tenant.updatedAt < updatedAfter) return result;
        const assignments = mockData.tenantBrandAssignments.filter(
          ({ tenantId }) => tenantId === tenant.id,
        );
        result.push({
          ...tenant,
          accountCount: mockData.authAccounts.filter(
            ({ tenantId }) => tenantId === tenant.id,
          ).length,
          brandCount: assignments.length,
          offerCount: assignments.reduce(
            (count, assignment) => count + assignment.offerIds.length,
            0,
          ),
          revenueShareCount: 0,
          canEdit,
        });
        return result;
      },
      [],
    );
    items.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
    const page = Math.min(query.page, totalPages);
    const start = (page - 1) * query.pageSize;
    return structuredClone({
      items: items.slice(start, start + query.pageSize),
      page,
      pageSize: query.pageSize,
      totalItems,
      totalPages,
    });
  },

  async getFilterOptions(roleCode: AdminRoleCode) {
    assertPermission(roleCode, 'tenants.view');
    return {
      accountOwners: [...new Set(mockData.tenants.map(({ accountOwner }) => accountOwner))]
        .filter(Boolean)
        .sort(),
    };
  },

  async createTenant(
    input: AdminTenantInput,
    roleCode: AdminRoleCode,
    actorId: string,
  ): Promise<Tenant> {
    assertPermission(roleCode, 'tenants.create');
    const parsed = adminTenantSchema.parse(input);
    if (
      mockData.tenants.some(
        ({ code }) => code.toLowerCase() === parsed.code.toLowerCase(),
      )
    )
      throw new Error('TENANT_CODE_DUPLICATE');
    const sequence = mockData.tenants.length + 1;
    const tenant: Tenant = {
      id: `tenant-${parsed.code.toLowerCase().replaceAll('_', '-')}`,
      ...parsed,
      createdBy: actorId,
      createdAt: `2026-08-03T${String(sequence).padStart(2, '0')}:00:00.000Z`,
      updatedBy: actorId,
      updatedAt: `2026-08-03T${String(sequence).padStart(2, '0')}:00:00.000Z`,
      version: 1,
    };
    mockData.tenants.push(tenant);
    mockData.auditRecords.push({
      id: `audit-tenant-${mockData.auditRecords.length + 1}`,
      actorId,
      action: 'CREATE_TENANT',
      entityType: 'TENANT',
      entityId: tenant.id,
      occurredAt: tenant.createdAt,
    });
    return structuredClone(tenant);
  },
};
