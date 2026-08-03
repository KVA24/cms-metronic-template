import { FormEvent, useState } from 'react';
import type { Configuration } from '@/shared/contracts';
import { useTranslations } from '@/shared/hooks/use-translations';
import type { AdminRoleCode } from '@/shared/permissions';
import { useAuthSession } from '@/shared/stores/auth-store';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/ui/atoms/alert-dialog';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Input } from '@/shared/ui/atoms/input';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/atoms/table';
import { Container } from '@/shared/ui/molecules/container';
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminConfigurations, useDeleteAdminConfiguration } from '../hooks/use-admin-configurations';
import { ADMIN_CONFIGURATION_DEFAULT_QUERY, validateConfigurationDateRange } from '../model/admin-configuration';
import { AdminConfigurationDialog } from './admin-configuration-dialog';

const dateFormatter = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium' });

export function AdminConfigurationPage() {
  const session = useAuthSession();
  const { t } = useTranslations();
  const roleCode = session?.roleCode as AdminRoleCode;
  const [query, setQuery] = useState(ADMIN_CONFIGURATION_DEFAULT_QUERY);
  const [filters, setFilters] = useState(query);
  const [dialog, setDialog] = useState<'closed' | 'create' | 'edit'>('closed');
  const [selected, setSelected] = useState<Configuration | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Configuration | null>(null);
  const [dateError, setDateError] = useState('');
  const result = useAdminConfigurations(query, roleCode);
  const remove = useDeleteAdminConfiguration();
  const apply = (event: FormEvent) => {
    event.preventDefault();
    const errors = validateConfigurationDateRange(filters);
    if (errors.createdTo) { setDateError(errors.createdTo); return; }
    setDateError('');
    setQuery({ ...filters, keyword: filters.keyword.trim(), page: 1 });
  };
  const confirmDelete = async () => {
    if (!deleteTarget || !session || remove.isPending) return;
    try {
      await remove.mutateAsync({ id: deleteTarget.id, roleCode, actorId: session.user.id });
      toast.success(t('ADMIN_CONFIGURATION.DELETE_SUCCESS'));
      setDeleteTarget(null);
    } catch (error) {
      toast.error(t(`ADMIN_CONFIGURATION.ERRORS.${error instanceof Error ? error.message : 'DELETE_ERROR'}`));
    }
  };
  if (result.isLoading) return <Container className="space-y-4 py-6"><Skeleton className="h-12 w-72" /><Skeleton className="h-96 w-full" /></Container>;
  if (!result.data || result.error) return <Container className="py-8 text-sm text-destructive">{t('ADMIN_CONFIGURATION.ERRORS.LOAD_ERROR')}</Container>;
  return <Container className="space-y-6 py-6 lg:py-8">
    <div className="flex items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold">{t('ADMIN_CONFIGURATION.TITLE')}</h1><p className="mt-1 text-sm text-muted-foreground">{t('ADMIN_CONFIGURATION.DESCRIPTION')}</p></div>{result.data.canCreate && <Button variant="mono" onClick={() => { setSelected(null); setDialog('create'); }}><Plus />{t('ADMIN_CONFIGURATION.ADD')}</Button>}</div>
    <Card><CardContent className="pt-6"><form className="grid gap-4 md:grid-cols-3" onSubmit={apply}>
      <label className="space-y-1"><span className="text-sm font-medium">{t('ADMIN_CONFIGURATION.SEARCH')}</span><Input id="configuration-keyword" name="keyword" value={filters.keyword} onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))} /></label>
      <label className="space-y-1"><span className="text-sm font-medium">{t('ADMIN_CONFIGURATION.CREATED_FROM')}</span><Input id="configuration-created-from" name="createdFrom" type="date" value={filters.createdFrom} onChange={(event) => setFilters((current) => ({ ...current, createdFrom: event.target.value }))} /></label>
      <label className="space-y-1"><span className="text-sm font-medium">{t('ADMIN_CONFIGURATION.CREATED_TO')}</span><Input id="configuration-created-to" name="createdTo" type="date" value={filters.createdTo} onChange={(event) => setFilters((current) => ({ ...current, createdTo: event.target.value }))} />{dateError && <p className="text-xs text-destructive" role="alert">{t(`ADMIN_CONFIGURATION.ERRORS.${dateError}`)}</p>}</label>
      <Button className="w-fit md:col-span-3" type="submit" variant="mono"><Search />{t('ADMIN_CONFIGURATION.SEARCH_BUTTON')}</Button>
    </form></CardContent></Card>
    <Card><CardContent className="space-y-4 pt-6">{result.data.items.length === 0 ? <div className="py-12 text-center text-sm text-muted-foreground">{t('ADMIN_CONFIGURATION.EMPTY')}</div> : <Table><TableHeader><TableRow><TableHead>{t('ADMIN_CONFIGURATION.ID')}</TableHead><TableHead>{t('ADMIN_CONFIGURATION.KEY')}</TableHead><TableHead>{t('ADMIN_CONFIGURATION.VALUE')}</TableHead><TableHead>{t('ADMIN_CONFIGURATION.CREATED_AT')}</TableHead><TableHead>{t('COMMON.STATUS_1')}</TableHead><TableHead className="text-right">{t('COMMON.ACTIONS')}</TableHead></TableRow></TableHeader><TableBody>{result.data.items.map((item) => <TableRow key={item.id}><TableCell>{item.id}</TableCell><TableCell className="font-medium">{item.key}</TableCell><TableCell>{item.value}</TableCell><TableCell>{dateFormatter.format(new Date(item.createdAt))}</TableCell><TableCell><Badge variant={item.status === 'ACTIVE' ? 'success' : 'secondary'} appearance="light">{t(`COMMON.STATUS.${item.status}`)}</Badge></TableCell><TableCell><div className="flex justify-end gap-2">{result.data.canEdit && <Button size="icon" variant="outline" aria-label={t('ADMIN_CONFIGURATION.EDIT_NAMED', { key: item.key })} onClick={() => { setSelected(item); setDialog('edit'); }}><Pencil /></Button>}{result.data.canDelete && <Button size="icon" variant="outline" aria-label={t('ADMIN_CONFIGURATION.DELETE_NAMED', { key: item.key })} onClick={() => setDeleteTarget(item)}><Trash2 /></Button>}</div></TableCell></TableRow>)}</TableBody></Table>}
      <div className="flex items-center justify-between text-sm text-muted-foreground"><span>{t('ADMIN_CONFIGURATION.RANGE', { from: result.data.totalItems ? (result.data.page - 1) * result.data.pageSize + 1 : 0, to: Math.min(result.data.page * result.data.pageSize, result.data.totalItems), total: result.data.totalItems })}</span><div className="flex gap-2"><Button size="icon" variant="outline" aria-label={t('ADMIN_CONFIGURATION.PREVIOUS')} disabled={result.data.page <= 1} onClick={() => setQuery((current) => ({ ...current, page: current.page - 1 }))}><ChevronLeft /></Button><Button size="icon" variant="outline" aria-label={t('ADMIN_CONFIGURATION.NEXT')} disabled={result.data.page >= result.data.totalPages} onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))}><ChevronRight /></Button></div></div>
    </CardContent></Card>
    {dialog !== 'closed' && <AdminConfigurationDialog key={`${dialog}-${selected?.id ?? 'new'}`} configuration={dialog === 'edit' ? selected : null} onClose={() => setDialog('closed')} />}
    <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('ADMIN_CONFIGURATION.DELETE_TITLE')}</AlertDialogTitle><AlertDialogDescription>{t('ADMIN_CONFIGURATION.DELETE_DESCRIPTION', { id: deleteTarget?.id })}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('COMMON.CANCEL')}</AlertDialogCancel><AlertDialogAction onClick={confirmDelete}>{t('COMMON.DELETE')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </Container>;
}
