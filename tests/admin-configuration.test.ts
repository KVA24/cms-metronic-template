import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { adminConfigurationService } from '../src/features/admin/configuration/api/admin-configuration-service';
import { ADMIN_CONFIGURATION_DEFAULT_QUERY } from '../src/features/admin/configuration/model/admin-configuration';
import { mockData, resetMockData } from '../src/shared/mocks/mock-data';

beforeEach(resetMockData);

describe('ADMIN Configuration service', () => {
  it('loads one fresh detail by ID before view or edit', async () => {
    const detail = await adminConfigurationService.getDetail(1, 'CMS_ADMIN');

    assert.equal(detail.key, 'TENANT_SHARE_DEFAULT_RATE');
    detail.value = 'changed-only-in-the-view';
    assert.equal(mockData.configurations[0]?.value, '40');
    await assert.rejects(
      () => adminConfigurationService.getDetail(1, 'CMS_OPERATION'),
      /FORBIDDEN/,
    );
    await assert.rejects(
      () => adminConfigurationService.getDetail(999, 'CMS_ADMIN'),
      /NOT_FOUND/,
    );
  });

  it('lists by ascending numeric ID and combines keyword/date filters', async () => {
    const all = await adminConfigurationService.list(
      ADMIN_CONFIGURATION_DEFAULT_QUERY,
      'CMS_ADMIN',
    );
    assert.deepEqual(
      all.items.map(({ id }) => id),
      [1, 2, 3],
    );
    assert.equal(all.items[0]?.value, '40');
    const filtered = await adminConfigurationService.list(
      {
        ...ADMIN_CONFIGURATION_DEFAULT_QUERY,
        keyword: ' share ',
        createdFrom: '2026-05-01',
        createdTo: '2026-05-01',
      },
      'CMS_ADMIN',
    );
    assert.deepEqual(
      filtered.items.map(({ id }) => id),
      [1],
    );
  });

  it('rejects an inverted created date range', async () => {
    await assert.rejects(
      () =>
        adminConfigurationService.list(
          {
            ...ADMIN_CONFIGURATION_DEFAULT_QUERY,
            createdFrom: '2026-06-02',
            createdTo: '2026-06-01',
          },
          'CMS_ADMIN',
        ),
      /DATE_RANGE_INVALID/,
    );
  });

  it('creates a trimmed unique string value with system fields and audit', async () => {
    const created = await adminConfigurationService.create(
      { key: ' CACHE_TTL ', value: ' 60 ', status: 'ACTIVE' },
      'CMS_ADMIN',
      'cms-admin',
    );
    assert.equal(created.id, 4);
    assert.equal(created.key, 'CACHE_TTL');
    assert.equal(created.value, '60');
    assert.equal(created.version, 1);
    assert.equal(mockData.auditRecords.at(-1)?.action, 'CREATE_CONFIGURATION');
  });

  it('rejects blank fields, normalized duplicate keys and non-admin roles', async () => {
    await assert.rejects(() =>
      adminConfigurationService.create(
        { key: ' ', value: ' ', status: 'ACTIVE' },
        'CMS_ADMIN',
        'cms-admin',
      ),
    );
    await assert.rejects(
      () =>
        adminConfigurationService.create(
          { key: 'tenant_share_default_rate', value: '50', status: 'ACTIVE' },
          'CMS_ADMIN',
          'cms-admin',
        ),
      /KEY_DUPLICATE/,
    );
    await assert.rejects(
      () =>
        adminConfigurationService.list(
          ADMIN_CONFIGURATION_DEFAULT_QUERY,
          'CMS_OPERATION',
        ),
      /FORBIDDEN/,
    );
  });

  it('updates only value/status with optimistic locking and immutable key', async () => {
    const updated = await adminConfigurationService.update(
      1,
      { key: 'TENANT_SHARE_DEFAULT_RATE', value: '45', status: 'INACTIVE' },
      1,
      'CMS_ADMIN',
      'cms-admin',
    );
    assert.equal(updated.value, '45');
    assert.equal(updated.version, 2);
    await assert.rejects(
      () =>
        adminConfigurationService.update(
          1,
          { key: 'OTHER', value: '45', status: 'ACTIVE' },
          2,
          'CMS_ADMIN',
          'cms-admin',
        ),
      /KEY_IMMUTABLE/,
    );
    await assert.rejects(
      () =>
        adminConfigurationService.update(
          1,
          { value: '45', status: 'ACTIVE' },
          1,
          'CMS_ADMIN',
          'cms-admin',
        ),
      /VERSION_CONFLICT/,
    );
  });

  it('masks sensitive values in audit before/after snapshots', async () => {
    await adminConfigurationService.update(
      3,
      { value: 'next-secret', status: 'ACTIVE' },
      1,
      'CMS_ADMIN',
      'cms-admin',
    );
    const audit = mockData.auditRecords.at(-1)!;
    assert.equal(audit.before?.value, '********');
    assert.equal(audit.after?.value, '********');
    assert.equal(JSON.stringify(audit).includes('next-secret'), false);
  });

  it('deletes only after the explicit service call and preserves a masked audit snapshot', async () => {
    await adminConfigurationService.remove(3, 'CMS_ADMIN', 'cms-admin');
    assert.equal(
      mockData.configurations.some(({ id }) => id === 3),
      false,
    );
    assert.equal(mockData.auditRecords.at(-1)?.before?.value, '********');
    await assert.rejects(
      () => adminConfigurationService.remove(1, 'CMS_FINANCE', 'cms-finance'),
      /FORBIDDEN/,
    );
  });

  it('resolves only Active runtime values immediately after changes', async () => {
    assert.equal(
      adminConfigurationService.getActiveValue(' tenant_share_default_rate '),
      '40',
    );
    await adminConfigurationService.update(
      1,
      { value: '45', status: 'INACTIVE' },
      1,
      'CMS_ADMIN',
      'cms-admin',
    );
    assert.equal(
      adminConfigurationService.getActiveValue('TENANT_SHARE_DEFAULT_RATE'),
      null,
    );
  });
});
