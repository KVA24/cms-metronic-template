import type {
  AdminRoleCode,
  PermissionCode,
} from '../../../../shared/permissions';

export type AdminRbacModuleCode =
  | 'DASHBOARD'
  | 'CATEGORIES'
  | 'BRANDS'
  | 'TENANTS'
  | 'CONFIGURATION'
  | 'TRANSACTIONS'
  | 'EXCEPTIONS';

export type AdminRbacActionCode =
  | 'VIEW'
  | 'CREATE'
  | 'EDIT'
  | 'DELETE'
  | 'EXPORT'
  | 'RETRY';

export type AdminRbacActionState = 'GRANTED' | 'DENIED' | 'NOT_APPLICABLE';

export interface AdminSystemRole {
  id: string;
  code: AdminRoleCode;
  name: string;
  status: 'ACTIVE';
  seedVersion: string;
  seededAt: string;
  readOnly: true;
}

export interface AdminRbacModuleDefinition {
  code: AdminRbacModuleCode;
  permissions: Partial<Record<AdminRbacActionCode, readonly PermissionCode[]>>;
}

export interface AdminRbacModuleView {
  code: AdminRbacModuleCode;
  actions: Record<AdminRbacActionCode, AdminRbacActionState>;
  full: boolean;
}

export interface AdminRolePermissionView {
  role: AdminSystemRole;
  modules: AdminRbacModuleView[];
  readOnly: true;
}

export const ADMIN_RBAC_ACTIONS: readonly AdminRbacActionCode[] = [
  'VIEW',
  'CREATE',
  'EDIT',
  'DELETE',
  'EXPORT',
  'RETRY',
];

export const ADMIN_RBAC_MODULES: readonly AdminRbacModuleDefinition[] = [
  { code: 'DASHBOARD', permissions: { VIEW: ['dashboard.view'] } },
  {
    code: 'CATEGORIES',
    permissions: {
      VIEW: ['categories.view'],
      CREATE: ['categories.create'],
      EDIT: ['categories.edit'],
    },
  },
  {
    code: 'BRANDS',
    permissions: {
      VIEW: ['brands.view'],
      CREATE: ['brands.create'],
      EDIT: ['brands.edit'],
    },
  },
  {
    code: 'TENANTS',
    permissions: {
      VIEW: [
        'tenants.view',
        'tenants.accounts.view',
        'tenants.assignments.view',
        'tenants.revenue_share.view',
      ],
      CREATE: ['tenants.create', 'tenants.accounts.create'],
      EDIT: [
        'tenants.edit',
        'tenants.accounts.edit',
        'tenants.assignments.edit',
        'tenants.revenue_share.edit',
      ],
      DELETE: ['tenants.accounts.delete'],
    },
  },
  {
    code: 'CONFIGURATION',
    permissions: {
      VIEW: ['configuration.view'],
      CREATE: ['configuration.create'],
      EDIT: ['configuration.edit'],
      DELETE: ['configuration.delete'],
    },
  },
  {
    code: 'TRANSACTIONS',
    permissions: {
      VIEW: ['transactions.view'],
      EXPORT: ['transactions.export'],
    },
  },
  {
    code: 'EXCEPTIONS',
    permissions: {
      VIEW: ['exceptions.view'],
      EXPORT: ['exceptions.export'],
      RETRY: ['exceptions.retry'],
    },
  },
];
