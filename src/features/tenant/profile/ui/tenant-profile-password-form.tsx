import { useState } from 'react';
import type { AuthSession } from '@/shared/contracts';
import { useTranslations } from '@/shared/hooks/use-translations';
import { useAuthActions } from '@/shared/stores/auth-store';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent, CardHeader } from '@/shared/ui/atoms/card';
import { Input } from '@/shared/ui/atoms/input';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTenantProfileMutations } from '../hooks/use-tenant-profile';
import {
  tenantProfilePasswordSchema,
  type TenantProfilePasswordInput,
} from '../model/tenant-profile';

interface PasswordFormValue {
  newPassword: string;
  confirmPassword: string;
}

export function TenantProfilePasswordForm({
  session,
  version,
}: {
  session: AuthSession;
  version: number;
}) {
  const { t } = useTranslations();
  const { logout } = useAuthActions();
  const navigate = useNavigate();
  const mutations = useTenantProfileMutations(session);
  const [visible, setVisible] = useState({ password: false, confirm: false });
  const form = useForm<PasswordFormValue>({
    defaultValues: { newPassword: '', confirmPassword: '' },
  });
  const errorText = (name: keyof PasswordFormValue) => {
    const message = form.formState.errors[name]?.message;
    return message ? t(`TENANT_PROFILE.ERRORS.${message}`) : null;
  };
  const submit = async (value: PasswordFormValue) => {
    const input: TenantProfilePasswordInput = { ...value, version };
    const parsed = tenantProfilePasswordSchema.safeParse(input);
    if (!parsed.success) {
      for (const issue of parsed.error.issues)
        form.setError(issue.path[0] as keyof PasswordFormValue, {
          message: issue.message,
        });
      return;
    }
    try {
      await mutations.changePassword.mutateAsync(parsed.data);
      toast.success(t('TENANT_PROFILE.PASSWORD_SUCCESS'));
      await logout();
      navigate('/auth/login?portal=tenant', { replace: true });
    } catch (error) {
      const code = error instanceof Error ? error.message : 'UNKNOWN';
      toast.error(
        t(`TENANT_PROFILE.ERRORS.${code}`, {
          defaultValue: t('TENANT_PROFILE.ERROR'),
        }),
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">{t('TENANT_PROFILE.CHANGE_PASSWORD')}</h2>
        <p className="text-muted-foreground text-sm">
          {t('TENANT_PROFILE.PASSWORD_HELP')}
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {(['newPassword', 'confirmPassword'] as const).map((name) => {
          const shown =
            name === 'newPassword' ? visible.password : visible.confirm;
          return (
            <label key={name} className="block space-y-1 text-sm">
              <span>
                {t(
                  name === 'newPassword'
                    ? 'TENANT_PROFILE.NEW_PASSWORD'
                    : 'TENANT_PROFILE.CONFIRM_PASSWORD',
                )}{' '}
                *
              </span>
              <div className="relative">
                <Input
                  type={shown ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder={t(
                    name === 'newPassword'
                      ? 'TENANT_PROFILE.NEW_PASSWORD'
                      : 'TENANT_PROFILE.CONFIRM_PASSWORD',
                  )}
                  className="pr-10"
                  aria-invalid={Boolean(errorText(name))}
                  {...form.register(name)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0"
                  aria-label={t(
                    shown
                      ? 'AUTH.SIGNIN.HIDE_PASSWORD'
                      : 'AUTH.SIGNIN.SHOW_PASSWORD',
                  )}
                  onClick={() =>
                    setVisible((current) => ({
                      ...current,
                      [name === 'newPassword' ? 'password' : 'confirm']: !shown,
                    }))
                  }
                >
                  {shown ? <EyeOff /> : <Eye />}
                </Button>
              </div>
              {errorText(name) && (
                <span className="text-destructive text-xs">
                  {errorText(name)}
                </span>
              )}
            </label>
          );
        })}
        <div className="flex justify-end">
          <Button
            type="button"
            disabled={mutations.changePassword.isPending}
            onClick={form.handleSubmit(submit)}
          >
            <KeyRound /> {t('TENANT_PROFILE.UPDATE_PASSWORD')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
