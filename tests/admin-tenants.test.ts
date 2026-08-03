import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { adminTenantService } from '../src/features/admin/tenants/api/admin-tenant-service';
import {
  ADMIN_TENANT_DEFAULT_QUERY,
  adminTenantSchema,
  readAdminTenantQuery,
  writeAdminTenantQuery,
} from '../src/features/admin/tenants/model/admin-tenant';
import { mockData, resetMockData } from '../src/shared/mocks/mock-data';

const validTenantInput = {
  code: 'sky_rewards',
  name: 'Sky Rewards',
  status: 'DRAFT' as const,
  accountOwner: 'Nguyen Minh',
  notes: 'Pilot tenant',
  contactName: 'Mai Anh',
  contactTitle: 'Loyalty Manager',
  contactEmail: 'mai@sky.test',
  contactPhone: '+84 (90) 123-4567',
};

describe('ADMIN Tenant list service', () => {
  beforeEach(() => resetMockData());

  it('returns updated-descending rows with shared-data counts', async () => {
    const result = await adminTenantService.listTenants(
      ADMIN_TENANT_DEFAULT_QUERY,
      'CMS_OPERATION',
    );
    assert.deepEqual(
      result.items.map(({ code }) => code),
      ['LOTUS', 'BAMBOO'],
    );
    assert.deepEqual(
      result.items.map(({ brandCount, offerCount }) => ({
        brandCount,
        offerCount,
      })),
      [
        { brandCount: 1, offerCount: 1 },
        { brandCount: 1, offerCount: 1 },
      ],
    );
  });

  it('searches Tenant ID, code and name case-insensitively', async () => {
    for (const keyword of ['tenant-lotus', 'LOTUS', 'rewards']) {
      const result = await adminTenantService.listTenants(
        { ...ADMIN_TENANT_DEFAULT_QUERY, keyword },
        'CMS_ADMIN',
      );
      assert.deepEqual(result.items.map(({ code }) => code), ['LOTUS']);
    }
  });

  it('combines status, owner and updated-period filters', async () => {
    const result = await adminTenantService.listTenants(
      {
        ...ADMIN_TENANT_DEFAULT_QUERY,
        status: 'ACTIVE',
        accountOwner: 'Nguyen Minh',
        updatedPeriod: '7_DAYS',
      },
      'CMS_ADMIN',
    );
    assert.deepEqual(result.items.map(({ code }) => code), ['LOTUS']);
  });

  it('round-trips supported URL filters and normalizes invalid values', () => {
    const query = {
      ...ADMIN_TENANT_DEFAULT_QUERY,
      page: 2,
      pageSize: 10,
      keyword: ' lotus ',
      status: 'ACTIVE' as const,
      accountOwner: 'Nguyen Minh',
      updatedPeriod: '30_DAYS' as const,
    };
    assert.deepEqual(readAdminTenantQuery(writeAdminTenantQuery(query)), {
      ...query,
      keyword: 'lotus',
    });
    assert.deepEqual(
      readAdminTenantQuery(
        new URLSearchParams('page=-1&pageSize=99&status=NOPE&updatedPeriod=X'),
      ),
      ADMIN_TENANT_DEFAULT_QUERY,
    );
  });

  it('fails closed without tenants.view', async () => {
    await assert.rejects(
      adminTenantService.listTenants(
        ADMIN_TENANT_DEFAULT_QUERY,
        'CMS_FINANCE',
      ),
      /FORBIDDEN/,
    );
  });
});

describe('ADMIN Tenant create service', () => {
  beforeEach(() => resetMockData());

  it('validates required, code, email and phone fields', () => {
    const result = adminTenantSchema.safeParse({
      ...validTenantInput,
      code: 'bad code!',
      name: '',
      contactEmail: 'invalid',
      contactPhone: 'call-me',
    });
    assert.equal(result.success, false);
    if (!result.success)
      assert.deepEqual(
        new Set(result.error.issues.map(({ message }) => message)),
        new Set([
          'TENANT_CODE_INVALID',
          'TENANT_NAME_REQUIRED',
          'CONTACT_EMAIL_INVALID',
          'CONTACT_PHONE_INVALID',
        ]),
      );
  });

  it('creates a deterministic Tenant without cascading related data', async () => {
    const before = {
      accounts: mockData.authAccounts.length,
      assignments: mockData.tenantBrandAssignments.length,
    };
    const tenant = await adminTenantService.createTenant(
      validTenantInput,
      'CMS_OPERATION',
      'cms-operation',
    );
    assert.equal(tenant.id, 'tenant-sky-rewards');
    assert.equal(tenant.code, 'SKY_REWARDS');
    assert.equal(tenant.version, 1);
    assert.deepEqual(
      {
        accounts: mockData.authAccounts.length,
        assignments: mockData.tenantBrandAssignments.length,
      },
      before,
    );
    assert.equal(mockData.auditRecords.at(-1)?.action, 'CREATE_TENANT');
  });

  it('rejects duplicate codes case-insensitively and unauthorized roles', async () => {
    await assert.rejects(
      adminTenantService.createTenant(
        { ...validTenantInput, code: 'lotus' },
        'CMS_ADMIN',
        'cms-admin',
      ),
      /TENANT_CODE_DUPLICATE/,
    );
    await assert.rejects(
      adminTenantService.createTenant(
        validTenantInput,
        'CMS_FINANCE',
        'cms-finance',
      ),
      /FORBIDDEN/,
    );
  });
});
