import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { adminCategoryService } from '../src/features/admin/categories/api/admin-category-service';
import {
  ADMIN_CATEGORY_DEFAULT_QUERY,
  adminCategorySchema,
} from '../src/features/admin/categories/model/admin-category';
import { mockData, resetMockData } from '../src/shared/mocks/mock-data';

describe('ADMIN category list service', () => {
  beforeEach(() => resetMockData());

  it('returns a sorted, paginated list with action projection', async () => {
    const result = await adminCategoryService.listCategories(
      ADMIN_CATEGORY_DEFAULT_QUERY,
      'CMS_OPERATION',
      'en-US',
    );

    assert.equal(result.page, 1);
    assert.equal(result.pageSize, 5);
    assert.equal(result.items.length, 5);
    assert.equal(result.totalItems > result.items.length, true);
    assert.equal(
      result.items.every(({ canEdit }) => canEdit),
      true,
    );
  });

  it('filters by trimmed code/name keyword, status and landing visibility', async () => {
    const result = await adminCategoryService.listCategories(
      {
        ...ADMIN_CATEGORY_DEFAULT_QUERY,
        keyword: '  travel  ',
        status: 'ACTIVE',
        landing: 'VISIBLE',
      },
      'CMS_ADMIN',
      'en-US',
    );

    assert.deepEqual(
      result.items.map(({ code }) => code),
      ['TRAVEL'],
    );
  });

  it('falls back to vi-VN when the selected locale is missing', async () => {
    const result = await adminCategoryService.listCategories(
      { ...ADMIN_CATEGORY_DEFAULT_QUERY, keyword: 'Ẩm thực' },
      'CMS_FINANCE',
      'en-US',
    );

    assert.equal(result.items[0]?.code, 'FOOD_DINING');
    assert.equal(result.items[0]?.name, 'Ẩm thực');
    assert.equal(result.items[0]?.resolvedLocale, 'vi-VN');
    assert.equal(result.items[0]?.canEdit, false);
  });

  it('sorts deterministically in either direction', async () => {
    const result = await adminCategoryService.listCategories(
      {
        ...ADMIN_CATEGORY_DEFAULT_QUERY,
        pageSize: 20,
        sortBy: 'code',
        sortDirection: 'desc',
      },
      'CMS_ADMIN',
      'vi-VN',
    );
    const codes = result.items.map(({ code }) => code);

    assert.deepEqual(codes, [...codes].sort().reverse());
  });

  it('rejects users without categories.view before reading data', async () => {
    await assert.rejects(
      () =>
        adminCategoryService.listCategories(
          ADMIN_CATEGORY_DEFAULT_QUERY,
          'CMS_CSKH',
          'vi-VN',
        ),
      /FORBIDDEN/,
    );
  });
});

const validCategoryInput = {
  code: 'HEALTH_WELLNESS',
  displayOrder: 90,
  status: 'ACTIVE' as const,
  icon: null,
  viName: 'Sức khỏe',
  viDescription: 'Sản phẩm và dịch vụ chăm sóc sức khỏe.',
  enName: 'Health & Wellness',
  enDescription: 'Health and wellness products and services.',
};

describe('ADMIN category CRUD service', () => {
  beforeEach(() => resetMockData());

  it('validates code, required vi-VN content and field limits with Zod', () => {
    assert.equal(
      adminCategorySchema.safeParse(validCategoryInput).success,
      true,
    );
    assert.equal(
      adminCategorySchema.safeParse({ ...validCategoryInput, code: 'a!' })
        .success,
      false,
    );
    assert.equal(
      adminCategorySchema.safeParse({ ...validCategoryInput, viName: '   ' })
        .success,
      false,
    );
    assert.equal(
      adminCategorySchema.safeParse({
        ...validCategoryInput,
        viDescription: 'x'.repeat(501),
      }).success,
      false,
    );
  });

  it('creates a category and appends an audit record', async () => {
    const created = await adminCategoryService.createCategory(
      validCategoryInput,
      'CMS_ADMIN',
      'cms-admin',
    );

    assert.equal(created.code, 'HEALTH_WELLNESS');
    assert.equal(
      mockData.categories.some(({ id }) => id === created.id),
      true,
    );
    assert.equal(mockData.auditRecords.at(-1)?.action, 'CREATE_CATEGORY');
  });

  it('rejects duplicate codes case-insensitively', async () => {
    await assert.rejects(
      () =>
        adminCategoryService.createCategory(
          { ...validCategoryInput, code: 'travel' },
          'CMS_ADMIN',
          'cms-admin',
        ),
      /CATEGORY_CODE_DUPLICATE/,
    );
  });

  it('locks category code when dependencies exist and allows content updates', async () => {
    const detail = await adminCategoryService.getCategory(
      'category-travel',
      'CMS_OPERATION',
    );
    assert.equal(detail.codeLocked, true);

    await assert.rejects(
      () =>
        adminCategoryService.updateCategory(
          'category-travel',
          { ...validCategoryInput, code: 'TRAVEL_NEW' },
          'CMS_OPERATION',
          'cms-operation',
        ),
      /CATEGORY_CODE_IMMUTABLE/,
    );

    const updated = await adminCategoryService.updateCategory(
      'category-travel',
      { ...validCategoryInput, code: 'TRAVEL', viName: 'Du lịch mới' },
      'CMS_OPERATION',
      'cms-operation',
    );
    assert.equal(updated.contents[0]?.name, 'Du lịch mới');
    assert.equal(mockData.auditRecords.at(-1)?.action, 'UPDATE_CATEGORY');
  });

  it('inactivates after returning dependencies and never hard deletes', async () => {
    const result = await adminCategoryService.inactivateCategory(
      'category-travel',
      'CMS_ADMIN',
      'cms-admin',
    );

    assert.equal(result.category.status, 'INACTIVE');
    assert.equal(result.dependency.canHardDelete, false);
    assert.equal(
      mockData.categories.some(({ id }) => id === result.category.id),
      true,
    );
    assert.equal(mockData.auditRecords.at(-1)?.action, 'INACTIVATE_CATEGORY');
  });

  it('returns typed icon metadata and rejects invalid upload metadata', async () => {
    const icon = await adminCategoryService.uploadIcon(
      {
        fileName: 'health.svg',
        mimeType: 'image/svg+xml',
        sizeBytes: 12_000,
      },
      'CMS_ADMIN',
    );
    assert.equal(icon.fileName, 'health.svg');

    await assert.rejects(
      () =>
        adminCategoryService.uploadIcon(
          {
            fileName: 'health.gif',
            mimeType: 'image/gif',
            sizeBytes: 12_000,
          },
          'CMS_ADMIN',
        ),
      /ICON_INVALID/,
    );
  });

  it('enforces create/edit permissions in the service', async () => {
    await assert.rejects(
      () =>
        adminCategoryService.createCategory(
          validCategoryInput,
          'CMS_FINANCE',
          'cms-finance',
        ),
      /FORBIDDEN/,
    );
    await assert.rejects(
      () =>
        adminCategoryService.inactivateCategory(
          'category-travel',
          'CMS_FINANCE',
          'cms-finance',
        ),
      /FORBIDDEN/,
    );
  });
});
