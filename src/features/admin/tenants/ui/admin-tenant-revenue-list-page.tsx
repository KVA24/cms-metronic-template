import { FormEvent, useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import type { AdminRoleCode } from '@/shared/permissions';
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
import { ArrowLeft, Pencil, RotateCcw, Search, Settings } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAdminTenantRevenueList } from '../hooks/use-admin-tenant-revenue';
import {
  ADMIN_TENANT_REVENUE_DEFAULT_QUERY,
  type AdminTenantRevenueQuery,
} from '../model/admin-tenant-revenue';

const selectClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm';
const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
});

export function AdminTenantRevenueListPage() {
  const { tenantId = '' } = useParams();
  const session = useAuthSession();
  const { t } = useTranslations();
  const roleCode = session?.roleCode as AdminRoleCode;
  const [query, setQuery] = useState(ADMIN_TENANT_REVENUE_DEFAULT_QUERY);
  const [filters, setFilters] = useState(query);
  const result = useAdminTenantRevenueList(tenantId, query, roleCode);
  const apply = (event: FormEvent) => {
    event.preventDefault();
    setQuery({ ...filters, keyword: filters.keyword.trim() });
  };
  if (result.isLoading)
    return (
      <Container className="space-y-4 py-6">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-80 w-full" />
      </Container>
    );
  if (!result.data || result.error)
    return (
      <Container className="text-destructive py-8 text-sm">
        {t('ADMIN_TENANT_REVENUE.ERRORS.LOAD_ERROR')}
      </Container>
    );
  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <div>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/admin/tenants/${tenantId}`}>
            <ArrowLeft />
            {result.data.tenant.name}
          </Link>
        </Button>
        <h1 className="mt-4 text-2xl font-semibold">
          {t('ADMIN_TENANT_REVENUE.TITLE')}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t('ADMIN_TENANT_REVENUE.DESCRIPTION')}
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
            onSubmit={apply}
          >
            <label className="space-y-1">
              <span className="text-sm font-medium">
                {t('ADMIN_TENANT_REVENUE.KEYWORD')}
              </span>
              <Input
                id="revenue-keyword"
                name="keyword"
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
                {t('ADMIN_TENANT_REVENUE.BRAND')}
              </span>
              <select
                id="revenue-brand"
                name="brandId"
                className={selectClassName}
                value={filters.brandId}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    brandId: event.target.value,
                  }))
                }
              >
                <option value="">{t('COMMON.ALL')}</option>
                {result.data.items.map(({ brand }) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">
                {t('ADMIN_TENANT_REVENUE.CONFIG_STATUS')}
              </span>
              <select
                id="revenue-config"
                name="config"
                className={selectClassName}
                value={filters.config}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    config: event.target
                      .value as AdminTenantRevenueQuery['config'],
                  }))
                }
              >
                <option value="ALL">{t('COMMON.ALL')}</option>
                <option value="CONFIGURED">
                  {t('ADMIN_TENANT_REVENUE.CONFIGURED')}
                </option>
                <option value="UNCONFIGURED">
                  {t('ADMIN_TENANT_REVENUE.UNCONFIGURED')}
                </option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">
                {t('COMMON.STATUS_1')}
              </span>
              <select
                id="revenue-status"
                name="status"
                className={selectClassName}
                value={filters.status}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    status: event.target
                      .value as AdminTenantRevenueQuery['status'],
                  }))
                }
              >
                <option value="ALL">{t('COMMON.ALL')}</option>
                <option value="ACTIVE">{t('COMMON.STATUS.ACTIVE')}</option>
                <option value="DRAFT">{t('COMMON.STATUS.DRAFT')}</option>
                <option value="INACTIVE">{t('COMMON.STATUS.INACTIVE')}</option>
              </select>
            </label>
            <div className="flex gap-2 xl:col-span-4">
              <Button type="submit" variant="mono">
                <Search />
                {t('COMMON.APPLY')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFilters(ADMIN_TENANT_REVENUE_DEFAULT_QUERY);
                  setQuery(ADMIN_TENANT_REVENUE_DEFAULT_QUERY);
                }}
              >
                <RotateCcw />
                {t('COMMON.RESET')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          {result.data.items.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center text-sm">
              {t('ADMIN_TENANT_REVENUE.EMPTY')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('ADMIN_TENANT_REVENUE.BRAND')}</TableHead>
                  <TableHead>{t('ADMIN_TENANT_REVENUE.VISIBILITY')}</TableHead>
                  <TableHead>
                    {t('ADMIN_TENANT_REVENUE.CONFIG_STATUS')}
                  </TableHead>
                  <TableHead>{t('ADMIN_TENANT_REVENUE.BRAND_RATE')}</TableHead>
                  <TableHead>
                    {t('ADMIN_TENANT_REVENUE.CATEGORY_OVERRIDES')}
                  </TableHead>
                  <TableHead>
                    {t('ADMIN_TENANT_REVENUE.OFFER_OVERRIDES')}
                  </TableHead>
                  <TableHead>{t('ADMIN_TENANT_REVENUE.UPDATED')}</TableHead>
                  <TableHead className="text-right">
                    {t('COMMON.ACTIONS')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.items.map((item) => (
                  <TableRow key={item.brand.id}>
                    <TableCell>
                      <p className="font-medium">{item.brand.name}</p>
                      <p className="text-muted-foreground font-mono text-xs">
                        {item.brand.id}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.visible ? 'success' : 'secondary'}
                        appearance="light"
                      >
                        {t(
                          `ADMIN_TENANT_REVENUE.${item.visible ? 'VISIBLE' : 'HIDDEN'}`,
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.configured ? 'success' : 'warning'}
                        appearance="light"
                      >
                        {t(
                          `ADMIN_TENANT_REVENUE.${item.configured ? 'CONFIGURED' : 'UNCONFIGURED'}`,
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.brandRate ? `${item.brandRate}%` : '-'}
                    </TableCell>
                    <TableCell>{item.categoryOverrideCount || '-'}</TableCell>
                    <TableCell>{item.offerOverrideCount || '-'}</TableCell>
                    <TableCell>
                      {item.updatedAt
                        ? dateFormatter.format(new Date(item.updatedAt))
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {result.data.canEdit && (
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            to={`/admin/tenants/${tenantId}/revenue-share/${item.brand.id}`}
                          >
                            {item.configured ? <Pencil /> : <Settings />}
                            {t(
                              item.configured
                                ? 'COMMON.EDIT'
                                : 'ADMIN_TENANT_REVENUE.CONFIGURE',
                            )}
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
