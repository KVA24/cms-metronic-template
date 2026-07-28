import { MenuConfig, MenuItem } from '@/shared/config/types';
import { hasRequiredRole, UserRole } from './roles';

/**
 * Filter menu items based on user role
 */
export function filterMenuByRoles(
  menu: MenuConfig,
  roles: UserRole[],
): MenuConfig {
  if (roles.length === 0) return [];

  return menu
    .map((item) => filterMenuItem(item, roles))
    .filter((item): item is MenuItem => item !== null);
}

/**
 * Filter a single menu item and its children
 */
function filterMenuItem(item: MenuItem, roles: UserRole[]): MenuItem | null {
  // If item has required roles, check if user has one of them
  if (item.requiredRoles && item.requiredRoles.length > 0) {
    if (!hasRequiredRole(roles, item.requiredRoles)) return null;
  }

  // If item has children, filter them recursively
  if (item.children && item.children.length > 0) {
    const filteredChildren = item.children
      .map((child) => filterMenuItem(child, roles))
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
