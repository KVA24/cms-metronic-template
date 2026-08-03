import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { getAssignedUserCount, getModuleSelection, getPermissionCoverage, isValidTenantPermissionSet, TENANT_PERMISSION_MODULES, wouldRemoveLastTenantAdministrator } from '../src/features/tenant/roles/model/tenant-role-permissions';
import { mockData, resetMockData } from '../src/shared/mocks/mock-data';
import { TENANT_PERMISSION_CATALOG, getPermissionsForRole } from '../src/shared/permissions';

beforeEach(resetMockData);

describe('TENANT role and permission foundation', () => {
  it('seeds four immutable Active system roles and custom roles per Tenant', () => {
    for (const tenantId of ['tenant-lotus', 'tenant-bamboo']) {
      const roles = mockData.tenantRoles.filter((role) => role.tenantId === tenantId);
      assert.equal(roles.filter(({ type }) => type === 'SYSTEM').length, 4);
      assert.ok(roles.some(({ type }) => type === 'CUSTOM'));
      for (const role of roles.filter(({ type }) => type === 'SYSTEM')) {
        assert.equal(role.status, 'ACTIVE');
        assert.deepEqual(new Set(role.permissions), getPermissionsForRole(role.code as 'TENANT_ADMIN'));
      }
    }
  });

  it('defines exactly seven modules and derives Full, indeterminate and coverage states', () => {
    assert.equal(TENANT_PERMISSION_MODULES.length, 7);
    assert.deepEqual(getModuleSelection(['brands.view', 'brands.edit'], ['brands.view']), { selectedCount: 1, full: false, indeterminate: true });
    assert.deepEqual(getModuleSelection(['brands.view', 'brands.edit'], ['brands.view', 'brands.edit']), { selectedCount: 2, full: true, indeterminate: false });
    assert.equal(getPermissionCoverage([...getPermissionsForRole('TENANT_ADMIN')]), 7);
  });

  it('rejects Platform permissions and accepts only the Tenant catalog', () => {
    assert.equal(isValidTenantPermissionSet(TENANT_PERMISSION_CATALOG), true);
    assert.equal(isValidTenantPermissionSet(['brands.view', 'configuration.delete']), false);
  });

  it('counts role assignment and protects the last account with role/account management access', () => {
    const adminRole = mockData.tenantRoles.find(({ tenantId, code }) => tenantId === 'tenant-lotus' && code === 'TENANT_ADMIN');
    assert.ok(adminRole);
    assert.equal(getAssignedUserCount(adminRole.id, mockData.authAccounts), 1);
    assert.equal(wouldRemoveLastTenantAdministrator(adminRole, ['profile.view'], mockData.tenantRoles, mockData.authAccounts), true);
    assert.equal(wouldRemoveLastTenantAdministrator(adminRole, adminRole.permissions, mockData.tenantRoles, mockData.authAccounts), false);
  });
});
