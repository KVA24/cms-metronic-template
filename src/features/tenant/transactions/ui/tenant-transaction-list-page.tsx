import { useMemo, useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Input } from '@/shared/ui/atoms/input';
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
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useTenantTransactionExport,
  useTenantTransactions,
} from '../hooks/use-tenant-transactions';
import {
  TENANT_TRANSACTION_DEFAULT_QUERY,
  validateTenantTransactionDateRange,
  type TenantTransactionQuery,
} from '../model/tenant-transaction';

export function TenantTransactionListPage() {
  const session = useAuthSession();
  const { t, language } = useTranslations();
  const [query, setQuery] = useState(TENANT_TRANSACTION_DEFAULT_QUERY);
  const [draft, setDraft] = useState(query);
  const [dateError, setDateError] = useState(false);
  const result = useTenantTransactions(session, query);
  const exportMutation = useTenantTransactionExport(session);
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
  const apply = () => {
    if (validateTenantTransactionDateRange(draft)) {
      setDateError(true);
      return;
    }
    setDateError(false);
    setQuery({ ...draft, search: draft.search?.trim() || undefined, page: 1 });
  };
  const exportRows = async () => {
    try {
      const request = await exportMutation.mutateAsync(query);
      toast.success(
        t('TENANT_TRANSACTIONS.EXPORT_SUCCESS', {
          file: request.fileName,
          rows: request.rowCount,
        }),
      );
    } catch {
      toast.error(t('TENANT_TRANSACTIONS.EXPORT_ERROR'));
    }
  };
  if (result.isLoading)
    return (
      <Container width="fluid">
        <Skeleton className="h-96 w-full" />
      </Container>
    );
  if (!result.data)
    return (
      <Container width="fluid">
        <p className="text-destructive">
          {t('TENANT_TRANSACTIONS.LOAD_ERROR')}
        </p>
      </Container>
    );
  const setField = <K extends keyof TenantTransactionQuery>(
    key: K,
    value: TenantTransactionQuery[K],
  ) => setDraft((current) => ({ ...current, [key]: value }));
  return (
    <Container width="fluid" className="space-y-5 pb-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {t('TENANT_TRANSACTIONS.TITLE')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('TENANT_TRANSACTIONS.DESCRIPTION')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => result.refetch()}>
            <RefreshCw />
            {t('COMMON.REFRESH')}
          </Button>
          {result.data.canExport && (
            <Button
              variant="outline"
              disabled={exportMutation.isPending}
              onClick={exportRows}
            >
              <Download />
              {t('TENANT_TRANSACTIONS.EXPORT')}
            </Button>
          )}
        </div>
      </header>
      <Card>
        <CardContent className="grid gap-4 pt-5 md:grid-cols-2 xl:grid-cols-5 xl:items-end">
          <label className="space-y-1 text-sm">
            <span>{t('TENANT_TRANSACTIONS.DATE_FROM')}</span>
            <Input
              name="transactionDateFrom"
              type="date"
              value={draft.dateFrom ?? ''}
              onChange={(event) =>
                setField('dateFrom', event.target.value || undefined)
              }
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>{t('TENANT_TRANSACTIONS.DATE_TO')}</span>
            <Input
              name="transactionDateTo"
              type="date"
              aria-invalid={dateError}
              value={draft.dateTo ?? ''}
              onChange={(event) =>
                setField('dateTo', event.target.value || undefined)
              }
            />
            {dateError && (
              <p className="text-xs text-destructive">
                {t('TENANT_TRANSACTIONS.DATE_ERROR')}
              </p>
            )}
          </label>
          <label className="space-y-1 text-sm">
            <span>{t('TENANT_TRANSACTIONS.KEYWORD')}</span>
            <Input
              name="transactionKeyword"
              maxLength={100}
              value={draft.search ?? ''}
              onChange={(event) =>
                setField('search', event.target.value || undefined)
              }
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>{t('TENANT_TRANSACTIONS.BRAND')}</span>
            <select
              name="transactionBrand"
              className="h-9 w-full rounded-md border border-input bg-background px-3"
              value={draft.brandId ?? ''}
              onChange={(event) =>
                setField('brandId', event.target.value || undefined)
              }
            >
              <option value="">{t('COMMON.ALL')}</option>
              {result.data.brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>{t('TENANT_TRANSACTIONS.STATUS')}</span>
            <select
              name="transactionStatus"
              className="h-9 w-full rounded-md border border-input bg-background px-3"
              value={draft.status ?? ''}
              onChange={(event) =>
                setField(
                  'status',
                  (event.target.value as TenantTransactionQuery['status']) ||
                    undefined,
                )
              }
            >
              <option value="">{t('COMMON.ALL')}</option>
              <option value="PENDING">{t('COMMON.STATUS.PENDING')}</option>
              <option value="CONFIRMED">{t('COMMON.STATUS.CONFIRMED')}</option>
              <option value="CANCELLED">{t('COMMON.STATUS.CANCELLED')}</option>
            </select>
          </label>
          <Button onClick={apply}>{t('COMMON.APPLY')}</Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-4 overflow-x-auto pt-5">
          {result.data.items.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              {t('TENANT_TRANSACTIONS.EMPTY')}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('TENANT_TRANSACTIONS.ORDER_ID')}</TableHead>
                  <TableHead>{t('TENANT_TRANSACTIONS.BRAND_ORDER')}</TableHead>
                  <TableHead>{t('TENANT_TRANSACTIONS.ORDER_DATE')}</TableHead>
                  <TableHead>{t('TENANT_TRANSACTIONS.MEMBER_REF')}</TableHead>
                  <TableHead>{t('TENANT_TRANSACTIONS.BRAND')}</TableHead>
                  <TableHead>{t('TENANT_TRANSACTIONS.STATUS')}</TableHead>
                  <TableHead>{t('TENANT_TRANSACTIONS.ESTIMATED')}</TableHead>
                  <TableHead>{t('TENANT_TRANSACTIONS.ACTUAL')}</TableHead>
                  <TableHead>
                    {t('TENANT_TRANSACTIONS.CONFIRMED_DATE')}
                  </TableHead>
                  <TableHead>{t('COMMON.ACTIONS')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>{item.brandOrderId}</TableCell>
                    <TableCell>
                      {date.format(new Date(item.createdAt))}
                    </TableCell>
                    <TableCell>{item.memberRef ?? '—'}</TableCell>
                    <TableCell>{item.brand.name}</TableCell>
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
                        {t(`COMMON.STATUS.${item.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {money.format(item.estimatedTenantShare)}
                    </TableCell>
                    <TableCell>
                      {money.format(item.actualTenantShare)}
                    </TableCell>
                    <TableCell>
                      {item.commissionConfirmedAt
                        ? date.format(new Date(item.commissionConfirmedAt))
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="outline" asChild>
                        <Link
                          aria-label={t('TENANT_TRANSACTIONS.VIEW', {
                            id: item.id,
                          })}
                          to={`/tenant/transactions/${item.id}`}
                        >
                          <Eye />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {t('TENANT_TRANSACTIONS.RANGE', {
                from: result.data.totalItems
                  ? (result.data.page - 1) * result.data.pageSize + 1
                  : 0,
                to: Math.min(
                  result.data.page * result.data.pageSize,
                  result.data.totalItems,
                ),
                total: result.data.totalItems,
              })}
            </span>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="outline"
                aria-label={t('COMMON.PREVIOUS')}
                disabled={result.data.page <= 1}
                onClick={() => setQuery({ ...query, page: query.page - 1 })}
              >
                <ChevronLeft />
              </Button>
              <Button
                size="icon"
                variant="outline"
                aria-label={t('COMMON.NEXT')}
                disabled={result.data.page >= result.data.totalPages}
                onClick={() => setQuery({ ...query, page: query.page + 1 })}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
