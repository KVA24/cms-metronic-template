import type { ExceptionResolutionItem } from '@/shared/contracts';
import { useTranslations } from '@/shared/hooks/use-translations';
import { Badge } from '@/shared/ui/atoms/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/atoms/table';

const moneyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const value = (amount: number | null) => amount === null ? '-' : moneyFormatter.format(amount);

export function AdminExceptionResolutionTable({ items }: { items: ExceptionResolutionItem[] }) {
  const { t } = useTranslations();
  return <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>{t('ADMIN_EXCEPTION_DETAIL.ITEM')}</TableHead><TableHead>{t('ADMIN_EXCEPTION_DETAIL.QUANTITY')}</TableHead><TableHead>{t('ADMIN_EXCEPTION_DETAIL.FINAL_AMOUNT')}</TableHead><TableHead>{t('ADMIN_EXCEPTION_DETAIL.BRAND_SOURCE')}</TableHead><TableHead>{t('ADMIN_EXCEPTION_DETAIL.GROSS_COMMISSION')}</TableHead><TableHead>{t('ADMIN_EXCEPTION_DETAIL.TENANT_SOURCE')}</TableHead><TableHead>{t('ADMIN_EXCEPTION_DETAIL.TENANT_SHARE')}</TableHead><TableHead>{t('ADMIN_EXCEPTION_DETAIL.RESULT')}</TableHead><TableHead>{t('ADMIN_EXCEPTION_DETAIL.ISSUE')}</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.code}><TableCell><p className="font-medium">{item.name}</p><p className="font-mono text-xs text-muted-foreground">{item.code}</p></TableCell><TableCell>{item.quantity}</TableCell><TableCell>{value(item.finalAmount)}</TableCell><TableCell>{item.brandCommissionSource ?? '-'}</TableCell><TableCell>{value(item.grossCommission)}</TableCell><TableCell>{item.tenantShareSource ?? '-'}</TableCell><TableCell>{value(item.tenantShare)}</TableCell><TableCell><Badge variant={item.validationResult === 'PASS' ? 'success' : 'destructive'} appearance="light">{t(`ADMIN_EXCEPTION_DETAIL.RESULTS.${item.validationResult}`)}</Badge></TableCell><TableCell>{item.issue || '-'}</TableCell></TableRow>)}</TableBody></Table></div>;
}
