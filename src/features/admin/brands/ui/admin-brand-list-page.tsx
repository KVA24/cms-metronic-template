import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { ContentLocale, EntityStatus } from '@/shared/contracts';
import { useTranslations } from '@/shared/hooks/use-translations';
import { hasPermission, type AdminRoleCode } from '@/shared/permissions';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Alert, AlertDescription, AlertIcon } from '@/shared/ui/atoms/alert';
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
import { AlertCircle, ChevronLeft, ChevronRight, Eye, Pencil, Plus, RotateCcw, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAdminBrandFilterOptions, useAdminBrands } from '../hooks/use-admin-brands';
import {
  ADMIN_BRAND_DEFAULT_QUERY,
  readAdminBrandQuery,
  writeAdminBrandQuery,
  type AdminBrandQuery,
} from '../model/admin-brand';

const selectClassName =
  'h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function BrandStatus({ status }: { status: EntityStatus }) {
  const { t } = useTranslations();
  return (
    <Badge
      variant={status === 'ACTIVE' ? 'success' : status === 'DRAFT' ? 'warning' : 'secondary'}
      appearance="light"
    >
      {t(`COMMON.STATUS.${status}`)}
    </Badge>
  );
}

export function AdminBrandListPage() {
  const session = useAuthSession();
  const { t, language } = useTranslations();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = useMemo(() => readAdminBrandQuery(searchParams), [searchParams]);
  const [draft, setDraft] = useState(query);
  const roleCode = session?.roleCode as AdminRoleCode;
  const locale: ContentLocale = language === 'vi' ? 'vi-VN' : 'en-US';
  const brands = useAdminBrands(query, roleCode, locale);
  const options = useAdminBrandFilterOptions();
  const canCreate = hasPermission(roleCode, 'brands.create');

  useEffect(() => setDraft(query), [query]);
  const updateQuery = (next: AdminBrandQuery) =>
    setSearchParams(writeAdminBrandQuery(next));
  const apply = (event: FormEvent) => {
    event.preventDefault();
    updateQuery({ ...draft, page: 1, keyword: draft.keyword.trim() });
  };

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('ADMIN_BRANDS.TITLE')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('ADMIN_BRANDS.DESCRIPTION')}</p>
        </div>
        {canCreate && (
          <Button variant="mono" asChild>
            <Link to="/admin/brands/new"><Plus />{t('ADMIN_BRANDS.CREATE')}</Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-6" onSubmit={apply}>
            <label className="space-y-1.5 xl:col-span-2">
              <span className="text-sm font-medium">{t('ADMIN_BRANDS.KEYWORD')}</span>
              <Input
                id="brand-keyword"
                name="keyword"
                maxLength={100}
                value={draft.keyword}
                placeholder={t('ADMIN_BRANDS.KEYWORD_PLACEHOLDER')}
                onChange={(event) => setDraft((current) => ({ ...current, keyword: event.target.value }))}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">{t('COMMON.STATUS_1')}</span>
              <select
                id="brand-status"
                name="status"
                className={selectClassName}
                value={draft.status}
                onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as AdminBrandQuery['status'] }))}
              >
                {['ALL', 'ACTIVE', 'INACTIVE', 'DRAFT'].map((status) => (
                  <option key={status} value={status}>{status === 'ALL' ? t('COMMON.ALL') : t(`COMMON.STATUS.${status}`)}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">{t('ADMIN_BRANDS.CATEGORY')}</span>
              <select
                id="brand-category"
                name="categoryId"
                className={selectClassName}
                value={draft.categoryId}
                onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}
              >
                <option value="">{t('COMMON.ALL')}</option>
                {options.data?.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">{t('ADMIN_BRANDS.CREATED_FROM')}</span>
              <Input id="brand-created-from" name="createdFrom" type="date" value={draft.createdFrom} onChange={(event) => setDraft((current) => ({ ...current, createdFrom: event.target.value }))} />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">{t('ADMIN_BRANDS.CREATED_TO')}</span>
              <Input id="brand-created-to" name="createdTo" type="date" value={draft.createdTo} onChange={(event) => setDraft((current) => ({ ...current, createdTo: event.target.value }))} />
            </label>
            <div className="flex items-end gap-2 xl:col-span-6">
              <Button type="submit" variant="mono"><Search />{t('COMMON.APPLY')}</Button>
              <Button type="button" variant="outline" onClick={() => updateQuery(ADMIN_BRAND_DEFAULT_QUERY)}><RotateCcw />{t('COMMON.RESET')}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{t('ADMIN_BRANDS.RESULT_COUNT', { count: brands.data?.totalItems ?? 0 })}</p>
            <div className="flex gap-2">
              <select
                id="brand-sort"
                name="sortBy"
                className={selectClassName}
                aria-label={t('ADMIN_BRANDS.SORT_BY')}
                value={query.sortBy}
                onChange={(event) => updateQuery({ ...query, page: 1, sortBy: event.target.value as AdminBrandQuery['sortBy'] })}
              >
                {['updatedAt', 'createdAt', 'code', 'name'].map((sort) => <option key={sort} value={sort}>{t(`ADMIN_BRANDS.SORT.${sort}`)}</option>)}
              </select>
              <select
                id="brand-sort-direction"
                name="sortDirection"
                className={selectClassName}
                aria-label={t('ADMIN_BRANDS.SORT_DIRECTION')}
                value={query.sortDirection}
                onChange={(event) => updateQuery({ ...query, page: 1, sortDirection: event.target.value as 'asc' | 'desc' })}
              >
                <option value="desc">{t('ADMIN_BRANDS.DESC')}</option>
                <option value="asc">{t('ADMIN_BRANDS.ASC')}</option>
              </select>
            </div>
          </div>

          {brands.isLoading ? (
            <Skeleton className="h-80 w-full" aria-label={t('COMMON.LOADING')} />
          ) : brands.error ? (
            <Alert variant="destructive" appearance="light">
              <AlertIcon><AlertCircle /></AlertIcon>
              <AlertDescription className="flex items-center justify-between gap-4">
                {t('ADMIN_BRANDS.ERROR')}
                <Button variant="outline" onClick={() => brands.refetch()}>{t('COMMON.RETRY')}</Button>
              </AlertDescription>
            </Alert>
          ) : brands.data?.items.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">{t('ADMIN_BRANDS.EMPTY')}</div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>{t('ADMIN_BRANDS.BRAND')}</TableHead>
                <TableHead>{t('ADMIN_BRANDS.CATEGORY')}</TableHead>
                <TableHead>{t('COMMON.STATUS_1')}</TableHead>
                <TableHead>{t('ADMIN_BRANDS.OFFERS')}</TableHead>
                <TableHead>{t('ADMIN_BRANDS.TENANTS')}</TableHead>
                <TableHead className="text-right">{t('COMMON.ACTIONS')}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {brands.data?.items.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img src={brand.logo?.url ?? '/media/app/mini-logo.svg'} alt="" className="size-10 rounded-md border bg-muted object-contain p-1.5" />
                        <div><p className="font-medium">{brand.name || t('ADMIN_BRANDS.NO_NAME')}</p><p className="font-mono text-xs text-muted-foreground">{brand.code}</p></div>
                      </div>
                    </TableCell>
                    <TableCell><div className="flex max-w-56 flex-wrap gap-1">{brand.categories.length ? brand.categories.map((category) => <Badge key={category.id} variant="outline">{category.name}</Badge>) : <span>-</span>}</div></TableCell>
                    <TableCell><BrandStatus status={brand.status} /></TableCell>
                    <TableCell>{brand.offerCount}</TableCell>
                    <TableCell>{brand.tenantAssignmentCount}</TableCell>
                    <TableCell><div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" asChild><Link to={`/admin/brands/${brand.id}`} aria-label={t('ADMIN_BRANDS.VIEW_BRAND', { name: brand.name })}><Eye /></Link></Button>
                      {brand.canEdit && <Button variant="outline" size="icon" asChild><Link to={`/admin/brands/${brand.id}?edit=true`} aria-label={t('ADMIN_BRANDS.EDIT_BRAND', { name: brand.name })}><Pencil /></Link></Button>}
                    </div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {brands.data && brands.data.totalItems > 0 && (
            <div className="flex items-center justify-end gap-2 border-t pt-4">
              <span className="text-sm text-muted-foreground">{t('ADMIN_BRANDS.PAGE', { page: brands.data.page, total: brands.data.totalPages })}</span>
              <Button variant="outline" size="icon" disabled={brands.data.page <= 1} aria-label={t('COMMON.PREVIOUS')} onClick={() => updateQuery({ ...query, page: query.page - 1 })}><ChevronLeft /></Button>
              <Button variant="outline" size="icon" disabled={brands.data.page >= brands.data.totalPages} aria-label={t('COMMON.NEXT')} onClick={() => updateQuery({ ...query, page: query.page + 1 })}><ChevronRight /></Button>
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
