import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { adminRbacService } from '../src/features/admin/rbac/api/admin-rbac-service';

describe('ADMIN read-only system-role matrix', () => {
  it('returns exactly the four active immutable ADMIN system roles', async () => {
    const roles = await adminRbacService.listRoles('CMS_ADMIN');

    assert.deepEqual(
      roles.map(({ code }) => code),
      ['CMS_ADMIN', 'CMS_FINANCE', 'CMS_CSKH', 'CMS_OPERATION'],
    );
    assert.equal(roles.every(({ status }) => status === 'ACTIVE'), true);
    assert.equal(roles.every(({ readOnly }) => readOnly), true);
  });

  it('returns the approved seven-module merged matrix', async () => {
    const matrix = await adminRbacService.getMatrix(
      'CMS_ADMIN',
      'CMS_OPERATION',
    );

    assert.deepEqual(
      matrix.modules.map(({ code }) => code),
      [
        'DASHBOARD',
        'CATEGORIES',
        'BRANDS',
        'TENANTS',
        'CONFIGURATION',
        'TRANSACTIONS',
        'EXCEPTIONS',
      ],
    );
  });

  it('derives Full only when every applicable action is granted', async () => {
    const admin = await adminRbacService.getMatrix('CMS_ADMIN', 'CMS_ADMIN');
    const operation = await adminRbacService.getMatrix(
      'CMS_ADMIN',
      'CMS_OPERATION',
    );

    assert.equal(admin.modules.every(({ full }) => full), true);
    assert.equal(
      operation.modules.find(({ code }) => code === 'CATEGORIES')?.full,
      true,
    );
    assert.equal(
      operation.modules.find(({ code }) => code === 'EXCEPTIONS')?.full,
      false,
    );
  });

  it('distinguishes non-applicable actions from denied permissions', async () => {
    const finance = await adminRbacService.getMatrix(
      'CMS_ADMIN',
      'CMS_FINANCE',
    );
    const dashboard = finance.modules.find(({ code }) => code === 'DASHBOARD');
    const categories = finance.modules.find(
      ({ code }) => code === 'CATEGORIES',
    );

    assert.equal(dashboard?.actions.CREATE, 'NOT_APPLICABLE');
    assert.equal(categories?.actions.VIEW, 'GRANTED');
    assert.equal(categories?.actions.CREATE, 'DENIED');
  });

  it('rejects every non-admin requester before returning role data', async () => {
    for (const requester of [
      'CMS_FINANCE',
      'CMS_CSKH',
      'CMS_OPERATION',
    ] as const) {
      await assert.rejects(
        () => adminRbacService.listRoles(requester),
        /FORBIDDEN/,
      );
      await assert.rejects(
        () => adminRbacService.getMatrix(requester, 'CMS_ADMIN'),
        /FORBIDDEN/,
      );
    }
  });
});
