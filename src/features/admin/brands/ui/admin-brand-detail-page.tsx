import { useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import type { AdminRoleCode } from '@/shared/permissions';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Alert, AlertDescription, AlertIcon } from '@/shared/ui/atoms/alert';
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
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { Container } from '@/shared/ui/molecules/container';
import {
  AlertCircle,
  ArrowLeft,
  FolderTree,
  Pencil,
  Power,
  Tag,
} from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useAdminBrand,
  useDeactivateAdminBrand,
} from '../hooks/use-admin-brands';
import { AdminBrandFormPage } from './admin-brand-create-page';

function BrandDetailField({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium break-words">{value}</dd>
    </div>
  );
}

export function AdminBrandDetailPage() {
  const { brandId } = useParams();
  const [searchParams] = useSearchParams();
  const session = useAuthSession();
  const { t } = useTranslations();
  const roleCode = session?.roleCode as AdminRoleCode;
  const detail = useAdminBrand(brandId, roleCode);
  const deactivate = useDeactivateAdminBrand();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (searchParams.get('edit') === 'true') {
    return <AdminBrandFormPage mode="edit" />;
  }
  if (detail.isLoading) {
    return (
      <Container
        className="space-y-4 py-6 lg:py-8"
        aria-label={t('COMMON.LOADING')}
      >
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-96 w-full" />
      </Container>
    );
  }
  if (detail.error || !detail.data) {
    return (
      <Container className="py-6 lg:py-8">
        <Alert variant="destructive" appearance="light">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertDescription>
            {t('ADMIN_BRAND_DETAIL.NOT_FOUND')}
          </AlertDescription>
        </Alert>
      </Container>
    );
  }

  const { brand, dependencies, canEdit, canDeactivate } = detail.data;
  const confirmDeactivate = async () => {
    if (!session || !brandId) return;
    try {
      await deactivate.mutateAsync({
        brandId,
        roleCode,
        actorId: session.user.id,
      });
      toast.success(t('ADMIN_BRAND_DETAIL.DEACTIVATE_SUCCESS'));
      setConfirmOpen(false);
    } catch {
      toast.error(t('ADMIN_BRAND_FORM.SAVE_ERROR'));
    }
  };

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/brands">
              <ArrowLeft />
              {t('ADMIN_BRAND_FORM.BACK')}
            </Link>
          </Button>
          <div className="mt-4 flex items-center gap-4">
            <img
              src={brand.logo?.url ?? '/media/app/mini-logo.svg'}
              alt=""
              className="bg-muted size-16 rounded-lg border object-contain p-2"
            />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {brand.name}
              </h1>
              <p className="text-muted-foreground font-mono text-sm">
                {brand.code}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to={`/admin/brands/${brand.id}/categories`}>
              <FolderTree />
              {t('ADMIN_BRAND_DETAIL.MAPPINGS')}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/admin/brands/${brand.id}/offers`}>
              <Tag />
              {t('ADMIN_BRAND_DETAIL.OFFERS')}
            </Link>
          </Button>
          {canDeactivate && (
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
              <Power />
              {t('ADMIN_BRAND_DETAIL.DEACTIVATE')}
            </Button>
          )}
          {canEdit && (
            <Button variant="mono" asChild>
              <Link to={`/admin/brands/${brand.id}?edit=true`}>
                <Pencil />
                {t('COMMON.EDIT')}
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">
              {t('ADMIN_BRAND_FORM.GENERAL')}
            </h2>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <BrandDetailField
                label={t('ADMIN_BRAND_FORM.LEGAL_NAME')}
                value={brand.legalName || '-'}
              />
              <BrandDetailField
                label={t('ADMIN_BRAND_FORM.WEBSITE')}
                value={brand.websiteUrl}
              />
              <div>
                <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {t('COMMON.STATUS_1')}
                </dt>
                <dd className="mt-1">
                  <Badge
                    variant={
                      brand.status === 'ACTIVE'
                        ? 'success'
                        : brand.status === 'DRAFT'
                          ? 'warning'
                          : 'secondary'
                    }
                    appearance="light"
                  >
                    {t(`COMMON.STATUS.${brand.status}`)}
                  </Badge>
                </dd>
              </div>
              <BrandDetailField
                label={t('ADMIN_BRAND_FORM.DEFAULT_LOCALE')}
                value={brand.defaultLocale}
              />
              <BrandDetailField
                label={t('ADMIN_BRAND_FORM.PENDING_DAYS')}
                value={brand.pendingDays}
              />
              <BrandDetailField
                label={t('ADMIN_BRAND_DETAIL.VERSION')}
                value={brand.version}
              />
              <BrandDetailField
                label={t('ADMIN_BRAND_FORM.CONTACT_NAME')}
                value={brand.contactName || '-'}
              />
              <BrandDetailField
                label={t('ADMIN_BRAND_FORM.CONTACT_EMAIL')}
                value={brand.contactEmail || '-'}
              />
              <BrandDetailField
                label={t('ADMIN_BRAND_FORM.CONTACT_PHONE')}
                value={brand.contactPhone || '-'}
              />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">
              {t('ADMIN_BRAND_DETAIL.DEPENDENCIES')}
            </h2>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-4 xl:grid-cols-1">
              <BrandDetailField
                label={t('ADMIN_BRAND_DETAIL.OFFERS')}
                value={dependencies.offerCount}
              />
              <BrandDetailField
                label={t('ADMIN_BRAND_DETAIL.ASSIGNMENTS')}
                value={dependencies.assignmentCount}
              />
              <BrandDetailField
                label={t('ADMIN_BRAND_DETAIL.MAPPINGS')}
                value={dependencies.mappingCount}
              />
              <BrandDetailField
                label={t('ADMIN_BRAND_DETAIL.TRANSACTIONS')}
                value={dependencies.transactionCount}
              />
            </dl>
            {!dependencies.canHardDelete && (
              <p className="text-muted-foreground mt-5 text-sm">
                {t('ADMIN_BRAND_DETAIL.SOFT_DELETE_ONLY')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold">
            {t('ADMIN_BRAND_FORM.CONTENT')}
          </h2>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-2">
          {brand.contents.map((content) => (
            <section key={content.locale} className="rounded-lg border p-4">
              <h3 className="font-semibold">{content.locale}</h3>
              <p className="mt-3 font-medium">{content.displayName}</p>
              <p className="mt-1 text-sm">{content.tagline}</p>
              <p className="text-muted-foreground mt-3 text-sm">
                {content.shortDescription}
              </p>
              <p className="text-muted-foreground mt-3 text-sm whitespace-pre-line">
                {content.terms}
              </p>
            </section>
          ))}
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('ADMIN_BRAND_DETAIL.DEACTIVATE_TITLE')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('ADMIN_BRAND_DETAIL.DEACTIVATE_WARNING')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-3 text-center text-sm">
            <div className="bg-muted rounded-md p-3">
              {dependencies.offerCount}
              <br />
              {t('ADMIN_BRAND_DETAIL.OFFERS')}
            </div>
            <div className="bg-muted rounded-md p-3">
              {dependencies.assignmentCount}
              <br />
              {t('ADMIN_BRAND_DETAIL.ASSIGNMENTS')}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivate.isPending}>
              {t('COMMON.CANCEL')}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deactivate.isPending}
              onClick={confirmDeactivate}
            >
              {deactivate.isPending
                ? t('COMMON.LOADING')
                : t('ADMIN_BRAND_DETAIL.CONFIRM_DEACTIVATE')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Container>
  );
}
