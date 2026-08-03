import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canViewFinancialField,
  getPermissionsForRole,
  hasPermission,
  type AdminRoleCode,
  type TenantRoleCode,
} from '../src/shared/permissions';

describe('approved permission matrices', () => {
  it('gives CMS_ADMIN the merged Tenant and Configuration permissions', () => {
    assert.equal(hasPermission('CMS_ADMIN', 'tenants.view'), true);
    assert.equal(hasPermission('CMS_ADMIN', 'configuration.delete'), true);
  });

  it('limits ADMIN system roles to their approved actions', () => {
    assert.equal(hasPermission('CMS_FINANCE', 'transactions.export'), true);
    assert.equal(hasPermission('CMS_FINANCE', 'configuration.view'), false);
    assert.equal(hasPermission('CMS_CSKH', 'transactions.view'), true);
    assert.equal(hasPermission('CMS_CSKH', 'transactions.export'), false);
    assert.equal(
      hasPermission('CMS_OPERATION', 'tenants.assignments.edit'),
      true,
    );
    assert.equal(hasPermission('CMS_OPERATION', 'exceptions.retry'), false);
  });

  it('matches the canonical Tenant system-role matrix', () => {
    assert.equal(hasPermission('TENANT_ADMIN', 'roles.permissions'), true);
    assert.equal(hasPermission('TENANT_MARKETING_OPS', 'brands.edit'), true);
    assert.equal(
      hasPermission('TENANT_MARKETING_OPS', 'dashboard.view'),
      false,
    );
    assert.equal(hasPermission('TENANT_VIEWER', 'transactions.view'), true);
    assert.equal(hasPermission('TENANT_VIEWER', 'transactions.export'), false);
    assert.equal(hasPermission('TENANT_FINANCE', 'transactions.export'), true);
  });

  it('fails closed for unknown permissions', () => {
    assert.equal(hasPermission('CMS_ADMIN', 'unknown.action'), false);
  });

  it('returns copies so callers cannot mutate the role matrix', () => {
    const permissions = getPermissionsForRole('TENANT_FINANCE');
    permissions.clear();

    assert.equal(hasPermission('TENANT_FINANCE', 'dashboard.view'), true);
  });
});

describe('ADMIN financial field scope', () => {
  const adminRoles: AdminRoleCode[] = [
    'CMS_ADMIN',
    'CMS_FINANCE',
    'CMS_CSKH',
    'CMS_OPERATION',
  ];

  it('allows full financial data for ADMIN and Finance', () => {
    for (const role of adminRoles.slice(0, 2)) {
      assert.equal(canViewFinancialField(role, 'grossCommission'), true);
      assert.equal(canViewFinancialField(role, 'tenantShare'), true);
      assert.equal(canViewFinancialField(role, 'affiliateKeep'), true);
    }
  });

  it('removes affiliate keep from Operation and all financial fields from CSKH', () => {
    assert.equal(
      canViewFinancialField('CMS_OPERATION', 'grossCommission'),
      true,
    );
    assert.equal(
      canViewFinancialField('CMS_OPERATION', 'affiliateKeep'),
      false,
    );
    assert.equal(canViewFinancialField('CMS_CSKH', 'tenantShare'), false);
  });
});

const _tenantRoleTypeCheck: TenantRoleCode = 'TENANT_VIEWER';
void _tenantRoleTypeCheck;
