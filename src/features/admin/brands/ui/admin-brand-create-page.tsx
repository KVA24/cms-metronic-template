import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import { ArrowLeft, ImageUp, Save } from 'lucide-react';
import {
  Link,
  useBeforeUnload,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { toast } from 'sonner';
import {
  useAdminBrand,
  useCreateAdminBrand,
  useUpdateAdminBrand,
  useUploadAdminBrandLogo,
} from '../hooks/use-admin-brands';
import {
  ADMIN_BRAND_EMPTY_INPUT,
  adminBrandSchema,
  brandToInput,
  type AdminBrandInput,
} from '../model/admin-brand';

type BrandErrors = Partial<Record<keyof AdminBrandInput, string>>;
const selectClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function BrandFieldError({ message }: { message?: string }) {
  const { t } = useTranslations();
  return message ? (
    <p className="text-destructive text-xs" role="alert">
      {t(`ADMIN_BRAND_FORM.ERRORS.${message}`)}
    </p>
  ) : null;
}

export function AdminBrandFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { brandId } = useParams();
  const session = useAuthSession();
  const { t } = useTranslations();
  const navigate = useNavigate();
  const roleCode = session?.roleCode as AdminRoleCode;
  const detail = useAdminBrand(mode === 'edit' ? brandId : undefined, roleCode);
  const create = useCreateAdminBrand();
  const update = useUpdateAdminBrand();
  const upload = useUploadAdminBrandLogo();
  const [form, setForm] = useState<AdminBrandInput>(ADMIN_BRAND_EMPTY_INPUT);
  const [initialForm, setInitialForm] = useState<AdminBrandInput>(
    ADMIN_BRAND_EMPTY_INPUT,
  );
  const [errors, setErrors] = useState<BrandErrors>({});
  const [locale, setLocale] = useState<'vi-VN' | 'en-US'>('vi-VN');
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [allowNavigation, setAllowNavigation] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const pendingNavigation = useRef<string | undefined>(undefined);
  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialForm),
    [form, initialForm],
  );

  useBeforeUnload(
    (event) => dirty && !allowNavigation && event.preventDefault(),
    { capture: true },
  );
  useEffect(() => {
    if (!dirty || allowNavigation) return;

    const guardLinkNavigation = (event: MouseEvent) => {
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

    document.addEventListener('click', guardLinkNavigation, true);
    return () =>
      document.removeEventListener('click', guardLinkNavigation, true);
  }, [allowNavigation, dirty]);
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );
  useEffect(() => {
    if (mode === 'edit' && detail.data) {
      const next = brandToInput(detail.data.brand);
      setForm(next);
      setInitialForm(next);
    }
  }, [detail.data, mode]);

  const setField = <K extends keyof AdminBrandInput>(
    field: K,
    value: AdminBrandInput[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (create.isPending || update.isPending) return;
    const result = adminBrandSchema.safeParse(form);
    if (!result.success) {
      const next: BrandErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof AdminBrandInput;
        next[field] ??= issue.message;
      }
      setErrors(next);
      const first = String(result.error.issues[0]?.path[0]);
      if (first.startsWith('vi')) setLocale('vi-VN');
      if (first.startsWith('en')) setLocale('en-US');
      window.setTimeout(() => document.getElementById(first)?.focus());
      return;
    }
    if (!session) return;
    const editDetail = detail.data;
    if (mode === 'edit' && (!brandId || !editDetail)) return;
    try {
      const saved =
        mode === 'create'
          ? await create.mutateAsync({
              input: result.data,
              roleCode,
              actorId: session.user.id,
            })
          : await update.mutateAsync({
              brandId: brandId!,
              input: result.data,
              expectedVersion: editDetail!.brand.version,
              roleCode,
              actorId: session.user.id,
            });
      toast.success(
        t(
          mode === 'create'
            ? 'ADMIN_BRAND_FORM.CREATE_SUCCESS'
            : 'ADMIN_BRAND_FORM.UPDATE_SUCCESS',
        ),
      );
      setAllowNavigation(true);
      navigate(
        mode === 'create' ? '/admin/brands' : `/admin/brands/${saved.id}`,
        {
          replace: true,
        },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message === 'BRAND_CODE_DUPLICATE') {
        setErrors({ code: message });
        document.getElementById('code')?.focus();
      } else if (message === 'BRAND_DEFAULT_CATEGORY_REQUIRED') {
        setErrors({ status: message });
        document.getElementById('status')?.focus();
      } else if (message === 'BRAND_CODE_IMMUTABLE') {
        setErrors({ code: message });
        document.getElementById('code')?.focus();
      } else if (message === 'VERSION_CONFLICT') {
        toast.error(t('ADMIN_BRAND_FORM.ERRORS.VERSION_CONFLICT'));
      } else {
        toast.error(t('ADMIN_BRAND_FORM.SAVE_ERROR'));
      }
    }
  };

  const uploadLogo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    try {
      const logo = await upload.mutateAsync({
        input: {
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        },
        roleCode,
      });
      setField('logo', logo);
    } catch {
      setErrors((current) => ({ ...current, logo: 'LOGO_INVALID' }));
    }
  };

  const prefix = locale === 'vi-VN' ? 'vi' : 'en';
  const displayName = `${prefix}DisplayName` as
    | 'viDisplayName'
    | 'enDisplayName';
  const tagline = `${prefix}Tagline` as 'viTagline' | 'enTagline';
  const shortDescription = `${prefix}ShortDescription` as
    | 'viShortDescription'
    | 'enShortDescription';
  const terms = `${prefix}Terms` as 'viTerms' | 'enTerms';
  const requestNavigation = (path: string) => {
    if (dirty && !allowNavigation) {
      pendingNavigation.current = path;
      setDiscardOpen(true);
      return;
    }
    navigate(path);
  };

  if (mode === 'edit' && detail.isLoading) {
    return (
      <Container
        className="space-y-4 py-6 lg:py-8"
        aria-label={t('COMMON.LOADING')}
      >
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-[40rem] w-full" />
      </Container>
    );
  }

  if (mode === 'edit' && (detail.error || !detail.data)) {
    return (
      <Container className="py-6 lg:py-8">
        <p className="text-destructive text-sm">
          {t('ADMIN_BRAND_FORM.NOT_FOUND')}
        </p>
      </Container>
    );
  }

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/brands">
            <ArrowLeft />
            {t('ADMIN_BRAND_FORM.BACK')}
          </Link>
        </Button>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          {t(
            mode === 'create'
              ? 'ADMIN_BRAND_FORM.TITLE'
              : 'ADMIN_BRAND_FORM.EDIT_TITLE',
          )}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t('ADMIN_BRAND_FORM.DESCRIPTION')}
        </p>
      </div>

      <form className="space-y-5" onSubmit={submit} noValidate>
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">
              {t('ADMIN_BRAND_FORM.GENERAL')}
            </h2>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium">
                {t('ADMIN_BRAND_FORM.CODE')} *
              </span>
              <Input
                id="code"
                name="code"
                placeholder={t('ADMIN_BRAND_FORM.CODE')}
                value={form.code}
                disabled={detail.data?.codeLocked}
                aria-invalid={Boolean(errors.code)}
                onChange={(event) => setField('code', event.target.value)}
              />
              {detail.data?.codeLocked && (
                <p className="text-muted-foreground text-xs">
                  {t('ADMIN_BRAND_FORM.CODE_LOCKED')}
                </p>
              )}
              <BrandFieldError message={errors.code} />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">
                {t('ADMIN_BRAND_FORM.LEGAL_NAME')}
              </span>
              <Input
                id="legalName"
                name="legalName"
                placeholder={t('ADMIN_BRAND_FORM.LEGAL_NAME')}
                value={form.legalName}
                aria-invalid={Boolean(errors.legalName)}
                onChange={(event) => setField('legalName', event.target.value)}
              />
              <BrandFieldError message={errors.legalName} />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">
                {t('ADMIN_BRAND_FORM.WEBSITE')} *
              </span>
              <Input
                id="websiteUrl"
                name="websiteUrl"
                type="url"
                placeholder={t('ADMIN_BRAND_FORM.WEBSITE')}
                value={form.websiteUrl}
                aria-invalid={Boolean(errors.websiteUrl)}
                onChange={(event) => setField('websiteUrl', event.target.value)}
              />
              <BrandFieldError message={errors.websiteUrl} />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">
                {t('COMMON.STATUS_1')} *
              </span>
              <select
                id="status"
                name="status"
                className={selectClassName}
                value={form.status}
                aria-invalid={Boolean(errors.status)}
                onChange={(event) =>
                  setField(
                    'status',
                    event.target.value as AdminBrandInput['status'],
                  )
                }
              >
                <option value="DRAFT">{t('COMMON.STATUS.DRAFT')}</option>
                <option value="ACTIVE">{t('COMMON.STATUS.ACTIVE')}</option>
                <option value="INACTIVE">{t('COMMON.STATUS.INACTIVE')}</option>
              </select>
              <BrandFieldError message={errors.status} />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">
                {t('ADMIN_BRAND_FORM.DEFAULT_LOCALE')} *
              </span>
              <select
                id="defaultLocale"
                name="defaultLocale"
                className={selectClassName}
                value={form.defaultLocale}
                onChange={(event) =>
                  setField(
                    'defaultLocale',
                    event.target.value as AdminBrandInput['defaultLocale'],
                  )
                }
              >
                <option value="vi-VN">vi-VN</option>
                <option value="en-US">en-US</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">
                {t('ADMIN_BRAND_FORM.PENDING_DAYS')} *
              </span>
              <Input
                id="pendingDays"
                name="pendingDays"
                type="number"
                placeholder={t('ADMIN_BRAND_FORM.PENDING_DAYS')}
                min={0}
                value={form.pendingDays}
                aria-invalid={Boolean(errors.pendingDays)}
                onChange={(event) =>
                  setField('pendingDays', Number(event.target.value))
                }
              />
              <BrandFieldError message={errors.pendingDays} />
            </label>
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="logo" className="text-sm font-medium">
                {t('ADMIN_BRAND_FORM.LOGO')}
              </label>
              <div className="flex items-center gap-4">
                <img
                  src={
                    previewUrl ?? form.logo?.url ?? '/media/app/mini-logo.svg'
                  }
                  alt={t('ADMIN_BRAND_FORM.LOGO_PREVIEW')}
                  className="bg-muted size-20 rounded-lg border object-contain p-2"
                />
                <Button type="button" variant="outline" asChild>
                  <label htmlFor="logo" className="cursor-pointer">
                    <ImageUp />
                    {t('ADMIN_BRAND_FORM.CHOOSE_LOGO')}
                  </label>
                </Button>
                <input
                  id="logo"
                  name="logo"
                  className="sr-only"
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={uploadLogo}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                {t('ADMIN_BRAND_FORM.LOGO_HINT')}
              </p>
              <BrandFieldError message={errors.logo} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">
              {t('ADMIN_BRAND_FORM.CONTACT')}
            </h2>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium">
                {t('ADMIN_BRAND_FORM.CONTACT_NAME')}
              </span>
              <Input
                id="contactName"
                name="contactName"
                placeholder={t('ADMIN_BRAND_FORM.CONTACT_NAME')}
                value={form.contactName}
                onChange={(event) =>
                  setField('contactName', event.target.value)
                }
              />
              <BrandFieldError message={errors.contactName} />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">
                {t('ADMIN_BRAND_FORM.CONTACT_EMAIL')}
              </span>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                placeholder={t('ADMIN_BRAND_FORM.CONTACT_EMAIL')}
                value={form.contactEmail}
                onChange={(event) =>
                  setField('contactEmail', event.target.value)
                }
              />
              <BrandFieldError message={errors.contactEmail} />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">
                {t('ADMIN_BRAND_FORM.CONTACT_PHONE')}
              </span>
              <Input
                id="contactPhone"
                name="contactPhone"
                placeholder={t('ADMIN_BRAND_FORM.CONTACT_PHONE')}
                value={form.contactPhone}
                onChange={(event) =>
                  setField('contactPhone', event.target.value)
                }
              />
              <BrandFieldError message={errors.contactPhone} />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">
                {t('ADMIN_BRAND_FORM.NOTES')}
              </span>
              <Textarea
                id="notes"
                name="notes"
                placeholder={t('ADMIN_BRAND_FORM.NOTES')}
                rows={3}
                value={form.notes}
                onChange={(event) => setField('notes', event.target.value)}
              />
              <BrandFieldError message={errors.notes} />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-3">
            <h2 className="text-base font-semibold">
              {t('ADMIN_BRAND_FORM.CONTENT')}
            </h2>
            <div
              className="flex gap-2"
              role="group"
              aria-label={t('ADMIN_BRAND_FORM.LOCALES')}
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
          <CardContent className="space-y-5">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">
                {t('ADMIN_BRAND_FORM.DISPLAY_NAME')}{' '}
                {form.defaultLocale === locale && '*'}
              </span>
              <Input
                id={displayName}
                name={displayName}
                placeholder={t('ADMIN_BRAND_FORM.DISPLAY_NAME')}
                value={form[displayName]}
                aria-invalid={Boolean(errors[displayName])}
                onChange={(event) => setField(displayName, event.target.value)}
              />
              <BrandFieldError message={errors[displayName]} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">
                {t('ADMIN_BRAND_FORM.TAGLINE')}
              </span>
              <Input
                id={tagline}
                name={tagline}
                placeholder={t('ADMIN_BRAND_FORM.TAGLINE')}
                value={form[tagline]}
                onChange={(event) => setField(tagline, event.target.value)}
              />
              <BrandFieldError message={errors[tagline]} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">
                {t('ADMIN_BRAND_FORM.SHORT_DESCRIPTION')}
              </span>
              <Textarea
                id={shortDescription}
                name={shortDescription}
                placeholder={t('ADMIN_BRAND_FORM.SHORT_DESCRIPTION')}
                rows={4}
                value={form[shortDescription]}
                onChange={(event) =>
                  setField(shortDescription, event.target.value)
                }
              />
              <BrandFieldError message={errors[shortDescription]} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">
                {t('ADMIN_BRAND_FORM.TERMS')}
              </span>
              <Textarea
                id={terms}
                name={terms}
                placeholder={t('ADMIN_BRAND_FORM.TERMS')}
                rows={4}
                value={form[terms]}
                onChange={(event) => setField(terms, event.target.value)}
              />
              <BrandFieldError message={errors[terms]} />
            </label>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              requestNavigation(
                mode === 'create'
                  ? '/admin/brands'
                  : `/admin/brands/${brandId}`,
              )
            }
          >
            {t('COMMON.CANCEL')}
          </Button>
          <Button
            type="submit"
            variant="mono"
            disabled={create.isPending || update.isPending || upload.isPending}
          >
            <Save />
            {create.isPending || update.isPending
              ? t('COMMON.LOADING')
              : t(
                  mode === 'create' ? 'ADMIN_BRAND_FORM.CREATE' : 'COMMON.SAVE',
                )}
          </Button>
        </div>
      </form>

      <AlertDialog
        open={discardOpen}
        onOpenChange={(open) => {
          setDiscardOpen(open);
          if (!open) pendingNavigation.current = undefined;
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('ADMIN_BRAND_FORM.DISCARD_TITLE')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('ADMIN_BRAND_FORM.DISCARD_DESCRIPTION')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('ADMIN_BRAND_FORM.KEEP_EDITING')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const path = pendingNavigation.current;
                setAllowNavigation(true);
                setDiscardOpen(false);
                if (path) navigate(path);
              }}
            >
              {t('ADMIN_BRAND_FORM.DISCARD')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Container>
  );
}

export function AdminBrandCreatePage() {
  return <AdminBrandFormPage mode="create" />;
}
