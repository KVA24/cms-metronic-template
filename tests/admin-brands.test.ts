import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { adminBrandService } from '../src/features/admin/brands/api/admin-brand-service';
import { adminBrandMappingService } from '../src/features/admin/brands/api/admin-brand-mapping-service';
import {
  adminBrandSchema,
  ADMIN_BRAND_DEFAULT_QUERY,
} from '../src/features/admin/brands/model/admin-brand';
import {
  adminBrandMappingRowSchema,
  ADMIN_BRAND_MAPPING_DEFAULT_QUERY,
} from '../src/features/admin/brands/model/admin-brand-mapping';
import { mockData, resetMockData } from '../src/shared/mocks/mock-data';

const validBrandInput = {
  code: 'HEALTHMART',
  legalName: 'Health Mart Joint Stock Company',
  websiteUrl: 'https://healthmart.test',
  logo: null,
  status: 'DRAFT' as const,
  defaultLocale: 'vi-VN' as const,
  pendingDays: 14,
  contactName: 'Nguyen Van A',
  contactEmail: 'ops@healthmart.test',
  contactPhone: '+84 912 345 678',
  notes: 'Mock onboarding note',
  viDisplayName: 'Health Mart',
  viTagline: 'Sống khỏe mỗi ngày',
  viShortDescription: 'Sản phẩm chăm sóc sức khỏe.',
  viTerms: 'Áp dụng điều kiện của thương hiệu.',
  enDisplayName: 'Health Mart',
  enTagline: 'Healthier every day',
  enShortDescription: 'Health and wellness products.',
  enTerms: 'Brand terms apply.',
};

describe('ADMIN brand list service', () => {
  beforeEach(() => resetMockData());

  it('paginates and sorts by updated time descending by default', async () => {
    const result = await adminBrandService.listBrands(
      ADMIN_BRAND_DEFAULT_QUERY,
      'CMS_OPERATION',
      'en-US',
    );

    assert.equal(result.page, 1);
    assert.equal(result.items.length, 3);
    assert.equal(result.items.every(({ canEdit }) => canEdit), true);
    assert.deepEqual(
      result.items.map(({ updatedAt }) => updatedAt),
      [...result.items.map(({ updatedAt }) => updatedAt)].sort().reverse(),
    );
  });

  it('searches code, localized name, website and contact email', async () => {
    for (const keyword of ['FOODNEST', 'FoodNest', 'foodnest.test', 'merchant@foodnest.test']) {
      const result = await adminBrandService.listBrands(
        { ...ADMIN_BRAND_DEFAULT_QUERY, keyword },
        'CMS_ADMIN',
        'en-US',
      );
      assert.deepEqual(result.items.map(({ code }) => code), ['FOODNEST']);
    }
  });

  it('filters by status and mapped affiliate category', async () => {
    const result = await adminBrandService.listBrands(
      {
        ...ADMIN_BRAND_DEFAULT_QUERY,
        status: 'ACTIVE',
        categoryId: 'category-travel',
      },
      'CMS_ADMIN',
      'vi-VN',
    );
    assert.deepEqual(result.items.map(({ code }) => code), ['TRAVELGO']);
  });

  it('rejects roles without brands.view', async () => {
    await assert.rejects(
      () =>
        adminBrandService.listBrands(
          ADMIN_BRAND_DEFAULT_QUERY,
          'CMS_CSKH',
          'vi-VN',
        ),
      /FORBIDDEN/,
    );
  });
});

describe('ADMIN brand create service', () => {
  beforeEach(() => resetMockData());

  it('validates required URL, pending days and default-locale display name', () => {
    assert.equal(adminBrandSchema.safeParse(validBrandInput).success, true);
    assert.equal(
      adminBrandSchema.safeParse({ ...validBrandInput, websiteUrl: 'healthmart.test' }).success,
      false,
    );
    assert.equal(
      adminBrandSchema.safeParse({ ...validBrandInput, pendingDays: -1 }).success,
      false,
    );
    assert.equal(
      adminBrandSchema.safeParse({ ...validBrandInput, viDisplayName: ' ' }).success,
      false,
    );
  });

  it('creates a Draft Brand without category or integration credentials', async () => {
    const created = await adminBrandService.createBrand(
      validBrandInput,
      'CMS_ADMIN',
      'cms-admin',
    );

    assert.equal(created.code, 'HEALTHMART');
    assert.equal(mockData.brandCategoryMappings.some(({ brandId }) => brandId === created.id), false);
    assert.equal(mockData.auditRecords.at(-1)?.action, 'CREATE_BRAND');
  });

  it('rejects duplicate Brand code case-insensitively', async () => {
    await assert.rejects(
      () =>
        adminBrandService.createBrand(
          { ...validBrandInput, code: 'foodnest' },
          'CMS_ADMIN',
          'cms-admin',
        ),
      /BRAND_CODE_DUPLICATE/,
    );
  });

  it('blocks Active until exactly one active default category exists', async () => {
    await assert.rejects(
      () =>
        adminBrandService.createBrand(
          { ...validBrandInput, status: 'ACTIVE' },
          'CMS_ADMIN',
          'cms-admin',
        ),
      /BRAND_DEFAULT_CATEGORY_REQUIRED/,
    );
  });

  it('enforces create permission in the service', async () => {
    await assert.rejects(
      () =>
        adminBrandService.createBrand(
          validBrandInput,
          'CMS_FINANCE',
          'cms-finance',
        ),
      /FORBIDDEN/,
    );
  });
});

describe('ADMIN brand detail, edit and deactivate service', () => {
  beforeEach(() => resetMockData());

  it('returns dependency counts and locks code once related data exists', async () => {
    const detail = await adminBrandService.getBrand(
      'brand-foodnest',
      'CMS_OPERATION',
    );

    assert.equal(detail.codeLocked, true);
    assert.equal(detail.dependencies.offerCount, 1);
    assert.equal(detail.dependencies.assignmentCount, 1);
  });

  it('rejects a stale version and an immutable code change', async () => {
    const current = await adminBrandService.getBrand(
      'brand-foodnest',
      'CMS_ADMIN',
    );
    const input = {
      ...validBrandInput,
      code: current.brand.code,
      status: current.brand.status,
    };

    await assert.rejects(
      () =>
        adminBrandService.updateBrand(
          'brand-foodnest',
          { ...input, code: 'FOODNEST_NEW' },
          current.brand.version,
          'CMS_ADMIN',
          'cms-admin',
        ),
      /BRAND_CODE_IMMUTABLE/,
    );
    await assert.rejects(
      () =>
        adminBrandService.updateBrand(
          'brand-foodnest',
          input,
          current.brand.version - 1,
          'CMS_ADMIN',
          'cms-admin',
        ),
      /VERSION_CONFLICT/,
    );
  });

  it('updates valid data, increments version and writes audit', async () => {
    const current = await adminBrandService.getBrand(
      'brand-travelgo',
      'CMS_OPERATION',
    );
    const updated = await adminBrandService.updateBrand(
      'brand-travelgo',
      {
        ...validBrandInput,
        code: current.brand.code,
        status: 'ACTIVE',
        viDisplayName: 'TravelGo mới',
      },
      current.brand.version,
      'CMS_OPERATION',
      'cms-operation',
    );

    assert.equal(updated.version, current.brand.version + 1);
    assert.equal(updated.name, 'TravelGo mới');
    assert.equal(mockData.auditRecords.at(-1)?.action, 'UPDATE_BRAND');
  });

  it('blocks activation without exactly one active default category', async () => {
    const current = await adminBrandService.getBrand(
      'brand-stylehub',
      'CMS_ADMIN',
    );
    await assert.rejects(
      () =>
        adminBrandService.updateBrand(
          'brand-stylehub',
          {
            ...validBrandInput,
            code: current.brand.code,
            status: 'ACTIVE',
          },
          current.brand.version,
          'CMS_ADMIN',
          'cms-admin',
        ),
      /BRAND_DEFAULT_CATEGORY_REQUIRED/,
    );
  });

  it('soft-deactivates without deleting Brand or Offer history', async () => {
    const result = await adminBrandService.deactivateBrand(
      'brand-foodnest',
      'CMS_ADMIN',
      'cms-admin',
    );

    assert.equal(result.brand.status, 'INACTIVE');
    assert.equal(result.dependencies.canHardDelete, false);
    assert.equal(mockData.brands.some(({ id }) => id === 'brand-foodnest'), true);
    assert.equal(mockData.offers.some(({ brandId }) => brandId === 'brand-foodnest'), true);
    assert.equal(mockData.auditRecords.at(-1)?.action, 'DEACTIVATE_BRAND');
  });

  it('enforces edit permission in the service', async () => {
    await assert.rejects(
      () =>
        adminBrandService.deactivateBrand(
          'brand-foodnest',
          'CMS_FINANCE',
          'cms-finance',
        ),
      /FORBIDDEN/,
    );
  });
});

const validMappingInput = {
  categoryId: 'category-travel',
  brandCategoryCode: 'TRAVEL_NEW',
  brandCategoryName: 'Travel new',
  isDefault: false,
  commissionType: 'PERCENTAGE' as const,
  commissionValue: 7.25,
  effectiveFrom: '2026-08-03',
  effectiveTo: '',
  status: 'DRAFT' as const,
};

describe('ADMIN Brand Category Mapping & Commission service', () => {
  beforeEach(() => resetMockData());

  it('validates code, conditional commission and effective period fields', () => {
    assert.equal(adminBrandMappingRowSchema.safeParse(validMappingInput).success, true);
    assert.equal(adminBrandMappingRowSchema.safeParse({ ...validMappingInput, brandCategoryCode: 'bad code' }).success, false);
    assert.equal(adminBrandMappingRowSchema.safeParse({ ...validMappingInput, commissionValue: 100.001 }).success, false);
    assert.equal(adminBrandMappingRowSchema.safeParse({ ...validMappingInput, commissionType: 'FIXED_AMOUNT', commissionValue: 0 }).success, false);
    assert.equal(adminBrandMappingRowSchema.safeParse({ ...validMappingInput, effectiveTo: '2026-08-02' }).success, false);
  });

  it('lists mappings with filters and a computed effective state', async () => {
    const result = await adminBrandMappingService.listMappings(
      'brand-foodnest',
      { ...ADMIN_BRAND_MAPPING_DEFAULT_QUERY, keyword: 'food', status: 'ACTIVE' },
      'CMS_OPERATION',
    );

    assert.equal(result.items.length, 1);
    assert.equal(result.items[0]?.categoryName, 'Ẩm thực');
    assert.equal(result.items[0]?.effectiveState, 'CURRENT');
    assert.equal(result.items[0]?.canEdit, true);
  });

  it('saves multiple valid rows only after every row passes', async () => {
    const saved = await adminBrandMappingService.saveBatch(
      'brand-stylehub',
      [
        validMappingInput,
        { ...validMappingInput, categoryId: 'category-food-dining', brandCategoryCode: 'FOOD_NEW', commissionType: 'FIXED_AMOUNT', commissionValue: 25000 },
      ],
      'CMS_ADMIN',
      'cms-admin',
    );

    assert.equal(saved.length, 2);
    assert.equal(mockData.brandCategoryMappings.filter(({ brandId }) => brandId === 'brand-stylehub').length, 3);
    assert.equal(mockData.auditRecords.at(-1)?.action, 'SAVE_BRAND_CATEGORY_MAPPINGS');
  });

  it('rolls back the complete batch when one row is invalid', async () => {
    const before = structuredClone(mockData.brandCategoryMappings);
    await assert.rejects(
      () => adminBrandMappingService.saveBatch(
        'brand-stylehub',
        [validMappingInput, { ...validMappingInput, brandCategoryCode: 'invalid code' }],
        'CMS_ADMIN',
        'cms-admin',
      ),
      /MAPPING_BATCH_INVALID/,
    );
    assert.deepEqual(mockData.brandCategoryMappings, before);
  });

  it('rejects overlapping Active codes and leaves stored mappings unchanged', async () => {
    const before = structuredClone(mockData.brandCategoryMappings);
    await assert.rejects(
      () => adminBrandMappingService.saveBatch(
        'brand-foodnest',
        [{ ...validMappingInput, categoryId: 'category-food-dining', brandCategoryCode: 'food', status: 'ACTIVE' }],
        'CMS_ADMIN',
        'cms-admin',
      ),
      /BRAND_CATEGORY_CODE_DUPLICATE/,
    );
    assert.deepEqual(mockData.brandCategoryMappings, before);
  });

  it('atomically moves the default and keeps exactly one for an Active Brand', async () => {
    const saved = await adminBrandMappingService.saveBatch(
      'brand-foodnest',
      [{ ...validMappingInput, isDefault: true, status: 'ACTIVE' }],
      'CMS_OPERATION',
      'cms-operation',
    );
    const activeDefaults = mockData.brandCategoryMappings.filter(
      ({ brandId, status, isDefault }) => brandId === 'brand-foodnest' && status === 'ACTIVE' && isDefault,
    );

    assert.equal(saved[0]?.isDefault, true);
    assert.deepEqual(activeDefaults.map(({ brandCategoryCode }) => brandCategoryCode), ['TRAVEL_NEW']);
  });

  it('does not allow the only default of an Active Brand to become inactive', async () => {
    const current = mockData.brandCategoryMappings.find(({ id }) => id === 'mapping-foodnest-food')!;
    await assert.rejects(
      () => adminBrandMappingService.saveBatch(
        'brand-foodnest',
        [{ ...validMappingInput, id: current.id, categoryId: current.categoryId, brandCategoryCode: current.brandCategoryCode, isDefault: true, status: 'INACTIVE' }],
        'CMS_ADMIN',
        'cms-admin',
      ),
      /BRAND_DEFAULT_CATEGORY_REQUIRED/,
    );
    assert.equal(current.status, 'ACTIVE');
  });

  it('enforces view and edit permissions in the service', async () => {
    await assert.rejects(
      () => adminBrandMappingService.listMappings('brand-foodnest', ADMIN_BRAND_MAPPING_DEFAULT_QUERY, 'CMS_CSKH'),
      /FORBIDDEN/,
    );
    await assert.rejects(
      () => adminBrandMappingService.saveBatch('brand-foodnest', [validMappingInput], 'CMS_FINANCE', 'cms-finance'),
      /FORBIDDEN/,
    );
  });
});
