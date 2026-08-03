import type { MenuConfig, MenuItem } from '../../config/types';
import type { PermissionCode } from '../../permissions';

export function filterMenuByPermissions(
  menu: MenuConfig,
  permissions: Iterable<PermissionCode>,
): MenuConfig {
  const permissionSet = new Set(permissions);

  return menu
    .map((item) => filterMenuItemByPermission(item, permissionSet))
    .filter((item): item is MenuItem => item !== null);
}

function filterMenuItemByPermission(
  item: MenuItem,
  permissions: ReadonlySet<PermissionCode>,
): MenuItem | null {
  if (item.requiredPermission && !permissions.has(item.requiredPermission)) {
    return null;
  }

  if (!item.children) return item;

  const children = item.children
    .map((child) => filterMenuItemByPermission(child, permissions))
    .filter((child): child is MenuItem => child !== null);

  return children.length > 0 ? { ...item, children } : null;
}
