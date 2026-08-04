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
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  RotateCcw,
  Search,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAdminCategories } from '../hooks/use-admin-categories';
import {
  ADMIN_CATEGORY_DEFAULT_QUERY,
  readAdminCategoryQuery,
  writeAdminCategoryQuery,
  type AdminCategoryQuery,
} from '../model/admin-category';

const selectClassName =
  'h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function StatusBadge({ status }: { status: EntityStatus }) {
  const { t } = useTranslations();
  const variant =
    status === 'ACTIVE'
      ? 'success'
      : status === 'DRAFT'
        ? 'warning'
        : 'secondary';
  return (
    <Badge variant={variant} appearance="light">
      {t(`COMMON.STATUS.${status}`)}
    </Badge>
  );
}

export function AdminCategoryListPage() {
  const session = useAuthSession();
  const { t, language } = useTranslations();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = useMemo(
    () => readAdminCategoryQuery(searchParams),
    [searchParams],
  );
  const [draft, setDraft] = useState(query);
  const roleCode = session?.roleCode as AdminRoleCode;
  const locale: ContentLocale = language === 'vi' ? 'vi-VN' : 'en-US';
  const categories = useAdminCategories(query, roleCode, locale);
  const canCreate = hasPermission(roleCode, 'categories.create');
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }),
    [locale],
  );

  useEffect(() => setDraft(query), [query]);

  const updateQuery = (next: AdminCategoryQuery) =>
    setSearchParams(writeAdminCategoryQuery(next));

  const apply = (event: FormEvent) => {
    event.preventDefault();
    updateQuery({ ...draft, page: 1, keyword: draft.keyword.trim() });
  };

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('ADMIN_CATEGORIES.TITLE')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('ADMIN_CATEGORIES.DESCRIPTION')}
          </p>
        </div>
        {canCreate && (
          <Button variant="mono" asChild>
            <Link to="/admin/categories/new">
              <Plus />
              {t('ADMIN_CATEGORIES.CREATE')}
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <form
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-6"
            onSubmit={apply}
          >
            <Input
              className="xl:col-span-2"
              id="category-keyword"
              name="keyword"
              aria-label={t('ADMIN_CATEGORIES.FILTERS.KEYWORD')}
              value={draft.keyword}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  keyword: event.target.value,
                }))
              }
              placeholder={t('ADMIN_CATEGORIES.FILTERS.KEYWORD_PLACEHOLDER')}
            />
            <Select
              value={draft.status === 'ALL' ? '' : draft.status}
              onValueChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  status: (value || 'ALL') as AdminCategoryQuery['status'],
                }))
              }
            >
              <SelectTrigger size="lg" aria-label={t('COMMON.STATUS_1')}>
                <SelectValue placeholder={t('COMMON.ALL')} />
              </SelectTrigger>
              <SelectContent>
                {['ACTIVE', 'INACTIVE', 'DRAFT'].map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`COMMON.STATUS.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={draft.landing === 'ALL' ? '' : draft.landing}
              onValueChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  landing: (value || 'ALL') as AdminCategoryQuery['landing'],
                }))
              }
            >
              <SelectTrigger
                size="lg"
                aria-label={t('ADMIN_CATEGORIES.LANDING')}
              >
                <SelectValue placeholder={t('COMMON.ALL')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VISIBLE">
                  {t('ADMIN_CATEGORIES.VISIBLE')}
                </SelectItem>
                <SelectItem value="HIDDEN">
                  {t('ADMIN_CATEGORIES.HIDDEN')}
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-end gap-2 xl:col-span-2">
              <Button type="submit" variant="mono">
                <Search />
                {t('COMMON.APPLY')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => updateQuery(ADMIN_CATEGORY_DEFAULT_QUERY)}
              >
                <RotateCcw />
                {t('COMMON.RESET')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">
              {t('ADMIN_CATEGORIES.RESULT_COUNT', {
                count: categories.data?.totalItems ?? 0,
              })}
            </p>
            <div className="flex flex-wrap gap-2">
              <select
                id="category-sort-by"
                name="sortBy"
                className={selectClassName}
                aria-label={t('ADMIN_CATEGORIES.SORT_BY')}
                value={query.sortBy}
                onChange={(event) =>
                  updateQuery({
                    ...query,
                    page: 1,
                    sortBy: event.target.value as AdminCategoryQuery['sortBy'],
                  })
                }
              >
                {['displayOrder', 'code', 'name', 'updatedAt'].map((sortBy) => (
                  <option key={sortBy} value={sortBy}>
                    {t(`ADMIN_CATEGORIES.SORT.${sortBy}`)}
                  </option>
                ))}
              </select>
              <select
                id="category-sort-direction"
                name="sortDirection"
                className={selectClassName}
                aria-label={t('ADMIN_CATEGORIES.SORT_DIRECTION')}
                value={query.sortDirection}
                onChange={(event) =>
                  updateQuery({
                    ...query,
                    page: 1,
                    sortDirection: event.target.value as 'asc' | 'desc',
                  })
                }
              >
                <option value="asc">{t('ADMIN_CATEGORIES.ASC')}</option>
                <option value="desc">{t('ADMIN_CATEGORIES.DESC')}</option>
              </select>
            </div>
          </div>

          {categories.isLoading ? (
            <Skeleton
              className="h-96 w-full"
              aria-label={t('COMMON.LOADING')}
            />
          ) : categories.error ? (
            <Alert variant="destructive" appearance="light">
              <AlertIcon>
                <AlertCircle />
              </AlertIcon>
              <AlertDescription className="flex items-center justify-between gap-4">
                {t('ADMIN_CATEGORIES.ERROR')}
                <Button variant="outline" onClick={() => categories.refetch()}>
                  {t('COMMON.RETRY')}
                </Button>
              </AlertDescription>
            </Alert>
          ) : categories.data?.items.length === 0 ? (
            <div className="text-muted-foreground py-16 text-center text-sm">
              {t('ADMIN_CATEGORIES.EMPTY')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('ADMIN_CATEGORIES.CODE')}</TableHead>
                  <TableHead>{t('ADMIN_CATEGORIES.NAME')}</TableHead>
                  <TableHead>{t('COMMON.STATUS_1')}</TableHead>
                  <TableHead>{t('ADMIN_CATEGORIES.UPDATED')}</TableHead>
                  <TableHead>{t('ADMIN_CATEGORIES.LANDING')}</TableHead>
                  <TableHead className="text-right">
                    {t('COMMON.ACTIONS')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.data?.items.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-mono font-medium">
                      {category.code}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={category.icon?.url ?? '/media/app/mini-logo.svg'}
                          alt=""
                          className="bg-muted size-9 rounded-md border object-contain p-1.5"
                        />
                        <div>
                          <p className="font-medium">{category.name}</p>
                          {category.resolvedLocale !== locale && (
                            <p className="text-muted-foreground text-xs">
                              {t('ADMIN_CATEGORIES.FALLBACK_VI')}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={category.status} />
                    </TableCell>
                    <TableCell>
                      <p>
                        {dateFormatter.format(new Date(category.updatedAt))}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {category.updatedBy}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          category.landingVisible ? 'success' : 'secondary'
                        }
                        appearance="light"
                      >
                        {category.landingVisible
                          ? t('ADMIN_CATEGORIES.VISIBLE')
                          : t('ADMIN_CATEGORIES.HIDDEN')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          tooltip={t('COMMON.VIEW')}
                          asChild
                        >
                          <Link
                            to={`/admin/categories/${category.id}`}
                            aria-label={t('ADMIN_CATEGORIES.VIEW_CATEGORY', {
                              name: category.name,
                            })}
                          >
                            <Eye />
                          </Link>
                        </Button>
                        {category.canEdit && (
                          <Button
                            variant="outline"
                            size="icon"
                            tooltip={t('COMMON.EDIT')}
                            asChild
                          >
                            <Link
                              to={`/admin/categories/${category.id}/edit`}
                              aria-label={t('ADMIN_CATEGORIES.EDIT_CATEGORY', {
                                name: category.name,
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

          {categories.data && categories.data.totalItems > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <label className="flex items-center gap-2 text-sm">
                {t('ADMIN_CATEGORIES.PAGE_SIZE')}
                <select
                  id="category-page-size"
                  name="pageSize"
                  className={selectClassName}
                  value={query.pageSize}
                  onChange={(event) =>
                    updateQuery({
                      ...query,
                      page: 1,
                      pageSize: Number(event.target.value),
                    })
                  }
                >
                  {[5, 10, 20].map((size) => (
                    <option key={size}>{size}</option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">
                  {t('ADMIN_CATEGORIES.PAGE', {
                    page: categories.data.page,
                    total: categories.data.totalPages,
                  })}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={categories.data.page <= 1}
                  aria-label={t('COMMON.PREVIOUS')}
                  onClick={() =>
                    updateQuery({ ...query, page: query.page - 1 })
                  }
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={categories.data.page >= categories.data.totalPages}
                  aria-label={t('COMMON.NEXT')}
                  onClick={() =>
                    updateQuery({ ...query, page: query.page + 1 })
                  }
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
