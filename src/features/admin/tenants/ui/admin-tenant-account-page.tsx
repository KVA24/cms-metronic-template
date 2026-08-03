import { FormEvent, useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import type { AdminRoleCode } from '@/shared/permissions';
import { useAuthSession } from '@/shared/stores/auth-store';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/atoms/alert-dialog';
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
import { ArrowLeft, Eye, Pencil, Plus, Power, RotateCcw, Search } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useAdminTenantAccounts,
  useDisableAdminTenantAccount,
} from '../hooks/use-admin-tenant-accounts';
import { useAdminTenant } from '../hooks/use-admin-tenants';
import {
  ADMIN_TENANT_ACCOUNT_DEFAULT_QUERY,
  TENANT_ACCOUNT_ROLES,
  type AdminTenantAccountQuery,
  type AdminTenantAccountView,
} from '../model/admin-tenant-account';
import {
  AdminTenantAccountDialog,
  type AccountDialogMode,
} from './admin-tenant-account-dialog';

const selectClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm';
const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'medium',
});

export function AdminTenantAccountPage() {
  const { tenantId = '' } = useParams();
  const session = useAuthSession();
  const { t } = useTranslations();
  const roleCode = session?.roleCode as AdminRoleCode;
  const tenant = useAdminTenant(tenantId, roleCode);
  const [query, setQuery] = useState(ADMIN_TENANT_ACCOUNT_DEFAULT_QUERY);
  const [filters, setFilters] = useState(query);
  const accounts = useAdminTenantAccounts(tenantId, query, roleCode);
  const disable = useDisableAdminTenantAccount(tenantId);
  const [mode, setMode] = useState<AccountDialogMode>(null);
  const [selected, setSelected] = useState<AdminTenantAccountView | null>(null);
  const [disableTarget, setDisableTarget] = useState<AdminTenantAccountView | null>(null);
  const apply = (event: FormEvent) => {
    event.preventDefault();
    setQuery({ ...filters, page: 1, keyword: filters.keyword.trim() });
  };
  const open = (nextMode: Exclude<AccountDialogMode, null>, account: AdminTenantAccountView | null = null) => {
    setSelected(account);
    setMode(nextMode);
  };
  const confirmDisable = async () => {
    if (!disableTarget || !session || disable.isPending) return;
    try {
      await disable.mutateAsync({
        accountId: disableTarget.id,
        roleCode,
        actorId: session.user.id,
      });
      toast.success(t('ADMIN_TENANT_ACCOUNTS.DISABLE_SUCCESS'));
      setDisableTarget(null);
    } catch (error) {
      toast.error(t(`ADMIN_TENANT_ACCOUNTS.ERRORS.${error instanceof Error ? error.message : 'SAVE_ERROR'}`));
    }
  };
  if (tenant.isLoading || accounts.isLoading)
    return <Container className="space-y-4 py-6"><Skeleton className="h-12 w-72" /><Skeleton className="h-96 w-full" /></Container>;
  if (!tenant.data || accounts.error || !accounts.data)
    return <Container className="py-8 text-sm text-destructive">{t('ADMIN_TENANT_ACCOUNTS.LOAD_ERROR')}</Container>;

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button variant="outline" size="sm" asChild><Link to={`/admin/tenants/${tenantId}`}><ArrowLeft />{tenant.data.tenant.name}</Link></Button>
          <h1 className="mt-4 text-2xl font-semibold">{t('ADMIN_TENANT_ACCOUNTS.TITLE')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{tenant.data.tenant.code} · {tenant.data.tenant.id}</p>
        </div>
        {accounts.data.canCreate && <Button variant="mono" onClick={() => open('create')}><Plus />{t('ADMIN_TENANT_ACCOUNTS.ADD')}</Button>}
      </div>
      {accounts.data.requiresFirstAdmin && <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">{t('ADMIN_TENANT_ACCOUNTS.FIRST_ADMIN_NOTICE')}</div>}
      <Card><CardContent className="pt-6"><form className="grid gap-4 md:grid-cols-3" onSubmit={apply}>
        <label className="space-y-1"><span className="text-sm font-medium">{t('ADMIN_TENANT_ACCOUNTS.KEYWORD')}</span><Input id="account-keyword" name="keyword" value={filters.keyword} onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))} /></label>
        <label className="space-y-1"><span className="text-sm font-medium">{t('ADMIN_TENANT_ACCOUNTS.ROLE')}</span><select id="account-role-filter" name="roleCode" className={selectClassName} value={filters.roleCode} onChange={(event) => setFilters((current) => ({ ...current, roleCode: event.target.value as AdminTenantAccountQuery['roleCode'] }))}><option value="ALL">{t('COMMON.ALL')}</option>{TENANT_ACCOUNT_ROLES.map((role) => <option key={role} value={role}>{t(`ADMIN_TENANT_ACCOUNTS.ROLES.${role}`)}</option>)}</select></label>
        <label className="space-y-1"><span className="text-sm font-medium">{t('COMMON.STATUS_1')}</span><select id="account-status-filter" name="status" className={selectClassName} value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as AdminTenantAccountQuery['status'] }))}><option value="ALL">{t('COMMON.ALL')}</option><option value="ACTIVE">{t('COMMON.STATUS.ACTIVE')}</option><option value="INACTIVE">{t('COMMON.STATUS.INACTIVE')}</option><option value="LOCKED">{t('ADMIN_TENANT_ACCOUNTS.LOCKED')}</option></select></label>
        <div className="flex gap-2 md:col-span-3"><Button type="submit" variant="mono"><Search />{t('COMMON.APPLY')}</Button><Button type="button" variant="outline" onClick={() => { setFilters(ADMIN_TENANT_ACCOUNT_DEFAULT_QUERY); setQuery(ADMIN_TENANT_ACCOUNT_DEFAULT_QUERY); }}><RotateCcw />{t('COMMON.RESET')}</Button></div>
      </form></CardContent></Card>
      <Card><CardContent className="space-y-4 pt-6">
        {accounts.data.items.length === 0 ? <div className="py-12 text-center text-sm text-muted-foreground">{t('ADMIN_TENANT_ACCOUNTS.EMPTY')}</div> : <Table><TableHeader><TableRow><TableHead>{t('ADMIN_TENANT_ACCOUNTS.USERNAME')}</TableHead><TableHead>{t('ADMIN_TENANT_ACCOUNTS.FULL_NAME')}</TableHead><TableHead>{t('ADMIN_TENANT_ACCOUNTS.EMAIL')}</TableHead><TableHead>{t('ADMIN_TENANT_ACCOUNTS.ROLE')}</TableHead><TableHead>{t('COMMON.STATUS_1')}</TableHead><TableHead>{t('ADMIN_TENANT_ACCOUNTS.CREATED_AT')}</TableHead><TableHead className="text-right">{t('COMMON.ACTIONS')}</TableHead></TableRow></TableHeader><TableBody>
          {accounts.data.items.map((account) => <TableRow key={account.id}><TableCell><p className="font-medium">{account.username}</p>{account.primary && <span className="text-xs text-muted-foreground">{t('ADMIN_TENANT_ACCOUNTS.PRIMARY')}</span>}</TableCell><TableCell>{account.fullName}</TableCell><TableCell>{account.email}</TableCell><TableCell>{t(`ADMIN_TENANT_ACCOUNTS.ROLES.${account.roleCode}`)}</TableCell><TableCell><Badge variant={account.status === 'ACTIVE' ? 'success' : account.status === 'LOCKED' ? 'warning' : 'secondary'} appearance="light">{account.status === 'LOCKED' ? t('ADMIN_TENANT_ACCOUNTS.LOCKED') : t(`COMMON.STATUS.${account.status}`)}</Badge></TableCell><TableCell>{dateFormatter.format(new Date(account.createdAt))}</TableCell><TableCell><div className="flex justify-end gap-2"><Button size="icon" variant="outline" aria-label={t('ADMIN_TENANT_ACCOUNTS.VIEW_USER', { name: account.username })} onClick={() => open('view', account)}><Eye /></Button>{accounts.data.canEdit && <><Button size="icon" variant="outline" aria-label={t('ADMIN_TENANT_ACCOUNTS.EDIT_USER_NAMED', { name: account.username })} onClick={() => open('edit', account)}><Pencil /></Button>{account.status !== 'INACTIVE' && <Button size="icon" variant="outline" aria-label={t('ADMIN_TENANT_ACCOUNTS.DISABLE_USER', { name: account.username })} onClick={() => setDisableTarget(account)}><Power /></Button>}</>}</div></TableCell></TableRow>)}
        </TableBody></Table>}
      </CardContent></Card>
      {mode && <AdminTenantAccountDialog key={`${mode}-${selected?.id ?? 'new'}`} tenantId={tenantId} mode={mode} account={selected} requiresFirstAdmin={accounts.data.requiresFirstAdmin} canEdit={accounts.data.canEdit} onModeChange={(next) => { setMode(next); if (!next) setSelected(null); }} />}
      <AlertDialog open={Boolean(disableTarget)} onOpenChange={(open) => !open && setDisableTarget(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('ADMIN_TENANT_ACCOUNTS.DISABLE_TITLE')}</AlertDialogTitle><AlertDialogDescription>{t('ADMIN_TENANT_ACCOUNTS.DISABLE_DESCRIPTION', { name: disableTarget?.username })}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('COMMON.CANCEL')}</AlertDialogCancel><AlertDialogAction onClick={confirmDisable}>{t('ADMIN_TENANT_ACCOUNTS.CONFIRM_DISABLE')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </Container>
  );
}
