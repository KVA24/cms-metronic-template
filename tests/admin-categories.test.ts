import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { adminCategoryService } from '../src/features/admin/categories/api/admin-category-service';
import { ADMIN_CATEGORY_DEFAULT_QUERY } from '../src/features/admin/categories/model/admin-category';
import { resetMockData } from '../src/shared/mocks/mock-data';

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
    assert.equal(result.items.every(({ canEdit }) => canEdit), true);
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

    assert.deepEqual(result.items.map(({ code }) => code), ['TRAVEL']);
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
