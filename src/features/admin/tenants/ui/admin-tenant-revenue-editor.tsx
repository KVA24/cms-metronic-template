import { FormEvent, useMemo, useState } from 'react';
import type { Brand, Tenant, TenantRevenueShare } from '@/shared/contracts';
import { useTranslations } from '@/shared/hooks/use-translations';
import { formatDateOnly, parseDateOnly } from '@/shared/lib/date-utils';
import type { AdminRoleCode } from '@/shared/permissions';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent, CardHeader } from '@/shared/ui/atoms/card';
import { DatePicker } from '@/shared/ui/atoms/date-picker';
import { Input } from '@/shared/ui/atoms/input';
import { Container } from '@/shared/ui/molecules/container';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { Link, useBeforeUnload, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSaveAdminTenantRevenue } from '../hooks/use-admin-tenant-revenue';
import {
  adminTenantRevenueSchema,
  revenueToInput,
  type AdminTenantRevenueInput,
  type AdminTenantRevenueOverrideInput,
} from '../model/admin-tenant-revenue';

const selectClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm';
type RevenueContext = {
  tenant: Tenant;
  brand: Brand;
  config: TenantRevenueShare | null;
  categories: Array<{ id: string; name: string }>;
  offers: Array<{ id: string; name: string; status: string }>;
  visible: boolean;
  canEdit: boolean;
};

export function AdminTenantRevenueEditor({ data }: { data: RevenueContext }) {
  const session = useAuthSession();
  const { t } = useTranslations();
  const navigate = useNavigate();
  const save = useSaveAdminTenantRevenue(data.tenant.id, data.brand.id);
  const initial = useMemo(() => revenueToInput(data.config), [data.config]);
  const [form, setForm] = useState(initial);
  const [addType, setAddType] = useState<'CATEGORY' | 'OFFER'>('CATEGORY');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  useBeforeUnload((event) => dirty && event.preventDefault(), {
    capture: true,
  });
  const listPath = `/admin/tenants/${data.tenant.id}/revenue-share`;
  const setRoot = <K extends keyof AdminTenantRevenueInput>(
    field: K,
    value: AdminTenantRevenueInput[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors({});
  };
  const updateOverride = (
    clientId: string,
    patch: Partial<AdminTenantRevenueOverrideInput>,
  ) => {
    setRoot(
      'overrides',
      form.overrides.map((row) =>
        row.clientId === clientId ? { ...row, ...patch } : row,
      ),
    );
  };
  const addOverride = () =>
    setRoot('overrides', [
      ...form.overrides,
      {
        clientId: `new-${form.overrides.length + 1}`,
        type: addType,
        targetId: '',
        rate: null,
        status: 'DRAFT',
      },
    ]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!session || save.isPending) return;
    const parsed = adminTenantRevenueSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        next[issue.path.join('.')] ??= issue.message;
      });
      setErrors(next);
      return;
    }
    try {
      await save.mutateAsync({
        input: form,
        expectedVersion: data.config?.version ?? null,
        roleCode: session.roleCode as AdminRoleCode,
        actorId: session.user.id,
      });
      toast.success(t('ADMIN_TENANT_REVENUE.SAVE_SUCCESS'));
      navigate(listPath, { replace: true });
    } catch (error) {
      toast.error(
        t(
          `ADMIN_TENANT_REVENUE.ERRORS.${error instanceof Error ? error.message : 'SAVE_ERROR'}`,
        ),
      );
    }
  };
  const cancel = () => {
    if (!dirty || window.confirm(t('ADMIN_TENANT_REVENUE.DISCARD_CONFIRM')))
      navigate(listPath);
  };

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <div>
        <Button variant="outline" size="sm" asChild>
          <Link to={listPath}>
            <ArrowLeft />
            {t('ADMIN_TENANT_REVENUE.TITLE')}
          </Link>
        </Button>
        <h1 className="mt-4 text-2xl font-semibold">
          {t('ADMIN_TENANT_REVENUE.UPDATE_TITLE')}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {data.tenant.name} · {data.brand.name} · {data.brand.id}
        </p>
        <Badge
          className="mt-2"
          variant={data.visible ? 'success' : 'secondary'}
          appearance="light"
        >
          {t(`ADMIN_TENANT_REVENUE.${data.visible ? 'VISIBLE' : 'HIDDEN'}`)}
        </Badge>
      </div>
      <form className="space-y-5" onSubmit={submit} noValidate>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">
              {t('ADMIN_TENANT_REVENUE.DEFAULT_RULE')}
            </h2>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1">
              <span className="text-sm font-medium">
                {t('ADMIN_TENANT_REVENUE.BRAND_RATE')}
              </span>
              <div className="relative">
                <Input
                  id="brandRate"
                  name="brandRate"
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={form.brandRate ?? ''}
                  onChange={(event) =>
                    setRoot(
                      'brandRate',
                      event.target.value ? Number(event.target.value) : null,
                    )
                  }
                />
                <span className="text-muted-foreground absolute top-2.5 right-3 text-sm">
                  %
                </span>
              </div>
              {errors.brandRate && (
                <p className="text-destructive text-xs" role="alert">
                  {t(`ADMIN_TENANT_REVENUE.ERRORS.${errors.brandRate}`)}
                </p>
              )}
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">
                {t('ADMIN_TENANT_REVENUE.EFFECTIVE_FROM')}
              </span>
              <DatePicker
                value={parseDateOnly(form.effectiveFrom)}
                placeholder={t('ADMIN_TENANT_REVENUE.EFFECTIVE_FROM')}
                ariaLabel={t('ADMIN_TENANT_REVENUE.EFFECTIVE_FROM')}
                showClearButton={false}
                onChange={(date) =>
                  setRoot('effectiveFrom', formatDateOnly(date))
                }
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">
                {t('COMMON.STATUS_1')} *
              </span>
              <select
                id="revenue-rule-status"
                name="status"
                className={selectClassName}
                value={form.status}
                onChange={(event) =>
                  setRoot(
                    'status',
                    event.target.value as AdminTenantRevenueInput['status'],
                  )
                }
              >
                <option value="DRAFT">{t('COMMON.STATUS.DRAFT')}</option>
                <option value="ACTIVE">{t('COMMON.STATUS.ACTIVE')}</option>
                <option value="INACTIVE">{t('COMMON.STATUS.INACTIVE')}</option>
              </select>
            </label>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <h2 className="font-semibold">
              {t('ADMIN_TENANT_REVENUE.OVERRIDES')}
            </h2>
            <div className="flex gap-2">
              <select
                id="revenue-add-type"
                name="addType"
                aria-label={t('ADMIN_TENANT_REVENUE.ADD_TYPE')}
                className={selectClassName}
                value={addType}
                onChange={(event) =>
                  setAddType(event.target.value as 'CATEGORY' | 'OFFER')
                }
              >
                <option value="CATEGORY">
                  {t('ADMIN_TENANT_REVENUE.CATEGORY')}
                </option>
                <option value="OFFER">{t('ADMIN_TENANT_REVENUE.OFFER')}</option>
              </select>
              <Button type="button" variant="outline" onClick={addOverride}>
                <Plus />
                {t('COMMON.ADD')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {form.overrides.length === 0 && (
              <p className="text-muted-foreground py-8 text-center text-sm">
                {t('ADMIN_TENANT_REVENUE.NO_OVERRIDES')}
              </p>
            )}
            {form.overrides.map((row, index) => {
              const targets =
                row.type === 'CATEGORY' ? data.categories : data.offers;
              return (
                <div
                  key={row.clientId}
                  className="grid gap-3 rounded-md border p-3 md:grid-cols-[8rem_1fr_9rem_9rem_auto]"
                >
                  <div className="self-center text-sm font-medium">
                    {t(`ADMIN_TENANT_REVENUE.${row.type}`)}
                  </div>
                  <label className="space-y-1">
                    <span className="sr-only">
                      {t(`ADMIN_TENANT_REVENUE.${row.type}`)}
                    </span>
                    <select
                      id={`override-target-${index}`}
                      name={`overrides.${index}.targetId`}
                      className={selectClassName}
                      value={row.targetId}
                      onChange={(event) =>
                        updateOverride(row.clientId, {
                          targetId: event.target.value,
                        })
                      }
                    >
                      <option value="">
                        {t('ADMIN_TENANT_REVENUE.SELECT_TARGET')}
                      </option>
                      {targets.map((target) => (
                        <option key={target.id} value={target.id}>
                          {target.name}
                        </option>
                      ))}
                    </select>
                    {errors[`overrides.${index}.targetId`] && (
                      <p className="text-destructive text-xs" role="alert">
                        {t(
                          `ADMIN_TENANT_REVENUE.ERRORS.${errors[`overrides.${index}.targetId`]}`,
                        )}
                      </p>
                    )}
                  </label>
                  <label className="space-y-1">
                    <span className="sr-only">
                      {t('ADMIN_TENANT_REVENUE.RATE')}
                    </span>
                    <Input
                      id={`override-rate-${index}`}
                      name={`overrides.${index}.rate`}
                      type="number"
                      min="0.01"
                      max="100"
                      step="0.01"
                      placeholder="%"
                      value={row.rate ?? ''}
                      onChange={(event) =>
                        updateOverride(row.clientId, {
                          rate: event.target.value
                            ? Number(event.target.value)
                            : null,
                        })
                      }
                    />
                    {errors[`overrides.${index}.rate`] && (
                      <p className="text-destructive text-xs" role="alert">
                        {t(
                          `ADMIN_TENANT_REVENUE.ERRORS.${errors[`overrides.${index}.rate`]}`,
                        )}
                      </p>
                    )}
                  </label>
                  <select
                    id={`override-status-${index}`}
                    name={`overrides.${index}.status`}
                    aria-label={t('COMMON.STATUS_1')}
                    className={selectClassName}
                    value={row.status}
                    onChange={(event) =>
                      updateOverride(row.clientId, {
                        status: event.target
                          .value as AdminTenantRevenueInput['status'],
                      })
                    }
                  >
                    <option value="DRAFT">{t('COMMON.STATUS.DRAFT')}</option>
                    <option value="ACTIVE">{t('COMMON.STATUS.ACTIVE')}</option>
                    <option value="INACTIVE">
                      {t('COMMON.STATUS.INACTIVE')}
                    </option>
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={t('COMMON.DELETE')}
                    onClick={() =>
                      setRoot(
                        'overrides',
                        form.overrides.filter(
                          (item) => item.clientId !== row.clientId,
                        ),
                      )
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <p className="bg-muted rounded-md border p-3 text-sm">
          {t('ADMIN_TENANT_REVENUE.PRIORITY_NOTICE')}
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={cancel}>
            {t('COMMON.CANCEL')}
          </Button>
          <Button
            type="submit"
            variant="mono"
            disabled={!data.canEdit || save.isPending}
          >
            <Save />
            {save.isPending
              ? t('COMMON.LOADING')
              : t('ADMIN_TENANT_REVENUE.SAVE_CONFIG')}
          </Button>
        </div>
      </form>
    </Container>
  );
}
