import { FormEvent, useMemo, useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import type { AdminRoleCode } from '@/shared/permissions';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/atoms/dialog';
import { Input } from '@/shared/ui/atoms/input';
import { Container } from '@/shared/ui/molecules/container';
import { ArrowLeft, Eye, EyeOff, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useCreateAdminTenantAccount,
  useUpdateAdminTenantAccount,
} from '../hooks/use-admin-tenant-accounts';
import {
  adminTenantAccountCreateSchema,
  adminTenantAccountEditSchema,
  TENANT_ACCOUNT_ROLES,
  type AdminTenantAccountCreateInput,
  type AdminTenantAccountView,
} from '../model/admin-tenant-account';

export type AccountDialogMode = 'create' | 'view' | 'edit' | null;
type AccountForm = AdminTenantAccountCreateInput;
type AccountErrors = Partial<Record<keyof AccountForm | 'root', string>>;
const selectClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60';

const emptyForm: AccountForm = {
  username: '',
  fullName: '',
  email: '',
  phone: '',
  roleCode: 'TENANT_VIEWER',
  status: 'ACTIVE',
  password: '',
  confirmPassword: '',
};

export function AdminTenantAccountDialog({
  tenantId,
  mode,
  account,
  requiresFirstAdmin,
  canEdit,
  onModeChange,
  presentation = 'dialog',
}: {
  tenantId: string;
  mode: Exclude<AccountDialogMode, null>;
  account: AdminTenantAccountView | null;
  requiresFirstAdmin: boolean;
  canEdit: boolean;
  onModeChange: (mode: AccountDialogMode) => void;
  presentation?: 'dialog' | 'page';
}) {
  const session = useAuthSession();
  const { t } = useTranslations();
  const create = useCreateAdminTenantAccount(tenantId);
  const update = useUpdateAdminTenantAccount(tenantId);
  const initial = useMemo<AccountForm>(() => {
    if (!account)
      return {
        ...emptyForm,
        roleCode: requiresFirstAdmin ? 'TENANT_ADMIN' : 'TENANT_VIEWER',
      };
    return {
      username: account.username,
      fullName: account.fullName,
      email: account.email,
      phone: account.phone,
      roleCode: account.roleCode,
      status: account.status === 'ACTIVE' ? 'ACTIVE' : account.status,
      password: '',
      confirmPassword: '',
    } as AccountForm;
  }, [account, requiresFirstAdmin]);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<AccountErrors>({});
  const [form, setForm] = useState<AccountForm>(initial);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const pending = create.isPending || update.isPending;
  const readOnly = mode === 'view';
  const close = () => {
    if (
      !readOnly &&
      dirty &&
      !window.confirm(t('ADMIN_TENANT_ACCOUNTS.DISCARD_CONFIRM'))
    )
      return;
    onModeChange(null);
  };
  const setField = (field: keyof AccountForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      root: undefined,
    }));
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (readOnly || !session || pending) return;
    const parsed =
      mode === 'create'
        ? adminTenantAccountCreateSchema.safeParse(form)
        : adminTenantAccountEditSchema.safeParse({
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
            roleCode: form.roleCode,
            status: form.status,
            password: form.password,
            confirmPassword: form.confirmPassword,
          });
    if (!parsed.success) {
      const next: AccountErrors = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof AccountForm;
        next[field] ??= issue.message;
      });
      setErrors(next);
      window.setTimeout(() =>
        document
          .getElementById(`account-${String(parsed.error.issues[0]?.path[0])}`)
          ?.focus(),
      );
      return;
    }
    try {
      if (mode === 'create')
        await create.mutateAsync({
          input: form,
          roleCode: session.roleCode as AdminRoleCode,
          actorId: session.user.id,
        });
      else if (account)
        await update.mutateAsync({
          accountId: account.id,
          input: {
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
            roleCode: form.roleCode,
            status: form.status,
            password: form.password,
            confirmPassword: form.confirmPassword,
          },
          expectedVersion: account.version,
          roleCode: session.roleCode as AdminRoleCode,
          actorId: session.user.id,
        });
      toast.success(
        t(
          mode === 'create'
            ? 'ADMIN_TENANT_ACCOUNTS.CREATE_SUCCESS'
            : 'ADMIN_TENANT_ACCOUNTS.UPDATE_SUCCESS',
        ),
      );
      onModeChange(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'SAVE_ERROR';
      if (message === 'USERNAME_DUPLICATE') setErrors({ username: message });
      else setErrors({ root: message });
    }
  };
  const field = (
    name: keyof AccountForm,
    label: string,
    options?: {
      type?: string;
      required?: boolean;
      disabled?: boolean;
      autoComplete?: string;
    },
  ) => (
    <label className="space-y-1">
      <span className="text-sm font-medium">
        {label}
        {options?.required && ' *'}
      </span>
      <Input
        id={`account-${name}`}
        name={name}
        placeholder={label}
        type={options?.type}
        autoComplete={options?.autoComplete}
        disabled={readOnly || options?.disabled}
        value={String(form[name])}
        onChange={(event) => setField(name, event.target.value)}
      />
      {errors[name] && (
        <p className="text-destructive text-xs" role="alert">
          {t(`ADMIN_TENANT_ACCOUNTS.ERRORS.${errors[name]}`)}
        </p>
      )}
    </label>
  );

  const titleKey = `ADMIN_TENANT_ACCOUNTS.${mode === 'create' ? 'CREATE_TITLE' : mode === 'edit' ? 'EDIT_TITLE' : 'VIEW_TITLE'}`;
  const descriptionKey = `ADMIN_TENANT_ACCOUNTS.${mode === 'create' ? 'CREATE_DESCRIPTION' : mode === 'edit' ? 'EDIT_DESCRIPTION' : 'VIEW_DESCRIPTION'}`;
  const formContent = (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        {field('username', t('ADMIN_TENANT_ACCOUNTS.USERNAME'), {
          required: mode === 'create',
          disabled: mode === 'edit',
          autoComplete: 'username',
        })}
        {field('fullName', t('ADMIN_TENANT_ACCOUNTS.FULL_NAME'), {
          required: !readOnly,
          autoComplete: 'name',
        })}
        {field('email', t('ADMIN_TENANT_ACCOUNTS.EMAIL'), {
          required: mode === 'create',
          type: 'email',
          autoComplete: 'email',
        })}
        {field('phone', t('ADMIN_TENANT_ACCOUNTS.PHONE'), {
          type: 'tel',
          autoComplete: 'tel',
        })}
        <label className="space-y-1">
          <span className="text-sm font-medium">
            {t('ADMIN_TENANT_ACCOUNTS.ROLE')} *
          </span>
          <select
            id="account-roleCode"
            name="roleCode"
            className={selectClassName}
            disabled={readOnly || (mode === 'create' && requiresFirstAdmin)}
            value={form.roleCode}
            onChange={(event) => setField('roleCode', event.target.value)}
          >
            {TENANT_ACCOUNT_ROLES.map((role) => (
              <option key={role} value={role}>
                {t(`ADMIN_TENANT_ACCOUNTS.ROLES.${role}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">{t('COMMON.STATUS_1')} *</span>
          <select
            id="account-status"
            name="status"
            className={selectClassName}
            disabled={readOnly || mode === 'create'}
            value={form.status}
            onChange={(event) => setField('status', event.target.value)}
          >
            <option value="ACTIVE">{t('COMMON.STATUS.ACTIVE')}</option>
            <option value="INACTIVE">{t('COMMON.STATUS.INACTIVE')}</option>
            <option value="LOCKED">{t('ADMIN_TENANT_ACCOUNTS.LOCKED')}</option>
          </select>
        </label>
        {readOnly ? (
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium">
              {t('ADMIN_TENANT_ACCOUNTS.PASSWORD')}
            </span>
            <Input
              id="account-password-masked"
              name="passwordMasked"
              placeholder={t('ADMIN_TENANT_ACCOUNTS.PASSWORD')}
              autoComplete="off"
              disabled
              value="••••••••"
            />
          </label>
        ) : (
          <>
            <label className="space-y-1">
              <span className="text-sm font-medium">
                {t(
                  mode === 'create'
                    ? 'ADMIN_TENANT_ACCOUNTS.INITIAL_PASSWORD'
                    : 'ADMIN_TENANT_ACCOUNTS.NEW_PASSWORD',
                )}
                {mode === 'create' && ' *'}
              </span>
              <div className="relative">
                <Input
                  id="account-password"
                  name="password"
                  placeholder={t(
                    mode === 'create'
                      ? 'ADMIN_TENANT_ACCOUNTS.INITIAL_PASSWORD'
                      : 'ADMIN_TENANT_ACCOUNTS.NEW_PASSWORD',
                  )}
                  autoComplete="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => setField('password', event.target.value)}
                />
                <Button
                  className="absolute top-0 right-0"
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={t('ADMIN_TENANT_ACCOUNTS.TOGGLE_PASSWORD')}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
              {errors.password && (
                <p className="text-destructive text-xs" role="alert">
                  {t(`ADMIN_TENANT_ACCOUNTS.ERRORS.${errors.password}`)}
                </p>
              )}
            </label>
            {field(
              'confirmPassword',
              t('ADMIN_TENANT_ACCOUNTS.CONFIRM_PASSWORD'),
              {
                required: mode === 'create',
                type: showPassword ? 'text' : 'password',
                autoComplete: 'new-password',
              },
            )}
          </>
        )}
      </div>
      {mode === 'view' && account && (
        <div className="rounded-md border p-3 text-sm">
          <p className="font-medium">
            {t('ADMIN_TENANT_ACCOUNTS.EFFECTIVE_PERMISSIONS')}
          </p>
          <p className="text-muted-foreground mt-1">
            {account.effectivePermissions.join(', ') || '-'}
          </p>
        </div>
      )}
      {errors.root && (
        <p className="text-destructive text-sm" role="alert">
          {t(`ADMIN_TENANT_ACCOUNTS.ERRORS.${errors.root}`)}
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={close}>
          {t(mode === 'view' ? 'COMMON.CLOSE' : 'COMMON.CANCEL')}
        </Button>
        {mode === 'view' && canEdit && (
          <Button
            type="button"
            variant="mono"
            onClick={() => onModeChange('edit')}
          >
            {t('ADMIN_TENANT_ACCOUNTS.EDIT_USER')}
          </Button>
        )}
        {mode !== 'view' && (
          <Button type="submit" variant="mono" disabled={pending}>
            <Save />
            {pending
              ? t('COMMON.LOADING')
              : t(
                  mode === 'create'
                    ? 'ADMIN_TENANT_ACCOUNTS.CREATE_ACCOUNT'
                    : 'ADMIN_TENANT_ACCOUNTS.SAVE',
                )}
          </Button>
        )}
      </div>
    </form>
  );

  if (presentation === 'page')
    return (
      <Container className="max-w-5xl space-y-5 py-6 lg:py-8">
        <header>
          <Button asChild variant="outline" size="sm">
            <Link to={`/admin/tenants/${tenantId}/accounts`}>
              <ArrowLeft />
              {t('COMMON.BACK')}
            </Link>
          </Button>
          <h1 className="mt-4 text-2xl font-semibold">{t(titleKey)}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t(descriptionKey)}
          </p>
        </header>
        <Card>
          <CardContent className="pt-6">{formContent}</CardContent>
        </Card>
      </Container>
    );

  return (
    <Dialog open={Boolean(mode)} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(titleKey)}</DialogTitle>
          <DialogDescription>{t(descriptionKey)}</DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
