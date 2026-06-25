import { UserRole } from '@/shared/lib/rbac/roles';
import { ClipboardList, LayoutGrid, Settings, Users } from 'lucide-react';
import { type MenuConfig } from './types';

export const MENU_SIDEBAR: MenuConfig = [
  {
    title: 'Dashboards',
    translationKey: 'SIDEBAR.DASHBOARDS',
    icon: LayoutGrid,
    path: '/dashboards',
    requiredRoles: [UserRole.ADMIN, UserRole.OPERATOR],
  },
  {
    title: 'Configuration',
    translationKey: 'SIDEBAR.CONFIGURATION',
    icon: Settings,
    path: '/config',
    requiredRoles: [UserRole.ADMIN],
  },
  {
    title: 'Account',
    translationKey: 'SIDEBAR.ACCOUNT',
    icon: Users,
    path: '/account',
    requiredRoles: [UserRole.ADMIN, UserRole.OPERATOR],
  },
  {
    title: 'Activity Log',
    translationKey: 'SIDEBAR.ACTIVITY_LOG',
    icon: ClipboardList,
    path: '/activity-log',
    requiredRoles: [UserRole.ADMIN],
  },
];
