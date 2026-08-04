import { FormEvent, useMemo, useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import type { AdminRoleCode } from '@/shared/permissions';
import { useAuthSession } from '@/shared/stores/auth-store';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/atoms/alert-dialog';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent, CardHeader } from '@/shared/ui/atoms/card';
import { Input } from '@/shared/ui/atoms/input';
import { Textarea } from '@/shared/ui/atoms/textarea';
import { Container } from '@/shared/ui/molecules/container';
import { ArrowLeft, Save } from 'lucide-react';
import { Link, useBeforeUnload, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCreateAdminTenant } from '../hooks/use-admin-tenants';
import {
  ADMIN_TENANT_EMPTY_INPUT,
  adminTenantSchema,
  type AdminTenantInput,
} from '../model/admin-tenant';

type TenantErrors = Partial<Record<keyof AdminTenantInput, string>>;
const selectClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function AdminTenantCreatePage() {
  const session = useAuthSession();
  const { t } = useTranslations();
  const navigate = useNavigate();
  const create = useCreateAdminTenant();
  const [form, setForm] = useState(ADMIN_TENANT_EMPTY_INPUT);
  const [errors, setErrors] = useState<TenantErrors>({});
  const [discardOpen, setDiscardOpen] = useState(false);
  const [allowNavigation, setAllowNavigation] = useState(false);
  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(ADMIN_TENANT_EMPTY_INPUT),
    [form],
  );
  useBeforeUnload(
    (event) => dirty && !allowNavigation && event.preventDefault(),
    { capture: true },
  );
  const setField = <K extends keyof AdminTenantInput>(
    field: K,
    value: AdminTenantInput[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!session || create.isPending) return;
    const parsed = adminTenantSchema.safeParse(form);
    if (!parsed.success) {
      const next: TenantErrors = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof AdminTenantInput;
        next[field] ??= issue.message;
      });
      setErrors(next);
      const first = String(parsed.error.issues[0]?.path[0]);
      window.setTimeout(() => document.getElementById(first)?.focus());
      return;
    }
    try {
      await create.mutateAsync({
        input: form,
        roleCode: session.roleCode as AdminRoleCode,
        actorId: session.user.id,
      });
      setAllowNavigation(true);
      toast.success(t('ADMIN_TENANT_FORM.CREATE_SUCCESS'));
      navigate('/admin/tenants', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message === 'TENANT_CODE_DUPLICATE') {
        setErrors({ code: message });
        document.getElementById('code')?.focus();
      } else toast.error(t('ADMIN_TENANT_FORM.SAVE_ERROR'));
    }
  };
  const field = (
    name: keyof AdminTenantInput,
    label: string,
    options?: { type?: string; required?: boolean; maxLength?: number },
  ) => (
    <label className="space-y-1">
      <span className="text-sm font-medium">
        {label}
        {options?.required && ' *'}
      </span>
      <Input
        id={name}
        name={name}
        type={options?.type}
        maxLength={options?.maxLength}
        value={String(form[name])}
        onChange={(event) => setField(name, event.target.value)}
      />
      {errors[name] && (
        <p className="text-destructive text-xs" role="alert">
          {t(`ADMIN_TENANT_FORM.ERRORS.${errors[name]}`)}
        </p>
      )}
    </label>
  );

  return (
    <Container className="space-y-5 py-6 lg:py-8">
      <div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/tenants">
            <ArrowLeft />
            {t('ADMIN_TENANTS.TITLE')}
          </Link>
        </Button>
        <h1 className="mt-4 text-2xl font-semibold">
          {t('ADMIN_TENANT_FORM.CREATE_TITLE')}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t('ADMIN_TENANT_FORM.CREATE_DESCRIPTION')}
        </p>
      </div>
      <form className="space-y-5" onSubmit={submit} noValidate>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">{t('ADMIN_TENANT_FORM.BASIC')}</h2>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {field('code', t('ADMIN_TENANT_FORM.CODE'), {
              required: true,
              maxLength: 50,
            })}
            {field('name', t('ADMIN_TENANT_FORM.NAME'), {
              required: true,
              maxLength: 255,
            })}
            <label className="space-y-1">
              <span className="text-sm font-medium">
                {t('COMMON.STATUS_1')} *
              </span>
              <select
                id="status"
                name="status"
                className={selectClassName}
                value={form.status}
                onChange={(event) =>
                  setField(
                    'status',
                    event.target.value as AdminTenantInput['status'],
                  )
                }
              >
                <option value="DRAFT">{t('COMMON.STATUS.DRAFT')}</option>
                <option value="ACTIVE">{t('COMMON.STATUS.ACTIVE')}</option>
                <option value="INACTIVE">{t('COMMON.STATUS.INACTIVE')}</option>
              </select>
            </label>
            {field('accountOwner', t('ADMIN_TENANT_FORM.OWNER'), {
              maxLength: 120,
            })}
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium">
                {t('ADMIN_TENANT_FORM.NOTES')}
              </span>
              <Textarea
                id="notes"
                name="notes"
                rows={4}
                maxLength={2000}
                value={form.notes}
                onChange={(event) => setField('notes', event.target.value)}
              />
              {errors.notes && (
                <p className="text-destructive text-xs" role="alert">
                  {t(`ADMIN_TENANT_FORM.ERRORS.${errors.notes}`)}
                </p>
              )}
            </label>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">{t('ADMIN_TENANT_FORM.CONTACT')}</h2>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {field('contactName', t('ADMIN_TENANT_FORM.CONTACT_NAME'), {
              maxLength: 120,
            })}
            {field('contactTitle', t('ADMIN_TENANT_FORM.CONTACT_TITLE'), {
              maxLength: 120,
            })}
            {field('contactEmail', t('ADMIN_TENANT_FORM.CONTACT_EMAIL'), {
              type: 'email',
              maxLength: 254,
            })}
            {field('contactPhone', t('ADMIN_TENANT_FORM.CONTACT_PHONE'), {
              type: 'tel',
              maxLength: 30,
            })}
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              dirty ? setDiscardOpen(true) : navigate('/admin/tenants')
            }
          >
            {t('COMMON.CANCEL')}
          </Button>
          <Button type="submit" variant="mono" disabled={create.isPending}>
            <Save />
            {create.isPending
              ? t('COMMON.LOADING')
              : t('ADMIN_TENANT_FORM.CREATE')}
          </Button>
        </div>
      </form>
      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('ADMIN_TENANT_FORM.DISCARD_TITLE')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('ADMIN_TENANT_FORM.DISCARD_DESCRIPTION')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('ADMIN_TENANT_FORM.KEEP_EDITING')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setAllowNavigation(true);
                navigate('/admin/tenants');
              }}
            >
              {t('ADMIN_TENANT_FORM.DISCARD')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Container>
  );
}
