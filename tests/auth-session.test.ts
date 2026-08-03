import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { getSafePortalRedirect, mockAuthService } from '../src/shared/auth';
import { mockData, resetMockData } from '../src/shared/mocks/mock-data';

describe('mock portal authentication', () => {
  beforeEach(() => {
    resetMockData();
  });

  it('creates an ADMIN session with resolved permissions', async () => {
    const session = await mockAuthService.login({
      portalType: 'ADMIN',
      username: 'admin@cms.test',
      password: 'Admin123!',
    });

    assert.equal(session.portalType, 'ADMIN');
    assert.equal(session.roleCode, 'CMS_ADMIN');
    assert.equal(session.tenantId, undefined);
    assert.equal(session.permissions.includes('configuration.delete'), true);
  });

  it('authenticates all four ADMIN and four TENANT seed personas', async () => {
    for (const account of mockData.authAccounts) {
      const session = await mockAuthService.login({
        portalType: account.portalType,
        username: account.username,
        password: account.password,
      });

      assert.equal(session.portalType, account.portalType);
      assert.equal(session.roleCode, account.roleCode);
      assert.equal(session.tenantId, account.tenantId);
    }
  });

  it('rejects valid credentials submitted through the wrong portal', async () => {
    await assert.rejects(
      mockAuthService.login({
        portalType: 'TENANT',
        username: 'admin@cms.test',
        password: 'Admin123!',
      }),
      { message: 'INVALID_CREDENTIALS' },
    );
  });

  it('binds a TENANT session to the account tenant', async () => {
    const session = await mockAuthService.login({
      portalType: 'TENANT',
      username: 'admin@lotus.test',
      password: 'Tenant123!',
    });

    assert.equal(session.portalType, 'TENANT');
    assert.equal(session.roleCode, 'TENANT_ADMIN');
    assert.equal(session.tenantId, 'tenant-lotus');
    assert.equal(session.permissions.includes('roles.permissions'), true);
  });

  it('rejects a TENANT account when its tenant is inactive', async () => {
    const tenant = mockData.tenants.find((item) => item.id === 'tenant-lotus');
    assert.ok(tenant);
    tenant.status = 'INACTIVE';

    await assert.rejects(
      mockAuthService.login({
        portalType: 'TENANT',
        username: 'admin@lotus.test',
        password: 'Tenant123!',
      }),
      { message: 'TENANT_INACTIVE' },
    );
  });
});

describe('portal-safe redirects', () => {
  it('keeps redirects inside the authenticated portal namespace', () => {
    assert.equal(
      getSafePortalRedirect('/admin/brands?status=active', 'ADMIN'),
      '/admin/brands?status=active',
    );
    assert.equal(
      getSafePortalRedirect('/tenant/transactions', 'TENANT'),
      '/tenant/transactions',
    );
  });

  it('uses the portal dashboard for unsafe or cross-portal paths', () => {
    assert.equal(
      getSafePortalRedirect('/tenant/dashboard', 'ADMIN'),
      '/admin/dashboard',
    );
    assert.equal(
      getSafePortalRedirect('https://evil.example', 'TENANT'),
      '/tenant/dashboard',
    );
  });
});
