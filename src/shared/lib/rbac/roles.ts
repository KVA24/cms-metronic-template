// Role definitions
export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
  CS = 'CS',
}

// Permission definitions
export enum Permission {
  VIEW_DASHBOARD = 'view_dashboard',
  MANAGE_DASHBOARD = 'manage_dashboard',

  VIEW_ACCOUNT = 'view_account',
  MANAGE_ACCOUNT = 'manage_account',

  VIEW_CONFIGURATION = 'view_configuration',
  MANAGE_CONFIGURATION = 'manage_configuration',

  // Activity Log permissions
  VIEW_ACTIVITY_LOG = 'view_activity_log',
  MANAGE_ACTIVITY_LOG = 'manage_activity_log',

  // Category permissions
  VIEW_CATEGORY = 'view_category',
  MANAGE_CATEGORY = 'manage_category',

  // Currency permissions
  VIEW_CURRENCY = 'view_currency',
  MANAGE_CURRENCY = 'manage_currency',

  // Currency Rate permissions
  VIEW_CURRENCY_RATE = 'view_currency_rate',
  MANAGE_CURRENCY_RATE = 'manage_currency_rate',

  // Event permissions
  VIEW_EVENT = 'view_event',
  MANAGE_EVENT = 'manage_event',

  // Metadata permissions
  VIEW_METADATA = 'view_metadata',
  MANAGE_METADATA = 'manage_metadata',

  // Partner permissions
  VIEW_PARTNER = 'view_partner',
  MANAGE_PARTNER = 'manage_partner',

  // Task Category permissions
  VIEW_TASK_CATEGORY = 'view_task_category',
  MANAGE_TASK_CATEGORY = 'manage_task_category',

  // Task permissions
  VIEW_TASK = 'view_task',
  MANAGE_TASK = 'manage_task',

  // Tier permissions
  VIEW_TIER = 'view_tier',
  MANAGE_TIER = 'manage_tier',

  // Tier Metric permissions
  VIEW_TIER_METRIC = 'view_tier_metric',
  MANAGE_TIER_METRIC = 'manage_tier_metric',

  // Tier Downgrade Rule permissions
  VIEW_TIER_DOWNGRADE_RULE = 'view_tier_downgrade_rule',
  MANAGE_TIER_DOWNGRADE_RULE = 'manage_tier_downgrade_rule',

  VIEW_CAMPAIGN = 'view_campaign',
  MANAGE_CAMPAIGN = 'manage_campaign',

  // User permissions
  VIEW_USER = 'view_user',
  MANAGE_USER = 'manage_user',

  // Validation Rule permissions
  VIEW_VALIDATION_RULE = 'view_validation_rule',
  MANAGE_VALIDATION_RULE = 'manage_validation_rule',

  // Currency permissions
  VIEW_EXPIRY_POLICY = 'view_expiry_policy',
  MANAGE_EXPIRY_POLICY = 'manage_expiry_policy',
  
  VIEW__POINT_TRANSACTION = 'view_point_transaction',
}

// Role to permissions mapping
export const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_ACCOUNT,
    Permission.MANAGE_ACCOUNT,
    Permission.VIEW_CONFIGURATION,
    Permission.MANAGE_CONFIGURATION,
    Permission.VIEW_CAMPAIGN,
    Permission.MANAGE_CAMPAIGN,
    Permission.VIEW_ACTIVITY_LOG,
    Permission.MANAGE_ACTIVITY_LOG,
    Permission.VIEW_CATEGORY,
    Permission.MANAGE_CATEGORY,
    Permission.VIEW_CURRENCY,
    Permission.MANAGE_CURRENCY,
    Permission.VIEW_CURRENCY_RATE,
    Permission.MANAGE_CURRENCY_RATE,
    Permission.VIEW_EVENT,
    Permission.MANAGE_EVENT,
    Permission.VIEW_METADATA,
    Permission.MANAGE_METADATA,
    Permission.VIEW_PARTNER,
    Permission.MANAGE_PARTNER,
    Permission.VIEW_TASK_CATEGORY,
    Permission.MANAGE_TASK_CATEGORY,
    Permission.VIEW_TASK,
    Permission.MANAGE_TASK,
    Permission.VIEW_TIER,
    Permission.MANAGE_TIER,
    Permission.VIEW_TIER_METRIC,
    Permission.MANAGE_TIER_METRIC,
    Permission.VIEW_TIER_DOWNGRADE_RULE,
    Permission.MANAGE_TIER_DOWNGRADE_RULE,
    Permission.VIEW_USER,
    Permission.MANAGE_USER,
    Permission.VIEW_VALIDATION_RULE,
    Permission.MANAGE_VALIDATION_RULE,
    Permission.VIEW_EXPIRY_POLICY,
    Permission.MANAGE_EXPIRY_POLICY,
    Permission.VIEW__POINT_TRANSACTION,
  ],

  [UserRole.OPERATOR]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_ACCOUNT,
    Permission.VIEW_USER,
    Permission.VIEW_CATEGORY,
    Permission.MANAGE_CATEGORY,
    Permission.VIEW_CURRENCY,
    Permission.VIEW_CURRENCY_RATE,
    Permission.VIEW_EVENT,
    Permission.VIEW_METADATA,
    Permission.MANAGE_PARTNER,
    Permission.VIEW_CAMPAIGN,
    Permission.MANAGE_CAMPAIGN,
    Permission.VIEW_TASK_CATEGORY,
    Permission.MANAGE_TASK_CATEGORY,
    Permission.VIEW_TASK,
    Permission.MANAGE_TASK,
    Permission.VIEW_TIER,
    Permission.MANAGE_TIER,
    Permission.VIEW_TIER_METRIC,
    Permission.MANAGE_TIER_METRIC,
    Permission.VIEW_TIER_DOWNGRADE_RULE,
    Permission.MANAGE_TIER_DOWNGRADE_RULE,
    Permission.VIEW_USER,
    Permission.MANAGE_USER,
    Permission.VIEW_VALIDATION_RULE,
    Permission.MANAGE_VALIDATION_RULE,
    Permission.VIEW__POINT_TRANSACTION,
  ],

  [UserRole.CS]: [
    Permission.VIEW_CAMPAIGN,
    Permission.VIEW_TIER,
    Permission.VIEW_USER,
    Permission.VIEW__POINT_TRANSACTION,
  ],
};

// Helper function to check if a role has a permission
export function hasPermission(
  role: UserRole | string,
  permission: Permission,
): boolean {
  const userRole = role as UserRole;
  if (!rolePermissions[userRole]) {
    return false;
  }
  return rolePermissions[userRole].includes(permission);
}

// Helper function to check if a role has any of the permissions
export function hasAnyPermission(
  role: UserRole | string,
  permissions: Permission[],
): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

// Helper function to check if a role has all of the permissions
export function hasAllPermissions(
  role: UserRole | string,
  permissions: Permission[],
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}
