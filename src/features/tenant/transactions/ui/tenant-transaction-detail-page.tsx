import { useMemo } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent, CardHeader } from '@/shared/ui/atoms/card';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/atoms/table';
import { Container } from '@/shared/ui/molecules/container';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useTenantTransactionDetail } from '../hooks/use-tenant-transactions';

export function TenantTransactionDetailPage() {
  const { transactionId = '' } = useParams();
  const session = useAuthSession();
  const { t, language } = useTranslations();
  const result = useTenantTransactionDetail(session, transactionId);
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';
  const money = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }),
    [locale],
  );
  const date = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: 'short',
        timeStyle: 'medium',
      }),
    [locale],
  );

  if (result.isLoading) {
    return (
      <Container width="fluid" className="space-y-4 pb-8">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-96 w-full" />
      </Container>
    );
  }
  if (!result.data || result.error) {
    return (
      <Container width="fluid" className="text-destructive pb-8 text-sm">
        {t('TENANT_TRANSACTIONS.DETAIL.LOAD_ERROR')}
      </Container>
    );
  }

  const { header, items, histories } = result.data;
  const formatDate = (value: string | null) =>
    value ? date.format(new Date(value)) : '—';
  const summary = [
    ['ORDER_ID', header.id],
    ['BRAND_ORDER', header.brandOrderId],
    ['USER_ID', header.userId ?? '—'],
    ['MEMBER_REF', header.memberRef ?? '—'],
    ['CUSTOMER_REF', header.customerRef ?? '—'],
    ['BRAND', `${header.brand.name} · ${header.brand.id}`],
    ['STATUS', t(`COMMON.STATUS.${header.status}`)],
    ['ORDER_DATE', formatDate(header.createdAt)],
    ['ESTIMATED', money.format(header.estimatedTenantShare)],
    ['ACTUAL', money.format(header.actualTenantShare)],
    ['CONFIRMED_DATE', formatDate(header.commissionConfirmedAt)],
  ] as const;

  return (
    <Container width="fluid" className="space-y-5 pb-8">
      <header>
        <Button variant="outline" size="sm" asChild>
          <Link to="/tenant/transactions">
            <ArrowLeft />
            {t('TENANT_TRANSACTIONS.DETAIL.BACK')}
          </Link>
        </Button>
        <h1 className="mt-4 text-2xl font-semibold">
          {t('TENANT_TRANSACTIONS.DETAIL.TITLE')}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">{header.id}</p>
      </header>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">
            {t('TENANT_TRANSACTIONS.DETAIL.SUMMARY')}
          </h2>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summary.map(([label, value]) => (
            <div key={label} className="rounded-md border p-3">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {t(`TENANT_TRANSACTIONS.${label}`)}
              </p>
              <p className="mt-1 text-sm font-medium break-words">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">
            {t('TENANT_TRANSACTIONS.DETAIL.ITEMS')}
          </h2>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t('TENANT_TRANSACTIONS.DETAIL.ITEM_CODE')}
                </TableHead>
                <TableHead>
                  {t('TENANT_TRANSACTIONS.DETAIL.ITEM_NAME')}
                </TableHead>
                <TableHead>{t('TENANT_TRANSACTIONS.DETAIL.QTY')}</TableHead>
                <TableHead>
                  {t('TENANT_TRANSACTIONS.DETAIL.ORIGINAL')}
                </TableHead>
                <TableHead>{t('TENANT_TRANSACTIONS.DETAIL.FINAL')}</TableHead>
                <TableHead>
                  {t('TENANT_TRANSACTIONS.DETAIL.SHARE_SOURCE')}
                </TableHead>
                <TableHead>
                  {t('TENANT_TRANSACTIONS.DETAIL.SHARE_VALUE')}
                </TableHead>
                <TableHead>
                  {t('TENANT_TRANSACTIONS.DETAIL.SHARE_REFERENCE')}
                </TableHead>
                <TableHead>{t('TENANT_TRANSACTIONS.DETAIL.SHARE')}</TableHead>
                <TableHead>
                  {t('TENANT_TRANSACTIONS.DETAIL.ITEM_STATUS')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{money.format(item.originalAmount)}</TableCell>
                  <TableCell>{money.format(item.finalAmount)}</TableCell>
                  <TableCell>
                    {t(
                      `TENANT_TRANSACTIONS.DETAIL.SOURCES.${item.tenantShareSource}`,
                    )}
                  </TableCell>
                  <TableCell>{item.tenantShareValue}%</TableCell>
                  <TableCell>{item.tenantShareReference}</TableCell>
                  <TableCell>{money.format(item.tenantShare)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.status === 'CONFIRMED'
                          ? 'success'
                          : item.status === 'PENDING'
                            ? 'warning'
                            : 'secondary'
                      }
                      appearance="light"
                    >
                      {t(
                        `TENANT_TRANSACTIONS.DETAIL.ITEM_STATUSES.${item.status}`,
                      )}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">
            {t('TENANT_TRANSACTIONS.DETAIL.HISTORY')}
          </h2>
        </CardHeader>
        <CardContent>
          {histories.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t('TENANT_TRANSACTIONS.DETAIL.NO_HISTORY')}
            </p>
          ) : (
            <ol className="space-y-4 border-l pl-5">
              {histories.map((history) => {
                const item = items.find(
                  ({ id }) => id === history.transactionItemId,
                );
                return (
                  <li key={history.id} className="relative">
                    <span className="bg-primary absolute top-1 -left-[1.55rem] h-2.5 w-2.5 rounded-full" />
                    <p className="text-sm font-medium">
                      {t(
                        `TENANT_TRANSACTIONS.DETAIL.EVENTS.${history.eventType}`,
                        {
                          brand: header.brand.name,
                          order: header.brandOrderId,
                          item: item?.code ?? '—',
                        },
                      )}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(history.eventAt)} · {history.createdBy} ·{' '}
                      {t(
                        `TENANT_TRANSACTIONS.DETAIL.RESULTS.${history.processingResult}`,
                      )}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
