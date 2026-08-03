import assert from 'node:assert/strict';
import test from 'node:test';
import { tenantProfileService } from '../src/features/tenant/profile/api/tenant-profile-service.ts';
import { mockAuthService } from '../src/shared/auth/mock-auth-service.ts';
import { mockData, resetMockData } from '../src/shared/mocks/mock-data.ts';

test.beforeEach(() => resetMockData());

async function login(username = 'admin@lotus.test') {
  return mockAuthService.login({
    portalType: 'TENANT',
    username,
    password: 'Tenant123!',
  });
}

test('AC-TP-PROFILE-001-01/02 resolves only the current session account', async () => {
  const session = await login('viewer@lotus.test');
  const profile = await tenantProfileService.get(session);
  assert.equal(profile.username, 'viewer@lotus.test');
  assert.equal(profile.roleName, 'Viewer Tenant');
  assert.equal('id' in profile, false);
});

test('AC-TP-PROFILE-001-08/09 updates the shared account record and avatar metadata', async () => {
  const session = await login();
  const profile = await tenantProfileService.get(session);
  const updated = await tenantProfileService.update(session, {
    fullName: 'Lotus Administrator',
    email: 'new.admin@lotus.test',
    phone: '+84 (901) 123-456',
    avatar: { name: 'avatar.png', type: 'image/png', size: 1000 },
    version: profile.version,
  });
  assert.equal(updated.fullName, 'Lotus Administrator');
  assert.equal(updated.avatarFileName, 'avatar.png');
  const account = mockData.authAccounts.find(
    ({ id }) => id === session.user.id,
  )!;
  assert.equal(account.displayName, updated.fullName);
  assert.equal(account.email, updated.email);
  assert.equal(account.phone, updated.phone);
});

test('AC-TP-PROFILE-001-03/04 rejects invalid profile and avatar data atomically', async () => {
  const session = await login();
  const profile = await tenantProfileService.get(session);
  await assert.rejects(
    tenantProfileService.update(session, {
      fullName: '',
      email: 'invalid',
      phone: 'letters',
      avatar: null,
      version: profile.version,
    }),
  );
  await assert.rejects(
    tenantProfileService.update(session, {
      ...profile,
      avatar: { name: 'avatar.svg', type: 'image/svg+xml', size: 100 },
    }),
    /AVATAR_INVALID/,
  );
  assert.equal((await tenantProfileService.get(session)).fullName, 'admin');
});

test('AC-TP-PROFILE-001-06/07/10 changes password, revokes session and never audits it', async () => {
  const session = await login();
  const profile = await tenantProfileService.get(session);
  await assert.rejects(
    tenantProfileService.changePassword(session, {
      newPassword: 'Changed123!',
      confirmPassword: '',
      version: profile.version,
    }),
  );
  await tenantProfileService.changePassword(session, {
    newPassword: 'Changed123!',
    confirmPassword: 'Changed123!',
    version: profile.version,
  });
  const account = mockData.authAccounts.find(
    ({ id }) => id === session.user.id,
  )!;
  assert.equal(account.sessionRevokedAt, account.updatedAt);
  const auditText = JSON.stringify(mockData.auditRecords.at(-1));
  assert.equal(auditText.includes('Changed123!'), false);
  const relogin = await mockAuthService.login({
    portalType: 'TENANT',
    username: session.user.username,
    password: 'Changed123!',
  });
  assert.equal(relogin.user.id, session.user.id);
});

test('BR-TP-PROFILE-001-01/02 requires profile permission and accepts no arbitrary user ID', async () => {
  const session = await login();
  const forbidden = { ...session, permissions: [] };
  await assert.rejects(tenantProfileService.get(forbidden), /FORBIDDEN/);
  assert.equal(tenantProfileService.get.length, 1);
  assert.equal(tenantProfileService.update.length, 2);
});
