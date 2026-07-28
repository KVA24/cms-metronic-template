// Role definitions
export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
  CS = 'CS',
}

interface RoleLike {
  roleCode: string;
}

export function getUserRoles(
  roles: RoleLike | RoleLike[] | null | undefined,
): UserRole[] {
  const assignedRoles = Array.isArray(roles) ? roles : roles ? [roles] : [];
  const knownRoles = new Set<string>(Object.values(UserRole));

  return assignedRoles
    .map((role) => role.roleCode)
    .filter((roleCode): roleCode is UserRole => knownRoles.has(roleCode));
}

export function hasRequiredRole(
  assignedRoles: readonly UserRole[],
  requiredRoles: readonly UserRole[],
): boolean {
  return (
    requiredRoles.length === 0 ||
    assignedRoles.some((role) => requiredRoles.includes(role))
  );
}
