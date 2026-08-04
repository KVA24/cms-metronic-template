import { FormEvent, useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import type { AdminRoleCode } from '@/shared/permissions';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Input } from '@/shared/ui/atoms/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/atoms/select';
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
            <Input
              id="revenue-keyword"
              name="keyword"
              aria-label={t('ADMIN_TENANT_REVENUE.KEYWORD')}
              placeholder={t('ADMIN_TENANT_REVENUE.KEYWORD')}
              value={filters.keyword}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  keyword: event.target.value,
                }))
              }
            />
            <Select
              value={filters.brandId || ''}
              onValueChange={(value) =>
                setFilters((current) => ({ ...current, brandId: value }))
              }
            >
              <SelectTrigger
                size="lg"
                aria-label={t('ADMIN_TENANT_REVENUE.BRAND')}
              >
                <SelectValue placeholder={t('COMMON.ALL')} />
              </SelectTrigger>
              <SelectContent>
                {result.data.items.map(({ brand }) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.config === 'ALL' ? '' : filters.config}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  config: (value || 'ALL') as AdminTenantRevenueQuery['config'],
                }))
              }
            >
              <SelectTrigger
                size="lg"
                aria-label={t('ADMIN_TENANT_REVENUE.CONFIG_STATUS')}
              >
                <SelectValue placeholder={t('COMMON.ALL')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONFIGURED">
                  {t('ADMIN_TENANT_REVENUE.CONFIGURED')}
                </SelectItem>
                <SelectItem value="UNCONFIGURED">
                  {t('ADMIN_TENANT_REVENUE.UNCONFIGURED')}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.status === 'ALL' ? '' : filters.status}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  status: (value || 'ALL') as AdminTenantRevenueQuery['status'],
                }))
              }
            >
              <SelectTrigger size="lg" aria-label={t('COMMON.STATUS_1')}>
                <SelectValue placeholder={t('COMMON.ALL')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">
                  {t('COMMON.STATUS.ACTIVE')}
                </SelectItem>
                <SelectItem value="DRAFT">
                  {t('COMMON.STATUS.DRAFT')}
                </SelectItem>
                <SelectItem value="INACTIVE">
                  {t('COMMON.STATUS.INACTIVE')}
                </SelectItem>
              </SelectContent>
            </Select>
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
