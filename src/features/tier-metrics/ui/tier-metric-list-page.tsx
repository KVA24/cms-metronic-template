import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useSharedEvents } from '@/features/shared';
import { TierMetric } from '@/features/tier-metrics/api/tierMetricApi';
import {
  useDeleteTierMetric,
  useTierMetricListQuery,
} from '@/features/tier-metrics/hooks/use-tier-metric-queries';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { useTranslations } from '@/shared/hooks/use-translations';
import { UserRole } from '@/shared/lib/rbac';
import { usePaginationParams } from '@/shared/lib/url-params';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from '@/shared/ui/atoms/alert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/atoms/alert-dialog';
import { Button } from '@/shared/ui/atoms/button';
import {
  Card,
  CardFooter,
  CardHeader,
  CardTable,
  CardTitle,
  CardToolbar,
} from '@/shared/ui/atoms/card';
import { DataGrid } from '@/shared/ui/atoms/data-grid';
import { DataGridColumnHeader } from '@/shared/ui/atoms/data-grid-column-header';
import { DataGridPagination } from '@/shared/ui/atoms/data-grid-pagination';
import { DataGridTable } from '@/shared/ui/atoms/data-grid-table';
import { Input } from '@/shared/ui/atoms/input';
import { ScrollArea, ScrollBar } from '@/shared/ui/atoms/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/atoms/select';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/shared/ui/molecules/common/toolbar';
import { Container } from '@/shared/ui/molecules/container';
import { PermissionGuard } from '@/shared/ui/molecules/permission-guard';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  AlertCircle,
  Edit,
  Eye,
  LoaderCircleIcon,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function TierMetricListPage() {
  const { t } = useTranslations();
  const navigate = useNavigate();

  const { page, limit, setPage, setLimit } = usePaginationParams();

  const { data: eventListData } = useSharedEvents();
  const events = eventListData?.data || [];

  const [keySearch, setKeySearch] = useState('');
  const [filterEventType, setFilterEventType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const debouncedKeySearch = useDebounce(keySearch, 500);

  const queryParams = useMemo(
    () => ({
      page: page,
      size: limit,
      keySearch: debouncedKeySearch || undefined,
      eventTypeCode: filterEventType || undefined,
      status: filterStatus || undefined,
    }),
    [page, limit, debouncedKeySearch, filterEventType, filterStatus],
  );

  const {
    data: metricListData,
    isLoading,
    error: queryError,
  } = useTierMetricListQuery(queryParams);

  const metrics = metricListData?.data || [];
  const total = metricListData?.pageInfo?.totalCount || 0;
  const pageCount = metricListData?.pageInfo?.totalPage || 0;
  const error = queryError?.message || null;

  const deleteMutation = useDeleteTierMetric();

  const [deleteMetric, setDeleteMetric] = useState<TierMetric | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: page,
    pageSize: limit,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    setPagination({
      pageIndex: page,
      pageSize: limit,
    });
  }, [page, limit]);

  const handlePaginationChange = (
    updater: PaginationState | ((old: PaginationState) => PaginationState),
  ) => {
    const newPagination =
      typeof updater === 'function' ? updater(pagination) : updater;

    if (newPagination.pageIndex !== page) {
      setPage(newPagination.pageIndex);
    }
    if (newPagination.pageSize !== limit) {
      setLimit(newPagination.pageSize);
    }
  };

  const handleAdd = () => {
    navigate('/tier-metrics/create');
  };

  const handleView = useCallback(
    (metric: TierMetric) => {
      navigate(`/tier-metrics/view/${metric.id}`);
    },
    [navigate],
  );

  const handleEdit = useCallback(
    (metric: TierMetric) => {
      navigate(`/tier-metrics/edit/${metric.id}`);
    },
    [navigate],
  );

  const handleDeleteConfirm = async () => {
    if (!deleteMetric) return;

    try {
      await deleteMutation.mutateAsync({
        id: deleteMetric.id,
      });
      setDeleteMetric(null);
      setDeleteDialogOpen(false);
    } catch {
      // Error handled by mutation
    }
  };

  const columns = useMemo<ColumnDef<TierMetric>[]>(
    () => [
      {
        id: 'metricName',
        accessorFn: (row) => row.metricName,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('TIER_METRICS.METRIC_NAME')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="font-medium">{info.row.original.metricName}</span>
        ),
        enableSorting: true,
        sortingFn: 'text',
        size: 200,
      },
      {
        id: 'metricCode',
        accessorFn: (row) => row.metricCode,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('TIER_METRICS.METRIC_CODE')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="font-mono">{info.row.original.metricCode}</span>
        ),
        enableSorting: true,
        sortingFn: 'text',
        size: 150,
      },
      {
        id: 'eventType',
        accessorFn: (row) => row.eventTypeCode,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('COMMON.EVENT_TYPE')}
            column={column}
          />
        ),
        cell: (info) => <span>{info.row.original.eventTypeCode}</span>,
        enableSorting: true,
        sortingFn: 'text',
        size: 150,
      },
      {
        id: 'formula',
        accessorFn: (row) => row.formula,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.FORMULA')} column={column} />
        ),
        cell: (info) => (
          <span className="text-xs text-muted-foreground truncate max-w-xs">
            {info.row.original.formula || '-'}
          </span>
        ),
        enableSorting: false,
        size: 200,
      },
      {
        id: 'status',
        accessorFn: (row) => row.status,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.STATUS_1')} column={column} />
        ),
        cell: (info) => (
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              info.row.original.status === 'ACTIVE'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {info.row.original.status}
          </span>
        ),
        enableSorting: true,
        sortingFn: 'text',
        size: 100,
      },
      {
        id: 'actions',
        header: () => (
          <span className="text-right block">{t('COMMON.ACTIONS')}</span>
        ),
        cell: (info) => {
          const metric = info.row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleView(metric)}
                aria-label="View"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <PermissionGuard
                requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(metric)}
                  aria-label="Edit"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </PermissionGuard>
              <PermissionGuard
                requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDeleteMetric(metric);
                    setDeleteDialogOpen(true);
                  }}
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </PermissionGuard>
            </div>
          );
        },
        enableSorting: false,
        size: 150,
      },
    ],
    [t, handleView, handleEdit],
  );

  const table = useReactTable({
    columns,
    data: metrics,
    pageCount: pageCount,
    getRowId: (row: TierMetric) => row.id.toString(),
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: handlePaginationChange,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });

  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle />
          </ToolbarHeading>
          <ToolbarActions>
            <PermissionGuard
              requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}
            >
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                {t('TIER_METRICS.ADD_BUTTON')}
              </Button>
            </PermissionGuard>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive" appearance="light">
              <AlertIcon>
                <AlertCircle />
              </AlertIcon>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="break-all">{error}</AlertDescription>
            </Alert>
          )}

          <DataGrid
            table={table}
            recordCount={total || 0}
            isLoading={isLoading}
            loadingMode="skeleton"
            emptyMessage={t('TIER_METRICS.EMPTY')}
            tableLayout={{
              cellBorder: true,
              rowBorder: true,
              headerBorder: true,
              headerSticky: false,
              width: 'auto',
              columnsResizable: false,
            }}
          >
            <Card>
              <CardHeader className="p-4">
                <CardTitle>{t('TIER_METRICS.PAGE_TITLE')}</CardTitle>
                <CardToolbar>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t('TIER_METRICS.SEARCH_PLACEHOLDER')}
                        value={keySearch}
                        onChange={(e) => setKeySearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <Select
                      value={filterEventType || ''}
                      onValueChange={setFilterEventType}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t('TIER_METRICS.EVENT_TYPE_PLACEHOLDER')}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.name}>
                            {event.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={filterStatus || ''}
                      onValueChange={setFilterStatus}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t('TIER_METRICS.STATUS_PLACEHOLDER')}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">
                          {t('COMMON.ACTIVE')}
                        </SelectItem>
                        <SelectItem value="INACTIVE">
                          {t('COMMON.INACTIVE')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardToolbar>
              </CardHeader>
              <CardTable>
                <ScrollArea>
                  <DataGridTable />
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardTable>
              <CardFooter className="flex items-center justify-between">
                <DataGridPagination />
              </CardFooter>
            </Card>
          </DataGrid>
        </div>
      </Container>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('TIER_METRICS.DELETE_TITLE')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('COMMON.ARE_YOU_SURE_YOU_WANT_TO_DELETE_NAME_THIS_ACTION_C', {
                name: deleteMetric?.metricName || '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t('COMMON.CANCEL')}
            </AlertDialogCancel>
            <Button
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                  {t('COMMON.DELETING')}
                </span>
              ) : (
                t('COMMON.DELETE')
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Fragment>
  );
}

export default TierMetricListPage;
