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
    createBrand('foodnest', 'FOODNEST', 'FoodNest', 'ACTIVE', 16),
    createBrand('travelgo', 'TRAVELGO', 'TravelGo', 'ACTIVE', 18),
    createBrand('stylehub', 'STYLEHUB', 'StyleHub', 'DRAFT', 20),
  ],
  brandCategoryMappings: [
    createBrandCategoryMapping(
      'foodnest-food',
      'brand-foodnest',
      'category-food-dining',
      'FOOD',
      true,
      8,
      'ACTIVE',
    ),
    createBrandCategoryMapping(
      'travelgo-travel',
      'brand-travelgo',
      'category-travel',
      'TRAVEL',
      true,
      6,
      'ACTIVE',
    ),
    createBrandCategoryMapping(
      'stylehub-fashion',
      'brand-stylehub',
      'category-fashion',
      'FASHION',
      false,
      5,
      'DRAFT',
    ),
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
  categories: [
    createCategory('travel', 'TRAVEL', 10, 'ACTIVE', 'Du lịch', 'Travel'),
    createCategory(
      'food-dining',
      'FOOD_DINING',
      20,
      'ACTIVE',
      'Ẩm thực',
    ),
    createCategory('hotel', 'HOTEL', 30, 'ACTIVE', 'Khách sạn', 'Hotel'),
    createCategory(
      'fashion',
      'FASHION',
      40,
      'DRAFT',
      'Thời trang',
      'Fashion',
    ),
    createCategory('books', 'BOOKS', 50, 'INACTIVE', 'Sách', 'Books'),
    createCategory(
      'electronics',
      'ELECTRONICS',
      60,
      'ACTIVE',
      'Điện tử',
      'Electronics',
    ),
    createCategory(
      'beauty',
      'BEAUTY',
      70,
      'ACTIVE',
      'Làm đẹp',
      'Beauty',
    ),
    createCategory(
      'services',
      'SERVICES',
      80,
      'DRAFT',
      'Dịch vụ',
      'Services',
    ),
  ],
  categoryDependencies: [
    createCategoryDependency('travel', 2, 1, 18),
    createCategoryDependency('food-dining', 1, 1, 9),
    createCategoryDependency('hotel', 1, 0, 4),
    createCategoryDependency('fashion', 0, 0, 0),
    createCategoryDependency('books', 1, 0, 2),
    createCategoryDependency('electronics', 1, 1, 6),
    createCategoryDependency('beauty', 1, 0, 3),
    createCategoryDependency('services', 0, 0, 0),
  ],
  auditRecords: [],
};

function createBrand(
  id: string,
  code: string,
  name: string,
  status: MockData['brands'][number]['status'],
  updatedDay: number,
): MockData['brands'][number] {
  return {
    id: `brand-${id}`,
    code,
    name,
    legalName: `${name} Joint Stock Company`,
    websiteUrl: `https://${id}.test`,
    logo: {
      id: `asset-brand-${id}`,
      fileName: `${id}.svg`,
      mimeType: 'image/svg+xml',
      sizeBytes: 4096,
      url: '/media/app/mini-logo.svg',
    },
    status,
    defaultLocale: 'vi-VN',
    pendingDays: 14,
    contactName: `${name} Merchant Ops`,
    contactEmail: `merchant@${id}.test`,
    contactPhone: '+84 900 000 000',
    notes: '',
    contents: [
      {
        locale: 'vi-VN',
        displayName: name,
        tagline: `${name} ưu đãi mỗi ngày`,
        shortDescription: `Mô tả thương hiệu ${name}.`,
        terms: 'Áp dụng điều kiện của thương hiệu.',
      },
      {
        locale: 'en-US',
        displayName: name,
        tagline: `${name} everyday offers`,
        shortDescription: `${name} brand description.`,
        terms: 'Brand terms apply.',
      },
    ],
    createdBy: 'cms-admin',
    createdAt: '2026-07-01T02:00:00.000Z',
    updatedBy: status === 'DRAFT' ? 'cms-operation' : 'cms-admin',
    updatedAt: `2026-07-${updatedDay}T03:00:00.000Z`,
    version: 1,
  };
}

function createBrandCategoryMapping(
  id: string,
  brandId: string,
  categoryId: string,
  brandCategoryCode: string,
  isDefault: boolean,
  commissionValue: number,
  status: MockData['brandCategoryMappings'][number]['status'],
): MockData['brandCategoryMappings'][number] {
  return {
    id: `mapping-${id}`,
    brandId,
    categoryId,
    brandCategoryCode,
    brandCategoryName: brandCategoryCode,
    isDefault,
    commissionType: 'PERCENTAGE',
    commissionValue,
    effectiveFrom: '2026-07-01T00:00:00.000Z',
    effectiveTo: null,
    status,
    createdBy: 'cms-admin',
    createdAt: '2026-07-01T02:00:00.000Z',
    updatedBy: 'cms-admin',
    updatedAt: '2026-07-01T02:00:00.000Z',
  };
}

function createCategory(
  id: string,
  code: string,
  displayOrder: number,
  status: MockData['categories'][number]['status'],
  viName: string,
  enName?: string,
): MockData['categories'][number] {
  const contents: MockData['categories'][number]['contents'] = [
    {
      locale: 'vi-VN',
      name: viName,
      description: `Mô tả cho danh mục ${viName}.`,
      status: 'ACTIVE',
    },
  ];
  if (enName) {
    contents.push({
      locale: 'en-US',
      name: enName,
      description: `Description for the ${enName} category.`,
      status: 'ACTIVE',
    });
  }

  return {
    id: `category-${id}`,
    code,
    icon: {
      id: `asset-category-${id}`,
      fileName: `${id}.svg`,
      mimeType: 'image/svg+xml',
      sizeBytes: 2048,
      url: '/media/app/mini-logo.svg',
    },
    displayOrder,
    status,
    contents,
    createdBy: 'cms-admin',
    createdAt: '2026-07-01T02:00:00.000Z',
    updatedBy: status === 'DRAFT' ? 'cms-operation' : 'cms-admin',
    updatedAt: `2026-07-${String(10 + displayOrder / 10).padStart(2, '0')}T03:00:00.000Z`,
  };
}

function createCategoryDependency(
  id: string,
  brandMappingCount: number,
  tenantConfigCount: number,
  transactionCount: number,
): MockData['categoryDependencies'][number] {
  const hasDependency =
    brandMappingCount + tenantConfigCount + transactionCount > 0;
  return {
    categoryId: `category-${id}`,
    brandMappingCount,
    tenantConfigCount,
    transactionCount,
    canHardDelete: !hasDependency,
    canInactive: true,
  };
}

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
  mockData.brandCategoryMappings.splice(
    0,
    mockData.brandCategoryMappings.length,
    ...freshData.brandCategoryMappings,
  );
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
  mockData.categories.splice(
    0,
    mockData.categories.length,
    ...freshData.categories,
  );
  mockData.categoryDependencies.splice(
    0,
    mockData.categoryDependencies.length,
    ...freshData.categoryDependencies,
  );
  mockData.auditRecords.splice(
    0,
    mockData.auditRecords.length,
    ...freshData.auditRecords,
  );
}
