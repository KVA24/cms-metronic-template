import {
  getPermissionsForRole,
  hasPermission,
  type AdminRoleCode,
} from '../../../../shared/permissions';
import {
  ADMIN_RBAC_ACTIONS,
  ADMIN_RBAC_MODULES,
  type AdminRbacActionState,
  type AdminRolePermissionView,
  type AdminSystemRole,
} from '../model/admin-rbac';

const systemRoles: readonly AdminSystemRole[] = [
  {
    id: 'role-cms-admin',
    code: 'CMS_ADMIN',
    name: 'Admin CMS',
    status: 'ACTIVE',
    seedVersion: 'affiliate-cms-rbac-v1',
    seededAt: '2026-07-01T00:00:00.000Z',
    readOnly: true,
  },
  {
    id: 'role-cms-finance',
    code: 'CMS_FINANCE',
    name: 'Finance CMS',
    status: 'ACTIVE',
    seedVersion: 'affiliate-cms-rbac-v1',
    seededAt: '2026-07-01T00:00:00.000Z',
    readOnly: true,
  },
  {
    id: 'role-cms-cskh',
    code: 'CMS_CSKH',
    name: 'CSKH CMS',
    status: 'ACTIVE',
    seedVersion: 'affiliate-cms-rbac-v1',
    seededAt: '2026-07-01T00:00:00.000Z',
    readOnly: true,
  },
  {
    id: 'role-cms-operation',
    code: 'CMS_OPERATION',
    name: 'Operation CMS',
    status: 'ACTIVE',
    seedVersion: 'affiliate-cms-rbac-v1',
    seededAt: '2026-07-01T00:00:00.000Z',
    readOnly: true,
  },
];

function assertCanViewRbac(requesterRole: AdminRoleCode): void {
  if (!hasPermission(requesterRole, 'rbac.view')) {
    throw new Error('FORBIDDEN');
  }
}

function getActionState(
  rolePermissions: ReadonlySet<string>,
  requiredPermissions: readonly string[] | undefined,
): AdminRbacActionState {
  if (!requiredPermissions) return 'NOT_APPLICABLE';
  return requiredPermissions.every((permission) =>
    rolePermissions.has(permission),
  )
    ? 'GRANTED'
    : 'DENIED';
}

export const adminRbacService = {
  async listRoles(requesterRole: AdminRoleCode): Promise<AdminSystemRole[]> {
    assertCanViewRbac(requesterRole);
    return structuredClone(systemRoles);
  },

  async getMatrix(
    requesterRole: AdminRoleCode,
    roleCode: AdminRoleCode,
  ): Promise<AdminRolePermissionView> {
    assertCanViewRbac(requesterRole);

    const role = systemRoles.find(({ code }) => code === roleCode);
    if (!role) throw new Error('ROLE_NOT_FOUND');

    const permissions = getPermissionsForRole(roleCode);
    const modules = ADMIN_RBAC_MODULES.map((module) => {
      const actions = Object.fromEntries(
        ADMIN_RBAC_ACTIONS.map((action) => [
          action,
          getActionState(permissions, module.permissions[action]),
        ]),
      ) as AdminRolePermissionView['modules'][number]['actions'];

      return {
        code: module.code,
        actions,
        full: Object.values(actions)
          .filter((state) => state !== 'NOT_APPLICABLE')
          .every((state) => state === 'GRANTED'),
      };
    });

    return structuredClone({ role, modules, readOnly: true });
  },
};
