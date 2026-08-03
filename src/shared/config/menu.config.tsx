import {
  Building2,
  ChartNoAxesCombined,
  CircleDollarSign,
  FolderTree,
  KeyRound,
  ReceiptText,
  Settings,
  ShieldAlert,
  Store,
  UsersRound,
} from 'lucide-react';
import type { PortalType } from '../contracts';
import { filterMenuByPermissions } from '../lib/rbac/menu-filter';
import type { PermissionCode } from '../permissions';
import type { MenuConfig } from './types';

export const ADMIN_MENU_SIDEBAR: MenuConfig = [
  {
    title: 'Dashboard',
    translationKey: 'SIDEBAR.DASHBOARD',
    icon: ChartNoAxesCombined,
    path: '/admin/dashboard',
    requiredPermission: 'dashboard.view',
  },
  {
    title: 'Access Control',
    translationKey: 'SIDEBAR.ACCESS_CONTROL',
    icon: KeyRound,
    path: '/admin/access/roles',
    requiredPermission: 'rbac.view',
  },
  {
    title: 'Categories',
    translationKey: 'SIDEBAR.CATEGORIES',
    icon: FolderTree,
    path: '/admin/categories',
    requiredPermission: 'categories.view',
  },
  {
    title: 'Brands',
    translationKey: 'SIDEBAR.BRANDS',
    icon: Store,
    path: '/admin/brands',
    requiredPermission: 'brands.view',
  },
  {
    title: 'Tenants',
    translationKey: 'SIDEBAR.TENANTS',
    icon: Building2,
    path: '/admin/tenants',
    requiredPermission: 'tenants.view',
  },
  {
    title: 'Configuration',
    translationKey: 'SIDEBAR.CONFIGURATION',
    icon: Settings,
    path: '/admin/configuration',
    requiredPermission: 'configuration.view',
  },
  {
    title: 'Transactions',
    translationKey: 'SIDEBAR.TRANSACTIONS',
    icon: ReceiptText,
    path: '/admin/transactions',
    requiredPermission: 'transactions.view',
  },
  {
    title: 'Exceptions',
    translationKey: 'SIDEBAR.EXCEPTIONS',
    icon: ShieldAlert,
    path: '/admin/exceptions',
    requiredPermission: 'exceptions.view',
  },
];

export const TENANT_MENU_SIDEBAR: MenuConfig = [
  {
    title: 'Dashboard',
    translationKey: 'SIDEBAR.DASHBOARD',
    icon: ChartNoAxesCombined,
    path: '/tenant/dashboard',
    requiredPermission: 'dashboard.view',
  },
  {
    title: 'Assigned Brands',
    translationKey: 'SIDEBAR.ASSIGNED_BRANDS',
    icon: Store,
    path: '/tenant/assigned-brands',
    requiredPermission: 'brands.view',
  },
  {
    title: 'Earn Display',
    translationKey: 'SIDEBAR.EARN_DISPLAY',
    icon: CircleDollarSign,
    path: '/tenant/earn-display',
    requiredPermission: 'earn_display.view',
  },
  {
    title: 'Transactions',
    translationKey: 'SIDEBAR.TRANSACTIONS',
    icon: ReceiptText,
    path: '/tenant/transactions',
    requiredPermission: 'transactions.view',
  },
  {
    title: 'Account Management',
    translationKey: 'SIDEBAR.ACCOUNT_MANAGEMENT',
    icon: UsersRound,
    children: [
      {
        title: 'Roles',
        translationKey: 'SIDEBAR.ROLES',
        path: '/tenant/account/roles',
        requiredPermission: 'roles.view',
      },
      {
        title: 'Users',
        translationKey: 'SIDEBAR.USERS',
        path: '/tenant/account/users',
        requiredPermission: 'users.view',
      },
      {
        title: 'Profile',
        translationKey: 'SIDEBAR.PROFILE',
        path: '/tenant/account/profile',
        requiredPermission: 'profile.view',
      },
    ],
  },
];

export function getPortalMenu(portalType: PortalType): MenuConfig {
  return portalType === 'ADMIN' ? ADMIN_MENU_SIDEBAR : TENANT_MENU_SIDEBAR;
}

function findFirstPath(menu: MenuConfig): string | null {
  for (const item of menu) {
    if (item.path) return item.path;
    if (item.children) {
      const childPath = findFirstPath(item.children);
      if (childPath) return childPath;
    }
  }
  return null;
}

export function getFirstPermittedPath(
  portalType: PortalType,
  permissions: Iterable<PermissionCode>,
): string {
  const filteredMenu = filterMenuByPermissions(
    getPortalMenu(portalType),
    permissions,
  );

  return findFirstPath(filteredMenu) ?? '/error/403';
}
