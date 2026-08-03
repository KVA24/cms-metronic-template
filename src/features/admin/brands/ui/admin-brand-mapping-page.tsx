import { FormEvent, useEffect, useRef, useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import type { AdminRoleCode } from '@/shared/permissions';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Alert, AlertDescription, AlertIcon } from '@/shared/ui/atoms/alert';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent, CardHeader } from '@/shared/ui/atoms/card';
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
  AlertCircle,
  ArrowLeft,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { toast } from 'sonner';
import {
  useAdminBrandMappings,
  useSaveAdminBrandMappings,
} from '../hooks/use-admin-brand-mappings';
import {
  ADMIN_BRAND_MAPPING_DEFAULT_QUERY,
  ADMIN_BRAND_MAPPING_EMPTY_ROW,
  adminBrandMappingBatchSchema,
  mappingToInput,
  type AdminBrandMappingQuery,
  type AdminBrandMappingRowInput,
} from '../model/admin-brand-mapping';

const selectClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
type RowErrors = Record<number, Record<string, string>>;
type EditableMappingRow = AdminBrandMappingRowInput & { clientId: string };
const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
});

function readQuery(params: URLSearchParams): AdminBrandMappingQuery {
  const commissionType = params.get('commissionType');
  const status = params.get('status');
  return {
    keyword: params.get('keyword')?.trim() ?? '',
    categoryId: params.get('categoryId') ?? '',
    commissionType:
      commissionType === 'PERCENTAGE' || commissionType === 'FIXED_AMOUNT'
        ? commissionType
        : 'ALL',
    status:
      status === 'ACTIVE' || status === 'INACTIVE' || status === 'DRAFT'
        ? status
        : 'ALL',
  };
}

function MappingEditor({
  brandId,
  categories,
  initialRows,
}: {
  brandId: string;
  categories: Array<{ id: string; name: string }>;
  initialRows: AdminBrandMappingRowInput[];
}) {
  const session = useAuthSession();
  const { t } = useTranslations();
  const navigate = useNavigate();
  const save = useSaveAdminBrandMappings(brandId);
  const nextClientId = useRef(initialRows.length + 1);
  const [rows, setRows] = useState<EditableMappingRow[]>(() =>
    initialRows.map((row, index) => ({
      ...row,
      clientId: row.id ?? `new-mapping-${index + 1}`,
    })),
  );
  const [errors, setErrors] = useState<RowErrors>({});

  const setField = <K extends keyof AdminBrandMappingRowInput>(
    index: number,
    field: K,
    value: AdminBrandMappingRowInput[K],
  ) => {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
    setErrors((current) => ({
      ...current,
      [index]: { ...current[index], [field]: '' },
    }));
  };
  const addRow = () => {
    const clientId = `new-mapping-${nextClientId.current}`;
    nextClientId.current += 1;
    setRows((current) => [
      ...current,
      { ...ADMIN_BRAND_MAPPING_EMPTY_ROW, clientId },
    ]);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!session || save.isPending) return;
    const parsed = adminBrandMappingBatchSchema.safeParse(rows);
    if (!parsed.success) {
      const next: RowErrors = {};
      parsed.error.issues.forEach((issue) => {
        const rowIndex = Number(issue.path[0]);
        const field = String(issue.path[1] ?? 'row');
        next[rowIndex] ??= {};
        next[rowIndex][field] ??= issue.message;
      });
      setErrors(next);
      return;
    }
    try {
      await save.mutateAsync({
        rows,
        roleCode: session.roleCode as AdminRoleCode,
        actorId: session.user.id,
      });
      toast.success(t('ADMIN_BRAND_MAPPINGS.SAVE_SUCCESS'));
      navigate(`/admin/brands/${brandId}/categories`, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message === 'BRAND_CATEGORY_CODE_DUPLICATE') {
        setErrors(
          Object.fromEntries(
            rows.map((_, index) => [
              index,
              { brandCategoryCode: 'BRAND_CATEGORY_CODE_DUPLICATE' },
            ]),
          ),
        );
      }
      toast.error(
        t(
          message === 'BRAND_DEFAULT_CATEGORY_REQUIRED' ||
            message === 'DEFAULT_MUST_BE_ACTIVE'
            ? 'ADMIN_BRAND_MAPPINGS.DEFAULT_ERROR'
            : message === 'BRAND_CATEGORY_CODE_DUPLICATE'
              ? 'ADMIN_BRAND_MAPPINGS.DUPLICATE_ERROR'
              : 'ADMIN_BRAND_MAPPINGS.SAVE_ERROR',
        ),
      );
    }
  };

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      {rows.map((row, index) => (
        <Card key={row.clientId}>
          <CardHeader className="flex-row items-center justify-between">
            <h2 className="font-semibold">
              {t('ADMIN_BRAND_MAPPINGS.ROW', { number: index + 1 })}
            </h2>
            {rows.length > 1 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-label={t('ADMIN_BRAND_MAPPINGS.REMOVE_ROW')}
                onClick={() =>
                  setRows((current) =>
                    current.filter((_, rowIndex) => rowIndex !== index),
                  )
                }
              >
                <Trash2 />
              </Button>
            )}
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1">
              <span className="text-sm font-medium">
                {t('ADMIN_BRAND_MAPPINGS.CATEGORY')} *
              </span>
              <select
                className={selectClassName}
                value={row.categoryId}
                onChange={(event) =>
                  setField(index, 'categoryId', event.target.value)
                }
              >
                <option value="">--</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors[index]?.categoryId && (
                <p role="alert" className="text-xs text-destructive">
                  {t(`ADMIN_BRAND_MAPPINGS.ERRORS.${errors[index].categoryId}`)}
                </p>
              )}
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">
                {t('ADMIN_BRAND_MAPPINGS.BRAND_CODE')} *
              </span>
              <Input
                value={row.brandCategoryCode}
                onChange={(event) =>
                  setField(index, 'brandCategoryCode', event.target.value)
                }
              />
              {errors[index]?.brandCategoryCode && (
                <p role="alert" className="text-xs text-destructive">
                  {t(
                    `ADMIN_BRAND_MAPPINGS.ERRORS.${errors[index].brandCategoryCode}`,
                  )}
                </p>
              )}
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">
                {t('ADMIN_BRAND_MAPPINGS.BRAND_NAME')}
              </span>
              <Input
                value={row.brandCategoryName}
                onChange={(event) =>
                  setField(index, 'brandCategoryName', event.target.value)
                }
              />
            </label>
            <label className="flex items-center gap-2 pt-7 text-sm font-medium">
              <input
                type="checkbox"
                checked={row.isDefault}
                onChange={(event) =>
                  setField(index, 'isDefault', event.target.checked)
                }
              />
              {t('ADMIN_BRAND_MAPPINGS.DEFAULT')}
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">
                {t('ADMIN_BRAND_MAPPINGS.COMMISSION_TYPE')} *
              </span>
              <select
                className={selectClassName}
                value={row.commissionType}
                onChange={(event) =>
                  setField(
                    index,
                    'commissionType',
                    event.target
                      .value as AdminBrandMappingRowInput['commissionType'],
                  )
                }
              >
                <option value="PERCENTAGE">
                  {t('ADMIN_BRAND_MAPPINGS.PERCENTAGE')}
                </option>
                <option value="FIXED_AMOUNT">
                  {t('ADMIN_BRAND_MAPPINGS.FIXED_AMOUNT')}
                </option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">
                {t('ADMIN_BRAND_MAPPINGS.COMMISSION')} (
                {row.commissionType === 'PERCENTAGE' ? '%' : 'VND'}) *
              </span>
              <Input
                type="number"
                min="0"
                step={row.commissionType === 'PERCENTAGE' ? '0.01' : '1'}
                value={row.commissionValue}
                onChange={(event) =>
                  setField(index, 'commissionValue', Number(event.target.value))
                }
              />
              {errors[index]?.commissionValue && (
                <p role="alert" className="text-xs text-destructive">
                  {t(
                    `ADMIN_BRAND_MAPPINGS.ERRORS.${errors[index].commissionValue}`,
                  )}
                </p>
              )}
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">
                {t('ADMIN_BRAND_MAPPINGS.EFFECTIVE_FROM')} *
              </span>
              <Input
                type="date"
                value={row.effectiveFrom}
                onChange={(event) =>
                  setField(index, 'effectiveFrom', event.target.value)
                }
              />
              {errors[index]?.effectiveFrom && (
                <p role="alert" className="text-xs text-destructive">
                  {t(
                    `ADMIN_BRAND_MAPPINGS.ERRORS.${errors[index].effectiveFrom}`,
                  )}
                </p>
              )}
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">
                {t('ADMIN_BRAND_MAPPINGS.EFFECTIVE_TO')}
              </span>
              <Input
                type="date"
                value={row.effectiveTo}
                onChange={(event) =>
                  setField(index, 'effectiveTo', event.target.value)
                }
              />
              {errors[index]?.effectiveTo && (
                <p role="alert" className="text-xs text-destructive">
                  {t(
                    `ADMIN_BRAND_MAPPINGS.ERRORS.${errors[index].effectiveTo}`,
                  )}
                </p>
              )}
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">
                {t('ADMIN_BRAND_MAPPINGS.STATUS')} *
              </span>
              <select
                className={selectClassName}
                value={row.status}
                onChange={(event) =>
                  setField(
                    index,
                    'status',
                    event.target.value as AdminBrandMappingRowInput['status'],
                  )
                }
              >
                <option value="DRAFT">{t('COMMON.STATUS.DRAFT')}</option>
                <option value="ACTIVE">{t('COMMON.STATUS.ACTIVE')}</option>
                <option value="INACTIVE">{t('COMMON.STATUS.INACTIVE')}</option>
              </select>
            </label>
          </CardContent>
        </Card>
      ))}
      <div className="flex flex-wrap justify-between gap-2">
        {!initialRows[0]?.id && (
          <Button
            type="button"
            variant="outline"
            onClick={addRow}
          >
            <Plus />
            {t('ADMIN_BRAND_MAPPINGS.ADD_ROW')}
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/admin/brands/${brandId}/categories`)}
          >
            {t('COMMON.CANCEL')}
          </Button>
          <Button type="submit" variant="mono" disabled={save.isPending}>
            <Save />
            {save.isPending
              ? t('COMMON.LOADING')
              : t('ADMIN_BRAND_MAPPINGS.SAVE')}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function AdminBrandMappingPage() {
  const { brandId } = useParams();
  const session = useAuthSession();
  const { t } = useTranslations();
  const [params, setParams] = useSearchParams();
  const editingId = params.get('edit');
  const editorOpen = params.get('add') === 'true' || Boolean(editingId);
  const query = readQuery(params);
  const roleCode = session?.roleCode as AdminRoleCode;
  const result = useAdminBrandMappings(
    brandId,
    editorOpen ? ADMIN_BRAND_MAPPING_DEFAULT_QUERY : query,
    roleCode,
  );
  const [filters, setFilters] = useState(query);
  useEffect(() => setFilters(readQuery(params)), [params]);

  if (result.isLoading)
    return (
      <Container className="space-y-4 py-6">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-96 w-full" />
      </Container>
    );
  if (result.error || !result.data || !brandId)
    return (
      <Container className="py-6">
        <Alert variant="destructive" appearance="light">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertDescription>
            {t('ADMIN_BRAND_DETAIL.NOT_FOUND')}
          </AlertDescription>
        </Alert>
      </Container>
    );
  const data = result.data;
  const editing = editingId
    ? data.items.find(({ id }) => id === editingId)
    : undefined;
  const initialRows = editing
    ? [mappingToInput(editing)]
    : [{ ...ADMIN_BRAND_MAPPING_EMPTY_ROW }];
  const applyFilters = (event: FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'ALL') next.set(key, value);
    });
    setParams(next);
  };

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/admin/brands/${brandId}`}>
              <ArrowLeft />
              {t('ADMIN_BRAND_MAPPINGS.BACK')}
            </Link>
          </Button>
          <h1 className="mt-4 text-2xl font-semibold">
            {data.brandName}: {t('ADMIN_BRAND_MAPPINGS.TITLE')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('ADMIN_BRAND_MAPPINGS.DESCRIPTION')}
          </p>
        </div>
        {data.canEdit && !editorOpen && (
          <Button variant="mono" onClick={() => setParams({ add: 'true' })}>
            <Plus />
            {t('ADMIN_BRAND_MAPPINGS.ADD')}
          </Button>
        )}
      </div>
      {editorOpen ? (
        <MappingEditor
          brandId={brandId}
          categories={data.categories}
          initialRows={initialRows}
        />
      ) : (
        <>
          <Card>
            <CardContent className="pt-5">
              <form
                className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"
                onSubmit={applyFilters}
              >
                <label className="space-y-1">
                  <span className="text-sm font-medium">
                    {t('ADMIN_BRAND_MAPPINGS.KEYWORD')}
                  </span>
                  <Input
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
                    {t('ADMIN_BRAND_MAPPINGS.CATEGORY')}
                  </span>
                  <select
                    className={selectClassName}
                    value={filters.categoryId}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        categoryId: event.target.value,
                      }))
                    }
                  >
                    <option value="">{t('ADMIN_BRAND_MAPPINGS.ALL')}</option>
                    {data.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium">
                    {t('ADMIN_BRAND_MAPPINGS.COMMISSION_TYPE')}
                  </span>
                  <select
                    className={selectClassName}
                    value={filters.commissionType}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        commissionType: event.target
                          .value as AdminBrandMappingQuery['commissionType'],
                      }))
                    }
                  >
                    <option value="ALL">{t('ADMIN_BRAND_MAPPINGS.ALL')}</option>
                    <option value="PERCENTAGE">
                      {t('ADMIN_BRAND_MAPPINGS.PERCENTAGE')}
                    </option>
                    <option value="FIXED_AMOUNT">
                      {t('ADMIN_BRAND_MAPPINGS.FIXED_AMOUNT')}
                    </option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium">
                    {t('ADMIN_BRAND_MAPPINGS.STATUS')}
                  </span>
                  <select
                    className={selectClassName}
                    value={filters.status}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        status: event.target
                          .value as AdminBrandMappingQuery['status'],
                      }))
                    }
                  >
                    <option value="ALL">{t('ADMIN_BRAND_MAPPINGS.ALL')}</option>
                    <option value="ACTIVE">{t('COMMON.STATUS.ACTIVE')}</option>
                    <option value="DRAFT">{t('COMMON.STATUS.DRAFT')}</option>
                    <option value="INACTIVE">
                      {t('COMMON.STATUS.INACTIVE')}
                    </option>
                  </select>
                </label>
                <div className="flex items-end">
                  <Button type="submit" variant="mono">
                    <Search />
                    {t('COMMON.APPLY')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t('ADMIN_BRAND_MAPPINGS.MAPPING_ID')}
                    </TableHead>
                    <TableHead>{t('ADMIN_BRAND_MAPPINGS.CATEGORY')}</TableHead>
                    <TableHead>
                      {t('ADMIN_BRAND_MAPPINGS.BRAND_CODE')}
                    </TableHead>
                    <TableHead>
                      {t('ADMIN_BRAND_MAPPINGS.COMMISSION')}
                    </TableHead>
                    <TableHead>
                      {t('ADMIN_BRAND_MAPPINGS.EFFECTIVE_PERIOD')}
                    </TableHead>
                    <TableHead>{t('ADMIN_BRAND_MAPPINGS.STATUS')}</TableHead>
                    <TableHead>{t('COMMON.ACTIONS')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">
                        {item.id}
                        {item.isDefault && (
                          <Badge
                            className="ml-2"
                            variant="info"
                            appearance="light"
                          >
                            {t('ADMIN_BRAND_MAPPINGS.DEFAULT')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.categoryName}
                        {item.categoryStatus !== 'ACTIVE' && (
                          <Badge className="ml-2" variant="warning">
                            {t(`COMMON.STATUS.${item.categoryStatus}`)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {item.brandCategoryCode}
                        </span>
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {item.brandCategoryName || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {item.commissionType === 'PERCENTAGE'
                          ? `${item.commissionValue}%`
                          : vndFormatter.format(item.commissionValue)}
                      </TableCell>
                      <TableCell>
                        {item.effectiveFrom.slice(0, 10)} →{' '}
                        {item.effectiveTo?.slice(0, 10) ?? '∞'}
                        <br />
                        <Badge
                          variant={
                            item.effectiveState === 'CURRENT'
                              ? 'success'
                              : 'warning'
                          }
                          appearance="light"
                        >
                          {t(`ADMIN_BRAND_MAPPINGS.${item.effectiveState}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === 'ACTIVE'
                              ? 'success'
                              : item.status === 'DRAFT'
                                ? 'warning'
                                : 'secondary'
                          }
                          appearance="light"
                        >
                          {t(`COMMON.STATUS.${item.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.canEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label={`${t('ADMIN_BRAND_MAPPINGS.EDIT')} ${item.brandCategoryCode}`}
                            onClick={() => setParams({ edit: item.id })}
                          >
                            <Pencil />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.items.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-28 text-center text-muted-foreground"
                      >
                        {t('ADMIN_BRAND_MAPPINGS.EMPTY')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </Container>
  );
}
