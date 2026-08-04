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
import { AlertCircle, ArrowLeft, Pencil, Power } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useAdminCategory,
  useInactivateAdminCategory,
} from '../hooks/use-admin-categories';

function DetailField({
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
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}

export function AdminCategoryDetailPage() {
  const { categoryId } = useParams();
  const session = useAuthSession();
  const { t } = useTranslations();
  const roleCode = session?.roleCode as AdminRoleCode;
  const detail = useAdminCategory(categoryId, roleCode);
  const inactivate = useInactivateAdminCategory();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const confirmInactive = async () => {
    if (!categoryId || !session) return;
    try {
      await inactivate.mutateAsync({
        categoryId,
        roleCode,
        actorId: session.user.id,
      });
      toast.success(t('ADMIN_CATEGORY_FORM.INACTIVE_SUCCESS'));
      setConfirmOpen(false);
    } catch {
      toast.error(t('ADMIN_CATEGORY_FORM.SAVE_ERROR'));
    }
  };

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
          <AlertDescription className="flex items-center justify-between gap-4">
            {t('ADMIN_CATEGORY_FORM.NOT_FOUND')}
            <Button variant="outline" onClick={() => detail.refetch()}>
              {t('COMMON.RETRY')}
            </Button>
          </AlertDescription>
        </Alert>
      </Container>
    );
  }

  const { category, dependency, codeLocked, canEdit, canInactive } =
    detail.data;

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/categories">
              <ArrowLeft />
              {t('ADMIN_CATEGORY_FORM.BACK')}
            </Link>
          </Button>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            {category.contents.find(({ locale }) => locale === 'vi-VN')?.name}
          </h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">
            {category.code}
          </p>
        </div>
        <div className="flex gap-2">
          {canInactive && (
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
              <Power />
              {t('ADMIN_CATEGORY_FORM.INACTIVE')}
            </Button>
          )}
          {canEdit && (
            <Button variant="mono" asChild>
              <Link to={`/admin/categories/${category.id}/edit`}>
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
              {t('ADMIN_CATEGORY_FORM.GENERAL')}
            </h2>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <DetailField
                label={t('ADMIN_CATEGORIES.CODE')}
                value={category.code}
              />
              <DetailField
                label={t('ADMIN_CATEGORY_FORM.DISPLAY_ORDER')}
                value={category.displayOrder}
              />
              <div>
                <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {t('COMMON.STATUS_1')}
                </dt>
                <dd className="mt-1">
                  <Badge
                    variant={
                      category.status === 'ACTIVE'
                        ? 'success'
                        : category.status === 'DRAFT'
                          ? 'warning'
                          : 'secondary'
                    }
                    appearance="light"
                  >
                    {t(`COMMON.STATUS.${category.status}`)}
                  </Badge>
                </dd>
              </div>
              <DetailField
                label={t('ADMIN_CATEGORY_FORM.CODE_POLICY')}
                value={
                  codeLocked
                    ? t('ADMIN_CATEGORY_FORM.LOCKED')
                    : t('ADMIN_CATEGORY_FORM.EDITABLE')
                }
              />
              <DetailField
                label={t('ADMIN_CATEGORY_FORM.UPDATED_BY')}
                value={category.updatedBy}
              />
              <DetailField
                label={t('ADMIN_CATEGORIES.UPDATED')}
                value={new Date(category.updatedAt).toLocaleString()}
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">
              {t('ADMIN_CATEGORY_FORM.DEPENDENCIES')}
            </h2>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-3 xl:grid-cols-1">
              <DetailField
                label={t('ADMIN_CATEGORY_FORM.BRAND_MAPPINGS')}
                value={dependency.brandMappingCount}
              />
              <DetailField
                label={t('ADMIN_CATEGORY_FORM.TENANT_CONFIGS')}
                value={dependency.tenantConfigCount}
              />
              <DetailField
                label={t('ADMIN_CATEGORY_FORM.TRANSACTIONS')}
                value={dependency.transactionCount}
              />
            </dl>
            {!dependency.canHardDelete && (
              <p className="text-muted-foreground mt-5 text-sm">
                {t('ADMIN_CATEGORY_FORM.NO_HARD_DELETE')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold">
            {t('ADMIN_CATEGORY_FORM.LOCALIZED_CONTENT')}
          </h2>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-2">
          {category.contents.map((content) => (
            <section key={content.locale} className="rounded-lg border p-4">
              <h3 className="font-semibold">{content.locale}</h3>
              <p className="mt-3 font-medium">{content.name}</p>
              <p className="text-muted-foreground mt-2 text-sm">
                {content.description || '-'}
              </p>
            </section>
          ))}
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('ADMIN_CATEGORY_FORM.INACTIVE_TITLE')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('ADMIN_CATEGORY_FORM.INACTIVE_WARNING')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="bg-muted rounded-md p-3">
              {dependency.brandMappingCount}
              <br />
              {t('ADMIN_CATEGORY_FORM.BRAND_MAPPINGS')}
            </div>
            <div className="bg-muted rounded-md p-3">
              {dependency.tenantConfigCount}
              <br />
              {t('ADMIN_CATEGORY_FORM.TENANT_CONFIGS')}
            </div>
            <div className="bg-muted rounded-md p-3">
              {dependency.transactionCount}
              <br />
              {t('ADMIN_CATEGORY_FORM.TRANSACTIONS')}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={inactivate.isPending}>
              {t('COMMON.CANCEL')}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={inactivate.isPending}
              onClick={confirmInactive}
            >
              {inactivate.isPending
                ? t('COMMON.LOADING')
                : t('ADMIN_CATEGORY_FORM.CONFIRM_INACTIVE')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Container>
  );
}
