import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
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
import { Alert, AlertDescription, AlertIcon } from '@/shared/ui/atoms/alert';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent, CardHeader } from '@/shared/ui/atoms/card';
import { Input } from '@/shared/ui/atoms/input';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { Textarea } from '@/shared/ui/atoms/textarea';
import { Container } from '@/shared/ui/molecules/container';
import { AlertCircle, ArrowLeft, ImageUp, Save } from 'lucide-react';
import {
  Link,
  useBeforeUnload,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { toast } from 'sonner';
import type { z } from 'zod';
import {
  useAdminCategory,
  useCreateAdminCategory,
  useUpdateAdminCategory,
  useUploadAdminCategoryIcon,
} from '../hooks/use-admin-categories';
import {
  adminCategorySchema,
  ADMIN_CATEGORY_EMPTY_INPUT,
  categoryToInput,
  type AdminCategoryInput,
} from '../model/admin-category';

const selectClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

type FieldErrors = Partial<Record<keyof AdminCategoryInput, string>>;
type ParsedCategoryInput = z.output<typeof adminCategorySchema>;

function FieldError({ message }: { message?: string }) {
  const { t } = useTranslations();
  if (!message) return null;
  return (
    <p className="text-xs text-destructive" role="alert">
      {t(`ADMIN_CATEGORY_FORM.ERRORS.${message}`)}
    </p>
  );
}

export function AdminCategoryFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { categoryId } = useParams();
  const session = useAuthSession();
  const { t } = useTranslations();
  const navigate = useNavigate();
  const roleCode = session?.roleCode as AdminRoleCode;
  const detail = useAdminCategory(mode === 'edit' ? categoryId : undefined, roleCode);
  const create = useCreateAdminCategory();
  const update = useUpdateAdminCategory();
  const upload = useUploadAdminCategoryIcon();
  const [form, setForm] = useState<AdminCategoryInput>(ADMIN_CATEGORY_EMPTY_INPUT);
  const [initialForm, setInitialForm] = useState<AdminCategoryInput>(ADMIN_CATEGORY_EMPTY_INPUT);
  const [activeLocale, setActiveLocale] = useState<'vi-VN' | 'en-US'>('vi-VN');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [allowNavigation, setAllowNavigation] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string>();
  const [inactiveConfirmation, setInactiveConfirmation] = useState<ParsedCategoryInput>();
  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialForm),
    [form, initialForm],
  );
  const isPending = create.isPending || update.isPending;

  useBeforeUnload(
    (event) => {
      if (dirty && !allowNavigation) event.preventDefault();
    },
    { capture: true },
  );

  useEffect(() => {
    if (mode === 'edit' && detail.data) {
      const next = categoryToInput(detail.data.category);
      setForm(next);
      setInitialForm(next);
    }
  }, [detail.data, mode]);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  useEffect(() => {
    if (!dirty || allowNavigation) return;

    const guardLinkNavigation = (event: MouseEvent) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank') return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingNavigation(`${url.pathname}${url.search}${url.hash}`);
      setDiscardOpen(true);
    };

    document.addEventListener('click', guardLinkNavigation, true);
    return () => document.removeEventListener('click', guardLinkNavigation, true);
  }, [allowNavigation, dirty]);

  const setField = <K extends keyof AdminCategoryInput>(
    field: K,
    value: AdminCategoryInput[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const save = async (input: ParsedCategoryInput) => {
    if (!session) return;
    try {
      const saved =
        mode === 'create'
          ? await create.mutateAsync({
              input,
              roleCode,
              actorId: session.user.id,
            })
          : await update.mutateAsync({
              categoryId: categoryId!,
              input,
              roleCode,
              actorId: session.user.id,
            });
      setAllowNavigation(true);
      toast.success(
        t(
          mode === 'create'
            ? 'ADMIN_CATEGORY_FORM.CREATE_SUCCESS'
            : 'ADMIN_CATEGORY_FORM.UPDATE_SUCCESS',
        ),
      );
      navigate(`/admin/categories/${saved.id}`, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message === 'CATEGORY_CODE_DUPLICATE' || message === 'CATEGORY_CODE_IMMUTABLE') {
        setErrors({ code: message });
        document.getElementById('code')?.focus();
      } else {
        toast.error(t('ADMIN_CATEGORY_FORM.SAVE_ERROR'));
      }
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = adminCategorySchema.safeParse(form);
    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof AdminCategoryInput;
        nextErrors[field] ??= issue.message;
      }
      setErrors(nextErrors);
      const firstField = result.error.issues[0]?.path[0];
      if (firstField === 'viName' || firstField === 'viDescription') {
        setActiveLocale('vi-VN');
      }
      if (firstField === 'enName' || firstField === 'enDescription') {
        setActiveLocale('en-US');
      }
      window.setTimeout(() => document.getElementById(String(firstField))?.focus());
      return;
    }
    setErrors({});
    if (
      mode === 'edit' &&
      detail.data?.category.status !== 'INACTIVE' &&
      result.data.status === 'INACTIVE'
    ) {
      setInactiveConfirmation(result.data);
      return;
    }
    void save(result.data);
  };

  const uploadIcon = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    try {
      const metadata = await upload.mutateAsync({
        input: {
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        },
        roleCode,
      });
      setField('icon', metadata);
    } catch {
      setErrors((current) => ({ ...current, icon: 'ICON_INVALID' }));
    }
  };

  const requestNavigation = (path: string) => {
    if (dirty && !allowNavigation) {
      setPendingNavigation(path);
      setDiscardOpen(true);
      return;
    }
    navigate(path);
  };

  if (mode === 'edit' && detail.isLoading) {
    return (
      <Container className="space-y-4 py-6 lg:py-8" aria-label={t('COMMON.LOADING')}>
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-[32rem] w-full" />
      </Container>
    );
  }

  if (mode === 'edit' && (detail.error || !detail.data)) {
    return (
      <Container className="py-6 lg:py-8">
        <Alert variant="destructive" appearance="light">
          <AlertIcon><AlertCircle /></AlertIcon>
          <AlertDescription>{t('ADMIN_CATEGORY_FORM.NOT_FOUND')}</AlertDescription>
        </Alert>
      </Container>
    );
  }

  const localeNameField = activeLocale === 'vi-VN' ? 'viName' : 'enName';
  const localeDescriptionField =
    activeLocale === 'vi-VN' ? 'viDescription' : 'enDescription';

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/categories"><ArrowLeft />{t('ADMIN_CATEGORY_FORM.BACK')}</Link>
        </Button>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          {t(mode === 'create' ? 'ADMIN_CATEGORY_FORM.CREATE_TITLE' : 'ADMIN_CATEGORY_FORM.EDIT_TITLE')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('ADMIN_CATEGORY_FORM.DESCRIPTION')}
        </p>
      </div>

      <form className="space-y-5" onSubmit={submit} noValidate>
        <Card>
          <CardHeader><h2 className="text-base font-semibold">{t('ADMIN_CATEGORY_FORM.GENERAL')}</h2></CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium">{t('ADMIN_CATEGORIES.CODE')} *</span>
              <Input
                id="code"
                name="code"
                value={form.code}
                disabled={detail.data?.codeLocked}
                aria-invalid={Boolean(errors.code)}
                onChange={(event) => setField('code', event.target.value)}
              />
              {detail.data?.codeLocked && <p className="text-xs text-muted-foreground">{t('ADMIN_CATEGORY_FORM.CODE_LOCKED_HINT')}</p>}
              <FieldError message={errors.code} />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">{t('ADMIN_CATEGORY_FORM.DISPLAY_ORDER')}</span>
              <Input
                id="displayOrder"
                name="displayOrder"
                type="number"
                min={0}
                max={9999}
                value={form.displayOrder}
                aria-invalid={Boolean(errors.displayOrder)}
                onChange={(event) => setField('displayOrder', Number(event.target.value))}
              />
              <FieldError message={errors.displayOrder} />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">{t('COMMON.STATUS_1')} *</span>
              <select
                id="status"
                name="status"
                className={selectClassName}
                value={form.status}
                onChange={(event) => setField('status', event.target.value as AdminCategoryInput['status'])}
              >
                {['ACTIVE', 'DRAFT', 'INACTIVE'].map((status) => (
                  <option key={status} value={status}>{t(`COMMON.STATUS.${status}`)}</option>
                ))}
              </select>
            </label>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="icon">{t('ADMIN_CATEGORY_FORM.ICON')}</label>
              <div className="flex items-center gap-4">
                <img
                  src={previewUrl ?? form.icon?.url ?? '/media/app/mini-logo.svg'}
                  alt={t('ADMIN_CATEGORY_FORM.ICON_PREVIEW')}
                  className="size-16 rounded-lg border bg-muted object-contain p-2"
                />
                <Button type="button" variant="outline" asChild>
                  <label htmlFor="icon" className="cursor-pointer"><ImageUp />{t('ADMIN_CATEGORY_FORM.CHOOSE_ICON')}</label>
                </Button>
                <input
                  id="icon"
                  name="icon"
                  className="sr-only"
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={uploadIcon}
                />
              </div>
              <p className="text-xs text-muted-foreground">{t('ADMIN_CATEGORY_FORM.ICON_HINT')}</p>
              <FieldError message={errors.icon} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-3">
            <div>
              <h2 className="text-base font-semibold">{t('ADMIN_CATEGORY_FORM.LOCALIZED_CONTENT')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t('ADMIN_CATEGORY_FORM.LOCALE_HINT')}</p>
            </div>
            <div className="flex gap-2" role="group" aria-label={t('ADMIN_CATEGORY_FORM.LOCALE_TABS')}>
              {(['vi-VN', 'en-US'] as const).map((locale) => (
                <Button
                  key={locale}
                  type="button"
                  variant={activeLocale === locale ? 'mono' : 'outline'}
                  aria-pressed={activeLocale === locale}
                  onClick={() => setActiveLocale(locale)}
                >
                  {locale}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">
                {t('ADMIN_CATEGORIES.NAME')} {activeLocale === 'vi-VN' && '*'}
              </span>
              <Input
                id={localeNameField}
                name={localeNameField}
                value={String(form[localeNameField])}
                aria-invalid={Boolean(errors[localeNameField])}
                onChange={(event) => setField(localeNameField, event.target.value)}
              />
              <FieldError message={errors[localeNameField]} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">{t('COMMON.DESCRIPTION')}</span>
              <Textarea
                id={localeDescriptionField}
                name={localeDescriptionField}
                rows={5}
                maxLength={500}
                value={String(form[localeDescriptionField])}
                aria-invalid={Boolean(errors[localeDescriptionField])}
                onChange={(event) => setField(localeDescriptionField, event.target.value)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <FieldError message={errors[localeDescriptionField]} />
                <span>{String(form[localeDescriptionField]).length}/500</span>
              </div>
            </label>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => requestNavigation('/admin/categories')}>
            {t('COMMON.CANCEL')}
          </Button>
          <Button type="submit" variant="mono" disabled={isPending || upload.isPending}>
            <Save />{isPending ? t('COMMON.LOADING') : t('COMMON.SAVE')}
          </Button>
        </div>
      </form>

      <AlertDialog
        open={discardOpen}
        onOpenChange={(open) => {
          setDiscardOpen(open);
          if (!open) setPendingNavigation(undefined);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('ADMIN_CATEGORY_FORM.DISCARD_TITLE')}</AlertDialogTitle>
            <AlertDialogDescription>{t('ADMIN_CATEGORY_FORM.DISCARD_DESCRIPTION')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('ADMIN_CATEGORY_FORM.KEEP_EDITING')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const path = pendingNavigation;
                setAllowNavigation(true);
                setDiscardOpen(false);
                if (path) navigate(path);
              }}
            >
              {t('ADMIN_CATEGORY_FORM.DISCARD')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(inactiveConfirmation)}
        onOpenChange={(open) => !open && setInactiveConfirmation(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('ADMIN_CATEGORY_FORM.INACTIVE_TITLE')}</AlertDialogTitle>
            <AlertDialogDescription>{t('ADMIN_CATEGORY_FORM.INACTIVE_WARNING')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('COMMON.CANCEL')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (inactiveConfirmation) void save(inactiveConfirmation);
                setInactiveConfirmation(undefined);
              }}
            >
              {t('ADMIN_CATEGORY_FORM.CONFIRM_INACTIVE')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Container>
  );
}
