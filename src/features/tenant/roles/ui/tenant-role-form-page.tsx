import { useEffect, useRef, useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Alert, AlertDescription, AlertIcon } from '@/shared/ui/atoms/alert';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Input } from '@/shared/ui/atoms/input';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { Textarea } from '@/shared/ui/atoms/textarea';
import { Container } from '@/shared/ui/molecules/container';
import { AlertCircle, ArrowLeft, Save } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useTenantRoleDetail,
  useTenantRoleMutations,
} from '../hooks/use-tenant-roles';
import {
  tenantRoleCreateSchema,
  type TenantRoleCreateInput,
} from '../model/tenant-role';

const initialValue: TenantRoleCreateInput = {
  code: '',
  name: '',
  description: '',
  status: 'ACTIVE',
};

export function TenantRoleFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { roleId = '' } = useParams();
  const session = useAuthSession();
  const { t } = useTranslations();
  const navigate = useNavigate();
  const detail = useTenantRoleDetail(session, mode === 'edit' ? roleId : '');
  const mutations = useTenantRoleMutations(session);
  const [form, setForm] = useState(initialValue);
  const initialRef = useRef(initialValue);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mode === 'edit' && detail.data) {
      const value = {
        code: detail.data.code,
        name: detail.data.name,
        description: detail.data.description,
        status: detail.data.status,
      };
      setForm(value);
      initialRef.current = value;
    }
  }, [detail.data, mode]);

  const dirty = JSON.stringify(form) !== JSON.stringify(initialRef.current);
  const cancel = () => {
    if (!dirty || window.confirm(t('TENANT_ROLES.FORM.DISCARD'))) {
      navigate('/tenant/account/roles');
    }
  };
  const submit = async () => {
    const parsed = tenantRoleCreateSchema.safeParse({
      ...form,
      code: form.code.trim().toUpperCase(),
    });
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            String(issue.path[0]),
            t(`TENANT_ROLES.ERRORS.${issue.message}`),
          ]),
        ),
      );
      return;
    }
    setErrors({});
    try {
      if (mode === 'create') {
        await mutations.create.mutateAsync(parsed.data);
        toast.success(t('TENANT_ROLES.FORM.CREATE_SUCCESS'));
      } else {
        await mutations.update.mutateAsync({
          roleId,
          input: {
            name: parsed.data.name,
            description: parsed.data.description,
            status: parsed.data.status,
            version: detail.data!.version,
          },
        });
        toast.success(t('TENANT_ROLES.FORM.UPDATE_SUCCESS'));
      }
      navigate('/tenant/account/roles');
    } catch (error) {
      const code = error instanceof Error ? error.message : 'UNKNOWN';
      if (code === 'ROLE_ID_EXISTS')
        setErrors({ code: t('TENANT_ROLES.ERRORS.ROLE_ID_EXISTS') });
      else
        toast.error(
          t(`TENANT_ROLES.ERRORS.${code}`, {
            defaultValue: t('TENANT_ROLES.ERROR'),
          }),
        );
    }
  };

  if (mode === 'edit' && detail.isLoading)
    return (
      <Container className="py-8">
        <Skeleton className="h-96 w-full" />
      </Container>
    );
  if (mode === 'edit' && (detail.isError || detail.data?.type !== 'CUSTOM'))
    return (
      <Container className="py-8">
        <Alert variant="destructive">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertDescription>
            {t('TENANT_ROLES.SYSTEM_READ_ONLY')}
          </AlertDescription>
        </Alert>
      </Container>
    );

  const pending = mutations.create.isPending || mutations.update.isPending;
  return (
    <Container width="fluid" className="max-w-3xl space-y-5 pb-8">
      <header>
        <Button asChild variant="ghost" className="-ml-3 mb-2">
          <Link to="/tenant/account/roles">
            <ArrowLeft /> {t('COMMON.BACK')}
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">
          {t(
            `TENANT_ROLES.FORM.${mode === 'create' ? 'CREATE_TITLE' : 'EDIT_TITLE'}`,
          )}
        </h1>
      </header>
      <Card>
        <CardContent className="space-y-5 pt-5">
          <label className="block space-y-1 text-sm">
            <span>{t('TENANT_ROLES.CODE')} *</span>
            <Input
              name="code"
              value={form.code}
              disabled={mode === 'edit'}
              onChange={(event) =>
                setForm({ ...form, code: event.target.value })
              }
              aria-invalid={Boolean(errors.code)}
            />
            {errors.code && (
              <span className="text-xs text-destructive">{errors.code}</span>
            )}
          </label>
          <label className="block space-y-1 text-sm">
            <span>{t('TENANT_ROLES.NAME')} *</span>
            <Input
              name="name"
              value={form.name}
              maxLength={100}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && (
              <span className="text-xs text-destructive">{errors.name}</span>
            )}
          </label>
          <label className="block space-y-1 text-sm">
            <span>{t('TENANT_ROLES.REMARK')}</span>
            <Textarea
              name="description"
              value={form.description}
              maxLength={500}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              aria-invalid={Boolean(errors.description)}
            />
            <span className="text-xs text-muted-foreground">
              {form.description.length}/500
            </span>
            {errors.description && (
              <span className="block text-xs text-destructive">
                {errors.description}
              </span>
            )}
          </label>
          <label className="block space-y-1 text-sm">
            <span>{t('COMMON.STATUS_1')} *</span>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              name="status"
              value={form.status}
              onChange={(event) =>
                setForm({
                  ...form,
                  status: event.target.value as TenantRoleCreateInput['status'],
                })
              }
            >
              <option value="ACTIVE">{t('COMMON.STATUS.ACTIVE')}</option>
              <option value="INACTIVE">{t('COMMON.STATUS.INACTIVE')}</option>
            </select>
          </label>
          {mode === 'edit' &&
            form.status === 'INACTIVE' &&
            detail.data!.assignedUsers > 0 && (
              <Alert>
                <AlertIcon>
                  <AlertCircle />
                </AlertIcon>
                <AlertDescription>
                  {t('TENANT_ROLES.FORM.INACTIVE_WARNING', {
                    count: detail.data!.assignedUsers,
                  })}
                </AlertDescription>
              </Alert>
            )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={cancel}>
              {t('COMMON.CANCEL')}
            </Button>
            <Button onClick={submit} disabled={pending}>
              <Save />{' '}
              {pending
                ? t('COMMON.LOADING')
                : t(
                    `TENANT_ROLES.FORM.${mode === 'create' ? 'CREATE' : 'SAVE'}`,
                  )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
