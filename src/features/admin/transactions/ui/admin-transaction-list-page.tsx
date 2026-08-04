import { FormEvent, useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import { formatDateOnly, parseDateOnly } from '@/shared/lib/date-utils';
import type { AdminRoleCode } from '@/shared/permissions';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import DateRangePicker from '@/shared/ui/atoms/date-range-picker';
import { Input } from '@/shared/ui/atoms/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/atoms/select';
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
  RotateCcw,
  Search,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useAdminTransactionFilters,
  useAdminTransactions,
  useExportAdminTransactions,
} from '../hooks/use-admin-transactions';
import {
  ADMIN_TRANSACTION_DEFAULT_QUERY,
  validateTransactionDateRange,
  type AdminTransactionQuery,
} from '../model/admin-transaction';

const moneyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});
const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'medium',
});
const money = (value: number | undefined) =>
  value === undefined ? '-' : moneyFormatter.format(value);

export function AdminTransactionListPage() {
  const session = useAuthSession();
  const { t } = useTranslations();
  const roleCode = session?.roleCode as AdminRoleCode;
  const [query, setQuery] = useState(ADMIN_TRANSACTION_DEFAULT_QUERY);
  const [filters, setFilters] = useState(query);
  const [dateError, setDateError] = useState('');
  const result = useAdminTransactions(query, roleCode);
  const options = useAdminTransactionFilters(roleCode);
  const exportMutation = useExportAdminTransactions();
  const apply = (event: FormEvent) => {
    event.preventDefault();
    const errors = validateTransactionDateRange(filters);
    if (errors.dateTo) {
      setDateError(errors.dateTo);
      return;
    }
    setDateError('');
    setQuery({ ...filters, keyword: filters.keyword.trim(), page: 1 });
  };
  const reset = () => {
    setFilters(ADMIN_TRANSACTION_DEFAULT_QUERY);
    setQuery(ADMIN_TRANSACTION_DEFAULT_QUERY);
    setDateError('');
  };
  const exportRows = async () => {
    if (!session || exportMutation.isPending) return;
    try {
      const request = await exportMutation.mutateAsync({
        query,
        roleCode,
        actorId: session.user.id,
      });
      toast.success(
        t('ADMIN_TRANSACTIONS.EXPORT_SUCCESS', {
          file: request.fileName,
          rows: request.rowCount,
        }),
      );
    } catch {
      toast.error(t('ADMIN_TRANSACTIONS.ERRORS.EXPORT_ERROR'));
    }
  };
  if (result.isLoading || options.isLoading)
    return (
      <Container className="space-y-4 py-6">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-96 w-full" />
      </Container>
    );
  if (!result.data || !options.data || result.error || options.error)
    return (
      <Container className="text-destructive py-8 text-sm">
        {t('ADMIN_TRANSACTIONS.ERRORS.LOAD_ERROR')}
      </Container>
    );
  const setFilter = <K extends keyof AdminTransactionQuery>(
    field: K,
    value: AdminTransactionQuery[K],
  ) => setFilters((current) => ({ ...current, [field]: value }));
  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {t('ADMIN_TRANSACTIONS.TITLE')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('ADMIN_TRANSACTIONS.DESCRIPTION')}
          </p>
        </div>
        {result.data.canExport && (
          <Button
            variant="outline"
            disabled={exportMutation.isPending}
            onClick={exportRows}
          >
            <Download />
            {exportMutation.isPending
              ? t('ADMIN_TRANSACTIONS.EXPORTING')
              : t('ADMIN_TRANSACTIONS.EXPORT')}
          </Button>
        )}
      </div>
      <Card>
        <CardContent className="pt-6">
          <form className="grid gap-4 lg:grid-cols-5" onSubmit={apply}>
            <Input
              id="transaction-keyword"
              name="keyword"
              aria-label={t('ADMIN_TRANSACTIONS.KEYWORD')}
              placeholder={t('ADMIN_TRANSACTIONS.KEYWORD')}
              value={filters.keyword}
              onChange={(event) => setFilter('keyword', event.target.value)}
            />
            <Select
              value={filters.tenantId || ''}
              onValueChange={(value) => setFilter('tenantId', value)}
            >
              <SelectTrigger
                size="lg"
                aria-label={t('ADMIN_TRANSACTIONS.TENANT')}
              >
                <SelectValue placeholder={t('COMMON.ALL')} />
              </SelectTrigger>
              <SelectContent>
                {options.data.tenants.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.brandId || ''}
              onValueChange={(value) => setFilter('brandId', value)}
            >
              <SelectTrigger
                size="lg"
                aria-label={t('ADMIN_TRANSACTIONS.BRAND')}
              >
                <SelectValue placeholder={t('COMMON.ALL')} />
              </SelectTrigger>
              <SelectContent>
                {options.data.brands.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.status === 'ALL' ? '' : filters.status}
              onValueChange={(value) =>
                setFilter(
                  'status',
                  (value || 'ALL') as AdminTransactionQuery['status'],
                )
              }
            >
              <SelectTrigger
                size="lg"
                aria-label={t('ADMIN_TRANSACTIONS.ORDER_STATUS')}
              >
                <SelectValue placeholder={t('COMMON.ALL')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">
                  {t('COMMON.STATUS.PENDING')}
                </SelectItem>
                <SelectItem value="CONFIRMED">
                  {t('ADMIN_TRANSACTIONS.STATUS.CONFIRMED')}
                </SelectItem>
                <SelectItem value="CANCELLED">
                  {t('ADMIN_TRANSACTIONS.STATUS.CANCELLED')}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={`${filters.sortBy}:${filters.sortDirection}`}
              onValueChange={(value) => {
                const [sortBy, sortDirection] = value.split(':') as [
                  AdminTransactionQuery['sortBy'],
                  AdminTransactionQuery['sortDirection'],
                ];
                setFilters((current) => ({
                  ...current,
                  sortBy,
                  sortDirection,
                }));
              }}
            >
              <SelectTrigger
                size="lg"
                clearable={false}
                aria-label={t('ADMIN_TRANSACTIONS.SORT')}
              >
                <SelectValue placeholder={t('ADMIN_TRANSACTIONS.SORT')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updatedAt:desc">
                  {t('ADMIN_TRANSACTIONS.LATEST_UPDATED')}
                </SelectItem>
                <SelectItem value="createdAt:desc">
                  {t('ADMIN_TRANSACTIONS.NEWEST_CREATED')}
                </SelectItem>
                <SelectItem value="id:asc">
                  {t('ADMIN_TRANSACTIONS.ORDER_ID_ASC')}
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-1 lg:col-span-2">
              <DateRangePicker
                start={parseDateOnly(filters.dateFrom)}
                end={parseDateOnly(filters.dateTo)}
                clearable
                ariaLabel={`${t('ADMIN_TRANSACTIONS.DATE_FROM')} - ${t('ADMIN_TRANSACTIONS.DATE_TO')}`}
                placeholder={`${t('ADMIN_TRANSACTIONS.DATE_FROM')} - ${t('ADMIN_TRANSACTIONS.DATE_TO')}`}
                resetLabel={t('COMMON.RESET')}
                applyLabel={t('COMMON.APPLY')}
                onApply={(range) => {
                  setFilters((current) => ({
                    ...current,
                    dateFrom: formatDateOnly(range?.from),
                    dateTo: formatDateOnly(range?.to),
                  }));
                  setDateError('');
                }}
              />
              {dateError && (
                <p className="text-destructive text-xs" role="alert">
                  {t(`ADMIN_TRANSACTIONS.ERRORS.${dateError}`)}
                </p>
              )}
            </div>
            <div className="flex items-end gap-2 lg:col-span-3">
              <Button type="submit" variant="mono">
                <Search />
                {t('COMMON.APPLY')}
              </Button>
              <Button type="button" variant="outline" onClick={reset}>
                <RotateCcw />
                {t('COMMON.RESET')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-4 overflow-x-auto pt-6">
          {result.data.items.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center text-sm">
              {t('ADMIN_TRANSACTIONS.EMPTY')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('ADMIN_TRANSACTIONS.ORDER_ID')}</TableHead>
                  <TableHead>{t('ADMIN_TRANSACTIONS.CLICK_ID')}</TableHead>
                  <TableHead>{t('ADMIN_TRANSACTIONS.BRAND_ORDER')}</TableHead>
                  <TableHead>{t('ADMIN_TRANSACTIONS.TENANT')}</TableHead>
                  <TableHead>{t('ADMIN_TRANSACTIONS.BRAND')}</TableHead>
                  <TableHead>{t('ADMIN_TRANSACTIONS.FINAL_AMOUNT')}</TableHead>
                  <TableHead>{t('ADMIN_TRANSACTIONS.ORDER_STATUS')}</TableHead>
                  {result.data.financialScope.grossCommission && (
                    <TableHead>
                      {t('ADMIN_TRANSACTIONS.ESTIMATED_COMMISSION')}
                    </TableHead>
                  )}
                  {result.data.financialScope.tenantShare && (
                    <TableHead>
                      {t('ADMIN_TRANSACTIONS.ESTIMATED_TENANT_SHARE')}
                    </TableHead>
                  )}
                  {result.data.financialScope.grossCommission && (
                    <TableHead>
                      {t('ADMIN_TRANSACTIONS.ACTUAL_COMMISSION')}
                    </TableHead>
                  )}
                  {result.data.financialScope.tenantShare && (
                    <TableHead>
                      {t('ADMIN_TRANSACTIONS.ACTUAL_TENANT_SHARE')}
                    </TableHead>
                  )}
                  <TableHead>{t('ADMIN_TRANSACTIONS.CONFIRMED_AT')}</TableHead>
                  <TableHead>{t('ADMIN_TRANSACTIONS.UPDATED_AT')}</TableHead>
                  <TableHead>{t('COMMON.ACTIONS')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>{item.clickId}</TableCell>
                    <TableCell>{item.brandOrderId}</TableCell>
                    <TableCell>{item.tenant.name}</TableCell>
                    <TableCell>{item.brand.name}</TableCell>
                    <TableCell>
                      {moneyFormatter.format(item.finalAmount)}
                    </TableCell>
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
                          item.status === 'PENDING'
                            ? 'COMMON.STATUS.PENDING'
                            : `ADMIN_TRANSACTIONS.STATUS.${item.status}`,
                        )}
                      </Badge>
                    </TableCell>
                    {result.data.financialScope.grossCommission && (
                      <TableCell>
                        {money(item.estimatedGrossCommission)}
                      </TableCell>
                    )}
                    {result.data.financialScope.tenantShare && (
                      <TableCell>{money(item.estimatedTenantShare)}</TableCell>
                    )}
                    {result.data.financialScope.grossCommission && (
                      <TableCell>{money(item.actualGrossCommission)}</TableCell>
                    )}
                    {result.data.financialScope.tenantShare && (
                      <TableCell>{money(item.actualTenantShare)}</TableCell>
                    )}
                    <TableCell>
                      {item.commissionConfirmedAt
                        ? dateFormatter.format(
                            new Date(item.commissionConfirmedAt),
                          )
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {dateFormatter.format(new Date(item.updatedAt))}
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="outline" asChild>
                        <Link
                          aria-label={t('ADMIN_TRANSACTIONS.VIEW_NAMED', {
                            id: item.id,
                          })}
                          to={`/admin/transactions/${item.id}`}
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
          <div className="text-muted-foreground flex items-center justify-between text-sm">
            <span>
              {t('ADMIN_TRANSACTIONS.RANGE', {
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
                aria-label={t('ADMIN_TRANSACTIONS.PREVIOUS')}
                disabled={result.data.page <= 1}
                onClick={() =>
                  setQuery((current) => ({
                    ...current,
                    page: current.page - 1,
                  }))
                }
              >
                <ChevronLeft />
              </Button>
              <Button
                size="icon"
                variant="outline"
                aria-label={t('ADMIN_TRANSACTIONS.NEXT')}
                disabled={result.data.page >= result.data.totalPages}
                onClick={() =>
                  setQuery((current) => ({
                    ...current,
                    page: current.page + 1,
                  }))
                }
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
