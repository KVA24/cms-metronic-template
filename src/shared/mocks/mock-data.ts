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
      accountOwner: 'Nguyen Minh',
      notes: 'Primary loyalty tenant.',
      contactName: 'Lan Nguyen',
      contactTitle: 'Partnership Manager',
      contactEmail: 'lan@lotus.test',
      contactPhone: '+84 901 111 222',
      createdBy: 'cms-admin',
      createdAt: '2026-05-01T08:00:00.000Z',
      updatedBy: 'cms-operation',
      updatedAt: '2026-07-29T10:00:00.000Z',
      version: 1,
    },
    {
      id: 'tenant-bamboo',
      code: 'BAMBOO',
      name: 'Bamboo Club',
      status: 'ACTIVE',
      accountOwner: 'Tran Ha',
      notes: '',
      contactName: 'Anh Le',
      contactTitle: 'Loyalty Lead',
      contactEmail: 'anh@bamboo.test',
      contactPhone: '+84 902 333 444',
      createdBy: 'cms-admin',
      createdAt: '2026-04-15T08:00:00.000Z',
      updatedBy: 'cms-admin',
      updatedAt: '2026-07-20T09:00:00.000Z',
      version: 1,
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
    createOffer(
      'foodnest-new-user',
      'brand-foodnest',
      'NEWUSER',
      'New user offer',
      'ACTIVE',
      'PERCENTAGE',
      12,
    ),
    createOffer(
      'travelgo-summer',
      'brand-travelgo',
      'SUMMER',
      'Summer travel offer',
      'ACTIVE',
      'FIXED_AMOUNT',
      50000,
    ),
    createOffer(
      'stylehub-draft',
      'brand-stylehub',
      'DRAFT01',
      'Draft fashion offer',
      'DRAFT',
      null,
      null,
    ),
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
  tenantRevenueShares: [
    {
      id: 'revenue-lotus-foodnest',
      tenantId: 'tenant-lotus',
      brandId: 'brand-foodnest',
      brandRate: 60,
      effectiveFrom: '2026-07-01',
      status: 'ACTIVE',
      overrides: [
        {
          id: 'revenue-override-lotus-food',
          type: 'CATEGORY',
          targetId: 'category-food-dining',
          rate: 65,
          status: 'ACTIVE',
        },
        {
          id: 'revenue-override-lotus-new-user',
          type: 'OFFER',
          targetId: 'offer-foodnest-new-user',
          rate: 70,
          status: 'ACTIVE',
        },
      ],
      updatedBy: 'cms-operation',
      updatedAt: '2026-07-30T08:00:00.000Z',
      version: 1,
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
    createCategory('food-dining', 'FOOD_DINING', 20, 'ACTIVE', 'Ẩm thực'),
    createCategory('hotel', 'HOTEL', 30, 'ACTIVE', 'Khách sạn', 'Hotel'),
    createCategory('fashion', 'FASHION', 40, 'DRAFT', 'Thời trang', 'Fashion'),
    createCategory('books', 'BOOKS', 50, 'INACTIVE', 'Sách', 'Books'),
    createCategory(
      'electronics',
      'ELECTRONICS',
      60,
      'ACTIVE',
      'Điện tử',
      'Electronics',
    ),
    createCategory('beauty', 'BEAUTY', 70, 'ACTIVE', 'Làm đẹp', 'Beauty'),
    createCategory('services', 'SERVICES', 80, 'DRAFT', 'Dịch vụ', 'Services'),
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

function createOffer(
  id: string,
  brandId: string,
  code: string,
  title: string,
  status: MockData['offers'][number]['status'],
  commissionType: MockData['offers'][number]['commissionType'],
  commissionValue: number | null,
): MockData['offers'][number] {
  const mapped = brandId !== 'brand-stylehub';
  return {
    id: `offer-${id}`,
    brandId,
    code,
    title,
    status,
    startAt: '2026-07-01T00:00:00.000Z',
    endAt: null,
    destinationUrl:
      status === 'DRAFT'
        ? ''
        : `https://${brandId.replace('brand-', '')}.test/offers/${code.toLowerCase()}`,
    defaultLocale: 'vi-VN',
    contents: [
      {
        locale: 'vi-VN',
        title,
        badge: status === 'DRAFT' ? 'Nháp' : 'Nổi bật',
        description: `${title} description.`,
        terms: 'Áp dụng điều kiện.',
      },
      {
        locale: 'en-US',
        title,
        badge: status === 'DRAFT' ? 'Draft' : 'Featured',
        description: `${title} description.`,
        terms: 'Terms apply.',
      },
    ],
    mappingId: mapped ? `OFM-${code}` : null,
    brandOfferCode: mapped ? code : null,
    brandOfferTitle: mapped ? `${title} (Brand)` : '',
    commissionType: mapped ? commissionType : null,
    commissionValue: mapped ? commissionValue : null,
    createdBy: 'cms-admin',
    createdAt: '2026-07-01T02:00:00.000Z',
    updatedBy: status === 'DRAFT' ? 'cms-operation' : 'cms-admin',
    updatedAt:
      status === 'DRAFT'
        ? '2026-07-20T03:00:00.000Z'
        : '2026-07-18T03:00:00.000Z',
    version: 1,
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
    phone: '',
    failedLoginCount: 0,
    createdSource: id === 'tenant-marketing' ? 'TENANT_PORTAL' : 'CMS',
    createdBy: tenantId ? 'cms-admin' : 'system',
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedBy: tenantId ? 'cms-admin' : 'system',
    updatedAt: '2026-07-01T08:00:00.000Z',
    version: 1,
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
