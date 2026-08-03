import { FormEvent, useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import type { AdminRoleCode } from '@/shared/permissions';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Alert, AlertDescription, AlertIcon } from '@/shared/ui/atoms/alert';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Input } from '@/shared/ui/atoms/input';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { Container } from '@/shared/ui/molecules/container';
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
} from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAdminOffers } from '../hooks/use-admin-offers';
import {
  ADMIN_OFFER_DEFAULT_QUERY,
  readAdminOfferQuery,
  writeAdminOfferQuery,
  type AdminOfferQuery,
} from '../model/admin-offer';

const selectClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function formatCommission(
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | null,
  value: number | null,
) {
  if (!type || !value) return null;
  return type === 'PERCENTAGE'
    ? `${value}%`
    : new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(value);
}

export function AdminOfferListPage() {
  const { brandId } = useParams();
  const session = useAuthSession();
  const { t, language } = useTranslations();
  const [params, setParams] = useSearchParams();
  const query = readAdminOfferQuery(params);
  const [filters, setFilters] = useState(query);
  const result = useAdminOffers(
    brandId,
    query,
    session?.roleCode as AdminRoleCode,
    language === 'en' ? 'en-US' : 'vi-VN',
  );
  const setQuery = (next: AdminOfferQuery) => {
    setFilters(next);
    setParams(writeAdminOfferQuery(next));
  };
  const apply = (event: FormEvent) => {
    event.preventDefault();
    setQuery({ ...filters, page: 1, keyword: filters.keyword.trim() });
  };

  if (result.isLoading)
    return (
      <Container className="space-y-4 py-6">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-96 w-full" />
      </Container>
    );
  if (result.error || !result.data || !brandId)
    return (
      <Container className="py-6">
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
  const data = result.data;
  const from = data.totalItems ? (data.page - 1) * data.pageSize + 1 : 0;
  const to = Math.min(data.page * data.pageSize, data.totalItems);

  return (
    <Container className="space-y-5 py-6 lg:py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/admin/brands/${brandId}`}>
              <ArrowLeft />
              {t('ADMIN_OFFERS.BACK')}
            </Link>
          </Button>
          <h1 className="mt-4 text-2xl font-semibold">
            {t('ADMIN_OFFERS.TITLE')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('ADMIN_OFFERS.DESCRIPTION')}
          </p>
        </div>
        {data.canCreate && (
          <Button variant="mono" asChild>
            <Link to={`/admin/brands/${brandId}/offers/new`}>
              <Plus />
              {t('ADMIN_OFFERS.ADD')}
            </Link>
          </Button>
        )}
      </div>
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 py-4">
          <img
            className="size-14 rounded-lg border object-contain p-2"
            src={data.brand.logo?.url ?? '/media/app/mini-logo.svg'}
            alt=""
          />
          <div>
            <p className="text-xs uppercase text-muted-foreground">
              {t('ADMIN_OFFERS.BRAND_CONTEXT')}
            </p>
            <p className="font-semibold">{data.brand.name}</p>
            <p className="text-xs text-muted-foreground">
              {data.brand.id} · {data.brand.domain}
            </p>
          </div>
          <Badge
            className="ml-auto"
            variant={data.brand.status === 'ACTIVE' ? 'success' : 'warning'}
            appearance="light"
          >
            {t(`COMMON.STATUS.${data.brand.status}`)}
          </Badge>
        </CardContent>
      </Card>
      <Alert appearance="light">
        <AlertIcon>
          <AlertCircle />
        </AlertIcon>
        <AlertDescription>
          <strong>{t('ADMIN_OFFERS.MAPPING_RULE_TITLE')}:</strong>{' '}
          {t('ADMIN_OFFERS.MAPPING_RULE')}
        </AlertDescription>
      </Alert>
      <Card>
        <CardContent className="py-5">
          <form
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_auto]"
            onSubmit={apply}
          >
            <label className="space-y-1">
              <span className="text-sm font-medium">
                {t('ADMIN_OFFERS.KEYWORD')}
              </span>
              <Input
                value={filters.keyword}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    keyword: event.target.value,
                  }))
                }
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">
                {t('ADMIN_OFFERS.STATUS')}
              </span>
              <select
                className={selectClassName}
                value={filters.status}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    status: event.target.value as AdminOfferQuery['status'],
                  }))
                }
              >
                <option value="ALL">{t('ADMIN_OFFERS.ALL')}</option>
                <option value="ACTIVE">{t('COMMON.STATUS.ACTIVE')}</option>
                <option value="DRAFT">{t('COMMON.STATUS.DRAFT')}</option>
                <option value="INACTIVE">{t('COMMON.STATUS.INACTIVE')}</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">
                {t('ADMIN_OFFERS.COMMISSION_STATUS')}
              </span>
              <select
                className={selectClassName}
                value={filters.commissionStatus}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    commissionStatus: event.target
                      .value as AdminOfferQuery['commissionStatus'],
                  }))
                }
              >
                <option value="ALL">{t('ADMIN_OFFERS.ALL')}</option>
                <option value="CONFIGURED">
                  {t('ADMIN_OFFERS.CONFIGURED')}
                </option>
                <option value="NOT_CONFIGURED">
                  {t('ADMIN_OFFERS.NOT_CONFIGURED')}
                </option>
              </select>
            </label>
            <div className="flex items-end gap-2">
              <Button type="submit" variant="mono">
                <Search />
                {t('COMMON.APPLY')}
              </Button>
              <Button
                type="button"
                variant="outline"
                aria-label={t('COMMON.RESET')}
                onClick={() => setQuery(ADMIN_OFFER_DEFAULT_QUERY)}
              >
                <RotateCcw />
              </Button>
              <Button
                type="button"
                variant="outline"
                aria-label={t('COMMON.REFRESH')}
                onClick={() => result.refetch()}
              >
                <RefreshCw />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="p-3">{t('ADMIN_OFFERS.MAPPING_ID')}</th>
                  <th className="p-3">{t('ADMIN_OFFERS.OFFER_TITLE')}</th>
                  <th className="p-3">{t('ADMIN_OFFERS.BRAND_OFFER_CODE')}</th>
                  <th className="p-3">{t('ADMIN_OFFERS.BRAND_OFFER_TITLE')}</th>
                  <th className="p-3">{t('ADMIN_OFFERS.COMMISSION_TYPE')}</th>
                  <th className="p-3">{t('ADMIN_OFFERS.COMMISSION_VALUE')}</th>
                  <th className="p-3">{t('ADMIN_OFFERS.STATUS')}</th>
                  <th className="p-3">{t('COMMON.ACTIONS')}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => {
                  const commission = formatCommission(
                    item.commissionType,
                    item.commissionValue,
                  );
                  return (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="p-3 font-mono text-xs">
                        {item.mappingId ?? '-'}
                      </td>
                      <td className="max-w-40 truncate p-3 font-medium">
                        {item.title}
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {item.brandOfferCode ?? '-'}
                      </td>
                      <td className="max-w-40 truncate p-3">
                        {item.brandOfferTitle || '-'}
                      </td>
                      <td className="p-3">
                        {item.commissionType
                          ? t(`ADMIN_BRAND_MAPPINGS.${item.commissionType}`)
                          : '-'}
                      </td>
                      <td className="p-3">
                        {commission ?? (
                          <Badge variant="secondary" appearance="light">
                            {t('ADMIN_OFFERS.NOT_CONFIGURED')}
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            item.status === 'ACTIVE'
                              ? 'success'
                              : item.status === 'DRAFT'
                                ? 'warning'
                                : 'secondary'
                          }
                          appearance="light"
                        >
                          {t(`COMMON.STATUS.${item.status}`)}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            aria-label={`${t('ADMIN_OFFERS.VIEW')} ${item.title}`}
                          >
                            <Link
                              to={`/admin/brands/${brandId}/offers/${item.id}`}
                            >
                              <Eye />
                            </Link>
                          </Button>
                          {item.canEdit && (
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                              aria-label={`${t('ADMIN_OFFERS.EDIT')} ${item.title}`}
                            >
                              <Link
                                to={`/admin/brands/${brandId}/offers/${item.id}/edit`}
                              >
                                <Pencil />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {data.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="h-28 text-center text-muted-foreground"
                    >
                      {t('ADMIN_OFFERS.EMPTY')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>
          {t('ADMIN_OFFERS.SUMMARY', {
            from,
            to,
            total: data.totalItems,
            brand: data.brand.name,
          })}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={data.page <= 1}
            onClick={() => setQuery({ ...query, page: data.page - 1 })}
          >
            {t('COMMON.PREVIOUS')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={data.page >= data.totalPages}
            onClick={() => setQuery({ ...query, page: data.page + 1 })}
          >
            {t('COMMON.NEXT')}
          </Button>
        </div>
      </div>
    </Container>
  );
}
