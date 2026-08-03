import { useTranslations } from '@/shared/hooks/use-translations';
import type { AdminRoleCode } from '@/shared/permissions';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Alert, AlertDescription, AlertIcon } from '@/shared/ui/atoms/alert';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent, CardHeader } from '@/shared/ui/atoms/card';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { Container } from '@/shared/ui/molecules/container';
import { AlertCircle, ArrowLeft, LockKeyhole, Pencil } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAdminOffer } from '../hooks/use-admin-offers';

const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
});

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
    </div>
  );
}

export function AdminOfferDetailPage() {
  const { brandId, offerId } = useParams();
  const session = useAuthSession();
  const { t } = useTranslations();
  const detail = useAdminOffer(
    brandId,
    offerId,
    session?.roleCode as AdminRoleCode,
  );
  if (detail.isLoading)
    return (
      <Container className="space-y-4 py-6">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-96 w-full" />
      </Container>
    );
  if (detail.error || !detail.data || !brandId || !offerId)
    return (
      <Container className="py-6">
        <Alert variant="destructive" appearance="light">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertDescription>{t('ADMIN_OFFERS.EMPTY')}</AlertDescription>
        </Alert>
      </Container>
    );
  const { brand, offer, mappingInUse, commissionConfigured, canEdit } =
    detail.data;
  const commission = !commissionConfigured
    ? t('ADMIN_OFFERS.NOT_CONFIGURED')
    : offer.commissionType === 'PERCENTAGE'
      ? `${offer.commissionValue}%`
      : vndFormatter.format(offer.commissionValue ?? 0);

  return (
    <Container className="space-y-5 py-6 lg:py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/admin/brands/${brandId}/offers`}>
              <ArrowLeft />
              {t('ADMIN_OFFERS.TITLE')}
            </Link>
          </Button>
          <h1 className="mt-4 text-2xl font-semibold">{offer.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('ADMIN_OFFERS.DETAIL_TITLE')}
          </p>
        </div>
        {canEdit && (
          <Button variant="mono" asChild>
            <Link to={`/admin/brands/${brandId}/offers/${offerId}/edit`}>
              <Pencil />
              {t('COMMON.EDIT')}
            </Link>
          </Button>
        )}
      </div>
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 py-4">
          <img
            className="size-14 rounded-lg border object-contain p-2"
            src={brand.logo?.url ?? '/media/app/mini-logo.svg'}
            alt=""
          />
          <div>
            <p className="font-semibold">{brand.name}</p>
            <p className="text-xs text-muted-foreground">
              {brand.id} · {brand.domain}
            </p>
          </div>
          <Badge
            className="ml-auto"
            variant={brand.status === 'ACTIVE' ? 'success' : 'warning'}
            appearance="light"
          >
            {t(`COMMON.STATUS.${brand.status}`)}
          </Badge>
        </CardContent>
      </Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">{t('ADMIN_OFFERS.GENERAL')}</h2>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <Field label={t('ADMIN_OFFERS.OFFER_ID')} value={offer.id} />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t('ADMIN_OFFERS.STATUS')}
                </dt>
                <dd className="mt-1">
                  <Badge
                    variant={
                      offer.status === 'ACTIVE'
                        ? 'success'
                        : offer.status === 'DRAFT'
                          ? 'warning'
                          : 'secondary'
                    }
                    appearance="light"
                  >
                    {t(`COMMON.STATUS.${offer.status}`)}
                  </Badge>
                </dd>
              </div>
              <Field
                label={t('ADMIN_OFFERS.START_AT')}
                value={offer.startAt ?? '-'}
              />
              <Field
                label={t('ADMIN_OFFERS.END_AT')}
                value={offer.endAt ?? '-'}
              />
              <Field
                label={t('ADMIN_OFFERS.DESTINATION_URL')}
                value={offer.destinationUrl || '-'}
              />
              <Field
                label={t('ADMIN_BRAND_FORM.DEFAULT_LOCALE')}
                value={offer.defaultLocale}
              />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">
              {t('ADMIN_OFFERS.MAPPING_COMMISSION')}
            </h2>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <Field
                label={t('ADMIN_OFFERS.MAPPING_ID')}
                value={offer.mappingId ?? '-'}
              />
              <Field
                label={t('ADMIN_OFFERS.BRAND_OFFER_CODE')}
                value={offer.brandOfferCode ?? '-'}
              />
              <Field
                label={t('ADMIN_OFFERS.BRAND_OFFER_TITLE')}
                value={offer.brandOfferTitle || '-'}
              />
              <Field
                label={t('ADMIN_OFFERS.COMMISSION_TYPE')}
                value={
                  offer.commissionType
                    ? t(`ADMIN_BRAND_MAPPINGS.${offer.commissionType}`)
                    : '-'
                }
              />
              <Field
                label={t('ADMIN_OFFERS.COMMISSION_VALUE')}
                value={commission}
              />
            </dl>
            {mappingInUse && (
            <p className="mt-5 flex items-start gap-2 rounded-md bg-muted p-3 text-sm text-foreground">
                <LockKeyhole className="mt-0.5 size-4 shrink-0" />
                {t('ADMIN_OFFERS.MAPPING_IN_USE')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <h2 className="font-semibold">
            {t('ADMIN_OFFERS.LOCALIZED_CONTENT')}
          </h2>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          {offer.contents.map((content) => (
            <section key={content.locale} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{content.locale}</h3>
                {content.badge && (
                  <Badge variant="info" appearance="light">
                    {content.badge}
                  </Badge>
                )}
              </div>
              <p className="mt-3 font-medium">{content.title}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                {content.description || '-'}
              </p>
              <p className="mt-3 whitespace-pre-line text-sm">
                <span className="font-medium">{t('ADMIN_OFFERS.TERMS')}:</span>{' '}
                {content.terms || '-'}
              </p>
            </section>
          ))}
        </CardContent>
      </Card>
    </Container>
  );
}
