import { FormEvent, useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import { formatDateOnly, parseDateOnly } from '@/shared/lib/date-utils';
import type { AdminRoleCode } from '@/shared/permissions';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import DateRangePicker from '@/shared/ui/atoms/date-range-picker';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/atoms/dialog';
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
  useAdminExceptionFilters,
  useAdminExceptions,
  useExportAdminExceptions,
  useRetryAdminException,
} from '../hooks/use-admin-exceptions';
import {
  ADMIN_EXCEPTION_DEFAULT_QUERY,
  EXCEPTION_GROUPS,
  validateExceptionDateRange,
  type AdminExceptionQuery,
} from '../model/admin-exception';

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'medium',
});

export function AdminExceptionListPage() {
  const session = useAuthSession();
  const { t } = useTranslations();
  const roleCode = session?.roleCode as AdminRoleCode;
  const [query, setQuery] = useState(ADMIN_EXCEPTION_DEFAULT_QUERY);
  const [filters, setFilters] = useState(query);
  const [dateError, setDateError] = useState('');
  const [retryId, setRetryId] = useState('');
  const result = useAdminExceptions(query, roleCode);
  const options = useAdminExceptionFilters(roleCode);
  const exportMutation = useExportAdminExceptions();
  const retryMutation = useRetryAdminException();
  const setFilter = <K extends keyof AdminExceptionQuery>(
    field: K,
    value: AdminExceptionQuery[K],
  ) => setFilters((current) => ({ ...current, [field]: value }));
  const apply = (event: FormEvent) => {
    event.preventDefault();
    const errors = validateExceptionDateRange(filters);
    if (errors.dateTo) {
      setDateError(errors.dateTo);
      return;
    }
    setDateError('');
    setQuery({ ...filters, keyword: filters.keyword.trim(), page: 1 });
  };
  const reset = () => {
    setFilters(ADMIN_EXCEPTION_DEFAULT_QUERY);
    setQuery(ADMIN_EXCEPTION_DEFAULT_QUERY);
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
        t('ADMIN_EXCEPTIONS.EXPORT_SUCCESS', {
          file: request.fileName,
          rows: request.rowCount,
        }),
      );
    } catch {
      toast.error(t('ADMIN_EXCEPTIONS.ERRORS.EXPORT_ERROR'));
    }
  };
  const retryException = async () => {
    if (!session || !retryId || retryMutation.isPending) return;
    try {
      await retryMutation.mutateAsync({
        exceptionId: retryId,
        roleCode,
        actorId: session.user.id,
      });
      setRetryId('');
      toast.success(t('ADMIN_EXCEPTION_DETAIL.RETRY_SUCCESS'));
    } catch {
      toast.error(t('ADMIN_EXCEPTION_DETAIL.ERRORS.RETRY_ERROR'));
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
        {t('ADMIN_EXCEPTIONS.ERRORS.LOAD_ERROR')}
      </Container>
    );
  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {t('ADMIN_EXCEPTIONS.TITLE')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('ADMIN_EXCEPTIONS.DESCRIPTION')}
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
              ? t('ADMIN_EXCEPTIONS.EXPORTING')
              : t('ADMIN_EXCEPTIONS.EXPORT')}
          </Button>
        )}
      </div>
      <Card>
        <CardContent className="pt-6">
          <form className="grid gap-4 lg:grid-cols-5" onSubmit={apply}>
            <Input
              id="exception-keyword"
              name="keyword"
              aria-label={t('ADMIN_EXCEPTIONS.KEYWORD')}
              placeholder={t('ADMIN_EXCEPTIONS.KEYWORD')}
              value={filters.keyword}
              onChange={(event) => setFilter('keyword', event.target.value)}
            />
            <Select
              value={filters.tenantId || ''}
              onValueChange={(value) => setFilter('tenantId', value)}
            >
              <SelectTrigger
                size="lg"
                aria-label={t('ADMIN_EXCEPTIONS.TENANT')}
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
              <SelectTrigger size="lg" aria-label={t('ADMIN_EXCEPTIONS.BRAND')}>
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
              value={filters.group === 'ALL' ? '' : filters.group}
              onValueChange={(value) =>
                setFilter(
                  'group',
                  (value || 'ALL') as AdminExceptionQuery['group'],
                )
              }
            >
              <SelectTrigger size="lg" aria-label={t('ADMIN_EXCEPTIONS.GROUP')}>
                <SelectValue placeholder={t('COMMON.ALL')} />
              </SelectTrigger>
              <SelectContent>
                {EXCEPTION_GROUPS.map((group) => (
                  <SelectItem key={group} value={group}>
                    {t(`ADMIN_EXCEPTIONS.GROUPS.${group}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.status === 'ALL' ? '' : filters.status}
              onValueChange={(value) =>
                setFilter(
                  'status',
                  (value || 'ALL') as AdminExceptionQuery['status'],
                )
              }
            >
              <SelectTrigger size="lg" aria-label={t('COMMON.STATUS_1')}>
                <SelectValue placeholder={t('COMMON.ALL')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">
                  {t('ADMIN_EXCEPTIONS.STATUS.OPEN')}
                </SelectItem>
                <SelectItem value="RESOLVED">
                  {t('ADMIN_EXCEPTIONS.STATUS.RESOLVED')}
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-1 lg:col-span-2">
              <DateRangePicker
                start={parseDateOnly(filters.dateFrom)}
                end={parseDateOnly(filters.dateTo)}
                clearable
                ariaLabel={`${t('ADMIN_EXCEPTIONS.DATE_FROM')} - ${t('ADMIN_EXCEPTIONS.DATE_TO')}`}
                placeholder={`${t('ADMIN_EXCEPTIONS.DATE_FROM')} - ${t('ADMIN_EXCEPTIONS.DATE_TO')}`}
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
                  {t(`ADMIN_EXCEPTIONS.ERRORS.${dateError}`)}
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
              {t('ADMIN_EXCEPTIONS.EMPTY')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('ADMIN_EXCEPTIONS.EXCEPTION_ID')}</TableHead>
                  <TableHead>{t('ADMIN_EXCEPTIONS.ORDER_ID')}</TableHead>
                  <TableHead>{t('ADMIN_EXCEPTIONS.BRAND_ORDER_ID')}</TableHead>
                  <TableHead>{t('ADMIN_EXCEPTIONS.TENANT')}</TableHead>
                  <TableHead>{t('ADMIN_EXCEPTIONS.BRAND')}</TableHead>
                  <TableHead>{t('ADMIN_EXCEPTIONS.GROUP')}</TableHead>
                  <TableHead>{t('ADMIN_EXCEPTIONS.TYPE')}</TableHead>
                  <TableHead>{t('ADMIN_EXCEPTIONS.SEVERITY')}</TableHead>
                  <TableHead>{t('COMMON.STATUS_1')}</TableHead>
                  <TableHead>{t('ADMIN_EXCEPTIONS.CREATED')}</TableHead>
                  <TableHead>{t('ADMIN_EXCEPTIONS.RETRY')}</TableHead>
                  <TableHead>{t('COMMON.ACTIONS')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>{item.orderId ?? '-'}</TableCell>
                    <TableCell>{item.brandOrderId ?? '-'}</TableCell>
                    <TableCell>{item.tenantName ?? '-'}</TableCell>
                    <TableCell>{item.brandName ?? '-'}</TableCell>
                    <TableCell>
                      {t(`ADMIN_EXCEPTIONS.GROUPS.${item.group}`)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.type}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.severity === 'HIGH'
                            ? 'destructive'
                            : item.severity === 'MEDIUM'
                              ? 'warning'
                              : 'secondary'
                        }
                        appearance="light"
                      >
                        {t(`ADMIN_EXCEPTIONS.SEVERITIES.${item.severity}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === 'RESOLVED' ? 'success' : 'warning'
                        }
                        appearance="light"
                      >
                        {t(`ADMIN_EXCEPTIONS.STATUS.${item.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {dateFormatter.format(new Date(item.createdAt))}
                    </TableCell>
                    <TableCell>{item.retryCount}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="icon" variant="outline" asChild>
                          <Link
                            aria-label={t('ADMIN_EXCEPTIONS.VIEW_NAMED', {
                              id: item.id,
                            })}
                            to={`/admin/exceptions/${item.id}`}
                          >
                            <Eye />
                          </Link>
                        </Button>
                        {result.data.canRetry && item.status === 'OPEN' && (
                          <Button
                            size="icon"
                            variant="outline"
                            aria-label={t('ADMIN_EXCEPTIONS.RETRY_NAMED', {
                              id: item.id,
                            })}
                            onClick={() => setRetryId(item.id)}
                          >
                            <RotateCcw />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="text-muted-foreground flex items-center justify-between text-sm">
            <span>
              {t('ADMIN_EXCEPTIONS.RANGE', {
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
                aria-label={t('ADMIN_EXCEPTIONS.PREVIOUS')}
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
                aria-label={t('ADMIN_EXCEPTIONS.NEXT')}
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
      <Dialog
        open={Boolean(retryId)}
        onOpenChange={(open) => {
          if (!open) setRetryId('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('ADMIN_EXCEPTION_DETAIL.RETRY_TITLE')}</DialogTitle>
            <DialogDescription>
              {t('ADMIN_EXCEPTION_DETAIL.RETRY_DESCRIPTION', { id: retryId })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('COMMON.CANCEL')}</Button>
            </DialogClose>
            <Button
              variant="mono"
              disabled={retryMutation.isPending}
              onClick={retryException}
            >
              {retryMutation.isPending
                ? t('ADMIN_EXCEPTION_DETAIL.RETRYING')
                : t('ADMIN_EXCEPTION_DETAIL.CONFIRM_RETRY')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
