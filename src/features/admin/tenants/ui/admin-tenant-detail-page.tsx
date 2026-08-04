import { FormEvent, useEffect, useMemo, useState } from 'react';
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
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent, CardHeader } from '@/shared/ui/atoms/card';
import { Input } from '@/shared/ui/atoms/input';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { Textarea } from '@/shared/ui/atoms/textarea';
import { Container } from '@/shared/ui/molecules/container';
import { ArrowLeft, Pencil, Power, Save } from 'lucide-react';
import {
  Link,
  useBeforeUnload,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { toast } from 'sonner';
import {
  useAdminTenant,
  useDeactivateAdminTenant,
  useUpdateAdminTenant,
} from '../hooks/use-admin-tenants';
import {
  adminTenantSchema,
  tenantToInput,
  type AdminTenantInput,
} from '../model/admin-tenant';

type TenantErrors = Partial<Record<keyof AdminTenantInput, string>>;
const selectClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60';

export function AdminTenantDetailPage() {
  const { tenantId } = useParams();
  const [params, setParams] = useSearchParams();
  const session = useAuthSession();
  const { t } = useTranslations();
  const roleCode = session?.roleCode as AdminRoleCode;
  const detail = useAdminTenant(tenantId, roleCode);
  const update = useUpdateAdminTenant(tenantId ?? '');
  const deactivate = useDeactivateAdminTenant(tenantId ?? '');
  const editing = params.get('edit') === 'true';
  const [form, setForm] = useState<AdminTenantInput | null>(null);
  const [initialForm, setInitialForm] = useState<AdminTenantInput | null>(null);
  const [errors, setErrors] = useState<TenantErrors>({});
  const [discardOpen, setDiscardOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [allowNavigation, setAllowNavigation] = useState(false);
  useEffect(() => {
    if (!detail.data) return;
    const next = tenantToInput(detail.data.tenant);
    setForm(next);
    setInitialForm(next);
  }, [detail.data]);
  const dirty = useMemo(
    () =>
      Boolean(
        form &&
        initialForm &&
        JSON.stringify(form) !== JSON.stringify(initialForm),
      ),
    [form, initialForm],
  );
  useBeforeUnload(
    (event) => dirty && !allowNavigation && event.preventDefault(),
    { capture: true },
  );
  const setField = <K extends keyof AdminTenantInput>(
    field: K,
    value: AdminTenantInput[K],
  ) => {
    setForm((current) => current && { ...current, [field]: value });
    setErrors((current) => ({ ...current, [field]: undefined }));
  };
  const stopEditing = () => {
    if (dirty) setDiscardOpen(true);
    else setParams({});
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form || !detail.data || !session || update.isPending) return;
    const parsed = adminTenantSchema.safeParse(form);
    if (!parsed.success) {
      const next: TenantErrors = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof AdminTenantInput;
        next[field] ??= issue.message;
      });
      setErrors(next);
      window.setTimeout(() =>
        document
          .getElementById(String(parsed.error.issues[0]?.path[0]))
          ?.focus(),
      );
      return;
    }
    try {
      await update.mutateAsync({
        input: form,
        expectedVersion: detail.data.tenant.version,
        roleCode,
        actorId: session.user.id,
      });
      setAllowNavigation(true);
      toast.success(t('ADMIN_TENANT_DETAIL.UPDATE_SUCCESS'));
      setParams({});
      setAllowNavigation(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (['TENANT_CODE_LOCKED', 'TENANT_CODE_DUPLICATE'].includes(message))
        setErrors({ code: message });
      else
        toast.error(t(`ADMIN_TENANT_DETAIL.ERRORS.${message || 'SAVE_ERROR'}`));
    }
  };
  const confirmDeactivate = async () => {
    if (!session || deactivate.isPending) return;
    try {
      await deactivate.mutateAsync({ roleCode, actorId: session.user.id });
      toast.success(t('ADMIN_TENANT_DETAIL.DEACTIVATE_SUCCESS'));
      setDeactivateOpen(false);
    } catch {
      toast.error(t('ADMIN_TENANT_DETAIL.ERRORS.SAVE_ERROR'));
    }
  };

  if (detail.isLoading)
    return (
      <Container className="space-y-4 py-6">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-[32rem] w-full" />
      </Container>
    );
  if (detail.error || !detail.data || !tenantId)
    return (
      <Container className="text-destructive py-8 text-sm">
        {t('ADMIN_TENANT_DETAIL.NOT_FOUND')}
      </Container>
    );
  if (!form)
    return (
      <Container className="space-y-4 py-6">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-[32rem] w-full" />
      </Container>
    );
  const { tenant, dependencies, codeLocked, canEdit, canDeactivate } =
    detail.data;
  const field = (
    name: keyof AdminTenantInput,
    label: string,
    options?: { type?: string; required?: boolean },
  ) => (
    <label className="space-y-1">
      <span className="text-sm font-medium">
        {label}
        {options?.required && ' *'}
      </span>
      <Input
        id={name}
        name={name}
        placeholder={label}
        type={options?.type}
        disabled={!editing || (name === 'code' && codeLocked)}
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/tenants">
              <ArrowLeft />
              {t('ADMIN_TENANTS.TITLE')}
            </Link>
          </Button>
          <h1 className="mt-4 text-2xl font-semibold">{tenant.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-xs">
              {tenant.id}
            </span>
            <Badge
              variant={
                tenant.status === 'ACTIVE'
                  ? 'success'
                  : tenant.status === 'DRAFT'
                    ? 'warning'
                    : 'secondary'
              }
              appearance="light"
            >
              {t(`COMMON.STATUS.${tenant.status}`)}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {canDeactivate && (
            <Button
              variant="destructive"
              onClick={() => setDeactivateOpen(true)}
            >
              <Power />
              {t('ADMIN_TENANT_DETAIL.DEACTIVATE')}
            </Button>
          )}
          {canEdit && !editing && (
            <Button variant="mono" onClick={() => setParams({ edit: 'true' })}>
              <Pencil />
              {t('COMMON.EDIT')}
            </Button>
          )}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-muted-foreground text-sm">
              {t('ADMIN_TENANT_DETAIL.ACCOUNTS')}
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {dependencies.accountCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-muted-foreground text-sm">
              {t('ADMIN_TENANT_DETAIL.ASSIGNMENTS')}
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {dependencies.assignmentCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-muted-foreground text-sm">
              {t('ADMIN_TENANT_DETAIL.TRANSACTIONS')}
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {dependencies.transactionCount}
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link to={`/admin/tenants/${tenantId}/accounts`}>
            {t('ADMIN_TENANT_DETAIL.MANAGE_ACCOUNTS')}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={`/admin/tenants/${tenantId}/assignments`}>
            {t('ADMIN_TENANT_DETAIL.MANAGE_ASSIGNMENTS')}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={`/admin/tenants/${tenantId}/revenue-share`}>
            {t('ADMIN_TENANT_DETAIL.MANAGE_REVENUE')}
          </Link>
        </Button>
      </div>
      <form className="space-y-5" onSubmit={submit} noValidate>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">{t('ADMIN_TENANT_FORM.BASIC')}</h2>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {field('code', t('ADMIN_TENANT_FORM.CODE'), { required: true })}
            {field('name', t('ADMIN_TENANT_FORM.NAME'), { required: true })}
            <label className="space-y-1">
              <span className="text-sm font-medium">
                {t('COMMON.STATUS_1')} *
              </span>
              <select
                id="status"
                name="status"
                className={selectClassName}
                disabled={!editing}
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
            {field('accountOwner', t('ADMIN_TENANT_FORM.OWNER'))}
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium">
                {t('ADMIN_TENANT_FORM.NOTES')}
              </span>
              <Textarea
                id="notes"
                name="notes"
                placeholder={t('ADMIN_TENANT_FORM.NOTES')}
                rows={4}
                disabled={!editing}
                value={form.notes}
                onChange={(event) => setField('notes', event.target.value)}
              />
            </label>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">{t('ADMIN_TENANT_FORM.CONTACT')}</h2>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {field('contactName', t('ADMIN_TENANT_FORM.CONTACT_NAME'))}
            {field('contactTitle', t('ADMIN_TENANT_FORM.CONTACT_TITLE'))}
            {field('contactEmail', t('ADMIN_TENANT_FORM.CONTACT_EMAIL'), {
              type: 'email',
            })}
            {field('contactPhone', t('ADMIN_TENANT_FORM.CONTACT_PHONE'), {
              type: 'tel',
            })}
          </CardContent>
        </Card>
        {editing && (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={stopEditing}>
              {t('COMMON.CANCEL')}
            </Button>
            <Button type="submit" variant="mono" disabled={update.isPending}>
              <Save />
              {update.isPending
                ? t('COMMON.LOADING')
                : t('ADMIN_TENANT_DETAIL.SAVE')}
            </Button>
          </div>
        )}
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
                setForm(initialForm);
                setErrors({});
                setDiscardOpen(false);
                setParams({});
              }}
            >
              {t('ADMIN_TENANT_FORM.DISCARD')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('ADMIN_TENANT_DETAIL.DEACTIVATE_TITLE')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('ADMIN_TENANT_DETAIL.DEACTIVATE_DESCRIPTION', {
                accounts: dependencies.accountCount,
                assignments: dependencies.assignmentCount,
                transactions: dependencies.transactionCount,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('COMMON.CANCEL')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivate}>
              {t('ADMIN_TENANT_DETAIL.CONFIRM_DEACTIVATE')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Container>
  );
}
