// Role definitions
export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
  CS = 'CS',
}

// Helper function to check if a role is one of the allowed roles
export function hasRole(
  userRole: UserRole | string,
  requiredRoles: UserRole[],
): boolean {
  return requiredRoles.includes(userRole as UserRole);
}

// Helper function to check if a user role is any of the provided roles
export function hasAnyRole(
  userRole: UserRole | string,
  requiredRoles: UserRole[],
): boolean {
  return requiredRoles.includes(userRole as UserRole);
}

// Helper function to check if a user role matches all of the provided roles
export function hasAllRoles(
  userRole: UserRole | string,
  requiredRoles: UserRole[],
): boolean {
  return requiredRoles.includes(userRole as UserRole);
}
