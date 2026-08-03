import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getFirstPermittedPath,
  getPortalMenu,
} from '../src/shared/config/menu.config';
import { filterMenuByPermissions } from '../src/shared/lib/rbac/menu-filter';
import { getPermissionsForRole } from '../src/shared/permissions';

function flattenPaths(items: ReturnType<typeof getPortalMenu>): string[] {
  return items.flatMap((item) => [
    ...(item.path ? [item.path] : []),
    ...(item.children ? flattenPaths(item.children) : []),
  ]);
}

describe('portal menu permissions', () => {
  it('shows only transaction navigation to CMS_CSKH', () => {
    const permissions = getPermissionsForRole('CMS_CSKH');
    const menu = filterMenuByPermissions(getPortalMenu('ADMIN'), permissions);

    assert.deepEqual(flattenPaths(menu), ['/admin/transactions']);
    assert.equal(
      getFirstPermittedPath('ADMIN', permissions),
      '/admin/transactions',
    );
  });

  it('uses the dashboard as the CMS_ADMIN landing route', () => {
    const permissions = getPermissionsForRole('CMS_ADMIN');

    assert.equal(
      getFirstPermittedPath('ADMIN', permissions),
      '/admin/dashboard',
    );
    assert.equal(
      flattenPaths(
        filterMenuByPermissions(getPortalMenu('ADMIN'), permissions),
      ).includes('/admin/exceptions'),
      true,
    );
  });

  it('gives Tenant Marketing only its permitted modules', () => {
    const permissions = getPermissionsForRole('TENANT_MARKETING_OPS');
    const paths = flattenPaths(
      filterMenuByPermissions(getPortalMenu('TENANT'), permissions),
    );

    assert.deepEqual(paths, [
      '/tenant/assigned-brands',
      '/tenant/earn-display',
      '/tenant/account/profile',
    ]);
    assert.equal(
      getFirstPermittedPath('TENANT', permissions),
      '/tenant/assigned-brands',
    );
  });
});
