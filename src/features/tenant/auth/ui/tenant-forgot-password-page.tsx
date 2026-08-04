import { useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import { Button } from '@/shared/ui/atoms/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/shared/ui/atoms/form';
import { Input } from '@/shared/ui/atoms/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { tenantPasswordRecoveryService } from '../api/tenant-password-recovery-service';
import { tenantResetEmailSchema } from '../model/tenant-password-recovery';

export function TenantForgotPasswordPage() {
  const { t } = useTranslations();
  const navigate = useNavigate();
  const [serviceError, setServiceError] = useState('');
  const form = useForm<{ email: string }>({
    resolver: zodResolver(tenantResetEmailSchema),
    defaultValues: { email: '' },
  });
  const submit = async (values: { email: string }) => {
    try {
      const request = await tenantPasswordRecoveryService.requestReset(values);
      navigate(`/auth/tenant/forgot-password/otp?requestId=${request.id}`);
    } catch (error) {
      setServiceError(error instanceof Error ? error.message : 'RESET_ERROR');
    }
  };
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">
          {t('TENANT_RECOVERY.EMAIL_TITLE')}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t('TENANT_RECOVERY.EMAIL_DESCRIPTION')}
        </p>
      </div>
      <Form {...form}>
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit(submit)}
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>{t('TENANT_RECOVERY.EMAIL')}</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                {fieldState.error && (
                  <p className="text-destructive text-xs">
                    {t(
                      `TENANT_RECOVERY.VALIDATION.${fieldState.error.message}`,
                    )}
                  </p>
                )}
              </FormItem>
            )}
          />
          {serviceError && (
            <p role="alert" className="text-destructive text-sm">
              {t(`TENANT_RECOVERY.ERRORS.${serviceError}`)}
            </p>
          )}
          <Button
            className="w-full"
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? t('TENANT_RECOVERY.SENDING')
              : t('TENANT_RECOVERY.SEND_CODE')}
          </Button>
        </form>
      </Form>
      <Link
        className="text-primary block text-center text-sm hover:underline"
        to="/auth/login?portal=tenant"
      >
        {t('TENANT_RECOVERY.BACK_TO_SIGN_IN')}
      </Link>
    </div>
  );
}
