import { MenuConfig, MenuItem } from '@/shared/config/types';
import { UserRole } from './roles';

/**
 * Filter menu items based on user role
 */
export function filterMenuByRole(
  menu: MenuConfig,
  role: UserRole | null,
): MenuConfig {
  if (!role) return [];

  return menu
    .map((item) => filterMenuItem(item, role))
    .filter((item): item is MenuItem => item !== null);
}

/**
 * Filter a single menu item and its children
 */
function filterMenuItem(item: MenuItem, role: UserRole): MenuItem | null {
  // If item has required roles, check if user has one of them
  if (item.requiredRoles && item.requiredRoles.length > 0) {
    const hasRole = item.requiredRoles.includes(role);
    if (!hasRole) return null;
  }

  // If item has children, filter them recursively
  if (item.children && item.children.length > 0) {
    const filteredChildren = item.children
      .map((child) => filterMenuItem(child, role))
      .filter((child): child is MenuItem => child !== null);

    // If all children are filtered out, hide the parent too
    if (filteredChildren.length === 0) {
      return null;
    }

    return {
      ...item,
      children: filteredChildren,
    };
  }

  return item;
}

/**
 * Check if a path is accessible by a role
 */
export function isPathAccessible(
  path: string,
  menu: MenuConfig,
  role: UserRole | null,
): boolean {
  if (!role) return false;

  const filteredMenu = filterMenuByRole(menu, role);
  return hasPathInMenu(path, filteredMenu);
}

/**
 * Recursively check if a path exists in menu
 */
function hasPathInMenu(path: string, menu: MenuConfig): boolean {
  for (const item of menu) {
    if (item.path === path) return true;
    if (item.children && hasPathInMenu(path, item.children)) return true;
  }
  return false;
}
