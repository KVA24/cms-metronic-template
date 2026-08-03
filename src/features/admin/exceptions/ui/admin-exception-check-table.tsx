import type { ExceptionCheck } from '@/shared/contracts';
import { useTranslations } from '@/shared/hooks/use-translations';
import { Badge } from '@/shared/ui/atoms/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/atoms/table';

export function AdminExceptionCheckTable({ checks }: { checks: ExceptionCheck[] }) {
  const { t } = useTranslations();
  return <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>{t('ADMIN_EXCEPTION_DETAIL.CHECK')}</TableHead><TableHead>{t('ADMIN_EXCEPTION_DETAIL.RESULT')}</TableHead><TableHead>{t('ADMIN_EXCEPTION_DETAIL.MESSAGE')}</TableHead></TableRow></TableHeader><TableBody>{checks.map((check) => <TableRow key={check.name}><TableCell className="font-medium">{check.name}</TableCell><TableCell><Badge variant={check.result === 'PASS' ? 'success' : check.result === 'FAILED' ? 'destructive' : 'secondary'} appearance="light">{t(`ADMIN_EXCEPTION_DETAIL.RESULTS.${check.result}`)}</Badge></TableCell><TableCell>{check.message}</TableCell></TableRow>)}</TableBody></Table></div>;
}
