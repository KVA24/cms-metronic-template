import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canAccessPortalRoute,
  getRequiredPermissionsForPath,
} from '../src/app/routing/portal-route-permissions';
import { getPermissionsForRole } from '../src/shared/permissions';

describe('portal route permissions', () => {
  it('matches specific create/edit routes before dynamic detail routes', () => {
    assert.deepEqual(getRequiredPermissionsForPath('/admin/categories/new'), [
      'categories.create',
    ]);
    assert.deepEqual(
      getRequiredPermissionsForPath('/admin/categories/category-1/edit'),
      ['categories.edit'],
    );
    assert.deepEqual(
      getRequiredPermissionsForPath('/tenant/account/roles/role-1/permissions'),
      ['roles.permissions'],
    );
    assert.deepEqual(
      getRequiredPermissionsForPath(
        '/admin/tenants/tenant-1/accounts/account-1/edit',
      ),
      ['tenants.accounts.edit'],
    );
  });

  it('denies direct feature routes before feature components mount', () => {
    assert.equal(
      canAccessPortalRoute(
        '/admin/categories',
        getPermissionsForRole('CMS_CSKH'),
      ),
      false,
    );
    assert.equal(
      canAccessPortalRoute(
        '/admin/transactions/txn-1',
        getPermissionsForRole('CMS_CSKH'),
      ),
      true,
    );
    assert.equal(
      canAccessPortalRoute(
        '/tenant/account/users',
        getPermissionsForRole('TENANT_MARKETING_OPS'),
      ),
      false,
    );
  });

  it('allows either applicable action on combined routes', () => {
    assert.equal(
      canAccessPortalRoute(
        '/tenant/earn-display/brand-1',
        new Set(['earn_display.create']),
      ),
      true,
    );
  });

  it('enforces direct TENANT routes for all four system roles', () => {
    assert.equal(
      canAccessPortalRoute(
        '/tenant/account/roles',
        getPermissionsForRole('TENANT_ADMIN'),
      ),
      true,
    );
    assert.equal(
      canAccessPortalRoute(
        '/tenant/dashboard',
        getPermissionsForRole('TENANT_MARKETING_OPS'),
      ),
      false,
    );
    assert.equal(
      canAccessPortalRoute(
        '/tenant/earn-display/brand-1',
        getPermissionsForRole('TENANT_VIEWER'),
      ),
      false,
    );
    assert.equal(
      canAccessPortalRoute(
        '/tenant/account/users',
        getPermissionsForRole('TENANT_FINANCE'),
      ),
      false,
    );
  });
});
