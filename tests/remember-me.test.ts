import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import {
  clearRememberedUsername,
  loadRememberedUsername,
  saveRememberedUsername,
} from '../src/shared/lib/remember-me';

const values = new Map<string, string>();

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, value),
  },
});

describe('portal-aware remembered username', () => {
  beforeEach(() => values.clear());

  it('stores usernames independently and never stores a password', () => {
    saveRememberedUsername('ADMIN', 'admin@cms.test');
    saveRememberedUsername('TENANT', 'admin@lotus.test');

    assert.equal(loadRememberedUsername('ADMIN'), 'admin@cms.test');
    assert.equal(loadRememberedUsername('TENANT'), 'admin@lotus.test');
    assert.equal([...values.values()].includes('Admin123!'), false);
    assert.equal([...values.values()].includes('Tenant123!'), false);
  });

  it('clears only the selected portal username', () => {
    saveRememberedUsername('ADMIN', 'admin@cms.test');
    saveRememberedUsername('TENANT', 'admin@lotus.test');

    clearRememberedUsername('TENANT');

    assert.equal(loadRememberedUsername('ADMIN'), 'admin@cms.test');
    assert.equal(loadRememberedUsername('TENANT'), null);
  });

  it('migrates the former shared username key to the active portal', () => {
    values.set('remembered_username', 'legacy@cms.test');

    assert.equal(loadRememberedUsername('ADMIN'), 'legacy@cms.test');
    assert.equal(values.get('remembered_username'), undefined);
    assert.equal(values.get('remembered_username_admin'), 'legacy@cms.test');
  });
});
