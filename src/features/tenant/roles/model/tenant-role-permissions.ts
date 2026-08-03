import type { MockAuthAccount, TenantRole } from '../../../../shared/contracts';
import { TENANT_PERMISSION_CATALOG, type PermissionCode } from '../../../../shared/permissions';

export const TENANT_PERMISSION_MODULES = [
  { code: 'DASHBOARD', label: 'Dashboard', actions: ['dashboard.view'] },
  { code: 'BRANDS', label: 'Assigned Brands', actions: ['brands.view', 'brands.edit'] },
  { code: 'EARN_DISPLAY', label: 'Earn Display', actions: ['earn_display.view', 'earn_display.create', 'earn_display.edit'] },
  { code: 'TRANSACTIONS', label: 'Transactions', actions: ['transactions.view', 'transactions.export'] },
  { code: 'ROLES', label: 'Roles', actions: ['roles.view', 'roles.create', 'roles.edit', 'roles.delete_disable', 'roles.permissions'] },
  { code: 'USERS', label: 'Accounts', actions: ['users.view', 'users.create', 'users.edit', 'users.delete_disable'] },
  { code: 'PROFILE', label: 'Profile', actions: ['profile.view', 'profile.edit'] },
] as const satisfies ReadonlyArray<{ code: string; label: string; actions: readonly PermissionCode[] }>;

export function getModuleSelection(actions: readonly PermissionCode[], selected: readonly PermissionCode[]) {
  const selectedCount = actions.filter((action) => selected.includes(action)).length;
  return { selectedCount, full: selectedCount === actions.length, indeterminate: selectedCount > 0 && selectedCount < actions.length };
}

export function getPermissionCoverage(selected: readonly PermissionCode[]) {
  return TENANT_PERMISSION_MODULES.filter(({ actions }) => getModuleSelection(actions, selected).full).length;
}

export function isValidTenantPermissionSet(selected: readonly string[]): selected is PermissionCode[] {
  const catalog = new Set<string>(TENANT_PERMISSION_CATALOG);
  return selected.every((permission) => catalog.has(permission));
}

export function getAssignedUserCount(roleId: string, accounts: readonly MockAuthAccount[]) {
  return accounts.filter(({ portalType, tenantRoleId }) => portalType === 'TENANT' && tenantRoleId === roleId).length;
}

const managementPermissions: PermissionCode[] = ['roles.permissions', 'users.edit'];

export function wouldRemoveLastTenantAdministrator(role: TenantRole, nextPermissions: readonly PermissionCode[], roles: readonly TenantRole[], accounts: readonly MockAuthAccount[]) {
  const effectivePermissions = (candidate: TenantRole) => candidate.id === role.id ? nextPermissions : candidate.permissions;
  return !accounts.some((account) => {
    if (account.portalType !== 'TENANT' || account.tenantId !== role.tenantId || account.status !== 'ACTIVE' || !account.tenantRoleId) return false;
    const assignedRole = roles.find(({ id, tenantId, status }) => id === account.tenantRoleId && tenantId === role.tenantId && status === 'ACTIVE');
    return Boolean(assignedRole && managementPermissions.every((permission) => effectivePermissions(assignedRole).includes(permission)));
  });
}
