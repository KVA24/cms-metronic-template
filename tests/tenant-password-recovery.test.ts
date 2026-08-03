import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { tenantPasswordRecoveryService } from '../src/features/tenant/auth/api/tenant-password-recovery-service';
import { DEMO_RESET_OTP } from '../src/features/tenant/auth/model/tenant-password-recovery';
import { mockAuthService } from '../src/shared/auth';
import { mockData, resetMockData } from '../src/shared/mocks/mock-data';

beforeEach(resetMockData);

describe('TENANT password recovery service', () => {
  it('validates a registered TENANT email and creates a five-minute demo OTP request', async () => {
    await assert.rejects(() => tenantPasswordRecoveryService.requestReset({ email: 'invalid' }));
    await assert.rejects(() => tenantPasswordRecoveryService.requestReset({ email: 'missing@example.test' }), /EMAIL_NOT_FOUND/);
    const result = await tenantPasswordRecoveryService.requestReset({ email: ' viewer@lotus.test ' });
    assert.equal(result.demoOtp, DEMO_RESET_OTP);
    assert.equal(result.expiresAt, '2026-08-03T23:15:00.000Z');
    assert.equal(mockData.passwordResetRequests.length, 1);
    assert.notEqual(mockData.passwordResetRequests[0]?.otpHash, DEMO_RESET_OTP);
  });

  it('keeps invalid and expired OTPs unverified and supports resend', async () => {
    const request = await tenantPasswordRecoveryService.requestReset({ email: 'viewer@lotus.test' });
    await assert.rejects(() => tenantPasswordRecoveryService.verifyOtp({ requestId: request.id, otp: '000000' }), /OTP_INVALID/);
    assert.equal(mockData.passwordResetRequests[0]?.attempts, 1);
    mockData.passwordResetRequests[0]!.expiresAt = '2026-08-03T23:11:00.000Z';
    await assert.rejects(() => tenantPasswordRecoveryService.verifyOtp({ requestId: request.id, otp: DEMO_RESET_OTP }), /OTP_EXPIRED/);
    await tenantPasswordRecoveryService.resendOtp(request.id);
    const verified = await tenantPasswordRecoveryService.verifyOtp({ requestId: request.id, otp: DEMO_RESET_OTP });
    assert.equal(verified.verifiedAt, '2026-08-03T23:12:00.000Z');
  });

  it('requires verified OTP and matching policy-compliant passwords', async () => {
    const request = await tenantPasswordRecoveryService.requestReset({ email: 'viewer@lotus.test' });
    await assert.rejects(() => tenantPasswordRecoveryService.resetPassword({ requestId: request.id, newPassword: 'NewTenant123!', confirmPassword: 'Mismatch123!' }));
    await assert.rejects(() => tenantPasswordRecoveryService.resetPassword({ requestId: request.id, newPassword: 'NewTenant123!', confirmPassword: 'NewTenant123!' }), /OTP_NOT_VERIFIED/);
  });

  it('updates the shared login password once and does not unlock a locked account', async () => {
    const account = mockData.authAccounts.find(({ id }) => id === 'tenant-viewer');
    assert.ok(account);
    const request = await tenantPasswordRecoveryService.requestReset({ email: account.email });
    await tenantPasswordRecoveryService.verifyOtp({ requestId: request.id, otp: DEMO_RESET_OTP });
    await tenantPasswordRecoveryService.resetPassword({ requestId: request.id, newPassword: 'NewTenant123!', confirmPassword: 'NewTenant123!' });
    await assert.rejects(() => tenantPasswordRecoveryService.resetPassword({ requestId: request.id, newPassword: 'AgainTenant123!', confirmPassword: 'AgainTenant123!' }), /RESET_REQUEST_INVALID/);
    const session = await mockAuthService.login({ portalType: 'TENANT', username: account.username, password: 'NewTenant123!' });
    assert.equal(session.user.id, account.id);
    account.status = 'LOCKED';
    const lockedRequest = await tenantPasswordRecoveryService.requestReset({ email: account.email });
    await tenantPasswordRecoveryService.verifyOtp({ requestId: lockedRequest.id, otp: DEMO_RESET_OTP });
    await tenantPasswordRecoveryService.resetPassword({ requestId: lockedRequest.id, newPassword: 'LockedNew123!', confirmPassword: 'LockedNew123!' });
    assert.equal(account.status, 'LOCKED');
  });
});
