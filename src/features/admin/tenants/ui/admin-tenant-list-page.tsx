import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { EntityStatus } from '@/shared/contracts';
import { useTranslations } from '@/shared/hooks/use-translations';
import { hasPermission, type AdminRoleCode } from '@/shared/permissions';
import { useAuthSession } from '@/shared/stores/auth-store';
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
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  useAdminTenantFilterOptions,
  useAdminTenants,
} from '../hooks/use-admin-tenants';
import {
  ADMIN_TENANT_DEFAULT_QUERY,
  readAdminTenantQuery,
  writeAdminTenantQuery,
  type AdminTenantQuery,
} from '../model/admin-tenant';

const selectClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
});

function TenantStatus({ status }: { status: EntityStatus }) {
  const { t } = useTranslations();
  return (
    <Badge
      variant={
        status === 'ACTIVE'
          ? 'success'
          : status === 'DRAFT'
            ? 'warning'
            : 'secondary'
      }
      appearance="light"
    >
      {t(`COMMON.STATUS.${status}`)}
    </Badge>
  );
}

export function AdminTenantListPage() {
  const session = useAuthSession();
  const { t } = useTranslations();
  const roleCode = session?.roleCode as AdminRoleCode;
  const [params, setParams] = useSearchParams();
  const query = useMemo(() => readAdminTenantQuery(params), [params]);
  const [filters, setFilters] = useState(query);
  const result = useAdminTenants(query, roleCode);
  const options = useAdminTenantFilterOptions(roleCode);
  const canCreate = hasPermission(roleCode, 'tenants.create');
  useEffect(() => setFilters(query), [query]);
  const setQuery = (next: AdminTenantQuery) =>
    setParams(writeAdminTenantQuery(next));
  const apply = (event: FormEvent) => {
    event.preventDefault();
    setQuery({ ...filters, page: 1, keyword: filters.keyword.trim() });
  };

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t('ADMIN_TENANTS.TITLE')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('ADMIN_TENANTS.DESCRIPTION')}
          </p>
        </div>
        {canCreate && (
          <Button variant="mono" asChild>
            <Link to="/admin/tenants/new">
              <Plus /> {t('ADMIN_TENANTS.CREATE')}
            </Link>
          </Button>
        )}
      </div>
      <Card>
        <CardContent className="pt-6">
          <form
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
            onSubmit={apply}
          >
            <label className="space-y-1">
              <span className="text-sm font-medium">
                {t('ADMIN_TENANTS.KEYWORD')}
              </span>
              <Input
                id="tenant-keyword"
                name="keyword"
                maxLength={100}
                value={filters.keyword}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    keyword: event.target.value,
                  }))
                }
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">
                {t('COMMON.STATUS_1')}
              </span>
              <select
                id="tenant-status"
                name="status"
                className={selectClassName}
                value={filters.status}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    status: event.target.value as AdminTenantQuery['status'],
                  }))
                }
              >
                {['ALL', 'DRAFT', 'ACTIVE', 'INACTIVE'].map((status) => (
                  <option key={status} value={status}>
                    {status === 'ALL'
                      ? t('COMMON.ALL')
                      : t(`COMMON.STATUS.${status}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">
                {t('ADMIN_TENANTS.OWNER')}
              </span>
              <select
                id="tenant-owner"
                name="accountOwner"
                className={selectClassName}
                value={filters.accountOwner}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    accountOwner: event.target.value,
                  }))
                }
              >
                <option value="">{t('COMMON.ALL')}</option>
                {options.data?.accountOwners.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">
                {t('ADMIN_TENANTS.UPDATED_PERIOD')}
              </span>
              <select
                id="tenant-updated-period"
                name="updatedPeriod"
                className={selectClassName}
                value={filters.updatedPeriod}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    updatedPeriod: event.target
                      .value as AdminTenantQuery['updatedPeriod'],
                  }))
                }
              >
                <option value="ALL">{t('COMMON.ALL')}</option>
                <option value="7_DAYS">{t('ADMIN_TENANTS.LAST_7_DAYS')}</option>
                <option value="30_DAYS">
                  {t('ADMIN_TENANTS.LAST_30_DAYS')}
                </option>
              </select>
            </label>
            <div className="flex gap-2 md:col-span-2 xl:col-span-4">
              <Button type="submit" variant="mono">
                <Search />
                {t('COMMON.APPLY')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setQuery(ADMIN_TENANT_DEFAULT_QUERY)}
              >
                <RotateCcw />
                {t('COMMON.RESET')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => result.refetch()}
              >
                <RefreshCw />
                {t('COMMON.REFRESH')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <p className="text-muted-foreground text-sm">
            {t('ADMIN_TENANTS.RESULT_COUNT', {
              count: result.data?.totalItems ?? 0,
            })}
          </p>
          {result.isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : result.error ? (
            <div className="text-destructive py-12 text-center text-sm">
              {t('ADMIN_TENANTS.ERROR')}
            </div>
          ) : result.data?.items.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center text-sm">
              {t('ADMIN_TENANTS.EMPTY')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('ADMIN_TENANTS.TENANT')}</TableHead>
                  <TableHead>{t('COMMON.STATUS_1')}</TableHead>
                  <TableHead>{t('ADMIN_TENANTS.CONTACT')}</TableHead>
                  <TableHead>{t('ADMIN_TENANTS.BRAND_OFFER')}</TableHead>
                  <TableHead>{t('ADMIN_TENANTS.COMMISSION')}</TableHead>
                  <TableHead>{t('ADMIN_TENANTS.UPDATED')}</TableHead>
                  <TableHead className="text-right">
                    {t('COMMON.ACTIONS')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data?.items.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-muted-foreground font-mono text-xs">
                        {tenant.code} · {tenant.id}
                      </p>
                    </TableCell>
                    <TableCell>
                      <TenantStatus status={tenant.status} />
                    </TableCell>
                    <TableCell>
                      <p>{tenant.contactName || '-'}</p>
                      <p className="text-muted-foreground text-xs">
                        {tenant.contactEmail || '-'}
                      </p>
                    </TableCell>
                    <TableCell>
                      {tenant.brandCount} / {tenant.offerCount}
                    </TableCell>
                    <TableCell>{tenant.revenueShareCount || '-'}</TableCell>
                    <TableCell>
                      <p>{dateFormatter.format(new Date(tenant.updatedAt))}</p>
                      <p className="text-muted-foreground text-xs">
                        {tenant.updatedBy}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" asChild>
                          <Link
                            to={`/admin/tenants/${tenant.id}`}
                            aria-label={t('ADMIN_TENANTS.VIEW', {
                              name: tenant.name,
                            })}
                          >
                            <Eye />
                          </Link>
                        </Button>
                        {tenant.canEdit && (
                          <Button variant="outline" size="icon" asChild>
                            <Link
                              to={`/admin/tenants/${tenant.id}?edit=true`}
                              aria-label={t('ADMIN_TENANTS.EDIT', {
                                name: tenant.name,
                              })}
                            >
                              <Pencil />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {result.data && result.data.totalItems > 0 && (
            <div className="flex items-center justify-end gap-2 border-t pt-4">
              <span className="text-muted-foreground text-sm">
                {t('ADMIN_TENANTS.PAGE', {
                  page: result.data.page,
                  total: result.data.totalPages,
                })}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={result.data.page <= 1}
                aria-label={t('COMMON.PREVIOUS')}
                onClick={() => setQuery({ ...query, page: query.page - 1 })}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={result.data.page >= result.data.totalPages}
                aria-label={t('COMMON.NEXT')}
                onClick={() => setQuery({ ...query, page: query.page + 1 })}
              >
                <ChevronRight />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
