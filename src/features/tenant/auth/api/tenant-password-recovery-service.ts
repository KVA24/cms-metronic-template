import { mockData } from '../../../../shared/mocks/mock-data';
import {
  DEMO_RESET_OTP,
  tenantResetEmailSchema,
  tenantResetOtpSchema,
  tenantResetPasswordSchema,
  type TenantResetPasswordInput,
} from '../model/tenant-password-recovery';

const issuedAt = '2026-08-03T23:10:00.000Z';
const expiresAt = '2026-08-03T23:15:00.000Z';
const verifiedAt = '2026-08-03T23:12:00.000Z';
const otpHash = 'demo-hash-260803';

function getRequest(requestId: string) {
  const request = mockData.passwordResetRequests.find(
    ({ id }) => id === requestId,
  );
  if (!request || request.completedAt) throw new Error('RESET_REQUEST_INVALID');
  return request;
}

export const tenantPasswordRecoveryService = {
  async requestReset(input: { email: string }) {
    const { email } = tenantResetEmailSchema.parse(input);
    const account = mockData.authAccounts.find(
      (item) =>
        item.portalType === 'TENANT' &&
        item.email.toLowerCase() === email.toLowerCase(),
    );
    if (!account || !account.tenantId) throw new Error('EMAIL_NOT_FOUND');
    const request = {
      id: `tenant-reset-${mockData.passwordResetRequests.length + 1}`,
      accountId: account.id,
      tenantId: account.tenantId,
      email: account.email,
      otpHash,
      issuedAt,
      expiresAt,
      attempts: 0,
      verifiedAt: null,
      completedAt: null,
    };
    mockData.passwordResetRequests.push(request);
    mockData.auditRecords.push({
      id: `audit-reset-${mockData.auditRecords.length + 1}`,
      actorId: account.id,
      action: 'REQUEST_PASSWORD_RESET',
      entityType: 'TENANT_ACCOUNT',
      entityId: account.id,
      occurredAt: issuedAt,
    });
    return structuredClone({
      id: request.id,
      email: request.email,
      expiresAt: request.expiresAt,
      demoOtp: DEMO_RESET_OTP,
    });
  },

  async resendOtp(requestId: string) {
    const request = getRequest(requestId);
    request.otpHash = otpHash;
    request.issuedAt = issuedAt;
    request.expiresAt = expiresAt;
    request.attempts = 0;
    request.verifiedAt = null;
    return structuredClone({
      id: request.id,
      email: request.email,
      expiresAt: request.expiresAt,
      demoOtp: DEMO_RESET_OTP,
    });
  },

  async verifyOtp(input: { requestId: string; otp: string }) {
    const parsed = tenantResetOtpSchema.parse(input);
    const request = getRequest(parsed.requestId);
    if (request.expiresAt < verifiedAt) throw new Error('OTP_EXPIRED');
    if (parsed.otp !== DEMO_RESET_OTP || request.otpHash !== otpHash) {
      request.attempts += 1;
      throw new Error('OTP_INVALID');
    }
    request.verifiedAt = verifiedAt;
    return structuredClone({
      requestId: request.id,
      verifiedAt: request.verifiedAt,
    });
  },

  async resetPassword(input: TenantResetPasswordInput) {
    const parsed = tenantResetPasswordSchema.parse(input);
    const request = getRequest(parsed.requestId);
    if (!request.verifiedAt) throw new Error('OTP_NOT_VERIFIED');
    const account = mockData.authAccounts.find(
      ({ id }) => id === request.accountId,
    );
    if (!account) throw new Error('ACCOUNT_NOT_FOUND');
    account.password = parsed.newPassword;
    account.sessionRevokedAt = '2026-08-03T23:13:00.000Z';
    account.updatedAt = account.sessionRevokedAt;
    account.version += 1;
    request.completedAt = account.sessionRevokedAt;
    request.otpHash = '';
    mockData.auditRecords.push({
      id: `audit-reset-${mockData.auditRecords.length + 1}`,
      actorId: account.id,
      action: 'RESET_TENANT_PASSWORD',
      entityType: 'TENANT_ACCOUNT',
      entityId: account.id,
      occurredAt: request.completedAt,
    });
    return { completedAt: request.completedAt };
  },
};
