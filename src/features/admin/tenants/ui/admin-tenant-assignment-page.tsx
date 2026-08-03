import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import type { AdminRoleCode } from '@/shared/permissions';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Checkbox } from '@/shared/ui/atoms/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/atoms/dialog';
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
import { ArrowLeft, ListChecks, RotateCcw, Save, Search } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useAdminTenantAssignments,
  useSaveAdminTenantAssignments,
} from '../hooks/use-admin-tenant-assignments';
import {
  ADMIN_TENANT_ASSIGNMENT_DEFAULT_QUERY,
  type AdminTenantAssignmentDraft,
  type AdminTenantAssignmentQuery,
  type AdminTenantAssignmentRow,
} from '../model/admin-tenant-assignment';

const selectClassName = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm';

export function AdminTenantAssignmentPage() {
  const { tenantId = '' } = useParams();
  const session = useAuthSession();
  const { t } = useTranslations();
  const roleCode = session?.roleCode as AdminRoleCode;
  const [query, setQuery] = useState(ADMIN_TENANT_ASSIGNMENT_DEFAULT_QUERY);
  const [filters, setFilters] = useState(query);
  const result = useAdminTenantAssignments(tenantId, query, roleCode);
  const save = useSaveAdminTenantAssignments(tenantId);
  const [drafts, setDrafts] = useState<Record<string, AdminTenantAssignmentDraft>>({});
  const [customBrandId, setCustomBrandId] = useState<string | null>(null);
  const [customOffers, setCustomOffers] = useState<string[]>([]);
  useEffect(() => {
    if (!result.data) return;
    setDrafts(Object.fromEntries(result.data.rows.map((row) => [row.brand.id, {
      brandId: row.brand.id,
      assigned: row.assigned,
      offerIds: row.assignedOfferIds,
    }])));
  }, [result.data]);
  const customRow = result.data?.rows.find(({ brand }) => brand.id === customBrandId) ?? null;
  const dirty = useMemo(() => result.data?.rows.some((row) => {
    const draft = drafts[row.brand.id];
    return draft && (draft.assigned !== row.assigned || JSON.stringify([...draft.offerIds].sort()) !== JSON.stringify([...row.assignedOfferIds].sort()));
  }) ?? false, [drafts, result.data]);
  const apply = (event: FormEvent) => {
    event.preventDefault();
    setQuery({ ...filters, keyword: filters.keyword.trim() });
  };
  const toggleBrand = (row: AdminTenantAssignmentRow, assigned: boolean) => {
    setDrafts((current) => ({ ...current, [row.brand.id]: {
      brandId: row.brand.id,
      assigned,
      offerIds: assigned ? row.activeOffers.map(({ id }) => id) : [],
    } }));
  };
  const toggleAll = (assigned: boolean) => {
    setDrafts((current) => {
      const next = { ...current };
      result.data?.rows.forEach((row) => {
        if (row.brand.status === 'ACTIVE') next[row.brand.id] = {
          brandId: row.brand.id,
          assigned,
          offerIds: assigned ? row.activeOffers.map(({ id }) => id) : [],
        };
      });
      return next;
    });
  };
  const openCustom = (row: AdminTenantAssignmentRow) => {
    setCustomBrandId(row.brand.id);
    setCustomOffers(drafts[row.brand.id]?.offerIds ?? []);
  };
  const submit = async () => {
    if (!session || save.isPending) return;
    try {
      await save.mutateAsync({
        drafts: Object.values(drafts),
        roleCode,
        actorId: session.user.id,
      });
      toast.success(t('ADMIN_TENANT_ASSIGNMENTS.SAVE_SUCCESS'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'SAVE_ERROR';
      toast.error(t(`ADMIN_TENANT_ASSIGNMENTS.ERRORS.${message}`));
    }
  };
  if (result.isLoading) return <Container className="space-y-4 py-6"><Skeleton className="h-12 w-72" /><Skeleton className="h-96 w-full" /></Container>;
  if (!result.data || result.error) return <Container className="py-8 text-sm text-destructive">{t('ADMIN_TENANT_ASSIGNMENTS.ERRORS.LOAD_ERROR')}</Container>;
  const activeRows = result.data.rows.filter(({ brand }) => brand.status === 'ACTIVE');
  const allSelected = activeRows.length > 0 && activeRows.every((row) => drafts[row.brand.id]?.assigned);

  return <Container className="space-y-6 py-6 lg:py-8">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><Button variant="outline" size="sm" asChild><Link to={`/admin/tenants/${tenantId}`}><ArrowLeft />{result.data.tenant.name}</Link></Button><h1 className="mt-4 text-2xl font-semibold">{t('ADMIN_TENANT_ASSIGNMENTS.TITLE')}</h1><p className="mt-1 text-sm text-muted-foreground">{t('ADMIN_TENANT_ASSIGNMENTS.DESCRIPTION')}</p></div>{result.data.canEdit && <Button variant="mono" disabled={!dirty || save.isPending} onClick={submit}><Save />{save.isPending ? t('COMMON.LOADING') : t('ADMIN_TENANT_ASSIGNMENTS.SAVE')}</Button>}</div>
    <Card><CardContent className="pt-6"><form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={apply}>
      <label className="space-y-1"><span className="text-sm font-medium">{t('ADMIN_TENANT_ASSIGNMENTS.KEYWORD')}</span><Input id="assignment-keyword" name="keyword" value={filters.keyword} onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))} /></label>
      <label className="space-y-1"><span className="text-sm font-medium">{t('ADMIN_TENANT_ASSIGNMENTS.BRAND_STATUS')}</span><select id="assignment-brand-status" name="brandStatus" className={selectClassName} value={filters.brandStatus} onChange={(event) => setFilters((current) => ({ ...current, brandStatus: event.target.value as AdminTenantAssignmentQuery['brandStatus'] }))}><option value="ALL">{t('COMMON.ALL')}</option><option value="ACTIVE">{t('COMMON.STATUS.ACTIVE')}</option><option value="INACTIVE">{t('COMMON.STATUS.INACTIVE')}</option><option value="DRAFT">{t('COMMON.STATUS.DRAFT')}</option></select></label>
      <label className="space-y-1"><span className="text-sm font-medium">{t('ADMIN_TENANT_ASSIGNMENTS.CATEGORY')}</span><select id="assignment-category" name="categoryId" className={selectClassName} value={filters.categoryId} onChange={(event) => setFilters((current) => ({ ...current, categoryId: event.target.value }))}><option value="">{t('COMMON.ALL')}</option>{result.data.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <label className="space-y-1"><span className="text-sm font-medium">{t('ADMIN_TENANT_ASSIGNMENTS.ASSIGNMENT_STATUS')}</span><select id="assignment-status" name="assignment" className={selectClassName} value={filters.assignment} onChange={(event) => setFilters((current) => ({ ...current, assignment: event.target.value as AdminTenantAssignmentQuery['assignment'] }))}><option value="ALL">{t('COMMON.ALL')}</option><option value="ASSIGNED">{t('ADMIN_TENANT_ASSIGNMENTS.ASSIGNED')}</option><option value="UNASSIGNED">{t('ADMIN_TENANT_ASSIGNMENTS.UNASSIGNED')}</option><option value="CUSTOM">{t('ADMIN_TENANT_ASSIGNMENTS.CUSTOM')}</option></select></label>
      <div className="flex gap-2 xl:col-span-4"><Button type="submit" variant="mono"><Search />{t('COMMON.APPLY')}</Button><Button type="button" variant="outline" onClick={() => { setFilters(ADMIN_TENANT_ASSIGNMENT_DEFAULT_QUERY); setQuery(ADMIN_TENANT_ASSIGNMENT_DEFAULT_QUERY); }}><RotateCcw />{t('COMMON.RESET')}</Button></div>
    </form></CardContent></Card>
    <Card><CardContent className="pt-6">{result.data.rows.length === 0 ? <div className="py-12 text-center text-sm text-muted-foreground">{t('ADMIN_TENANT_ASSIGNMENTS.EMPTY')}</div> : <Table><TableHeader><TableRow><TableHead><Checkbox aria-label={t('ADMIN_TENANT_ASSIGNMENTS.SELECT_ALL')} checked={allSelected} disabled={!result.data.canEdit || activeRows.length === 0} onCheckedChange={(value) => toggleAll(Boolean(value))} /></TableHead><TableHead>{t('ADMIN_TENANT_ASSIGNMENTS.BRAND')}</TableHead><TableHead>{t('ADMIN_TENANT_ASSIGNMENTS.CATEGORY')}</TableHead><TableHead>{t('COMMON.STATUS_1')}</TableHead><TableHead>{t('ADMIN_TENANT_ASSIGNMENTS.ACTIVE_OFFERS')}</TableHead><TableHead>{t('ADMIN_TENANT_ASSIGNMENTS.SCOPE')}</TableHead><TableHead className="text-right">{t('COMMON.ACTIONS')}</TableHead></TableRow></TableHeader><TableBody>{result.data.rows.map((row) => {
      const draft = drafts[row.brand.id];
      const scope = !draft?.assigned ? 'NOT_ASSIGNED' : draft.offerIds.length === row.activeOffers.length ? 'ALL_ACTIVE' : 'CUSTOM';
      return <TableRow key={row.brand.id}><TableCell><Checkbox aria-label={t('ADMIN_TENANT_ASSIGNMENTS.SELECT_BRAND', { name: row.brand.name })} checked={draft?.assigned ?? false} disabled={!result.data.canEdit || row.brand.status !== 'ACTIVE'} onCheckedChange={(value) => toggleBrand(row, Boolean(value))} /></TableCell><TableCell><p className="font-medium">{row.brand.name}</p><p className="font-mono text-xs text-muted-foreground">{row.brand.id}</p></TableCell><TableCell>{row.categories.map(({ name }) => name).join(', ') || '-'}</TableCell><TableCell><Badge variant={row.brand.status === 'ACTIVE' ? 'success' : row.brand.status === 'DRAFT' ? 'warning' : 'secondary'} appearance="light">{t(`COMMON.STATUS.${row.brand.status}`)}</Badge></TableCell><TableCell>{row.activeOffers.length}</TableCell><TableCell>{t(`ADMIN_TENANT_ASSIGNMENTS.SCOPES.${scope}`)}</TableCell><TableCell className="text-right"><Button variant="outline" size="sm" disabled={!result.data.canEdit || !draft?.assigned || row.activeOffers.length === 0} onClick={() => openCustom(row)}><ListChecks />{t('ADMIN_TENANT_ASSIGNMENTS.EDIT_OFFERS')}</Button></TableCell></TableRow>;
    })}</TableBody></Table>}</CardContent></Card>
    <Dialog open={Boolean(customRow)} onOpenChange={(open) => !open && setCustomBrandId(null)}><DialogContent><DialogHeader><DialogTitle>{t('ADMIN_TENANT_ASSIGNMENTS.OFFER_TITLE', { name: customRow?.brand.name })}</DialogTitle><DialogDescription>{t('ADMIN_TENANT_ASSIGNMENTS.OFFER_DESCRIPTION')}</DialogDescription></DialogHeader><div className="space-y-3">{customRow?.activeOffers.map((offer) => <label key={offer.id} className="flex items-center gap-3 rounded-md border p-3"><Checkbox checked={customOffers.includes(offer.id)} onCheckedChange={(value) => setCustomOffers((current) => value ? [...current, offer.id] : current.filter((id) => id !== offer.id))} /><span><span className="block font-medium">{offer.title}</span><span className="block font-mono text-xs text-muted-foreground">{offer.id}</span></span></label>)}</div><DialogFooter><Button variant="outline" onClick={() => setCustomBrandId(null)}>{t('COMMON.CANCEL')}</Button><Button variant="mono" onClick={() => { if (customRow) setDrafts((current) => ({ ...current, [customRow.brand.id]: { brandId: customRow.brand.id, assigned: true, offerIds: customOffers } })); setCustomBrandId(null); }}>{t('ADMIN_TENANT_ASSIGNMENTS.APPLY_OFFERS')}</Button></DialogFooter></DialogContent></Dialog>
  </Container>;
}
