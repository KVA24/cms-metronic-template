import { type MockData } from '../contracts';

const seedData: MockData = {
  authAccounts: [
    createAuthAccount('cms-admin', 'admin@cms.test', 'CMS_ADMIN'),
    createAuthAccount('cms-finance', 'finance@cms.test', 'CMS_FINANCE'),
    createAuthAccount('cms-cskh', 'cskh@cms.test', 'CMS_CSKH'),
    createAuthAccount('cms-operation', 'operation@cms.test', 'CMS_OPERATION'),
    createAuthAccount(
      'tenant-admin',
      'admin@lotus.test',
      'TENANT_ADMIN',
      'tenant-lotus',
    ),
    createAuthAccount(
      'tenant-marketing',
      'marketing@lotus.test',
      'TENANT_MARKETING_OPS',
      'tenant-lotus',
    ),
    createAuthAccount(
      'tenant-viewer',
      'viewer@lotus.test',
      'TENANT_VIEWER',
      'tenant-lotus',
    ),
    createAuthAccount(
      'tenant-finance',
      'finance@bamboo.test',
      'TENANT_FINANCE',
      'tenant-bamboo',
    ),
  ],
  tenants: [
    {
      id: 'tenant-lotus',
      code: 'LOTUS',
      name: 'Lotus Rewards',
      status: 'ACTIVE',
    },
    {
      id: 'tenant-bamboo',
      code: 'BAMBOO',
      name: 'Bamboo Club',
      status: 'ACTIVE',
    },
  ],
  brands: [
    {
      id: 'brand-foodnest',
      code: 'FOODNEST',
      name: 'FoodNest',
      status: 'ACTIVE',
    },
    {
      id: 'brand-travelgo',
      code: 'TRAVELGO',
      name: 'TravelGo',
      status: 'ACTIVE',
    },
    {
      id: 'brand-stylehub',
      code: 'STYLEHUB',
      name: 'StyleHub',
      status: 'DRAFT',
    },
  ],
  offers: [
    {
      id: 'offer-foodnest-new-user',
      brandId: 'brand-foodnest',
      code: 'NEWUSER',
      title: 'New user offer',
      status: 'ACTIVE',
    },
    {
      id: 'offer-travelgo-summer',
      brandId: 'brand-travelgo',
      code: 'SUMMER',
      title: 'Summer travel offer',
      status: 'ACTIVE',
    },
    {
      id: 'offer-stylehub-draft',
      brandId: 'brand-stylehub',
      code: 'DRAFT01',
      title: 'Draft fashion offer',
      status: 'DRAFT',
    },
  ],
  tenantBrandAssignments: [
    {
      id: 'assignment-lotus-foodnest',
      tenantId: 'tenant-lotus',
      brandId: 'brand-foodnest',
      offerIds: ['offer-foodnest-new-user'],
      showOnLanding: true,
      isHot: true,
    },
    {
      id: 'assignment-bamboo-travelgo',
      tenantId: 'tenant-bamboo',
      brandId: 'brand-travelgo',
      offerIds: ['offer-travelgo-summer'],
      showOnLanding: true,
      isHot: false,
    },
  ],
  transactions: [
    {
      id: 'transaction-lotus-pending',
      tenantId: 'tenant-lotus',
      brandId: 'brand-foodnest',
      status: 'PENDING',
      orderAmount: 500_000,
      estimatedTenantShare: 25_000,
      actualTenantShare: 0,
      createdAt: '2026-07-15T03:00:00.000Z',
    },
    {
      id: 'transaction-bamboo-confirmed',
      tenantId: 'tenant-bamboo',
      brandId: 'brand-travelgo',
      status: 'CONFIRMED',
      orderAmount: 2_000_000,
      estimatedTenantShare: 0,
      actualTenantShare: 120_000,
      createdAt: '2026-07-16T04:00:00.000Z',
    },
  ],
  auditRecords: [],
};

function createAuthAccount(
  id: string,
  username: string,
  roleCode: MockData['authAccounts'][number]['roleCode'],
  tenantId?: string,
): MockData['authAccounts'][number] {
  const portalType = tenantId ? 'TENANT' : 'ADMIN';

  return {
    id,
    username,
    displayName: username.split('@')[0],
    email: username,
    status: 'ACTIVE',
    portalType,
    password: tenantId ? 'Tenant123!' : 'Admin123!',
    roleCode,
    tenantId,
    roles: [{ roleCode, roleName: roleCode }],
  };
}

function cloneSeed(): MockData {
  return structuredClone(seedData);
}

export const mockData = cloneSeed();

export function resetMockData(): void {
  const freshData = cloneSeed();

  mockData.authAccounts.splice(
    0,
    mockData.authAccounts.length,
    ...freshData.authAccounts,
  );
  mockData.tenants.splice(0, mockData.tenants.length, ...freshData.tenants);
  mockData.brands.splice(0, mockData.brands.length, ...freshData.brands);
  mockData.offers.splice(0, mockData.offers.length, ...freshData.offers);
  mockData.tenantBrandAssignments.splice(
    0,
    mockData.tenantBrandAssignments.length,
    ...freshData.tenantBrandAssignments,
  );
  mockData.transactions.splice(
    0,
    mockData.transactions.length,
    ...freshData.transactions,
  );
  mockData.auditRecords.splice(
    0,
    mockData.auditRecords.length,
    ...freshData.auditRecords,
  );
}
