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
import { Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { tenantPasswordRecoveryService } from '../api/tenant-password-recovery-service';
import {
  tenantResetPasswordSchema,
  type TenantResetPasswordInput,
} from '../model/tenant-password-recovery';

export function TenantForgotPasswordResetPage() {
  const { t } = useTranslations();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId') ?? '';
  const [visible, setVisible] = useState({ password: false, confirm: false });
  const [serviceError, setServiceError] = useState('');
  const form = useForm<TenantResetPasswordInput>({
    resolver: zodResolver(tenantResetPasswordSchema),
    defaultValues: { requestId, newPassword: '', confirmPassword: '' },
  });
  const submit = async (values: TenantResetPasswordInput) => {
    try {
      await tenantPasswordRecoveryService.resetPassword(values);
      navigate('/auth/tenant/forgot-password/success');
    } catch (error) {
      setServiceError(error instanceof Error ? error.message : 'RESET_ERROR');
    }
  };
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">
          {t('TENANT_RECOVERY.RESET_TITLE')}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t('TENANT_RECOVERY.RESET_DESCRIPTION')}
        </p>
      </div>
      <Form {...form}>
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit(submit)}
        >
          {(['newPassword', 'confirmPassword'] as const).map((name) => {
            const shown =
              name === 'newPassword' ? visible.password : visible.confirm;
            return (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      {t(
                        name === 'newPassword'
                          ? 'TENANT_RECOVERY.NEW_PASSWORD'
                          : 'TENANT_RECOVERY.CONFIRM_PASSWORD',
                      )}
                    </FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={shown ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder={t(
                            name === 'newPassword'
                              ? 'TENANT_RECOVERY.NEW_PASSWORD'
                              : 'TENANT_RECOVERY.CONFIRM_PASSWORD',
                          )}
                          className="pr-10"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        mode="icon"
                        className="absolute top-0 right-0 h-full"
                        aria-label={t(
                          shown
                            ? 'AUTH.SIGNIN.HIDE_PASSWORD'
                            : 'AUTH.SIGNIN.SHOW_PASSWORD',
                        )}
                        onClick={() =>
                          setVisible((current) =>
                            name === 'newPassword'
                              ? { ...current, password: !current.password }
                              : { ...current, confirm: !current.confirm },
                          )
                        }
                      >
                        {shown ? <EyeOff /> : <Eye />}
                      </Button>
                    </div>
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
            );
          })}
          {serviceError && (
            <p role="alert" className="text-destructive text-sm">
              {t(`TENANT_RECOVERY.ERRORS.${serviceError}`)}
            </p>
          )}
          <Button
            className="w-full"
            type="submit"
            disabled={!requestId || form.formState.isSubmitting}
          >
            {t('TENANT_RECOVERY.CONFIRM')}
          </Button>
          <Button
            className="w-full"
            type="button"
            variant="ghost"
            onClick={() =>
              navigate(
                `/auth/tenant/forgot-password/otp?requestId=${requestId}`,
              )
            }
          >
            {t('COMMON.BACK')}
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
