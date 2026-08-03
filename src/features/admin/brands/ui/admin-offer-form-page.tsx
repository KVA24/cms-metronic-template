import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
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
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { Textarea } from '@/shared/ui/atoms/textarea';
import { Container } from '@/shared/ui/molecules/container';
import { ArrowLeft, Info, Save } from 'lucide-react';
import {
  Link,
  useBeforeUnload,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { toast } from 'sonner';
import { useAdminBrand } from '../hooks/use-admin-brands';
import {
  useAdminOffer,
  useCreateAdminOffer,
  useUpdateAdminOffer,
} from '../hooks/use-admin-offers';
import {
  ADMIN_OFFER_EMPTY_INPUT,
  adminOfferSchema,
  offerToInput,
  type AdminOfferInput,
} from '../model/admin-offer';

const selectClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
type OfferErrors = Partial<Record<keyof AdminOfferInput, string>>;
type SetOfferField = <K extends keyof AdminOfferInput>(
  field: K,
  value: AdminOfferInput[K],
) => void;

function FieldError({ message }: { message?: string }) {
  const { t } = useTranslations();
  return message ? (
    <p className="text-xs text-destructive" role="alert">
      {t(`ADMIN_OFFER_FORM.ERRORS.${message}`)}
    </p>
  ) : null;
}

function GeneralFields({
  form,
  errors,
  setField,
}: {
  form: AdminOfferInput;
  errors: OfferErrors;
  setField: SetOfferField;
}) {
  const { t } = useTranslations();
  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">{t('ADMIN_OFFERS.GENERAL')}</h2>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium">
            {t('ADMIN_OFFER_FORM.STATUS')} *
          </span>
          <select
            id="status"
            className={selectClassName}
            value={form.status}
            onChange={(event) =>
              setField(
                'status',
                event.target.value as AdminOfferInput['status'],
              )
            }
          >
            <option value="DRAFT">{t('COMMON.STATUS.DRAFT')}</option>
            <option value="ACTIVE">{t('COMMON.STATUS.ACTIVE')}</option>
            <option value="INACTIVE">{t('COMMON.STATUS.INACTIVE')}</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">
            {t('ADMIN_OFFER_FORM.DEFAULT_LOCALE')} *
          </span>
          <select
            id="defaultLocale"
            className={selectClassName}
            value={form.defaultLocale}
            onChange={(event) =>
              setField(
                'defaultLocale',
                event.target.value as AdminOfferInput['defaultLocale'],
              )
            }
          >
            <option value="vi-VN">vi-VN</option>
            <option value="en-US">en-US</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">
            {t('ADMIN_OFFER_FORM.START_AT')}
          </span>
          <Input
            id="startAt"
            type="datetime-local"
            value={form.startAt}
            onChange={(event) => setField('startAt', event.target.value)}
          />
          <FieldError message={errors.startAt} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">
            {t('ADMIN_OFFER_FORM.END_AT')}
          </span>
          <Input
            id="endAt"
            type="datetime-local"
            value={form.endAt}
            onChange={(event) => setField('endAt', event.target.value)}
          />
          <FieldError message={errors.endAt} />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium">
            {t('ADMIN_OFFER_FORM.DESTINATION_URL')}{' '}
            {form.status === 'ACTIVE' && '*'}
          </span>
          <Input
            id="destinationUrl"
            type="url"
            value={form.destinationUrl}
            onChange={(event) => setField('destinationUrl', event.target.value)}
          />
          <FieldError message={errors.destinationUrl} />
        </label>
      </CardContent>
    </Card>
  );
}

function ContentFields({
  form,
  errors,
  setField,
}: {
  form: AdminOfferInput;
  errors: OfferErrors;
  setField: SetOfferField;
}) {
  const { t } = useTranslations();
  const [locale, setLocale] = useState<'vi-VN' | 'en-US'>('vi-VN');
  const prefix = locale === 'vi-VN' ? 'vi' : 'en';
  const title = `${prefix}Title` as 'viTitle' | 'enTitle';
  const badge = `${prefix}Badge` as 'viBadge' | 'enBadge';
  const description = `${prefix}Description` as
    | 'viDescription'
    | 'enDescription';
  const terms = `${prefix}Terms` as 'viTerms' | 'enTerms';
  return (
    <Card>
      <CardHeader className="gap-3">
        <h2 className="font-semibold">{t('ADMIN_OFFER_FORM.CONTENT')}</h2>
        <div
          className="flex gap-2"
          role="group"
          aria-label={t('ADMIN_OFFER_FORM.CONTENT')}
        >
          {(['vi-VN', 'en-US'] as const).map((value) => (
            <Button
              key={value}
              type="button"
              variant={locale === value ? 'mono' : 'outline'}
              aria-pressed={locale === value}
              onClick={() => setLocale(value)}
            >
              {value}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">
            {t('ADMIN_OFFER_FORM.TITLE')}{' '}
            {form.status === 'ACTIVE' && form.defaultLocale === locale && '*'}
          </span>
          <Input
            id={title}
            value={form[title]}
            onChange={(event) => setField(title, event.target.value)}
          />
          <FieldError message={errors[title]} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">
            {t('ADMIN_OFFER_FORM.BADGE')}
          </span>
          <Input
            id={badge}
            value={form[badge]}
            onChange={(event) => setField(badge, event.target.value)}
          />
          <FieldError message={errors[badge]} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">
            {t('ADMIN_OFFER_FORM.DESCRIPTION_FIELD')}
          </span>
          <Textarea
            id={description}
            rows={4}
            value={form[description]}
            onChange={(event) => setField(description, event.target.value)}
          />
          <FieldError message={errors[description]} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">
            {t('ADMIN_OFFER_FORM.TERMS')}
          </span>
          <Textarea
            id={terms}
            rows={4}
            value={form[terms]}
            onChange={(event) => setField(terms, event.target.value)}
          />
          <FieldError message={errors[terms]} />
        </label>
      </CardContent>
    </Card>
  );
}

function MappingFields({
  form,
  errors,
  codeLocked,
  setField,
  requestNone,
}: {
  form: AdminOfferInput;
  errors: OfferErrors;
  codeLocked: boolean;
  setField: SetOfferField;
  requestNone: () => void;
}) {
  const { t } = useTranslations();
  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">{t('ADMIN_OFFER_FORM.MAPPING')}</h2>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium">
            {t('ADMIN_OFFER_FORM.BRAND_OFFER_CODE')}{' '}
            {form.commissionType !== 'NONE' && '*'}
          </span>
          <Input
            id="brandOfferCode"
            value={form.brandOfferCode}
            disabled={codeLocked}
            onChange={(event) => setField('brandOfferCode', event.target.value)}
          />
          {codeLocked && (
            <p className="text-xs text-muted-foreground">
              {t('ADMIN_OFFER_FORM.CODE_LOCKED')}
            </p>
          )}
          <FieldError message={errors.brandOfferCode} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">
            {t('ADMIN_OFFER_FORM.BRAND_OFFER_TITLE')}
          </span>
          <Input
            id="brandOfferTitle"
            value={form.brandOfferTitle}
            onChange={(event) =>
              setField('brandOfferTitle', event.target.value)
            }
          />
          <FieldError message={errors.brandOfferTitle} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">
            {t('ADMIN_OFFER_FORM.COMMISSION_TYPE')}
          </span>
          <select
            id="commissionType"
            className={selectClassName}
            value={form.commissionType}
            onChange={(event) => {
              const value = event.target
                .value as AdminOfferInput['commissionType'];
              if (value === 'NONE' && form.commissionType !== 'NONE')
                requestNone();
              else setField('commissionType', value);
            }}
          >
            <option value="NONE">{t('ADMIN_OFFER_FORM.NONE')}</option>
            <option value="PERCENTAGE">
              {t('ADMIN_BRAND_MAPPINGS.PERCENTAGE')}
            </option>
            <option value="FIXED_AMOUNT">
              {t('ADMIN_BRAND_MAPPINGS.FIXED_AMOUNT')}
            </option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">
            {t('ADMIN_OFFER_FORM.COMMISSION_VALUE')}{' '}
            {form.commissionType !== 'NONE' &&
              `* (${form.commissionType === 'PERCENTAGE' ? '%' : 'VND'})`}
          </span>
          <Input
            id="commissionValue"
            type="number"
            min="0"
            step={form.commissionType === 'PERCENTAGE' ? '0.01' : '1'}
            disabled={form.commissionType === 'NONE'}
            value={form.commissionValue ?? ''}
            onChange={(event) =>
              setField(
                'commissionValue',
                event.target.value ? Number(event.target.value) : null,
              )
            }
          />
          <FieldError message={errors.commissionValue} />
        </label>
      </CardContent>
    </Card>
  );
}

export function AdminOfferFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { brandId, offerId } = useParams();
  const session = useAuthSession();
  const { t } = useTranslations();
  const navigate = useNavigate();
  const roleCode = session?.roleCode as AdminRoleCode;
  const brand = useAdminBrand(brandId, roleCode);
  const detail = useAdminOffer(
    brandId,
    mode === 'edit' ? offerId : undefined,
    roleCode,
  );
  const create = useCreateAdminOffer(brandId ?? '');
  const update = useUpdateAdminOffer(brandId ?? '', offerId ?? '');
  const [form, setForm] = useState<AdminOfferInput>(ADMIN_OFFER_EMPTY_INPUT);
  const [initialForm, setInitialForm] = useState<AdminOfferInput>(
    ADMIN_OFFER_EMPTY_INPUT,
  );
  const [errors, setErrors] = useState<OfferErrors>({});
  const [allowNavigation, setAllowNavigation] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [removeCommissionOpen, setRemoveCommissionOpen] = useState(false);
  const pendingNavigation = useRef<string>();
  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialForm),
    [form, initialForm],
  );
  const pending = create.isPending || update.isPending;

  useEffect(() => {
    if (mode === 'edit' && detail.data) {
      const next = offerToInput(detail.data.offer);
      setForm(next);
      setInitialForm(next);
    }
  }, [detail.data, mode]);
  useBeforeUnload(
    (event) => dirty && !allowNavigation && event.preventDefault(),
    { capture: true },
  );
  useEffect(() => {
    if (!dirty || allowNavigation) return;
    const guard = (event: MouseEvent) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      const anchor = (event.target as Element | null)?.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank')
        return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      event.preventDefault();
      event.stopPropagation();
      pendingNavigation.current = `${url.pathname}${url.search}${url.hash}`;
      setDiscardOpen(true);
    };
    document.addEventListener('click', guard, true);
    return () => document.removeEventListener('click', guard, true);
  }, [allowNavigation, dirty]);

  const setField: SetOfferField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };
  const requestNavigation = (path: string) => {
    if (dirty && !allowNavigation) {
      pendingNavigation.current = path;
      setDiscardOpen(true);
    } else navigate(path);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (
      !session ||
      !brandId ||
      pending ||
      (mode === 'edit' && (!offerId || !detail.data))
    )
      return;
    const parsed = adminOfferSchema.safeParse(form);
    if (!parsed.success) {
      const next: OfferErrors = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof AdminOfferInput;
        next[field] ??= issue.message;
      });
      setErrors(next);
      const first = String(parsed.error.issues[0]?.path[0]);
      window.setTimeout(() => document.getElementById(first)?.focus());
      return;
    }
    try {
      if (mode === 'create')
        await create.mutateAsync({
          input: form,
          roleCode,
          actorId: session.user.id,
        });
      else
        await update.mutateAsync({
          input: form,
          expectedVersion: detail.data.offer.version,
          roleCode,
          actorId: session.user.id,
        });
      setAllowNavigation(true);
      toast.success(
        t(
          mode === 'create'
            ? 'ADMIN_OFFER_FORM.CREATE_SUCCESS'
            : 'ADMIN_OFFER_FORM.UPDATE_SUCCESS',
        ),
      );
      navigate(`/admin/brands/${brandId}/offers`, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (
        message === 'BRAND_OFFER_CODE_DUPLICATE' ||
        message === 'BRAND_OFFER_CODE_IN_USE'
      ) {
        setErrors({ brandOfferCode: message });
        document.getElementById('brandOfferCode')?.focus();
      } else
        toast.error(
          t(
            ['BRAND_NOT_ACTIVE', 'VERSION_CONFLICT'].includes(message)
              ? `ADMIN_OFFER_FORM.ERRORS.${message}`
              : 'ADMIN_OFFER_FORM.SAVE_ERROR',
          ),
        );
    }
  };

  if (brand.isLoading || (mode === 'edit' && detail.isLoading))
    return (
      <Container className="space-y-4 py-6">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-[40rem] w-full" />
      </Container>
    );
  if (!brand.data || (mode === 'edit' && !detail.data) || !brandId)
    return (
      <Container className="py-6 text-sm text-destructive">
        {t('ADMIN_BRAND_DETAIL.NOT_FOUND')}
      </Container>
    );
  const listPath = `/admin/brands/${brandId}/offers`;
  return (
    <Container className="space-y-5 py-6 lg:py-8">
      <div>
        <Button variant="outline" size="sm" asChild>
          <Link to={listPath}>
            <ArrowLeft />
            {t('ADMIN_OFFERS.TITLE')}
          </Link>
        </Button>
        <h1 className="mt-4 text-2xl font-semibold">
          {t(
            mode === 'create'
              ? 'ADMIN_OFFER_FORM.CREATE_TITLE'
              : 'ADMIN_OFFER_FORM.EDIT_TITLE',
          )}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('ADMIN_OFFER_FORM.DESCRIPTION')}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {t('ADMIN_OFFER_FORM.REQUIRED_NOTE')}
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 py-4">
          <img
            className="size-12 rounded-lg border p-2"
            src={brand.data.brand.logo?.url ?? '/media/app/mini-logo.svg'}
            alt=""
          />
          <div>
            <p className="font-semibold">{brand.data.brand.name}</p>
            <p className="text-xs text-muted-foreground">
              {brand.data.brand.id}
              {mode === 'edit' && ` · ${detail.data?.offer.id}`}
            </p>
          </div>
        </CardContent>
      </Card>
      <p className="flex gap-2 rounded-md border bg-muted p-3 text-sm">
        <Info className="size-4 shrink-0" />
        {t('ADMIN_OFFER_FORM.ATTRIBUTION_NOTICE')}
      </p>
      <form className="space-y-5" onSubmit={submit} noValidate>
        <GeneralFields form={form} errors={errors} setField={setField} />
        <ContentFields form={form} errors={errors} setField={setField} />
        <MappingFields
          form={form}
          errors={errors}
          codeLocked={Boolean(detail.data?.mappingInUse)}
          setField={setField}
          requestNone={() => setRemoveCommissionOpen(true)}
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => requestNavigation(listPath)}
          >
            {t('COMMON.CANCEL')}
          </Button>
          <Button type="submit" variant="mono" disabled={pending}>
            <Save />
            {pending
              ? t('COMMON.LOADING')
              : t(
                  mode === 'create'
                    ? 'ADMIN_OFFER_FORM.CREATE'
                    : 'ADMIN_OFFER_FORM.SAVE',
                )}
          </Button>
        </div>
      </form>
      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('ADMIN_OFFER_FORM.DISCARD_TITLE')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('ADMIN_OFFER_FORM.DISCARD_DESCRIPTION')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('ADMIN_OFFER_FORM.KEEP_EDITING')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const path = pendingNavigation.current;
                setAllowNavigation(true);
                if (path) navigate(path);
              }}
            >
              {t('ADMIN_OFFER_FORM.DISCARD')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={removeCommissionOpen}
        onOpenChange={setRemoveCommissionOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('ADMIN_OFFER_FORM.REMOVE_COMMISSION_TITLE')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('ADMIN_OFFER_FORM.REMOVE_COMMISSION_DESCRIPTION')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('COMMON.CANCEL')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setField('commissionType', 'NONE');
                setField('commissionValue', null);
              }}
            >
              {t('ADMIN_OFFER_FORM.CONFIRM_REMOVE')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Container>
  );
}

export function AdminOfferCreatePage() {
  return <AdminOfferFormPage mode="create" />;
}
export function AdminOfferEditPage() {
  return <AdminOfferFormPage mode="edit" />;
}
