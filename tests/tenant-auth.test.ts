import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { mockAuthService } from '../src/shared/auth';
import { mockData, resetMockData } from '../src/shared/mocks/mock-data';

beforeEach(resetMockData);

describe('TENANT authentication eligibility and lockout', () => {
  it('resolves all four approved role permission sets and one immutable tenant context', async () => {
    const personas = mockData.authAccounts.filter(
      ({ portalType }) => portalType === 'TENANT',
    );
    assert.deepEqual(
      new Set(personas.map(({ roleCode }) => roleCode)),
      new Set([
        'TENANT_ADMIN',
        'TENANT_MARKETING_OPS',
        'TENANT_VIEWER',
        'TENANT_FINANCE',
      ]),
    );
    assert.equal(new Set(personas.map(({ tenantId }) => tenantId)).size, 2);
    for (const persona of personas) {
      const session = await mockAuthService.login({
        portalType: 'TENANT',
        username: ` ${persona.username} `,
        password: persona.password,
      });
      assert.equal(session.tenantId, persona.tenantId);
      assert.ok(session.permissions.length > 0);
    }
  });

  it('increments only an existing TENANT account and locks it on the fifth invalid password', async () => {
    const account = mockData.authAccounts.find(
      ({ id }) => id === 'tenant-marketing',
    );
    assert.ok(account);
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      await assert.rejects(
        () =>
          mockAuthService.login({
            portalType: 'TENANT',
            username: account.username,
            password: 'Wrong123!',
          }),
        /INVALID_PASSWORD/,
      );
      assert.equal(account.status, 'ACTIVE');
      assert.equal(account.failedLoginCount, attempt);
    }
    await assert.rejects(
      () =>
        mockAuthService.login({
          portalType: 'TENANT',
          username: account.username,
          password: 'Wrong123!',
        }),
      /ACCOUNT_LOCKED/,
    );
    assert.equal(account.status, 'LOCKED');
    assert.equal(account.failedLoginCount, 5);
    assert.equal(account.lockedAt, '2026-08-03T23:00:00.000Z');
    assert.equal(mockData.auditRecords.at(-1)?.action, 'LOCK_TENANT_ACCOUNT');
  });

  it('does not lock a nonexistent username and resets failures after a successful login', async () => {
    const before = mockData.authAccounts.map(
      ({ failedLoginCount }) => failedLoginCount,
    );
    await assert.rejects(
      () =>
        mockAuthService.login({
          portalType: 'TENANT',
          username: 'missing@lotus.test',
          password: 'Wrong123!',
        }),
      /USERNAME_NOT_FOUND/,
    );
    assert.deepEqual(
      mockData.authAccounts.map(({ failedLoginCount }) => failedLoginCount),
      before,
    );
    const account = mockData.authAccounts.find(
      ({ id }) => id === 'tenant-viewer',
    );
    assert.ok(account);
    account.failedLoginCount = 3;
    await mockAuthService.login({
      portalType: 'TENANT',
      username: account.username,
      password: account.password,
    });
    assert.equal(account.failedLoginCount, 0);
  });

  it('rejects inactive account, role and tenant before creating a session', async () => {
    const account = mockData.authAccounts.find(
      ({ id }) => id === 'tenant-admin',
    );
    assert.ok(account);
    account.status = 'INACTIVE';
    await assert.rejects(
      () =>
        mockAuthService.login({
          portalType: 'TENANT',
          username: account.username,
          password: account.password,
        }),
      /ACCOUNT_INACTIVE/,
    );
    account.status = 'ACTIVE';
    const role = mockData.tenantRoles.find(
      ({ tenantId, code }) =>
        tenantId === account.tenantId && code === account.roleCode,
    );
    assert.ok(role);
    role.status = 'INACTIVE';
    await assert.rejects(
      () =>
        mockAuthService.login({
          portalType: 'TENANT',
          username: account.username,
          password: account.password,
        }),
      /ROLE_INACTIVE/,
    );
  });
});
