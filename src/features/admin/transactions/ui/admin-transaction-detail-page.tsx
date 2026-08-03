import { useTranslations } from '@/shared/hooks/use-translations';
import type { AdminRoleCode } from '@/shared/permissions';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent, CardHeader } from '@/shared/ui/atoms/card';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/atoms/table';
import { Container } from '@/shared/ui/molecules/container';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAdminTransactionDetail } from '../hooks/use-admin-transactions';

const moneyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const dateFormatter = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium' });
const money = (value: number | undefined) => value === undefined ? '-' : moneyFormatter.format(value);
const date = (value: string | null) => value ? dateFormatter.format(new Date(value)) : '-';

export function AdminTransactionDetailPage() {
  const { transactionId = '' } = useParams();
  const session = useAuthSession();
  const { t } = useTranslations();
  const result = useAdminTransactionDetail(transactionId, session?.roleCode as AdminRoleCode);
  if (result.isLoading) return <Container className="space-y-4 py-6"><Skeleton className="h-12 w-72" /><Skeleton className="h-96 w-full" /></Container>;
  if (!result.data || result.error) return <Container className="py-8 text-sm text-destructive">{t('ADMIN_TRANSACTION_DETAIL.ERRORS.LOAD_ERROR')}</Container>;
  const { header, items, histories, financialScope } = result.data;
  const summary = [
    ['ORDER_ID', header.id],
    ['BRAND_ORDER_ID', header.brandOrderId],
    ['TENANT', `${header.tenant.name} · ${header.tenant.id}`],
    ['USER_ID', header.userId ?? '-'],
    ['MEMBER_REF', header.memberRef ?? '-'],
    ['BRAND', `${header.brand.name} · ${header.brand.id}`],
    ['ORDER_STATUS', t(header.status === 'PENDING' ? 'COMMON.STATUS.PENDING' : `ADMIN_TRANSACTIONS.STATUS.${header.status}`)],
    ['LATEST_UPDATED', date(header.updatedAt)],
    ['ESTIMATED_COMMISSION', financialScope.grossCommission ? money(header.estimatedGrossCommission) : '-'],
    ['ESTIMATED_TENANT_SHARE', financialScope.tenantShare ? money(header.estimatedTenantShare) : '-'],
    ['ACTUAL_COMMISSION', financialScope.grossCommission ? money(header.actualGrossCommission) : '-'],
    ['ACTUAL_TENANT_SHARE', financialScope.tenantShare ? money(header.actualTenantShare) : '-'],
    ['CONFIRMED_AT', date(header.commissionConfirmedAt)],
  ] as const;
  const refundedCount = items.filter(({ status }) => status === 'REFUNDED').length;
  return <Container className="space-y-6 py-6 lg:py-8">
    <div><Button variant="outline" size="sm" asChild><Link to="/admin/transactions"><ArrowLeft />{t('ADMIN_TRANSACTION_DETAIL.BACK')}</Link></Button><h1 className="mt-4 text-2xl font-semibold">{t('ADMIN_TRANSACTION_DETAIL.TITLE')}</h1><p className="mt-1 text-sm text-muted-foreground">{header.id}</p></div>
    <Card><CardHeader><h2 className="font-semibold">{t('ADMIN_TRANSACTION_DETAIL.ORDER_SUMMARY')}</h2></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{summary.map(([label, value]) => <div key={label} className="rounded-md border p-3"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t(`ADMIN_TRANSACTION_DETAIL.${label}`)}</p><p className="mt-1 break-words text-sm font-medium">{value}</p></div>)}</CardContent></Card>
    <Card><CardHeader className="flex-row items-center justify-between"><h2 className="font-semibold">{t('ADMIN_TRANSACTION_DETAIL.ITEMS')}</h2><Badge variant={refundedCount ? 'warning' : 'secondary'} appearance="light">{t('ADMIN_TRANSACTION_DETAIL.ITEM_BADGE', { total: items.length, refunded: refundedCount })}</Badge></CardHeader><CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>{t('ADMIN_TRANSACTION_DETAIL.ITEM_CODE')}</TableHead><TableHead>{t('ADMIN_TRANSACTION_DETAIL.ITEM_NAME')}</TableHead><TableHead>{t('ADMIN_TRANSACTION_DETAIL.QTY')}</TableHead><TableHead>{t('ADMIN_TRANSACTION_DETAIL.BRAND_SOURCE')}</TableHead>{financialScope.grossCommission && <TableHead>{t('ADMIN_TRANSACTION_DETAIL.BRAND_VALUE')}</TableHead>}<TableHead>{t('ADMIN_TRANSACTION_DETAIL.BRAND_REFERENCE')}</TableHead><TableHead>{t('ADMIN_TRANSACTION_DETAIL.ORIGINAL_AMOUNT')}</TableHead><TableHead>{t('ADMIN_TRANSACTION_DETAIL.FINAL_AMOUNT')}</TableHead>{financialScope.grossCommission && <TableHead>{t('ADMIN_TRANSACTION_DETAIL.GROSS_COMMISSION')}</TableHead>}<TableHead>{t('ADMIN_TRANSACTION_DETAIL.TENANT_SOURCE')}</TableHead>{financialScope.tenantShare && <TableHead>{t('ADMIN_TRANSACTION_DETAIL.TENANT_VALUE')}</TableHead>}<TableHead>{t('ADMIN_TRANSACTION_DETAIL.TENANT_REFERENCE')}</TableHead>{financialScope.tenantShare && <TableHead>{t('ADMIN_TRANSACTION_DETAIL.TENANT_SHARE')}</TableHead>}<TableHead>{t('ADMIN_TRANSACTION_DETAIL.ITEM_STATUS')}</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.id}><TableCell className="font-medium">{item.code}</TableCell><TableCell>{item.name}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>{t(`ADMIN_TRANSACTION_DETAIL.SOURCES.${item.brandCommissionSource}`)}</TableCell>{financialScope.grossCommission && <TableCell>{item.brandCommissionValue}%</TableCell>}<TableCell>{item.brandMappingReference}</TableCell><TableCell>{moneyFormatter.format(item.originalAmount)}</TableCell><TableCell>{moneyFormatter.format(item.finalAmount)}</TableCell>{financialScope.grossCommission && <TableCell>{money(item.grossCommission)}</TableCell>}<TableCell>{t(`ADMIN_TRANSACTION_DETAIL.SOURCES.${item.tenantShareSource}`)}</TableCell>{financialScope.tenantShare && <TableCell>{item.tenantShareValue}%</TableCell>}<TableCell>{item.tenantShareReference || '-'}</TableCell>{financialScope.tenantShare && <TableCell>{money(item.tenantShare)}</TableCell>}<TableCell><Badge variant={item.status === 'CONFIRMED' ? 'success' : item.status === 'PENDING' ? 'warning' : 'secondary'} appearance="light">{t(`ADMIN_TRANSACTION_DETAIL.ITEM_STATUSES.${item.status}`)}</Badge></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    <Card><CardHeader><h2 className="font-semibold">{t('ADMIN_TRANSACTION_DETAIL.HISTORY')}</h2></CardHeader><CardContent>{histories.length === 0 ? <p className="text-sm text-muted-foreground">{t('ADMIN_TRANSACTION_DETAIL.NO_HISTORY')}</p> : <ol className="space-y-4 border-l pl-5">{histories.map((history) => { const item = items.find(({ id }) => id === history.transactionItemId); return <li key={history.id} className="relative"><span className="absolute -left-[1.55rem] top-1 h-2.5 w-2.5 rounded-full bg-primary" /><p className="text-sm font-medium">{t(`ADMIN_TRANSACTION_DETAIL.EVENTS.${history.eventType}`, { brand: header.brand.name, order: header.brandOrderId, count: items.length, item: item?.code ?? '-' })}</p><p className="text-xs text-muted-foreground">{date(history.eventAt)} · {history.createdBy}</p></li>; })}</ol>}</CardContent></Card>
  </Container>;
}
