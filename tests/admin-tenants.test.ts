import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { adminTenantService } from '../src/features/admin/tenants/api/admin-tenant-service';
import { adminTenantAccountService } from '../src/features/admin/tenants/api/admin-tenant-account-service';
import { adminTenantAssignmentService } from '../src/features/admin/tenants/api/admin-tenant-assignment-service';
import { ADMIN_TENANT_ASSIGNMENT_DEFAULT_QUERY } from '../src/features/admin/tenants/model/admin-tenant-assignment';
import {
  ADMIN_TENANT_ACCOUNT_DEFAULT_QUERY,
  adminTenantAccountCreateSchema,
} from '../src/features/admin/tenants/model/admin-tenant-account';
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

describe('ADMIN Tenant detail, edit and deactivate service', () => {
  beforeEach(() => resetMockData());

  it('returns dependencies and locks a code once related data exists', async () => {
    const detail = await adminTenantService.getTenant(
      'tenant-lotus',
      'CMS_OPERATION',
    );
    assert.deepEqual(detail.dependencies, {
      accountCount: 3,
      assignmentCount: 1,
      transactionCount: 1,
      canHardDelete: false,
    });
    assert.equal(detail.codeLocked, true);
    assert.equal(detail.canDeactivate, true);
  });

  it('updates valid data with optimistic versioning and audit', async () => {
    const current = mockData.tenants[0];
    const updated = await adminTenantService.updateTenant(
      current.id,
      { ...validTenantInput, code: current.code, name: 'Lotus Rewards Plus' },
      current.version,
      'CMS_ADMIN',
      'cms-admin',
    );
    assert.equal(updated.name, 'Lotus Rewards Plus');
    assert.equal(updated.version, 2);
    assert.equal(mockData.auditRecords.at(-1)?.action, 'UPDATE_TENANT');
    await assert.rejects(
      adminTenantService.updateTenant(
        current.id,
        { ...validTenantInput, code: current.code },
        1,
        'CMS_ADMIN',
        'cms-admin',
      ),
      /VERSION_CONFLICT/,
    );
  });

  it('blocks a linked Tenant code change', async () => {
    const current = mockData.tenants[0];
    await assert.rejects(
      adminTenantService.updateTenant(
        current.id,
        { ...validTenantInput, code: 'NEW_CODE' },
        current.version,
        'CMS_OPERATION',
        'cms-operation',
      ),
      /TENANT_CODE_LOCKED/,
    );
  });

  it('soft-deactivates without deleting dependent history', async () => {
    const before = {
      accounts: mockData.authAccounts.length,
      assignments: mockData.tenantBrandAssignments.length,
      transactions: mockData.transactions.length,
    };
    const tenant = await adminTenantService.deactivateTenant(
      'tenant-lotus',
      'CMS_OPERATION',
      'cms-operation',
    );
    assert.equal(tenant.status, 'INACTIVE');
    assert.deepEqual(
      {
        accounts: mockData.authAccounts.length,
        assignments: mockData.tenantBrandAssignments.length,
        transactions: mockData.transactions.length,
      },
      before,
    );
    assert.equal(mockData.auditRecords.at(-1)?.action, 'DEACTIVATE_TENANT');
  });

  it('enforces view and edit permissions', async () => {
    await assert.rejects(
      adminTenantService.getTenant('tenant-lotus', 'CMS_FINANCE'),
      /FORBIDDEN/,
    );
    await assert.rejects(
      adminTenantService.deactivateTenant(
        'tenant-lotus',
        'CMS_FINANCE',
        'cms-finance',
      ),
      /FORBIDDEN/,
    );
  });
});

const validAccountInput = {
  username: 'ops_user',
  fullName: 'Operations User',
  email: 'ops.user@lotus.test',
  phone: '+84901234567',
  roleCode: 'TENANT_MARKETING_OPS' as const,
  status: 'ACTIVE' as const,
  password: 'Tenant123!',
  confirmPassword: 'Tenant123!',
};

describe('ADMIN Tenant Portal account service', () => {
  beforeEach(() => resetMockData());

  it('lists only the current Tenant and supports combined filters', async () => {
    const result = await adminTenantAccountService.listAccounts(
      'tenant-lotus',
      {
        ...ADMIN_TENANT_ACCOUNT_DEFAULT_QUERY,
        keyword: 'marketing',
        roleCode: 'TENANT_MARKETING_OPS',
        status: 'ACTIVE',
      },
      'CMS_OPERATION',
    );
    assert.deepEqual(result.items.map(({ username }) => username), [
      'marketing@lotus.test',
    ]);
    assert.equal(result.items.every(({ tenantId }) => tenantId === 'tenant-lotus'), true);
    assert.equal(result.items[0].createdSource, 'TENANT_PORTAL');
  });

  it('never exposes a password in list or detail DTOs', async () => {
    const list = await adminTenantAccountService.listAccounts(
      'tenant-lotus',
      ADMIN_TENANT_ACCOUNT_DEFAULT_QUERY,
      'CMS_ADMIN',
    );
    const detail = await adminTenantAccountService.getAccount(
      'tenant-lotus',
      list.items[0].id,
      'CMS_ADMIN',
    );
    assert.equal('password' in list.items[0], false);
    assert.equal('password' in detail, false);
    await assert.rejects(
      adminTenantAccountService.getAccount(
        'tenant-bamboo',
        list.items[0].id,
        'CMS_ADMIN',
      ),
      /ACCOUNT_NOT_FOUND/,
    );
  });

  it('validates username, email, phone and password policy', () => {
    const result = adminTenantAccountCreateSchema.safeParse({
      ...validAccountInput,
      username: 'bad user',
      email: 'invalid',
      phone: '+84 90',
      password: 'weak',
      confirmPassword: 'different',
    });
    assert.equal(result.success, false);
    if (!result.success)
      assert.equal(
        ['USERNAME_INVALID', 'EMAIL_INVALID', 'PHONE_INVALID', 'PASSWORD_POLICY', 'PASSWORD_MISMATCH'].every(
          (code) => result.error.issues.some(({ message }) => message === code),
        ),
        true,
      );
  });

  it('enforces first Admin Tenant and per-Tenant normalized username uniqueness', async () => {
    const bamboo = await adminTenantAccountService.listAccounts(
      'tenant-bamboo',
      ADMIN_TENANT_ACCOUNT_DEFAULT_QUERY,
      'CMS_ADMIN',
    );
    assert.equal(bamboo.requiresFirstAdmin, true);
    await assert.rejects(
      adminTenantAccountService.createAccount(
        'tenant-bamboo',
        validAccountInput,
        'CMS_ADMIN',
        'cms-admin',
      ),
      /FIRST_ACCOUNT_ADMIN_REQUIRED/,
    );
    const created = await adminTenantAccountService.createAccount(
      'tenant-bamboo',
      { ...validAccountInput, roleCode: 'TENANT_ADMIN' },
      'CMS_ADMIN',
      'cms-admin',
    );
    assert.equal(created.roleCode, 'TENANT_ADMIN');
    await assert.rejects(
      adminTenantAccountService.createAccount(
        'tenant-bamboo',
        { ...validAccountInput, username: ' OPS_USER ' },
        'CMS_ADMIN',
        'cms-admin',
      ),
      /USERNAME_DUPLICATE/,
    );
    const sameUsernameOtherTenant = await adminTenantAccountService.createAccount(
      'tenant-lotus',
      validAccountInput,
      'CMS_ADMIN',
      'cms-admin',
    );
    assert.equal(sameUsernameOtherTenant.tenantId, 'tenant-lotus');
  });

  it('updates fields, keeps username immutable and audits session invalidation', async () => {
    const current = mockData.authAccounts.find(({ id }) => id === 'tenant-marketing')!;
    const updated = await adminTenantAccountService.updateAccount(
      'tenant-lotus',
      current.id,
      {
        fullName: 'Marketing Lead',
        email: 'lead@lotus.test',
        phone: '+84999888777',
        roleCode: 'TENANT_VIEWER',
        status: 'LOCKED',
        password: 'NewTenant123!',
        confirmPassword: 'NewTenant123!',
      },
      current.version,
      'CMS_OPERATION',
      'cms-operation',
    );
    assert.equal(updated.username, 'marketing@lotus.test');
    assert.equal(updated.status, 'LOCKED');
    assert.equal(
      mockData.auditRecords.at(-1)?.action,
      'UPDATE_TENANT_ACCOUNT_AND_INVALIDATE_SESSION',
    );
  });

  it('blocks disabling the final Active Admin Tenant and soft-disables other users', async () => {
    await assert.rejects(
      adminTenantAccountService.disableAccount(
        'tenant-lotus',
        'tenant-admin',
        'CMS_ADMIN',
        'cms-admin',
      ),
      /LAST_ACTIVE_ADMIN/,
    );
    const count = mockData.authAccounts.length;
    const disabled = await adminTenantAccountService.disableAccount(
      'tenant-lotus',
      'tenant-viewer',
      'CMS_OPERATION',
      'cms-operation',
    );
    assert.equal(disabled.status, 'INACTIVE');
    assert.equal(mockData.authAccounts.length, count);
  });

  it('enforces account permissions', async () => {
    await assert.rejects(
      adminTenantAccountService.listAccounts(
        'tenant-lotus',
        ADMIN_TENANT_ACCOUNT_DEFAULT_QUERY,
        'CMS_FINANCE',
      ),
      /FORBIDDEN/,
    );
  });
});

describe('ADMIN Tenant Brand/Offer assignment service', () => {
  beforeEach(() => resetMockData());

  it('projects assignment scope, active Offers and Brand categories', async () => {
    const result = await adminTenantAssignmentService.listAssignments(
      'tenant-lotus',
      ADMIN_TENANT_ASSIGNMENT_DEFAULT_QUERY,
      'CMS_OPERATION',
    );
    const foodnest = result.rows.find(({ brand }) => brand.code === 'FOODNEST')!;
    assert.equal(foodnest.scope, 'ALL_ACTIVE');
    assert.deepEqual(foodnest.assignedOfferIds, ['offer-foodnest-new-user']);
    assert.equal(foodnest.categories.length, 1);
  });

  it('filters Brand ID/name, status, category and assignment with AND semantics', async () => {
    const result = await adminTenantAssignmentService.listAssignments(
      'tenant-lotus',
      {
        keyword: 'foodnest',
        brandStatus: 'ACTIVE',
        categoryId: 'category-food-dining',
        assignment: 'ASSIGNED',
      },
      'CMS_ADMIN',
    );
    assert.deepEqual(result.rows.map(({ brand }) => brand.code), ['FOODNEST']);
  });

  it('assigns all active Offers by explicit draft and supports a custom pool', async () => {
    await adminTenantAssignmentService.saveAssignments(
      'tenant-lotus',
      [{ brandId: 'brand-travelgo', assigned: true, offerIds: ['offer-travelgo-summer'] }],
      'CMS_OPERATION',
      'cms-operation',
    );
    let assignment = mockData.tenantBrandAssignments.find(
      ({ tenantId, brandId }) => tenantId === 'tenant-lotus' && brandId === 'brand-travelgo',
    );
    assert.deepEqual(assignment?.offerIds, ['offer-travelgo-summer']);
    await adminTenantAssignmentService.saveAssignments(
      'tenant-lotus',
      [{ brandId: 'brand-travelgo', assigned: true, offerIds: [] }],
      'CMS_OPERATION',
      'cms-operation',
    );
    assignment = mockData.tenantBrandAssignments.find(
      ({ tenantId, brandId }) => tenantId === 'tenant-lotus' && brandId === 'brand-travelgo',
    );
    assert.deepEqual(assignment?.offerIds, []);
    assert.equal(mockData.auditRecords.at(-1)?.action, 'SAVE_TENANT_ASSIGNMENTS');
  });

  it('saves atomically and rejects inactive Tenant, Brand or Offer IDs', async () => {
    const before = structuredClone(mockData.tenantBrandAssignments);
    await assert.rejects(
      adminTenantAssignmentService.saveAssignments(
        'tenant-lotus',
        [
          { brandId: 'brand-travelgo', assigned: true, offerIds: ['offer-travelgo-summer'] },
          { brandId: 'brand-stylehub', assigned: true, offerIds: [] },
        ],
        'CMS_ADMIN',
        'cms-admin',
      ),
      /BRAND_NOT_ACTIVE/,
    );
    assert.deepEqual(mockData.tenantBrandAssignments, before);
    mockData.tenants[0].status = 'INACTIVE';
    await assert.rejects(
      adminTenantAssignmentService.saveAssignments(
        'tenant-lotus',
        [{ brandId: 'brand-travelgo', assigned: true, offerIds: ['offer-travelgo-summer'] }],
        'CMS_ADMIN',
        'cms-admin',
      ),
      /TENANT_NOT_ACTIVE/,
    );
  });

  it('enforces assignment permissions', async () => {
    await assert.rejects(
      adminTenantAssignmentService.listAssignments(
        'tenant-lotus',
        ADMIN_TENANT_ASSIGNMENT_DEFAULT_QUERY,
        'CMS_FINANCE',
      ),
      /FORBIDDEN/,
    );
  });
});
