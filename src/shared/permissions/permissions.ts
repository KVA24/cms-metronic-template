export type AdminRoleCode =
  | 'CMS_ADMIN'
  | 'CMS_FINANCE'
  | 'CMS_CSKH'
  | 'CMS_OPERATION';

export type TenantRoleCode =
  | 'TENANT_ADMIN'
  | 'TENANT_MARKETING_OPS'
  | 'TENANT_VIEWER'
  | 'TENANT_FINANCE';

export type SystemRoleCode = AdminRoleCode | TenantRoleCode;

export const ADMIN_PERMISSION_CATALOG = [
  'dashboard.view',
  'rbac.view',
  'categories.view',
  'categories.create',
  'categories.edit',
  'brands.view',
  'brands.create',
  'brands.edit',
  'tenants.view',
  'tenants.create',
  'tenants.edit',
  'tenants.accounts.view',
  'tenants.accounts.create',
  'tenants.accounts.edit',
  'tenants.accounts.delete',
  'tenants.assignments.view',
  'tenants.assignments.edit',
  'tenants.revenue_share.view',
  'tenants.revenue_share.edit',
  'configuration.view',
  'configuration.create',
  'configuration.edit',
  'configuration.delete',
  'transactions.view',
  'transactions.export',
  'exceptions.view',
  'exceptions.export',
  'exceptions.retry',
  'financial.gross_commission.view',
  'financial.tenant_share.view',
  'financial.affiliate_keep.view',
  'financial.rules.edit',
] as const;

export const TENANT_PERMISSION_CATALOG = [
  'dashboard.view',
  'brands.view',
  'brands.edit',
  'earn_display.view',
  'earn_display.create',
  'earn_display.edit',
  'transactions.view',
  'transactions.export',
  'roles.view',
  'roles.create',
  'roles.edit',
  'roles.delete_disable',
  'roles.permissions',
  'users.view',
  'users.create',
  'users.edit',
  'users.delete_disable',
  'profile.view',
  'profile.edit',
] as const;

export type PermissionCode =
  | (typeof ADMIN_PERMISSION_CATALOG)[number]
  | (typeof TENANT_PERMISSION_CATALOG)[number];

const adminPermissions = ADMIN_PERMISSION_CATALOG;
const tenantAdminPermissions = TENANT_PERMISSION_CATALOG;

const rolePermissions: Record<SystemRoleCode, readonly PermissionCode[]> = {
  CMS_ADMIN: adminPermissions,
  CMS_FINANCE: [
    'dashboard.view',
    'categories.view',
    'brands.view',
    'transactions.view',
    'transactions.export',
    'financial.gross_commission.view',
    'financial.tenant_share.view',
    'financial.affiliate_keep.view',
  ],
  CMS_CSKH: ['transactions.view'],
  CMS_OPERATION: [
    'dashboard.view',
    'categories.view',
    'categories.create',
    'categories.edit',
    'brands.view',
    'brands.create',
    'brands.edit',
    'tenants.view',
    'tenants.create',
    'tenants.edit',
    'tenants.accounts.view',
    'tenants.accounts.create',
    'tenants.accounts.edit',
    'tenants.accounts.delete',
    'tenants.assignments.view',
    'tenants.assignments.edit',
    'tenants.revenue_share.view',
    'tenants.revenue_share.edit',
    'transactions.view',
    'transactions.export',
    'financial.gross_commission.view',
    'financial.tenant_share.view',
    'financial.rules.edit',
  ],
  TENANT_ADMIN: tenantAdminPermissions,
  TENANT_MARKETING_OPS: [
    'brands.view',
    'brands.edit',
    'earn_display.view',
    'earn_display.create',
    'earn_display.edit',
    'profile.view',
    'profile.edit',
  ],
  TENANT_VIEWER: [
    'dashboard.view',
    'brands.view',
    'earn_display.view',
    'transactions.view',
    'profile.view',
    'profile.edit',
  ],
  TENANT_FINANCE: [
    'dashboard.view',
    'transactions.view',
    'transactions.export',
    'profile.view',
    'profile.edit',
  ],
};

export function getPermissionsForRole(
  roleCode: SystemRoleCode,
): Set<PermissionCode> {
  return new Set(rolePermissions[roleCode]);
}

export function hasPermission(
  roleCode: SystemRoleCode,
  permission: string,
): boolean {
  return rolePermissions[roleCode].includes(permission as PermissionCode);
}

export type FinancialField =
  | 'grossCommission'
  | 'tenantShare'
  | 'affiliateKeep';

const financialFieldsByRole: Record<AdminRoleCode, readonly FinancialField[]> =
  {
    CMS_ADMIN: ['grossCommission', 'tenantShare', 'affiliateKeep'],
    CMS_FINANCE: ['grossCommission', 'tenantShare', 'affiliateKeep'],
    CMS_CSKH: [],
    CMS_OPERATION: ['grossCommission', 'tenantShare'],
  };

export function canViewFinancialField(
  roleCode: AdminRoleCode,
  field: FinancialField,
): boolean {
  return financialFieldsByRole[roleCode].includes(field);
}
