import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import {
  clearRememberedCredentials,
  loadRememberedCredentials,
  saveRememberedCredentials,
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

describe('portal-aware remembered credentials', () => {
  beforeEach(() => values.clear());

  it('stores username and password independently for each portal', () => {
    saveRememberedCredentials('ADMIN', {
      username: 'admin@cms.test',
      password: 'Admin123!',
    });
    saveRememberedCredentials('TENANT', {
      username: 'admin@lotus.test',
      password: 'Tenant123!',
    });

    assert.deepEqual(loadRememberedCredentials('ADMIN'), {
      username: 'admin@cms.test',
      password: 'Admin123!',
    });
    assert.deepEqual(loadRememberedCredentials('TENANT'), {
      username: 'admin@lotus.test',
      password: 'Tenant123!',
    });
  });

  it('clears only the selected portal credentials', () => {
    saveRememberedCredentials('ADMIN', {
      username: 'admin@cms.test',
      password: 'Admin123!',
    });
    saveRememberedCredentials('TENANT', {
      username: 'admin@lotus.test',
      password: 'Tenant123!',
    });

    clearRememberedCredentials('TENANT');

    assert.deepEqual(loadRememberedCredentials('ADMIN'), {
      username: 'admin@cms.test',
      password: 'Admin123!',
    });
    assert.equal(loadRememberedCredentials('TENANT'), null);
  });

  it('migrates a remembered username without inventing a password', () => {
    values.set('remembered_username_admin', 'legacy@cms.test');

    assert.deepEqual(loadRememberedCredentials('ADMIN'), {
      username: 'legacy@cms.test',
      password: '',
    });
    assert.equal(values.get('remembered_username_admin'), undefined);
  });

  it('removes malformed stored credentials', () => {
    values.set('remembered_credentials_admin', '{"username":42}');

    assert.equal(loadRememberedCredentials('ADMIN'), null);
    assert.equal(values.get('remembered_credentials_admin'), undefined);
  });
});
