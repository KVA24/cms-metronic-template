import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import type { AdminRoleCode } from '@/shared/permissions';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Alert, AlertDescription, AlertIcon } from '@/shared/ui/atoms/alert';
import { Button } from '@/shared/ui/atoms/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/shared/ui/atoms/card';
import { Input } from '@/shared/ui/atoms/input';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { Container } from '@/shared/ui/molecules/container';
import {
  AlertCircle,
  Download,
  RefreshCw,
  RotateCcw,
  Search,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';
import {
  useAdminDashboard,
  useAdminDashboardExport,
  useAdminDashboardFilterOptions,
} from '../hooks/use-admin-dashboard';
import {
  ADMIN_DASHBOARD_DEFAULT_QUERY,
  readAdminDashboardQuery,
  type AdminDashboardQuery,
} from '../model/admin-dashboard';

function useAdminDashboardPageModel() {
  const session = useAuthSession();
  const { t, language } = useTranslations();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() =>
    readAdminDashboardQuery(searchParams),
  );
  const [draft, setDraft] = useState(query);
  const roleCode = session?.roleCode as AdminRoleCode;
  const dashboard = useAdminDashboard(query, roleCode);
  const filterOptions = useAdminDashboardFilterOptions();
  const exportMutation = useAdminDashboardExport();
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale),
    [locale],
  );
  const moneyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
        notation: 'compact',
      }),
    [locale],
  );

  useEffect(() => {
    const nextQuery = readAdminDashboardQuery(searchParams);
    setQuery(nextQuery);
    setDraft(nextQuery);
  }, [searchParams]);

  const apply = () => {
    const nextParams = new URLSearchParams();
    Object.entries(draft).forEach(([key, value]) => {
      if (value) nextParams.set(key, value);
    });
    setSearchParams(nextParams);
    setQuery(draft);
  };

  const reset = () => {
    setDraft(ADMIN_DASHBOARD_DEFAULT_QUERY);
    setQuery(ADMIN_DASHBOARD_DEFAULT_QUERY);
    setSearchParams({});
  };

  const exportDashboard = async () => {
    try {
      const result = await exportMutation.mutateAsync({ query, roleCode });
      toast.success(
        t('ADMIN_DASHBOARD.EXPORT_SUCCESS', { fileName: result.fileName }),
      );
    } catch {
      toast.error(t('ADMIN_DASHBOARD.EXPORT_ERROR'));
    }
  };

  return {
    apply,
    dashboard,
    draft,
    exportDashboard,
    exportMutation,
    filterOptions,
    moneyFormatter,
    numberFormatter,
    reset,
    setDraft,
    t,
  };
}

function DashboardSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-5" aria-label={label}>
      <Skeleton className="h-28 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-80 w-full" />
    </div>
  );
}

export function AdminDashboardPage() {
  const model = useAdminDashboardPageModel();
  const {
    apply,
    dashboard,
    draft,
    exportDashboard,
    exportMutation,
    filterOptions,
    moneyFormatter,
    numberFormatter,
    reset,
    setDraft,
    t,
  } = model;

  const selectClassName =
    'h-9 w-full rounded-md border border-input bg-background px-3 text-sm';

  return (
    <Container width="fluid" className="space-y-5 pb-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {t('ADMIN_DASHBOARD.TITLE')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('ADMIN_DASHBOARD.DESCRIPTION')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportDashboard}
            disabled={exportMutation.isPending}
          >
            <Download />
            {exportMutation.isPending
              ? t('ADMIN_DASHBOARD.EXPORTING')
              : t('COMMON.EXPORT')}
          </Button>
          <Button
            variant="mono"
            onClick={() => dashboard.refetch()}
            disabled={dashboard.isFetching}
          >
            <RefreshCw className={dashboard.isFetching ? 'animate-spin' : ''} />
            {t('COMMON.REFRESH')}
          </Button>
        </div>
      </header>

      <Card>
        <CardContent className="grid gap-4 pt-5 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1 text-sm">
            <span>{t('ADMIN_DASHBOARD.FILTERS.FROM_DATE')}</span>
            <Input
              type="date"
              value={draft.fromDate}
              onChange={(event) =>
                setDraft({ ...draft, fromDate: event.target.value })
              }
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>{t('ADMIN_DASHBOARD.FILTERS.TO_DATE')}</span>
            <Input
              type="date"
              value={draft.toDate}
              onChange={(event) =>
                setDraft({ ...draft, toDate: event.target.value })
              }
            />
          </label>
          {[
            ['tenantId', 'TENANT', filterOptions.data?.tenants],
            ['brandId', 'BRAND', filterOptions.data?.brands],
            ['categoryId', 'CATEGORY', filterOptions.data?.categories],
            ['offerId', 'OFFER', filterOptions.data?.offers],
          ].map(([field, label, options]) => (
            <label key={field as string} className="space-y-1 text-sm">
              <span>{t(`ADMIN_DASHBOARD.FILTERS.${label}`)}</span>
              <select
                className={selectClassName}
                value={draft[field as keyof AdminDashboardQuery] ?? ''}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    [field as string]: event.target.value || undefined,
                  })
                }
              >
                <option value="">{t('COMMON.ALL')}</option>
                {(
                  options as Array<{ id: string; name: string }> | undefined
                )?.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label className="space-y-1 text-sm">
            <span>{t('ADMIN_DASHBOARD.FILTERS.ORDER_STATUS')}</span>
            <select
              className={selectClassName}
              value={draft.orderStatus ?? ''}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  orderStatus:
                    (event.target
                      .value as AdminDashboardQuery['orderStatus']) ||
                    undefined,
                })
              }
            >
              <option value="">{t('COMMON.ALL')}</option>
              {['PENDING', 'CONFIRMED', 'CANCELLED'].map((status) => (
                <option key={status} value={status}>
                  {t(`COMMON.STATUS.${status}`)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <Button variant="mono" onClick={apply}>
              <Search />
              {t('COMMON.APPLY')}
            </Button>
            <Button variant="outline" onClick={reset}>
              <RotateCcw />
              {t('COMMON.RESET')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {dashboard.isLoading ? (
        <DashboardSkeleton label={t('COMMON.LOADING')} />
      ) : dashboard.error ? (
        <Alert variant="destructive" appearance="light">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertDescription className="flex items-center justify-between gap-4">
            {t('ADMIN_DASHBOARD.ERROR')}
            <Button
              size="sm"
              variant="outline"
              onClick={() => dashboard.refetch()}
            >
              {t('COMMON.RETRY')}
            </Button>
          </AlertDescription>
        </Alert>
      ) : dashboard.data && dashboard.data.trend.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-16 text-center">
            {t('ADMIN_DASHBOARD.EMPTY')}
          </CardContent>
        </Card>
      ) : dashboard.data ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [
                'VALID_CLICKS',
                numberFormatter.format(dashboard.data.metrics.validClicks),
              ],
              ['ORDERS', numberFormatter.format(dashboard.data.metrics.orders)],
              ['CONVERSION_RATE', `${dashboard.data.metrics.conversionRate}%`],
              [
                'TRACKED_GMV',
                moneyFormatter.format(dashboard.data.metrics.trackedGmv),
              ],
              [
                'EXCEPTIONS',
                numberFormatter.format(dashboard.data.metrics.exceptions),
              ],
            ].map(([label, value]) => (
              <Card key={label}>
                <CardContent className="py-5">
                  <p className="text-muted-foreground text-sm">
                    {t(`ADMIN_DASHBOARD.METRICS.${label}`)}
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{value}</p>
                </CardContent>
              </Card>
            ))}
            {Object.entries(dashboard.data.financial).map(([field, value]) => (
              <Card key={field}>
                <CardContent className="py-5">
                  <p className="text-muted-foreground text-sm">
                    {t(`ADMIN_DASHBOARD.FINANCIAL.${field}`)}
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {moneyFormatter.format(value)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader>
                <h2 className="text-base font-semibold">
                  {t('ADMIN_DASHBOARD.TREND_TITLE')}
                </h2>
                <CardDescription>
                  {t('ADMIN_DASHBOARD.TREND_DESCRIPTION')}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboard.data.trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis
                      tickFormatter={(value) => moneyFormatter.format(value)}
                      width={84}
                    />
                    <Tooltip
                      formatter={(value) =>
                        moneyFormatter.format(Number(value))
                      }
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="confirmedCommission"
                      name={t('ADMIN_DASHBOARD.FINANCIAL.grossCommission')}
                      stroke="#2563eb"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="estimatedCommission"
                      name={t('ADMIN_DASHBOARD.FINANCIAL.estimatedCommission')}
                      stroke="#f59e0b"
                      strokeWidth={2}
                    />
                    {'tenantShare' in dashboard.data.financial && (
                      <Line
                        type="monotone"
                        dataKey="tenantShare"
                        name={t('ADMIN_DASHBOARD.FINANCIAL.tenantShare')}
                        stroke="#10b981"
                        strokeWidth={2}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold">
                  {t('ADMIN_DASHBOARD.STATUS_TITLE')}
                </h2>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboard.data.orderStatus} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="status"
                      type="category"
                      width={82}
                      tickFormatter={(status) => t(`COMMON.STATUS.${status}`)}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      name={t('ADMIN_DASHBOARD.METRICS.ORDERS')}
                      fill="#2563eb"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold">
                {t('ADMIN_DASHBOARD.TOP_BRANDS')}
              </h2>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b text-left">
                    <th className="px-5 py-3">#</th>
                    <th className="px-5 py-3">{t('SIDEBAR.BRANDS')}</th>
                    <th className="px-5 py-3">
                      {t('ADMIN_DASHBOARD.METRICS.ORDERS')}
                    </th>
                    <th className="px-5 py-3">
                      {t('ADMIN_DASHBOARD.METRICS.TRACKED_GMV')}
                    </th>
                    {'grossCommission' in dashboard.data.financial && (
                      <th className="px-5 py-3">
                        {t('ADMIN_DASHBOARD.FINANCIAL.grossCommission')}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {dashboard.data.topBrands.map((brand, index) => (
                    <tr key={brand.brandId} className="border-b last:border-0">
                      <td className="px-5 py-3">{index + 1}</td>
                      <td className="px-5 py-3 font-medium">
                        {brand.brandName}
                      </td>
                      <td className="px-5 py-3">
                        {numberFormatter.format(brand.orders)}
                      </td>
                      <td className="px-5 py-3">
                        {moneyFormatter.format(brand.trackedGmv)}
                      </td>
                      {'grossCommission' in dashboard.data.financial && (
                        <td className="px-5 py-3">
                          {moneyFormatter.format(brand.grossCommission)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </Container>
  );
}
