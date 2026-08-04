import { useMemo, useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Alert, AlertDescription, AlertIcon } from '@/shared/ui/atoms/alert';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent, CardHeader } from '@/shared/ui/atoms/card';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { Container } from '@/shared/ui/molecules/container';
import { AlertCircle, RefreshCw } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTenantDashboard } from '../hooks/use-tenant-dashboard';
import {
  TENANT_DASHBOARD_DEFAULT_QUERY,
  TENANT_DASHBOARD_RANGES,
  type TenantDashboardQuery,
  type TenantDashboardTrendPoint,
} from '../model/tenant-dashboard';

const selectClassName =
  'h-9 w-full rounded-md border border-input bg-background px-3 text-sm';

function DashboardChart({
  data,
  dataKey,
  title,
  format,
}: {
  data: TenantDashboardTrendPoint[];
  dataKey: 'revenue' | 'actualCommission' | 'orders';
  title: string;
  format: (value: number) => string;
}) {
  const tooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: TenantDashboardTrendPoint; value: number }>;
  }) => {
    if (!active || !payload?.[0]) return null;
    const point = payload[0].payload;
    return (
      <div className="bg-background rounded-md border p-3 text-sm shadow-md">
        <p className="font-medium">{point.bucket}</p>
        <p>
          {title}: {format(payload[0].value)}
        </p>
        {dataKey === 'orders' && (
          <p className="text-muted-foreground mt-1 text-xs">
            Pending {point.pending} · Confirmed {point.confirmed} · Cancelled{' '}
            {point.cancelled}
          </p>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">{title}</h2>
      </CardHeader>
      <CardContent className="h-64" aria-label={title}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="bucket" interval="preserveStartEnd" />
            <YAxis hide />
            <Tooltip content={tooltip} />
            <Line
              type="monotone"
              dataKey={dataKey}
              name={title}
              stroke="var(--color-primary)"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function TenantDashboardPage() {
  const session = useAuthSession();
  const { t, language } = useTranslations();
  const [query, setQuery] = useState<TenantDashboardQuery>(
    TENANT_DASHBOARD_DEFAULT_QUERY,
  );
  const [draft, setDraft] = useState(query);
  const dashboard = useTenantDashboard(session, query);
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const money = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }),
    [locale],
  );
  const dateTime = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    [locale],
  );

  const view = dashboard.data;
  const metricCards = view
    ? [
        [
          t('TENANT_DASHBOARD.METRICS.CLICKS'),
          number.format(view.metrics.trackedClicks),
        ],
        [
          t('TENANT_DASHBOARD.METRICS.ORDERS'),
          number.format(view.metrics.attributedOrders),
        ],
        [
          t('TENANT_DASHBOARD.METRICS.RATE'),
          `${view.metrics.clickToOrderRate}%`,
        ],
        ...(view.hasFinancialAccess
          ? [
              [
                t('TENANT_DASHBOARD.METRICS.REVENUE'),
                money.format(view.metrics.revenue ?? 0),
              ],
              [
                t('TENANT_DASHBOARD.METRICS.COMMISSION'),
                money.format(view.metrics.actualCommission ?? 0),
              ],
            ]
          : []),
      ]
    : [];

  return (
    <Container width="fluid" className="space-y-5 pb-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {t('TENANT_DASHBOARD.TITLE')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('TENANT_DASHBOARD.DESCRIPTION')}
          </p>
        </div>
        <Button
          variant="mono"
          onClick={() => dashboard.refetch()}
          disabled={dashboard.isFetching}
        >
          <RefreshCw className={dashboard.isFetching ? 'animate-spin' : ''} />
          {t('COMMON.REFRESH')}
        </Button>
      </header>

      <Card>
        <CardContent className="grid gap-4 pt-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="space-y-1 text-sm">
            <span>{t('TENANT_DASHBOARD.DATE_RANGE')}</span>
            <select
              className={selectClassName}
              value={draft.range}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  range: event.target.value as TenantDashboardQuery['range'],
                })
              }
            >
              {TENANT_DASHBOARD_RANGES.map((range) => (
                <option key={range} value={range}>
                  {t(`TENANT_DASHBOARD.RANGES.${range}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>{t('TENANT_DASHBOARD.BRAND')}</span>
            <select
              className={selectClassName}
              value={draft.brandId ?? ''}
              onChange={(event) =>
                setDraft({ ...draft, brandId: event.target.value || undefined })
              }
            >
              <option value="">{t('TENANT_DASHBOARD.ALL_BRANDS')}</option>
              {view?.brandOptions.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>
          <Button onClick={() => setQuery(draft)}>{t('COMMON.APPLY')}</Button>
        </CardContent>
      </Card>

      {dashboard.isLoading ? (
        <div className="space-y-4" aria-label={t('COMMON.LOADING')}>
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : dashboard.isError || !view ? (
        <Alert variant="destructive">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertDescription>{t('TENANT_DASHBOARD.ERROR')}</AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {metricCards.map(([label, value]) => (
              <Card key={label}>
                <CardContent className="pt-5">
                  <p className="text-muted-foreground text-sm">{label}</p>
                  <p className="mt-2 text-2xl font-semibold">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {view.trend.length === 0 ? (
            <Card>
              <CardContent className="text-muted-foreground py-12 text-center">
                {t('TENANT_DASHBOARD.EMPTY')}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 xl:grid-cols-3">
              {view.hasFinancialAccess && (
                <>
                  <DashboardChart
                    data={view.trend}
                    dataKey="revenue"
                    title={t('TENANT_DASHBOARD.METRICS.REVENUE')}
                    format={money.format}
                  />
                  <DashboardChart
                    data={view.trend}
                    dataKey="actualCommission"
                    title={t('TENANT_DASHBOARD.METRICS.COMMISSION')}
                    format={money.format}
                  />
                </>
              )}
              <DashboardChart
                data={view.trend}
                dataKey="orders"
                title={t('TENANT_DASHBOARD.ORDERS_RECORDED')}
                format={number.format}
              />
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <h2 className="font-semibold">
                  {t('TENANT_DASHBOARD.TOP_BRANDS')}
                </h2>
              </CardHeader>
              <CardContent>
                {view.topBrands.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">
                    {t('TENANT_DASHBOARD.EMPTY')}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2">#</th>
                          <th>{t('TENANT_DASHBOARD.BRAND')}</th>
                          <th>{t('TENANT_DASHBOARD.METRICS.ORDERS')}</th>
                          {view.hasFinancialAccess && (
                            <>
                              <th>{t('TENANT_DASHBOARD.METRICS.REVENUE')}</th>
                              <th>
                                {t('TENANT_DASHBOARD.METRICS.COMMISSION')}
                              </th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {view.topBrands.map((brand, index) => (
                          <tr key={brand.brandId} className="border-b">
                            <td className="py-3">{index + 1}</td>
                            <td>{brand.brandName}</td>
                            <td>{number.format(brand.orders)}</td>
                            {view.hasFinancialAccess && (
                              <>
                                <td>{money.format(brand.revenue ?? 0)}</td>
                                <td>
                                  {money.format(brand.actualCommission ?? 0)}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {view.hasFinancialAccess && (
              <Card>
                <CardHeader>
                  <h2 className="font-semibold">
                    {t('TENANT_DASHBOARD.DISTRIBUTION')}
                  </h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  {view.commissionDistribution?.map((item) => (
                    <div key={item.source}>
                      <div className="mb-1 flex justify-between gap-3 text-sm">
                        <span>
                          {t(`TENANT_DASHBOARD.SOURCES.${item.source}`)}
                        </span>
                        <span>
                          {money.format(item.amount)} · {item.percentage}%
                        </span>
                      </div>
                      <div className="bg-muted h-2 overflow-hidden rounded">
                        <div
                          className="bg-primary h-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="text-muted-foreground text-xs">
                    {t('TENANT_DASHBOARD.COMMISSION_NOTE')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          <p className="text-muted-foreground text-right text-xs">
            {t('TENANT_DASHBOARD.LAST_REFRESHED', {
              value: dateTime.format(new Date(view.generatedAt)),
            })}
          </p>
        </>
      )}
    </Container>
  );
}
