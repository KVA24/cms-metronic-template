import { useEffect, useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Alert, AlertDescription, AlertIcon } from '@/shared/ui/atoms/alert';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Input } from '@/shared/ui/atoms/input';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { Container } from '@/shared/ui/molecules/container';
import { AlertCircle, ArrowLeft, Eye, EyeOff, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useTenantAccountDetail,
  useTenantAccountMutations,
  useTenantAccountRoles,
} from '../hooks/use-tenant-accounts';
import {
  tenantAccountCreateSchema,
  tenantAccountUpdateSchema,
  type TenantAccountCreateInput,
  type TenantAccountUpdateInput,
} from '../model/tenant-account';

type AccountFormValue = TenantAccountCreateInput & { version: number };

const initialValue: AccountFormValue = {
  username: '',
  fullName: '',
  email: '',
  phone: '',
  roleId: '',
  status: 'ACTIVE',
  password: '',
  confirmPassword: '',
  version: 1,
};

export function TenantAccountFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { userId = '' } = useParams();
  const session = useAuthSession();
  const { t } = useTranslations();
  const navigate = useNavigate();
  const detail = useTenantAccountDetail(session, mode === 'edit' ? userId : '');
  const roles = useTenantAccountRoles(session);
  const mutations = useTenantAccountMutations(session);
  const [visible, setVisible] = useState({ password: false, confirm: false });
  const form = useForm<AccountFormValue>({ defaultValues: initialValue });

  useEffect(() => {
    if (mode === 'edit' && detail.data) {
      form.reset({
        username: detail.data.username,
        fullName: detail.data.fullName,
        email: detail.data.email,
        phone: detail.data.phone,
        roleId: detail.data.roleId,
        status: detail.data.status,
        password: '',
        confirmPassword: '',
        version: detail.data.version,
      });
    }
  }, [detail.data, form, mode]);

  const cancel = () => {
    if (
      !form.formState.isDirty ||
      window.confirm(t('TENANT_ACCOUNTS.FORM.DISCARD'))
    ) {
      navigate('/tenant/account/users');
    }
  };

  const submit = async (value: AccountFormValue) => {
    const parsed =
      mode === 'create'
        ? tenantAccountCreateSchema.safeParse(value)
        : tenantAccountUpdateSchema.safeParse(value);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        form.setError(issue.path[0] as keyof AccountFormValue, {
          message: issue.message,
        });
      }
      return;
    }
    try {
      if (mode === 'create') {
        await mutations.create.mutateAsync(
          parsed.data as TenantAccountCreateInput,
        );
        toast.success(t('TENANT_ACCOUNTS.FORM.CREATE_SUCCESS'));
      } else {
        await mutations.update.mutateAsync({
          accountId: userId,
          input: parsed.data as TenantAccountUpdateInput,
        });
        toast.success(t('TENANT_ACCOUNTS.FORM.UPDATE_SUCCESS'));
      }
      navigate('/tenant/account/users');
    } catch (error) {
      const code = error instanceof Error ? error.message : 'UNKNOWN';
      if (code === 'USERNAME_DUPLICATE') {
        form.setError('username', { message: code });
      } else {
        toast.error(
          t(`TENANT_ACCOUNTS.ERRORS.${code}`, {
            defaultValue: t('TENANT_ACCOUNTS.ERROR'),
          }),
        );
      }
    }
  };

  if (mode === 'edit' && detail.isLoading)
    return (
      <Container className="py-8">
        <Skeleton className="h-96 w-full" />
      </Container>
    );
  if (mode === 'edit' && (detail.isError || !detail.data))
    return (
      <Container className="py-8">
        <Alert variant="destructive">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertDescription>{t('TENANT_ACCOUNTS.NOT_FOUND')}</AlertDescription>
        </Alert>
      </Container>
    );

  const fieldError = (name: keyof AccountFormValue) => {
    const message = form.formState.errors[name]?.message;
    return message ? t(`TENANT_ACCOUNTS.ERRORS.${message}`) : null;
  };
  const pending = mutations.create.isPending || mutations.update.isPending;
  const selectClassName =
    'h-9 w-full rounded-md border border-input bg-background px-3 text-sm';

  return (
    <Container width="fluid" className="max-w-3xl space-y-5 pb-8">
      <header>
        <Button asChild variant="ghost" className="-ml-3 mb-2">
          <Link to="/tenant/account/users">
            <ArrowLeft /> {t('COMMON.BACK')}
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">
          {t(
            `TENANT_ACCOUNTS.FORM.${mode === 'create' ? 'CREATE_TITLE' : 'EDIT_TITLE'}`,
          )}
        </h1>
      </header>
      <Card>
        <CardContent className="space-y-5 pt-5">
          <label className="block space-y-1 text-sm">
            <span>{t('TENANT_ACCOUNTS.USERNAME')} *</span>
            <Input
              autoComplete="username"
              disabled={mode === 'edit'}
              aria-invalid={Boolean(fieldError('username'))}
              {...form.register('username')}
            />
            {fieldError('username') && (
              <span className="text-xs text-destructive">
                {fieldError('username')}
              </span>
            )}
          </label>
          <label className="block space-y-1 text-sm">
            <span>{t('TENANT_ACCOUNTS.FULL_NAME')} *</span>
            <Input
              maxLength={150}
              aria-invalid={Boolean(fieldError('fullName'))}
              {...form.register('fullName')}
            />
            {fieldError('fullName') && (
              <span className="text-xs text-destructive">
                {fieldError('fullName')}
              </span>
            )}
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span>{t('TENANT_ACCOUNTS.EMAIL')}</span>
              <Input
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(fieldError('email'))}
                {...form.register('email')}
              />
              {fieldError('email') && (
                <span className="text-xs text-destructive">
                  {fieldError('email')}
                </span>
              )}
            </label>
            <label className="block space-y-1 text-sm">
              <span>{t('TENANT_ACCOUNTS.PHONE')}</span>
              <Input
                autoComplete="tel"
                aria-invalid={Boolean(fieldError('phone'))}
                {...form.register('phone')}
              />
              {fieldError('phone') && (
                <span className="text-xs text-destructive">
                  {fieldError('phone')}
                </span>
              )}
            </label>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span>{t('TENANT_ACCOUNTS.ROLE')} *</span>
              <select
                className={selectClassName}
                aria-invalid={Boolean(fieldError('roleId'))}
                {...form.register('roleId')}
              >
                <option value="">
                  {t('TENANT_ACCOUNTS.FORM.SELECT_ROLE')}
                </option>
                {roles.data?.map((role) => (
                  <option key={role.id} value={role.id} disabled={!role.active}>
                    {role.name}
                    {!role.active ? ` — ${t('COMMON.STATUS.INACTIVE')}` : ''}
                  </option>
                ))}
              </select>
              {fieldError('roleId') && (
                <span className="text-xs text-destructive">
                  {fieldError('roleId')}
                </span>
              )}
            </label>
            <label className="block space-y-1 text-sm">
              <span>{t('COMMON.STATUS_1')} *</span>
              <select className={selectClassName} {...form.register('status')}>
                <option value="ACTIVE">{t('COMMON.STATUS.ACTIVE')}</option>
                <option value="INACTIVE">{t('COMMON.STATUS.INACTIVE')}</option>
                <option value="LOCKED">{t('COMMON.STATUS.LOCKED')}</option>
              </select>
            </label>
          </div>
          {(['password', 'confirmPassword'] as const).map((name) => {
            const shown =
              name === 'password' ? visible.password : visible.confirm;
            return (
              <label key={name} className="block space-y-1 text-sm">
                <span>
                  {t(
                    name === 'password'
                      ? 'TENANT_ACCOUNTS.FORM.INITIAL_PASSWORD'
                      : 'TENANT_ACCOUNTS.FORM.CONFIRM_PASSWORD',
                  )}
                  {mode === 'create' ? ' *' : ''}
                </span>
                <div className="relative">
                  <Input
                    type={shown ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="pr-10"
                    aria-invalid={Boolean(fieldError(name))}
                    {...form.register(name)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    aria-label={t(
                      shown
                        ? 'AUTH.SIGNIN.HIDE_PASSWORD'
                        : 'AUTH.SIGNIN.SHOW_PASSWORD',
                    )}
                    onClick={() =>
                      setVisible((current) => ({
                        ...current,
                        [name === 'password' ? 'password' : 'confirm']: !shown,
                      }))
                    }
                  >
                    {shown ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
                {fieldError(name) && (
                  <span className="text-xs text-destructive">
                    {fieldError(name)}
                  </span>
                )}
              </label>
            );
          })}
          {mode === 'edit' && (
            <p className="text-xs text-muted-foreground">
              {t('TENANT_ACCOUNTS.FORM.PASSWORD_OPTIONAL')}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={cancel}>
              {t('COMMON.CANCEL')}
            </Button>
            <Button
              type="button"
              disabled={pending}
              onClick={form.handleSubmit(submit)}
            >
              <Save />
              {pending
                ? t('COMMON.LOADING')
                : t(
                    `TENANT_ACCOUNTS.FORM.${mode === 'create' ? 'CREATE' : 'SAVE'}`,
                  )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
