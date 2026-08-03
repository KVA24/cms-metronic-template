import { useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import type { AdminRoleCode } from '@/shared/permissions';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent, CardHeader } from '@/shared/ui/atoms/card';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/atoms/dialog';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { Container } from '@/shared/ui/molecules/container';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAdminExceptionDetail, useRetryAdminException } from '../hooks/use-admin-exceptions';
import { AdminExceptionCheckTable } from './admin-exception-check-table';
import { AdminExceptionResolutionTable } from './admin-exception-resolution-table';

const dateFormatter = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium' });
const moneyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const date = (value: string | null) => value ? dateFormatter.format(new Date(value)) : '-';
const money = (value: number | null) => value === null ? '-' : moneyFormatter.format(value);

export function AdminExceptionDetailPage() {
  const { exceptionId = '' } = useParams();
  const session = useAuthSession();
  const { t } = useTranslations();
  const roleCode = session?.roleCode as AdminRoleCode;
  const detail = useAdminExceptionDetail(exceptionId, roleCode);
  const retry = useRetryAdminException();
  const [retryOpen, setRetryOpen] = useState(false);
  if (detail.isLoading) return <Container className="space-y-4 py-6"><Skeleton className="h-12 w-72" /><Skeleton className="h-96 w-full" /></Container>;
  if (!detail.data || detail.error) return <Container className="py-8 text-sm text-destructive">{t('ADMIN_EXCEPTION_DETAIL.ERRORS.LOAD_ERROR')}</Container>;
  const { exception, tenant, brand, relatedTransaction, canRetry } = detail.data;
  const retryException = async () => {
    if (!session || retry.isPending) return;
    try {
      await retry.mutateAsync({ exceptionId, roleCode, actorId: session.user.id });
      setRetryOpen(false);
      toast.success(t('ADMIN_EXCEPTION_DETAIL.RETRY_SUCCESS'));
    } catch {
      toast.error(t('ADMIN_EXCEPTION_DETAIL.ERRORS.RETRY_ERROR'));
    }
  };
  const summary = [
    ['EXCEPTION_ID', exception.id], ['GROUP', t(`ADMIN_EXCEPTIONS.GROUPS.${exception.group}`)], ['TYPE', exception.type],
    ['REQUEST_ID', exception.requestId ?? '-'], ['ORDER_ID', exception.orderId ?? '-'], ['BRAND_ORDER_ID', exception.brandOrderId ?? '-'],
    ['CLICK_ID', exception.clickId ?? '-'], ['TENANT', tenant ? `${tenant.name} · ${tenant.id}` : '-'], ['BRAND', brand ? `${brand.name} · ${brand.id}` : '-'],
    ['CREATED', date(exception.createdAt)], ['RESOLVED', date(exception.resolvedAt)], ['RETRY_COUNT', String(exception.retryCount)],
  ] as const;
  let variantContent;
  if (exception.group === 'REQUEST_AUTHENTICATION') variantContent = <><div className="grid gap-3 sm:grid-cols-3"><p><span className="text-xs text-muted-foreground">{t('ADMIN_EXCEPTION_DETAIL.ENDPOINT')}</span><br />{exception.details.endpoint}</p><p><span className="text-xs text-muted-foreground">{t('ADMIN_EXCEPTION_DETAIL.AUTH_METHOD')}</span><br />{exception.details.authenticationMethod}</p><p><span className="text-xs text-muted-foreground">{t('ADMIN_EXCEPTION_DETAIL.FAILURE_MESSAGE')}</span><br />{exception.details.failureMessage}</p></div><AdminExceptionCheckTable checks={exception.details.checks} /></>;
  else if (exception.group === 'CLICK_ELIGIBILITY') variantContent = <><p className="text-sm"><span className="text-muted-foreground">{t('ADMIN_EXCEPTION_DETAIL.CLICK_AT')}:</span> {date(exception.details.clickAt)}</p><AdminExceptionCheckTable checks={exception.details.checks} /></>;
  else if (exception.group === 'BRAND_COMMISSION' || exception.group === 'TENANT_SHARE') variantContent = <><p className="text-sm"><span className="text-muted-foreground">{t('ADMIN_EXCEPTION_DETAIL.ORDER_SUCCESS_AT')}:</span> {date(exception.details.orderSuccessAt)}</p><AdminExceptionResolutionTable items={exception.details.items} /></>;
  else if (exception.group === 'CANCEL_REFUND') variantContent = <><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><p><span className="text-xs text-muted-foreground">{t('ADMIN_EXCEPTION_DETAIL.EVENT_TYPE')}</span><br />{exception.details.eventType}</p><p><span className="text-xs text-muted-foreground">{t('ADMIN_EXCEPTION_DETAIL.EVENT_AT')}</span><br />{date(exception.details.eventAt)}</p><p><span className="text-xs text-muted-foreground">{t('ADMIN_EXCEPTION_DETAIL.REASON')}</span><br />{exception.details.reason}</p><p><span className="text-xs text-muted-foreground">{t('ADMIN_EXCEPTION_DETAIL.ITEM_CODES')}</span><br />{exception.details.itemCodes.join(', ')}</p></div><AdminExceptionCheckTable checks={exception.details.checks} /><div className="grid gap-3 sm:grid-cols-4"><p>{t('ADMIN_EXCEPTION_DETAIL.TRANSACTION_STATUS')}: {relatedTransaction?.status ?? exception.details.transactionStatus ?? '-'}</p><p>{t('ADMIN_EXCEPTION_DETAIL.FINAL_AMOUNT')}: {money(exception.details.finalAmount)}</p><p>{t('ADMIN_EXCEPTION_DETAIL.GROSS_COMMISSION')}: {money(exception.details.grossCommission)}</p><p>{t('ADMIN_EXCEPTION_DETAIL.TENANT_SHARE')}: {money(exception.details.tenantShare)}</p></div></>;
  else variantContent = <><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><p><span className="text-xs text-muted-foreground">{t('ADMIN_EXCEPTION_DETAIL.ITEM_COUNT')}</span><br />{exception.details.itemCount}</p><p><span className="text-xs text-muted-foreground">{t('ADMIN_EXCEPTION_DETAIL.FAILURE_CODE')}</span><br />{exception.details.failureCode}</p><p><span className="text-xs text-muted-foreground">{t('ADMIN_EXCEPTION_DETAIL.FAILED_OPERATION')}</span><br />{exception.details.failedOperation}</p><p><span className="text-xs text-muted-foreground">{t('ADMIN_EXCEPTION_DETAIL.ROLLBACK_RESULT')}</span><br />{exception.details.rollbackResult}</p></div><AdminExceptionCheckTable checks={exception.details.checks} /></>;

  return <Container className="space-y-6 py-6 lg:py-8">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><Button variant="outline" size="sm" asChild><Link to="/admin/exceptions"><ArrowLeft />{t('ADMIN_EXCEPTION_DETAIL.BACK')}</Link></Button><h1 className="mt-4 text-2xl font-semibold">{t('ADMIN_EXCEPTION_DETAIL.TITLE')}</h1><p className="mt-1 text-sm text-muted-foreground">{exception.message}</p></div>{canRetry && <Button variant="mono" onClick={() => setRetryOpen(true)}><RotateCcw />{t('ADMIN_EXCEPTION_DETAIL.RETRY')}</Button>}</div>
    <Card><CardHeader><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{t('ADMIN_EXCEPTION_DETAIL.CLASSIFICATION')}</h2><Badge variant={exception.severity === 'HIGH' ? 'destructive' : exception.severity === 'MEDIUM' ? 'warning' : 'secondary'} appearance="light">{t(`ADMIN_EXCEPTIONS.SEVERITIES.${exception.severity}`)}</Badge><Badge variant={exception.status === 'RESOLVED' ? 'success' : 'warning'} appearance="light">{t(`ADMIN_EXCEPTIONS.STATUS.${exception.status}`)}</Badge></div></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{summary.map(([label, value]) => <div key={label} className="rounded-md border p-3"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t(`ADMIN_EXCEPTION_DETAIL.${label}`)}</p><p className="mt-1 break-words text-sm font-medium">{value}</p></div>)}</CardContent></Card>
    <Card><CardHeader><h2 className="font-semibold">{t('ADMIN_EXCEPTION_DETAIL.DIAGNOSTICS')}</h2></CardHeader><CardContent className="space-y-5">{variantContent}</CardContent></Card>
    <Dialog open={retryOpen} onOpenChange={setRetryOpen}><DialogContent><DialogHeader><DialogTitle>{t('ADMIN_EXCEPTION_DETAIL.RETRY_TITLE')}</DialogTitle><DialogDescription>{t('ADMIN_EXCEPTION_DETAIL.RETRY_DESCRIPTION', { id: exception.id })}</DialogDescription></DialogHeader><DialogFooter><DialogClose asChild><Button variant="outline">{t('COMMON.CANCEL')}</Button></DialogClose><Button variant="mono" disabled={retry.isPending} onClick={retryException}>{retry.isPending ? t('ADMIN_EXCEPTION_DETAIL.RETRYING') : t('ADMIN_EXCEPTION_DETAIL.CONFIRM_RETRY')}</Button></DialogFooter></DialogContent></Dialog>
  </Container>;
}
