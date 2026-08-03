import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getPortalForPath,
  getPortalFromSearchParam,
  getPortalLoginPath,
  isPathAllowedForPortal,
} from '../src/shared/auth';

describe('portal routing', () => {
  it('normalizes login portal query values', () => {
    assert.equal(getPortalFromSearchParam('tenant'), 'TENANT');
    assert.equal(getPortalFromSearchParam('ADMIN'), 'ADMIN');
    assert.equal(getPortalFromSearchParam('unknown'), 'ADMIN');
    assert.equal(getPortalFromSearchParam(null), 'ADMIN');
  });

  it('derives a portal from protected paths', () => {
    assert.equal(getPortalForPath('/admin/brands'), 'ADMIN');
    assert.equal(getPortalForPath('/tenant/transactions'), 'TENANT');
    assert.equal(getPortalForPath('/'), null);
  });

  it('builds a portal-aware login URL with a safe next path', () => {
    assert.equal(
      getPortalLoginPath('TENANT', '/tenant/transactions?status=pending'),
      '/auth/login?portal=tenant&next=%2Ftenant%2Ftransactions%3Fstatus%3Dpending',
    );
    assert.equal(
      getPortalLoginPath('ADMIN', '/tenant/dashboard'),
      '/auth/login?portal=admin',
    );
  });

  it('rejects cross-portal namespace access', () => {
    assert.equal(isPathAllowedForPortal('/admin/dashboard', 'ADMIN'), true);
    assert.equal(isPathAllowedForPortal('/tenant/dashboard', 'ADMIN'), false);
    assert.equal(isPathAllowedForPortal('/tenant', 'TENANT'), true);
  });
});
