import { FormEvent, useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import type { AdminRoleCode } from '@/shared/permissions';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Input } from '@/shared/ui/atoms/input';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/atoms/table';
import { Container } from '@/shared/ui/molecules/container';
import { ChevronLeft, ChevronRight, Download, Eye, RotateCcw, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAdminExceptionFilters, useAdminExceptions, useExportAdminExceptions } from '../hooks/use-admin-exceptions';
import { ADMIN_EXCEPTION_DEFAULT_QUERY, EXCEPTION_GROUPS, validateExceptionDateRange, type AdminExceptionQuery } from '../model/admin-exception';

const selectClassName = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm';
const dateFormatter = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium' });

export function AdminExceptionListPage() {
  const session = useAuthSession();
  const { t } = useTranslations();
  const roleCode = session?.roleCode as AdminRoleCode;
  const [query, setQuery] = useState(ADMIN_EXCEPTION_DEFAULT_QUERY);
  const [filters, setFilters] = useState(query);
  const [dateError, setDateError] = useState('');
  const result = useAdminExceptions(query, roleCode);
  const options = useAdminExceptionFilters(roleCode);
  const exportMutation = useExportAdminExceptions();
  const setFilter = <K extends keyof AdminExceptionQuery>(field: K, value: AdminExceptionQuery[K]) => setFilters((current) => ({ ...current, [field]: value }));
  const apply = (event: FormEvent) => {
    event.preventDefault();
    const errors = validateExceptionDateRange(filters);
    if (errors.dateTo) { setDateError(errors.dateTo); return; }
    setDateError(''); setQuery({ ...filters, keyword: filters.keyword.trim(), page: 1 });
  };
  const reset = () => { setFilters(ADMIN_EXCEPTION_DEFAULT_QUERY); setQuery(ADMIN_EXCEPTION_DEFAULT_QUERY); setDateError(''); };
  const exportRows = async () => {
    if (!session || exportMutation.isPending) return;
    try { const request = await exportMutation.mutateAsync({ query, roleCode, actorId: session.user.id }); toast.success(t('ADMIN_EXCEPTIONS.EXPORT_SUCCESS', { file: request.fileName, rows: request.rowCount })); }
    catch { toast.error(t('ADMIN_EXCEPTIONS.ERRORS.EXPORT_ERROR')); }
  };
  if (result.isLoading || options.isLoading) return <Container className="space-y-4 py-6"><Skeleton className="h-12 w-72" /><Skeleton className="h-96 w-full" /></Container>;
  if (!result.data || !options.data || result.error || options.error) return <Container className="py-8 text-sm text-destructive">{t('ADMIN_EXCEPTIONS.ERRORS.LOAD_ERROR')}</Container>;
  return <Container className="space-y-6 py-6 lg:py-8">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold">{t('ADMIN_EXCEPTIONS.TITLE')}</h1><p className="mt-1 text-sm text-muted-foreground">{t('ADMIN_EXCEPTIONS.DESCRIPTION')}</p></div>{result.data.canExport && <Button variant="outline" disabled={exportMutation.isPending} onClick={exportRows}><Download />{exportMutation.isPending ? t('ADMIN_EXCEPTIONS.EXPORTING') : t('ADMIN_EXCEPTIONS.EXPORT')}</Button>}</div>
    <Card><CardContent className="pt-6"><form className="grid gap-4 lg:grid-cols-5" onSubmit={apply}>
      <label className="space-y-1"><span className="text-sm font-medium">{t('ADMIN_EXCEPTIONS.KEYWORD')}</span><Input id="exception-keyword" name="keyword" value={filters.keyword} onChange={(event) => setFilter('keyword', event.target.value)} /></label>
      <label className="space-y-1"><span className="text-sm font-medium">{t('ADMIN_EXCEPTIONS.TENANT')}</span><select id="exception-tenant" name="tenantId" className={selectClassName} value={filters.tenantId} onChange={(event) => setFilter('tenantId', event.target.value)}><option value="">{t('COMMON.ALL')}</option>{options.data.tenants.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="space-y-1"><span className="text-sm font-medium">{t('ADMIN_EXCEPTIONS.BRAND')}</span><select id="exception-brand" name="brandId" className={selectClassName} value={filters.brandId} onChange={(event) => setFilter('brandId', event.target.value)}><option value="">{t('COMMON.ALL')}</option>{options.data.brands.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="space-y-1"><span className="text-sm font-medium">{t('ADMIN_EXCEPTIONS.GROUP')}</span><select id="exception-group" name="group" className={selectClassName} value={filters.group} onChange={(event) => setFilter('group', event.target.value as AdminExceptionQuery['group'])}><option value="ALL">{t('COMMON.ALL')}</option>{EXCEPTION_GROUPS.map((group) => <option key={group} value={group}>{t(`ADMIN_EXCEPTIONS.GROUPS.${group}`)}</option>)}</select></label>
      <label className="space-y-1"><span className="text-sm font-medium">{t('COMMON.STATUS_1')}</span><select id="exception-status" name="status" className={selectClassName} value={filters.status} onChange={(event) => setFilter('status', event.target.value as AdminExceptionQuery['status'])}><option value="ALL">{t('COMMON.ALL')}</option><option value="OPEN">{t('ADMIN_EXCEPTIONS.STATUS.OPEN')}</option><option value="RESOLVED">{t('ADMIN_EXCEPTIONS.STATUS.RESOLVED')}</option></select></label>
      <label className="space-y-1"><span className="text-sm font-medium">{t('ADMIN_EXCEPTIONS.DATE_FROM')}</span><Input id="exception-date-from" name="dateFrom" type="date" value={filters.dateFrom} onChange={(event) => setFilter('dateFrom', event.target.value)} /></label>
      <label className="space-y-1"><span className="text-sm font-medium">{t('ADMIN_EXCEPTIONS.DATE_TO')}</span><Input id="exception-date-to" name="dateTo" type="date" value={filters.dateTo} onChange={(event) => setFilter('dateTo', event.target.value)} />{dateError && <p className="text-xs text-destructive" role="alert">{t(`ADMIN_EXCEPTIONS.ERRORS.${dateError}`)}</p>}</label>
      <div className="flex items-end gap-2 lg:col-span-3"><Button type="submit" variant="mono"><Search />{t('COMMON.APPLY')}</Button><Button type="button" variant="outline" onClick={reset}><RotateCcw />{t('COMMON.RESET')}</Button></div>
    </form></CardContent></Card>
    <Card><CardContent className="space-y-4 overflow-x-auto pt-6">{result.data.items.length === 0 ? <div className="py-12 text-center text-sm text-muted-foreground">{t('ADMIN_EXCEPTIONS.EMPTY')}</div> : <Table><TableHeader><TableRow><TableHead>{t('ADMIN_EXCEPTIONS.EXCEPTION_ID')}</TableHead><TableHead>{t('ADMIN_EXCEPTIONS.ORDER_ID')}</TableHead><TableHead>{t('ADMIN_EXCEPTIONS.BRAND_ORDER_ID')}</TableHead><TableHead>{t('ADMIN_EXCEPTIONS.TENANT')}</TableHead><TableHead>{t('ADMIN_EXCEPTIONS.BRAND')}</TableHead><TableHead>{t('ADMIN_EXCEPTIONS.GROUP')}</TableHead><TableHead>{t('ADMIN_EXCEPTIONS.TYPE')}</TableHead><TableHead>{t('ADMIN_EXCEPTIONS.SEVERITY')}</TableHead><TableHead>{t('COMMON.STATUS_1')}</TableHead><TableHead>{t('ADMIN_EXCEPTIONS.CREATED')}</TableHead><TableHead>{t('ADMIN_EXCEPTIONS.RETRY')}</TableHead><TableHead>{t('COMMON.ACTIONS')}</TableHead></TableRow></TableHeader><TableBody>{result.data.items.map((item) => <TableRow key={item.id}><TableCell className="font-medium">{item.id}</TableCell><TableCell>{item.orderId ?? '-'}</TableCell><TableCell>{item.brandOrderId ?? '-'}</TableCell><TableCell>{item.tenantName ?? '-'}</TableCell><TableCell>{item.brandName ?? '-'}</TableCell><TableCell>{t(`ADMIN_EXCEPTIONS.GROUPS.${item.group}`)}</TableCell><TableCell className="font-mono text-xs">{item.type}</TableCell><TableCell><Badge variant={item.severity === 'HIGH' ? 'destructive' : item.severity === 'MEDIUM' ? 'warning' : 'secondary'} appearance="light">{t(`ADMIN_EXCEPTIONS.SEVERITIES.${item.severity}`)}</Badge></TableCell><TableCell><Badge variant={item.status === 'RESOLVED' ? 'success' : 'warning'} appearance="light">{t(`ADMIN_EXCEPTIONS.STATUS.${item.status}`)}</Badge></TableCell><TableCell>{dateFormatter.format(new Date(item.createdAt))}</TableCell><TableCell>{item.retryCount}</TableCell><TableCell><Button size="icon" variant="outline" asChild><Link aria-label={t('ADMIN_EXCEPTIONS.VIEW_NAMED', { id: item.id })} to={`/admin/exceptions/${item.id}`}><Eye /></Link></Button></TableCell></TableRow>)}</TableBody></Table>}
      <div className="flex items-center justify-between text-sm text-muted-foreground"><span>{t('ADMIN_EXCEPTIONS.RANGE', { from: result.data.totalItems ? (result.data.page - 1) * result.data.pageSize + 1 : 0, to: Math.min(result.data.page * result.data.pageSize, result.data.totalItems), total: result.data.totalItems })}</span><div className="flex gap-2"><Button size="icon" variant="outline" aria-label={t('ADMIN_EXCEPTIONS.PREVIOUS')} disabled={result.data.page <= 1} onClick={() => setQuery((current) => ({ ...current, page: current.page - 1 }))}><ChevronLeft /></Button><Button size="icon" variant="outline" aria-label={t('ADMIN_EXCEPTIONS.NEXT')} disabled={result.data.page >= result.data.totalPages} onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))}><ChevronRight /></Button></div></div>
    </CardContent></Card>
  </Container>;
}
