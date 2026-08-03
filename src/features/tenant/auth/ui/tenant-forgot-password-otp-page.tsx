import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslations } from '@/shared/hooks/use-translations';
import { Button } from '@/shared/ui/atoms/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/shared/ui/atoms/form';
import { Input } from '@/shared/ui/atoms/input';
import { tenantPasswordRecoveryService } from '../api/tenant-password-recovery-service';
import { DEMO_RESET_OTP, tenantResetOtpSchema } from '../model/tenant-password-recovery';

export function TenantForgotPasswordOtpPage() {
  const { t } = useTranslations();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId') ?? '';
  const [serviceError, setServiceError] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const form = useForm<{ requestId: string; otp: string }>({ resolver: zodResolver(tenantResetOtpSchema), defaultValues: { requestId, otp: '' } });
  const submit = async (values: { requestId: string; otp: string }) => {
    try { await tenantPasswordRecoveryService.verifyOtp(values); navigate(`/auth/tenant/forgot-password/reset?requestId=${requestId}`); }
    catch (error) { setServiceError(error instanceof Error ? error.message : 'RESET_ERROR'); }
  };
  const resend = async () => { try { await tenantPasswordRecoveryService.resendOtp(requestId); setServiceError(''); setResendMessage(t('TENANT_RECOVERY.RESEND_SUCCESS')); } catch { setServiceError('RESET_REQUEST_INVALID'); } };
  return <div className="space-y-5"><div><h1 className="text-2xl font-semibold">{t('TENANT_RECOVERY.OTP_TITLE')}</h1><p className="mt-1 text-sm text-muted-foreground">{t('TENANT_RECOVERY.OTP_DESCRIPTION')}</p><p className="mt-2 rounded-md bg-muted p-2 text-sm">{t('TENANT_RECOVERY.DEMO_OTP', { otp: DEMO_RESET_OTP })}</p></div><Form {...form}><form className="space-y-4" noValidate onSubmit={form.handleSubmit(submit)}><FormField control={form.control} name="otp" render={({ field, fieldState }) => <FormItem><FormLabel>{t('TENANT_RECOVERY.OTP')}</FormLabel><FormControl><Input inputMode="numeric" maxLength={6} autoComplete="one-time-code" {...field} /></FormControl>{fieldState.error && <p className="text-xs text-destructive">{t(`TENANT_RECOVERY.VALIDATION.${fieldState.error.message}`)}</p>}</FormItem>} />{serviceError && <p role="alert" className="text-sm text-destructive">{t(`TENANT_RECOVERY.ERRORS.${serviceError}`)}</p>}{resendMessage && <p role="status" className="text-sm text-success">{resendMessage}</p>}<Button className="w-full" type="submit" disabled={!requestId || form.formState.isSubmitting}>{t('TENANT_RECOVERY.VERIFY')}</Button><div className="flex justify-between"><Button type="button" variant="ghost" onClick={() => navigate('/auth/tenant/forgot-password')}>{t('COMMON.BACK')}</Button><Button type="button" variant="ghost" disabled={!requestId} onClick={resend}>{t('TENANT_RECOVERY.RESEND')}</Button></div></form></Form><Link className="block text-center text-sm text-primary hover:underline" to="/auth/login?portal=tenant">{t('TENANT_RECOVERY.BACK_TO_SIGN_IN')}</Link></div>;
}
