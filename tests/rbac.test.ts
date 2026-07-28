import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getUserRoles,
  hasRequiredRole,
  UserRole,
} from '../src/shared/lib/rbac/roles';

describe('RBAC role matching', () => {
  it('authorizes when any assigned role is required', () => {
    const roles = getUserRoles([
      { roleCode: UserRole.CS },
      { roleCode: UserRole.ADMIN },
    ]);

    assert.equal(hasRequiredRole(roles, [UserRole.ADMIN]), true);
  });

  it('fails closed when a protected action has no assigned role', () => {
    assert.equal(hasRequiredRole([], [UserRole.ADMIN]), false);
  });

  it('ignores unknown server roles', () => {
    assert.deepEqual(
      getUserRoles([{ roleCode: 'UNKNOWN' }, { roleCode: UserRole.OPERATOR }]),
      [UserRole.OPERATOR],
    );
  });
});
