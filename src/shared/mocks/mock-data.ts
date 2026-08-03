import { type ExceptionResolutionItem, type MockData } from '../contracts';
import { getPermissionsForRole, type TenantRoleCode } from '../permissions';

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
  tenantRoles: [
    ...createSystemTenantRoles('tenant-lotus'),
    ...createSystemTenantRoles('tenant-bamboo'),
    createCustomTenantRole('tenant-lotus', 'CONTENT_EDITOR', 'Content Editor', [
      'brands.view',
      'earn_display.view',
      'earn_display.create',
      'earn_display.edit',
      'profile.view',
      'profile.edit',
    ]),
    createCustomTenantRole('tenant-bamboo', 'REPORT_VIEWER', 'Report Viewer', [
      'dashboard.view',
      'transactions.view',
      'profile.view',
    ]),
  ],
  passwordResetRequests: [],
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
  earnDisplays: [
    {
      id: 'earn-lotus-foodnest-brand',
      tenantId: 'tenant-lotus',
      brandId: 'brand-foodnest',
      targetType: 'BRAND',
      targetId: null,
      textEn: 'Earn up to 12% with FoodNest',
      textVi: 'Tích lũy đến 12% tại FoodNest',
      displayStatus: 'ACTIVE',
      effectiveFrom: '2026-07-01',
      effectiveTo: null,
      updatedBy: 'tenant-marketing',
      updatedAt: '2026-07-20T09:00:00.000Z',
      version: 1,
    },
    {
      id: 'earn-lotus-foodnest-category-food',
      tenantId: 'tenant-lotus',
      brandId: 'brand-foodnest',
      targetType: 'CATEGORY',
      targetId: 'category-food-dining',
      textEn: 'Earn more on dining orders',
      textVi: 'Tích lũy thêm cho đơn hàng ẩm thực',
      displayStatus: 'ACTIVE',
      effectiveFrom: null,
      effectiveTo: null,
      updatedBy: 'tenant-marketing',
      updatedAt: '2026-07-21T09:00:00.000Z',
      version: 1,
    },
    {
      id: 'earn-lotus-foodnest-offer-new-user',
      tenantId: 'tenant-lotus',
      brandId: 'brand-foodnest',
      targetType: 'OFFER',
      targetId: 'offer-foodnest-new-user',
      textEn: 'New members earn 12%',
      textVi: 'Thành viên mới tích lũy 12%',
      displayStatus: 'INACTIVE',
      effectiveFrom: '2026-07-01',
      effectiveTo: null,
      updatedBy: 'tenant-marketing',
      updatedAt: '2026-07-22T09:00:00.000Z',
      version: 1,
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
  configurations: [
    {
      id: 1,
      key: 'TENANT_SHARE_DEFAULT_RATE',
      value: '40',
      status: 'ACTIVE',
      createdBy: 'cms-admin',
      createdAt: '2026-05-01T08:00:00.000Z',
      updatedBy: 'cms-admin',
      updatedAt: '2026-05-01T08:00:00.000Z',
      version: 1,
    },
    {
      id: 2,
      key: 'SESSION_TIMEOUT_MINUTES',
      value: '30',
      status: 'ACTIVE',
      createdBy: 'cms-admin',
      createdAt: '2026-05-02T08:00:00.000Z',
      updatedBy: 'cms-admin',
      updatedAt: '2026-05-02T08:00:00.000Z',
      version: 1,
    },
    {
      id: 3,
      key: 'PARTNER_API_SECRET',
      value: 'mock-secret-value',
      status: 'INACTIVE',
      createdBy: 'cms-admin',
      createdAt: '2026-06-01T08:00:00.000Z',
      updatedBy: 'cms-admin',
      updatedAt: '2026-06-01T08:00:00.000Z',
      version: 1,
    },
  ],
  transactions: [
    {
      id: 'transaction-lotus-pending',
      requestId: 'request-lotus-001',
      tenantId: 'tenant-lotus',
      brandId: 'brand-foodnest',
      clickId: 'click-lotus-001',
      brandOrderId: 'FN-2026-001',
      userId: 'user-1001',
      memberRef: 'LM-1001',
      customerRef: 'food-customer-1',
      status: 'PENDING',
      finalAmount: 500_000,
      currency: 'VND',
      estimatedGrossCommission: 50_000,
      estimatedTenantShare: 35_000,
      actualGrossCommission: 30_000,
      actualTenantShare: 21_000,
      commissionConfirmedAt: null,
      createdAt: '2026-07-15T03:00:00.000Z',
      updatedAt: '2026-07-20T03:00:00.000Z',
    },
    {
      id: 'transaction-bamboo-confirmed',
      requestId: 'request-bamboo-001',
      tenantId: 'tenant-bamboo',
      brandId: 'brand-travelgo',
      clickId: 'click-bamboo-001',
      brandOrderId: 'TG-2026-001',
      userId: 'user-2001',
      memberRef: 'BC-2001',
      customerRef: null,
      status: 'CONFIRMED',
      finalAmount: 2_000_000,
      currency: 'VND',
      estimatedGrossCommission: 200_000,
      estimatedTenantShare: 0,
      actualGrossCommission: 200_000,
      actualTenantShare: 120_000,
      commissionConfirmedAt: '2026-07-25T04:00:00.000Z',
      createdAt: '2026-07-16T04:00:00.000Z',
      updatedAt: '2026-07-25T04:00:00.000Z',
    },
    {
      id: 'transaction-lotus-cancelled',
      requestId: 'request-lotus-002',
      tenantId: 'tenant-lotus',
      brandId: 'brand-foodnest',
      clickId: 'click-lotus-002',
      brandOrderId: 'FN-2026-002',
      userId: null,
      memberRef: null,
      customerRef: null,
      status: 'CANCELLED',
      finalAmount: 0,
      currency: 'VND',
      estimatedGrossCommission: 0,
      estimatedTenantShare: 0,
      actualGrossCommission: 0,
      actualTenantShare: 0,
      commissionConfirmedAt: null,
      createdAt: '2026-07-18T03:00:00.000Z',
      updatedAt: '2026-07-19T03:00:00.000Z',
    },
  ],
  transactionItems: [
    createTransactionItem(
      'lotus-pending-1',
      'transaction-lotus-pending',
      'FN-ITEM-1',
      'Meal combo',
      300_000,
      30_000,
      21_000,
      'CONFIRMED',
    ),
    createTransactionItem(
      'lotus-pending-2',
      'transaction-lotus-pending',
      'FN-ITEM-2',
      'Dinner voucher',
      200_000,
      20_000,
      14_000,
      'PENDING',
    ),
    createTransactionItem(
      'bamboo-confirmed-1',
      'transaction-bamboo-confirmed',
      'TG-ITEM-1',
      'Flight package',
      2_000_000,
      200_000,
      120_000,
      'CONFIRMED',
    ),
    createTransactionItem(
      'lotus-cancelled-1',
      'transaction-lotus-cancelled',
      'FN-ITEM-3',
      'Refunded voucher',
      100_000,
      0,
      0,
      'REFUNDED',
    ),
  ],
  transactionHistories: [
    {
      id: 'history-lotus-order',
      transactionId: 'transaction-lotus-pending',
      transactionItemId: null,
      requestId: 'request-lotus-001',
      eventType: 'ORDER_RECORDED',
      eventAt: '2026-07-15T03:00:00.000Z',
      processingResult: 'APPLIED',
      createdBy: 'brand-system',
    },
    {
      id: 'history-lotus-confirmed',
      transactionId: 'transaction-lotus-pending',
      transactionItemId: 'item-lotus-pending-1',
      requestId: null,
      eventType: 'ITEM_CONFIRMED',
      eventAt: '2026-07-20T03:00:00.000Z',
      processingResult: 'APPLIED',
      createdBy: 'platform-job',
    },
    {
      id: 'history-bamboo-order',
      transactionId: 'transaction-bamboo-confirmed',
      transactionItemId: null,
      requestId: 'request-bamboo-001',
      eventType: 'ORDER_RECORDED',
      eventAt: '2026-07-16T04:00:00.000Z',
      processingResult: 'APPLIED',
      createdBy: 'brand-system',
    },
    {
      id: 'history-bamboo-confirmed',
      transactionId: 'transaction-bamboo-confirmed',
      transactionItemId: 'item-bamboo-confirmed-1',
      requestId: null,
      eventType: 'ITEM_CONFIRMED',
      eventAt: '2026-07-25T04:00:00.000Z',
      processingResult: 'APPLIED',
      createdBy: 'platform-job',
    },
    {
      id: 'history-lotus-refund',
      transactionId: 'transaction-lotus-cancelled',
      transactionItemId: 'item-lotus-cancelled-1',
      requestId: 'request-refund-001',
      eventType: 'ITEM_REFUNDED',
      eventAt: '2026-07-19T03:00:00.000Z',
      processingResult: 'APPLIED',
      createdBy: 'brand-system',
    },
  ],
  exportRequests: [],
  exceptions: [
    {
      id: 'exception-auth-001',
      group: 'REQUEST_AUTHENTICATION',
      type: 'auth_fail',
      severity: 'HIGH',
      status: 'OPEN',
      requestId: 'request-auth-001',
      orderId: null,
      brandOrderId: 'FN-FAILED-001',
      clickId: null,
      tenantId: null,
      brandId: 'brand-foodnest',
      retryCount: 0,
      message: 'Signature verification failed.',
      createdAt: '2026-07-28T08:00:00.000Z',
      resolvedAt: null,
      details: {
        endpoint: 'POST /orders/success',
        authenticationMethod: 'HMAC signature',
        failureMessage: 'Request signature is invalid or expired.',
        checks: [
          {
            name: 'Credential lookup',
            result: 'PASS',
            message: 'Credential identifier matched FoodNest.',
          },
          {
            name: 'Credential status',
            result: 'PASS',
            message: 'Credential is Active.',
          },
          {
            name: 'Signature verification',
            result: 'FAILED',
            message: 'Signature mismatch.',
          },
        ],
      },
    },
    {
      id: 'exception-click-001',
      group: 'CLICK_ELIGIBILITY',
      type: 'click_id_invalid',
      severity: 'MEDIUM',
      status: 'OPEN',
      requestId: 'request-click-001',
      orderId: null,
      brandOrderId: 'TG-FAILED-001',
      clickId: 'click-unknown',
      tenantId: null,
      brandId: 'brand-travelgo',
      retryCount: 1,
      message: 'Click record was not found.',
      createdAt: '2026-07-27T08:00:00.000Z',
      resolvedAt: null,
      details: {
        clickAt: null,
        checks: [
          {
            name: 'Request validation',
            result: 'PASS',
            message: 'Order payload is valid.',
          },
          {
            name: 'Click lookup',
            result: 'FAILED',
            message: 'Click ID does not exist.',
          },
          {
            name: 'Eligibility',
            result: 'NOT_EXECUTED',
            message: 'Click must be resolved first.',
          },
        ],
      },
    },
    {
      id: 'exception-brand-commission-001',
      group: 'BRAND_COMMISSION',
      type: 'brand_commission_source_missing',
      severity: 'HIGH',
      status: 'OPEN',
      requestId: 'request-commission-001',
      orderId: null,
      brandOrderId: 'FN-FAILED-002',
      clickId: 'click-lotus-003',
      tenantId: 'tenant-lotus',
      brandId: 'brand-foodnest',
      retryCount: 0,
      message: 'One item has no Brand commission source.',
      createdAt: '2026-07-26T08:00:00.000Z',
      resolvedAt: null,
      details: {
        orderSuccessAt: '2026-07-26T07:59:00.000Z',
        items: [
          createExceptionItem(
            'FN-MISSING-1',
            'Unknown food item',
            false,
            'Brand commission source not found.',
          ),
        ],
      },
    },
    {
      id: 'exception-tenant-share-001',
      group: 'TENANT_SHARE',
      type: 'tenant_share_source_missing',
      severity: 'HIGH',
      status: 'RESOLVED',
      requestId: 'request-share-001',
      orderId: 'transaction-lotus-pending',
      brandOrderId: 'FN-2026-001',
      clickId: 'click-lotus-001',
      tenantId: 'tenant-lotus',
      brandId: 'brand-foodnest',
      retryCount: 1,
      message: 'Tenant Share rule was supplied and retry completed.',
      createdAt: '2026-07-20T08:00:00.000Z',
      resolvedAt: '2026-07-21T08:00:00.000Z',
      details: {
        orderSuccessAt: '2026-07-15T03:00:00.000Z',
        items: [createExceptionItem('FN-ITEM-1', 'Meal combo', true, '')],
      },
    },
    {
      id: 'exception-cancel-refund-001',
      group: 'CANCEL_REFUND',
      type: 'cancel_refund_item_unmatched',
      severity: 'MEDIUM',
      status: 'OPEN',
      requestId: 'request-refund-failed-001',
      orderId: 'transaction-lotus-pending',
      brandOrderId: 'FN-2026-001',
      clickId: null,
      tenantId: 'tenant-lotus',
      brandId: 'brand-foodnest',
      retryCount: 2,
      message: 'Refund item does not belong to the Order.',
      createdAt: '2026-07-29T08:00:00.000Z',
      resolvedAt: null,
      details: {
        eventType: 'ITEM_REFUNDED',
        eventAt: '2026-07-29T07:59:00.000Z',
        reason: 'Customer request',
        itemCodes: ['FN-NOT-FOUND'],
        checks: [
          {
            name: 'Request validation',
            result: 'PASS',
            message: 'Event payload is valid.',
          },
          {
            name: 'Event ordering',
            result: 'PASS',
            message: 'Event ordering is valid.',
          },
          { name: 'Order match', result: 'PASS', message: 'Order matched.' },
          {
            name: 'Item match',
            result: 'FAILED',
            message: 'Item not found in Order.',
          },
          {
            name: 'Atomic update',
            result: 'NOT_EXECUTED',
            message: 'No item was changed.',
          },
        ],
        transactionStatus: 'PENDING',
        finalAmount: 500_000,
        grossCommission: 50_000,
        tenantShare: 35_000,
      },
    },
    {
      id: 'exception-persistence-001',
      group: 'TRANSACTION_PERSISTENCE',
      type: 'persistence_fail',
      severity: 'HIGH',
      status: 'OPEN',
      requestId: 'request-persistence-001',
      orderId: null,
      brandOrderId: 'TG-FAILED-002',
      clickId: 'click-bamboo-002',
      tenantId: 'tenant-bamboo',
      brandId: 'brand-travelgo',
      retryCount: 0,
      message: 'Database commit timed out and all staged data was rolled back.',
      createdAt: '2026-07-30T08:00:00.000Z',
      resolvedAt: null,
      details: {
        itemCount: 2,
        failureCode: 'DB_COMMIT_TIMEOUT',
        failedOperation: 'Commit database transaction',
        rollbackResult: 'No Transaction retained',
        checks: [
          {
            name: 'Generate Order ID',
            result: 'PASS',
            message: 'Temporary ID generated.',
          },
          {
            name: 'Order header insert',
            result: 'PASS',
            message: 'Header staged.',
          },
          {
            name: 'Order Item insert',
            result: 'PASS',
            message: 'Items staged.',
          },
          {
            name: 'Commission snapshot insert',
            result: 'PASS',
            message: 'Snapshots staged.',
          },
          {
            name: 'Status & totals initialization',
            result: 'PASS',
            message: 'Totals staged.',
          },
          {
            name: 'Database commit',
            result: 'FAILED',
            message: 'Commit timeout.',
          },
          {
            name: 'Reporting publication',
            result: 'NOT_EXECUTED',
            message: 'Commit must succeed first.',
          },
        ],
      },
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
    tenantRoleId: tenantId
      ? systemTenantRoleId(tenantId, roleCode as TenantRoleCode)
      : undefined,
    tenantId,
    roles: [{ roleCode, roleName: roleCode }],
    phone: '',
    failedLoginCount: 0,
    lockedAt: null,
    sessionRevokedAt: null,
    createdSource: id === 'tenant-marketing' ? 'TENANT_PORTAL' : 'CMS',
    createdBy: tenantId ? 'cms-admin' : 'system',
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedBy: tenantId ? 'cms-admin' : 'system',
    updatedAt: '2026-07-01T08:00:00.000Z',
    version: 1,
  };
}

function createSystemTenantRoles(tenantId: string): MockData['tenantRoles'] {
  const roles: TenantRoleCode[] = [
    'TENANT_ADMIN',
    'TENANT_MARKETING_OPS',
    'TENANT_VIEWER',
    'TENANT_FINANCE',
  ];
  const names: Record<TenantRoleCode, string> = {
    TENANT_ADMIN: 'Admin Tenant',
    TENANT_MARKETING_OPS: 'Marketing/Ops Tenant',
    TENANT_VIEWER: 'Viewer Tenant',
    TENANT_FINANCE: 'Finance Tenant',
  };
  return roles.map((code) => ({
    id: systemTenantRoleId(tenantId, code),
    tenantId,
    code,
    name: names[code],
    description: `System role ${code}`,
    type: 'SYSTEM',
    status: 'ACTIVE',
    permissions: [...getPermissionsForRole(code)],
    createdBy: 'system',
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedBy: 'system',
    updatedAt: '2026-07-01T08:00:00.000Z',
    version: 1,
  }));
}

function systemTenantRoleId(tenantId: string, code: TenantRoleCode) {
  return `role-${tenantId.replace('tenant-', '')}-${code.toLowerCase().replace('tenant_', '').replaceAll('_', '-')}`;
}

function createCustomTenantRole(
  tenantId: string,
  code: string,
  name: string,
  permissions: MockData['tenantRoles'][number]['permissions'],
): MockData['tenantRoles'][number] {
  return {
    id: `role-${tenantId.replace('tenant-', '')}-${code.toLowerCase().replaceAll('_', '-')}`,
    tenantId,
    code,
    name,
    description: `${name} custom role`,
    type: 'CUSTOM',
    status: 'ACTIVE',
    permissions,
    createdBy: 'tenant-admin',
    createdAt: '2026-07-15T08:00:00.000Z',
    updatedBy: 'tenant-admin',
    updatedAt: '2026-07-15T08:00:00.000Z',
    version: 1,
  };
}

function createTransactionItem(
  suffix: string,
  transactionId: string,
  code: string,
  name: string,
  originalAmount: number,
  grossCommission: number,
  tenantShare: number,
  status: MockData['transactionItems'][number]['status'],
): MockData['transactionItems'][number] {
  const refunded = status === 'REFUNDED';
  const confirmed = status === 'CONFIRMED';
  return {
    id: `item-${suffix}`,
    transactionId,
    code,
    name,
    sku: null,
    quantity: refunded ? 0 : 1,
    originalAmount,
    finalAmount: refunded ? 0 : originalAmount,
    offerCode: code.startsWith('FN') ? 'NEWUSER' : null,
    categoryCode: code.startsWith('TG') ? 'TRAVEL' : 'FOOD',
    brandCommissionSource: code.startsWith('FN') ? 'OFFER' : 'CATEGORY',
    brandCommissionValue: 10,
    brandMappingReference: code.startsWith('FN')
      ? 'offer-foodnest-new-user'
      : 'mapping-travelgo-travel',
    brandCommissionRuleVersion: 'v1',
    grossCommission,
    tenantShareSource: code.startsWith('FN') ? 'OFFER' : 'TENANT_BRAND_DEFAULT',
    tenantShareValue: code.startsWith('FN') ? 70 : 60,
    tenantShareReference: code.startsWith('FN')
      ? 'revenue-override-lotus-new-user'
      : 'revenue-bamboo-travelgo',
    tenantShareRuleVersion: 'v1',
    tenantShare,
    affiliateKeep: grossCommission - tenantShare,
    status,
    confirmedAt: confirmed ? '2026-07-25T04:00:00.000Z' : null,
    refundedAt: refunded ? '2026-07-19T03:00:00.000Z' : null,
    createdAt: '2026-07-15T03:00:00.000Z',
    updatedAt: refunded
      ? '2026-07-19T03:00:00.000Z'
      : confirmed
        ? '2026-07-25T04:00:00.000Z'
        : '2026-07-15T03:00:00.000Z',
  };
}

function createExceptionItem(
  code: string,
  name: string,
  valid: boolean,
  issue: string,
): ExceptionResolutionItem {
  return {
    code,
    name,
    quantity: 1,
    originalAmount: 300_000,
    finalAmount: 300_000,
    brandCommissionSource: valid ? 'OFFER' : null,
    brandCommissionValue: valid ? 10 : null,
    brandMappingReference: valid ? 'offer-foodnest-new-user' : null,
    grossCommission: valid ? 30_000 : null,
    tenantShareSource: valid ? 'OFFER' : null,
    tenantShareValue: valid ? 70 : null,
    tenantShareReference: valid ? 'revenue-override-lotus-new-user' : null,
    tenantShare: valid ? 21_000 : null,
    validationResult: valid ? 'PASS' : 'FAILED',
    issue,
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
  mockData.tenantRoles.splice(
    0,
    mockData.tenantRoles.length,
    ...freshData.tenantRoles,
  );
  mockData.passwordResetRequests.splice(
    0,
    mockData.passwordResetRequests.length,
    ...freshData.passwordResetRequests,
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
  mockData.earnDisplays.splice(
    0,
    mockData.earnDisplays.length,
    ...freshData.earnDisplays,
  );
  mockData.tenantRevenueShares.splice(
    0,
    mockData.tenantRevenueShares.length,
    ...freshData.tenantRevenueShares,
  );
  mockData.configurations.splice(
    0,
    mockData.configurations.length,
    ...freshData.configurations,
  );
  mockData.transactions.splice(
    0,
    mockData.transactions.length,
    ...freshData.transactions,
  );
  mockData.transactionItems.splice(
    0,
    mockData.transactionItems.length,
    ...freshData.transactionItems,
  );
  mockData.transactionHistories.splice(
    0,
    mockData.transactionHistories.length,
    ...freshData.transactionHistories,
  );
  mockData.exportRequests.splice(
    0,
    mockData.exportRequests.length,
    ...freshData.exportRequests,
  );
  mockData.exceptions.splice(
    0,
    mockData.exceptions.length,
    ...freshData.exceptions,
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
