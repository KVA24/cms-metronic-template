import { matchPath } from 'react-router-dom';
import type { PermissionCode } from '../../shared/permissions';

interface PortalRoutePermission {
  path: string;
  permissions: readonly PermissionCode[];
}

const portalRoutePermissions: readonly PortalRoutePermission[] = [
  { path: '/admin/dashboard', permissions: ['dashboard.view'] },
  { path: '/admin/access/roles', permissions: ['rbac.view'] },
  { path: '/admin/categories/new', permissions: ['categories.create'] },
  {
    path: '/admin/categories/:categoryId/edit',
    permissions: ['categories.edit'],
  },
  {
    path: '/admin/categories/:categoryId',
    permissions: ['categories.view'],
  },
  { path: '/admin/categories', permissions: ['categories.view'] },
  { path: '/admin/brands/new', permissions: ['brands.create'] },
  {
    path: '/admin/brands/:brandId/offers/new',
    permissions: ['brands.create'],
  },
  {
    path: '/admin/brands/:brandId/offers/:offerId/edit',
    permissions: ['brands.edit'],
  },
  {
    path: '/admin/brands/:brandId/offers/:offerId',
    permissions: ['brands.view'],
  },
  {
    path: '/admin/brands/:brandId/offers',
    permissions: ['brands.view'],
  },
  {
    path: '/admin/brands/:brandId/categories',
    permissions: ['brands.view'],
  },
  { path: '/admin/brands/:brandId', permissions: ['brands.view'] },
  { path: '/admin/brands', permissions: ['brands.view'] },
  { path: '/admin/tenants/new', permissions: ['tenants.create'] },
  {
    path: '/admin/tenants/:tenantId/accounts/new',
    permissions: ['tenants.accounts.create'],
  },
  {
    path: '/admin/tenants/:tenantId/accounts/:accountId/edit',
    permissions: ['tenants.accounts.edit'],
  },
  {
    path: '/admin/tenants/:tenantId/accounts',
    permissions: ['tenants.accounts.view'],
  },
  {
    path: '/admin/tenants/:tenantId/assignments',
    permissions: ['tenants.assignments.view'],
  },
  {
    path: '/admin/tenants/:tenantId/revenue-share/:brandId',
    permissions: ['tenants.revenue_share.edit'],
  },
  {
    path: '/admin/tenants/:tenantId/revenue-share',
    permissions: ['tenants.revenue_share.view'],
  },
  { path: '/admin/tenants/:tenantId', permissions: ['tenants.view'] },
  { path: '/admin/tenants', permissions: ['tenants.view'] },
  { path: '/admin/configuration', permissions: ['configuration.view'] },
  {
    path: '/admin/transactions/:transactionId',
    permissions: ['transactions.view'],
  },
  { path: '/admin/transactions', permissions: ['transactions.view'] },
  {
    path: '/admin/exceptions/:exceptionId',
    permissions: ['exceptions.view'],
  },
  { path: '/admin/exceptions', permissions: ['exceptions.view'] },
  { path: '/tenant/dashboard', permissions: ['dashboard.view'] },
  { path: '/tenant/assigned-brands', permissions: ['brands.view'] },
  {
    path: '/tenant/earn-display/:brandId',
    permissions: ['earn_display.create', 'earn_display.edit'],
  },
  { path: '/tenant/earn-display', permissions: ['earn_display.view'] },
  {
    path: '/tenant/transactions/:transactionId',
    permissions: ['transactions.view'],
  },
  { path: '/tenant/transactions', permissions: ['transactions.view'] },
  { path: '/tenant/account/roles/new', permissions: ['roles.create'] },
  {
    path: '/tenant/account/roles/:roleId/permissions',
    permissions: ['roles.permissions'],
  },
  {
    path: '/tenant/account/roles/:roleId/edit',
    permissions: ['roles.edit'],
  },
  { path: '/tenant/account/roles/:roleId', permissions: ['roles.view'] },
  { path: '/tenant/account/roles', permissions: ['roles.view'] },
  { path: '/tenant/account/users/new', permissions: ['users.create'] },
  {
    path: '/tenant/account/users/:userId/edit',
    permissions: ['users.edit'],
  },
  { path: '/tenant/account/users/:userId', permissions: ['users.view'] },
  { path: '/tenant/account/users', permissions: ['users.view'] },
  { path: '/tenant/account/profile', permissions: ['profile.view'] },
];

export function getRequiredPermissionsForPath(
  pathname: string,
): readonly PermissionCode[] {
  return (
    portalRoutePermissions.find(({ path }) =>
      matchPath({ path, end: true }, pathname),
    )?.permissions ?? []
  );
}

export function canAccessPortalRoute(
  pathname: string,
  permissions: Iterable<PermissionCode>,
): boolean {
  const requiredPermissions = getRequiredPermissionsForPath(pathname);
  if (requiredPermissions.length === 0) return true;

  const permissionSet = new Set(permissions);
  return requiredPermissions.some((permission) =>
    permissionSet.has(permission),
  );
}
