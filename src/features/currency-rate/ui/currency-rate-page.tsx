import { Fragment, useEffect, useMemo, useState } from 'react';
import { CurrencyRate } from '@/features/currency-rate/api/currencyRateApi';
import { useSharedCurrencies } from '@/features/shared';
import { useDebounce } from '@/shared/hooks';
import { useTranslations } from '@/shared/hooks/use-translations';
import { UserRole } from '@/shared/lib/rbac';
import { usePaginationParams, useUrlParams } from '@/shared/lib/url-params';
import {
  useCurrencyRateDeleteDialog,
  useCurrencyRateDrawer,
} from '@/shared/stores/ui-store';
import { Alert, AlertIcon, AlertTitle } from '@/shared/ui/atoms/alert';
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
import { Label } from '@/shared/ui/atoms/label';
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
import { format } from 'date-fns';
import {
  AlertCircle,
  Edit,
  Eye,
  LoaderCircleIcon,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateCurrencyRate,
  useCurrencyRateDetail,
  useCurrencyRateList,
  useDeleteCurrencyRate,
  useUpdateCurrencyRate,
} from '../hooks/use-currency-rate-queries';
import { CurrencyRateDrawer } from './currency-rate-drawer';

export function CurrencyRatePage() {
  const { t } = useTranslations();

  // URL params management
  const { page, limit, setPage, setLimit } = usePaginationParams();
  const { getParam, updateParams } = useUrlParams({
    defaults: { page: 0, limit: 10 },
  });

  // Local state for search filters
  const [localSearch, setLocalSearch] = useState({
    searchId: getParam('id') || '',
    baseCurrencyId: getParam('baseCurrencyId') || '',
    targetCurrencyId: getParam('targetCurrencyId') || '',
    roundingRule: getParam('roundingRule') || '',
  });

  const debouncedSearchId = useDebounce(localSearch.searchId, 500);
  const debouncedBaseCurrencyId = useDebounce(localSearch.baseCurrencyId, 500);
  const debouncedTargetCurrencyId = useDebounce(
    localSearch.targetCurrencyId,
    500,
  );
  const debouncedRoundingRule = useDebounce(localSearch.roundingRule, 500);

  // Update URL params when filters change
  useEffect(() => {
    updateParams({
      id: debouncedSearchId || null,
      baseCurrencyId: debouncedBaseCurrencyId || null,
      targetCurrencyId: debouncedTargetCurrencyId || null,
      roundingRule: debouncedRoundingRule || null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearchId,
    debouncedBaseCurrencyId,
    debouncedTargetCurrencyId,
    debouncedRoundingRule,
  ]);

  // Memoize query params to prevent unnecessary refetches
  const queryParams = useMemo(
    () => ({
      page,
      size: limit,
      id: debouncedSearchId || undefined,
      baseCurrencyId: debouncedBaseCurrencyId || undefined,
      targetCurrencyId: debouncedTargetCurrencyId || undefined,
      roundingRule: debouncedRoundingRule || undefined,
    }),
    [
      page,
      limit,
      debouncedSearchId,
      debouncedBaseCurrencyId,
      debouncedTargetCurrencyId,
      debouncedRoundingRule,
    ],
  );

  // React Query - Fetch currency rate list
  const {
    data: currencyRateListData,
    isLoading,
    error: queryError,
  } = useCurrencyRateList(queryParams);

  const { data: currenciesData } = useSharedCurrencies({});
  const currencies = currenciesData?.data || [];

  const currencyRates = currencyRateListData?.data || [];
  const total = currencyRateListData?.pageInfo?.totalCount || 0;
  const error = queryError?.message || null;

  // React Query - Mutations
  const createMutation = useCreateCurrencyRate();
  const updateMutation = useUpdateCurrencyRate();
  const deleteMutation = useDeleteCurrencyRate();

  // UI state from Zustand
  const drawer = useCurrencyRateDrawer();
  const deleteDialog = useCurrencyRateDeleteDialog();

  const [detailCurrencyRateId, setDetailCurrencyRateId] = useState<
    string | null
  >(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>(
    'create',
  );
  const [deleteOtp, setDeleteOtp] = useState('');

  // Fetch currency rate detail when detailCurrencyRateId changes
  const {
    data: detailData,
    isFetching: isDetailFetching,
    error: detailError,
  } = useCurrencyRateDetail(detailCurrencyRateId || undefined, {
    enabled: !!detailCurrencyRateId,
  });

  // Handle detail fetch completion or error
  useEffect(() => {
    if (!isDetailFetching && detailCurrencyRateId) {
      if (detailData) {
        drawer.open(detailData);
      } else if (detailError) {
        toast.error(t('CURRENCY_RATE.PAGE.ERROR.LOAD_FAILED'));
      }
      setDetailCurrencyRateId(null);
    }
  }, [
    detailData,
    detailError,
    isDetailFetching,
    detailCurrencyRateId,
    drawer,
    t,
  ]);

  // DataGrid state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: page,
    pageSize: limit,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  // Sync pagination state with URL
  useEffect(() => {
    setPagination({
      pageIndex: page,
      pageSize: limit,
    });
  }, [page, limit]);

  // Handle pagination change from DataGrid
  const handlePaginationChange = (updater: any) => {
    const newPagination =
      typeof updater === 'function' ? updater(pagination) : updater;

    // Update URL (which will trigger fetch via react-query)
    if (newPagination.pageIndex !== page) {
      setPage(newPagination.pageIndex);
    }
    if (newPagination.pageSize !== limit) {
      setLimit(newPagination.pageSize);
    }
  };

  const handleAdd = () => {
    setDrawerMode('create');
    drawer.open();
  };

  const handleView = (currencyRate: CurrencyRate) => {
    setDetailCurrencyRateId(currencyRate.id);
    setDrawerMode('view');
  };

  const handleEdit = (currencyRate: CurrencyRate) => {
    setDetailCurrencyRateId(currencyRate.id);
    setDrawerMode('edit');
  };

  const handleEditFromView = () => {
    setDrawerMode('edit');
  };

  const handleDrawerSubmit = async (data: any) => {
    try {
      if (drawer.currencyRate) {
        await updateMutation.mutateAsync({
          id: drawer.currencyRate.id,
          data,
        });
        drawer.close();
      } else {
        await createMutation.mutateAsync({ data });
        drawer.close();
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteOtp.trim()) {
      return;
    }

    if (deleteDialog.currencyRate) {
      try {
        await deleteMutation.mutateAsync({
          id: deleteDialog.currencyRate.id,
          otpCode: deleteOtp,
        });
        setDeleteOtp('');
        deleteDialog.close();
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  // Define columns for DataGrid
  const columns = useMemo<ColumnDef<CurrencyRate>[]>(
    () => [
      {
        id: 'id',
        accessorFn: (row) => row.id,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.ID')} column={column} />
        ),
        cell: (info) => (
          <span className="font-mono text-xs">{info.row.original.id}</span>
        ),
        enableSorting: true,
        sortingFn: 'alphanumeric',
        size: 150,
      },
      {
        id: 'baseCurrencyName',
        accessorFn: (row) => row.baseCurrencyName,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('CURRENCY_RATE.PAGE.TABLE.BASE_CURRENCY')}
            column={column}
          />
        ),
        cell: (info) => <span>{info.row.original.baseCurrencyName}</span>,
        enableSorting: true,
        sortingFn: 'alphanumeric',
        size: 120,
      },
      {
        id: 'targetCurrencyName',
        accessorFn: (row) => row.targetCurrencyName,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('CURRENCY_RATE.PAGE.TABLE.TARGET_CURRENCY')}
            column={column}
          />
        ),
        cell: (info) => <span>{info.row.original.targetCurrencyName}</span>,
        enableSorting: true,
        sortingFn: 'alphanumeric',
        size: 120,
      },
      {
        id: 'buyRate',
        accessorFn: (row) => row.buyRate,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('CURRENCY_RATE.PAGE.TABLE.BUY_RATE')}
            column={column}
          />
        ),
        cell: (info) => <span>{info.row.original.buyRate}</span>,
        enableSorting: true,
        sortingFn: 'basic',
        size: 150,
      },
      {
        id: 'sellRate',
        accessorFn: (row) => row.sellRate,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('CURRENCY_RATE.PAGE.TABLE.SELL_RATE')}
            column={column}
          />
        ),
        cell: (info) => <span>{info.row.original.sellRate}</span>,
        enableSorting: true,
        sortingFn: 'basic',
        size: 150,
      },
      {
        id: 'totalPartner',
        accessorFn: (row) => row.totalPartner,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('CURRENCY_RATE.PAGE.TABLE.TOTAL_PARTNER')}
            column={column}
          />
        ),
        cell: (info) => <span>{info.row.original.totalPartner ?? 0}</span>,
        enableSorting: true,
        sortingFn: 'basic',
        size: 120,
      },
      {
        id: 'totalService',
        accessorFn: (row) => row.totalService,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('CURRENCY_RATE.PAGE.TABLE.TOTAL_SERVICE')}
            column={column}
          />
        ),
        cell: (info) => <span>{info.row.original.totalService ?? 0}</span>,
        enableSorting: true,
        sortingFn: 'basic',
        size: 120,
      },
      {
        id: 'startAt',
        accessorFn: (row) => row.startAt,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('CURRENCY_RATE.PAGE.TABLE.START_TIME')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="whitespace-nowrap">
            {format(info.row.original.startAt, 'dd/MM/yyyy')}
          </span>
        ),
        enableSorting: true,
        sortingFn: 'basic',
        size: 150,
      },
      {
        id: 'endAt',
        accessorFn: (row) => row.endAt,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('CURRENCY_RATE.PAGE.TABLE.END_TIME')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="whitespace-nowrap">
            {info.row.original.endAt
              ? format(info.row.original.endAt, 'dd/MM/yyyy')
              : '--/--/--'}
          </span>
        ),
        enableSorting: true,
        sortingFn: 'basic',
        size: 150,
      },
      {
        id: 'actions',
        header: () => (
          <span className="text-right block">{t('COMMON.ACTIONS')}</span>
        ),
        cell: (info) => {
          const currencyRate = info.row.original;
          const isLoadingThis = detailCurrencyRateId === currencyRate.id;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleView(currencyRate)}
                aria-label="View"
                disabled={isLoadingThis}
              >
                {isLoadingThis ? (
                  <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <PermissionGuard requiredRoles={[UserRole.ADMIN]}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(currencyRate)}
                  aria-label="Edit"
                  disabled={isLoadingThis}
                >
                  {isLoadingThis ? (
                    <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <Edit className="h-4 w-4" />
                  )}
                </Button>
              </PermissionGuard>
              <PermissionGuard requiredRoles={[UserRole.ADMIN]}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteDialog.open(currencyRate)}
                  aria-label="Delete"
                  disabled={isLoadingThis}
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
    [t, deleteDialog, detailCurrencyRateId],
  );

  // Create table instance
  const table = useReactTable({
    columns,
    data: currencyRates,
    pageCount: total > 0 ? Math.ceil(total / limit) : 0,
    getRowId: (row: CurrencyRate) => row.id,
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
    manualPagination: true, // Server-side pagination
  });

  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle />
          </ToolbarHeading>
          <ToolbarActions>
            <PermissionGuard requiredRoles={[UserRole.ADMIN]}>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                {t('CURRENCY_RATE.PAGE.ADD_BUTTON')}
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
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}

          <DataGrid
            table={table}
            recordCount={total || 0}
            isLoading={isLoading}
            loadingMode="skeleton"
            emptyMessage={t('CURRENCY_RATE.PAGE.TABLE.EMPTY')}
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
                <CardTitle>{t('CURRENCY_RATE.PAGE.TABLE.TITLE')}</CardTitle>
                <CardToolbar>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t(
                          'CURRENCY_RATE.PAGE.SEARCH_ID_PLACEHOLDER',
                        )}
                        value={localSearch.searchId}
                        onChange={(e) =>
                          setLocalSearch({
                            ...localSearch,
                            searchId: e.target.value,
                          })
                        }
                        className="pl-10"
                      />
                    </div>

                    <div>
                      <Select
                        value={localSearch.baseCurrencyId || ''}
                        onValueChange={(value) =>
                          setLocalSearch({
                            ...localSearch,
                            baseCurrencyId: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'CURRENCY_RATE.PAGE.BASE_CURRENCY_PLACEHOLDER',
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.id} value={currency.id}>
                              {currency.name} ({currency.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Select
                        value={localSearch.targetCurrencyId || ''}
                        onValueChange={(value) =>
                          setLocalSearch({
                            ...localSearch,
                            targetCurrencyId: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'CURRENCY_RATE.PAGE.TARGET_CURRENCY_PLACEHOLDER',
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.id} value={currency.id}>
                              {currency.name} ({currency.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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

      <CurrencyRateDrawer
        open={drawer.isOpen}
        onClose={drawer.close}
        onSubmit={handleDrawerSubmit}
        currencyRate={drawer.currencyRate}
        isLoading={createMutation.isPending || updateMutation.isPending}
        mode={drawerMode}
        onEdit={handleEditFromView}
      />

      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setDeleteOtp('');
            deleteDialog.close();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('CURRENCY_RATE.PAGE.DELETE.TITLE')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('CURRENCY_RATE.PAGE.DELETE.DESCRIPTION', {
                name: deleteDialog.currencyRate?.id,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="delete-otp">{t('COMMON.OTP_CODE')}</Label>
            <Input
              id="delete-otp"
              type="text"
              placeholder={t('COMMON.ENTER_6_DIGIT_OTP')}
              value={deleteOtp}
              onChange={(e) => setDeleteOtp(e.target.value)}
              disabled={deleteMutation.isPending}
              maxLength={6}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t('COMMON.CANCEL')}
            </AlertDialogCancel>
            <Button
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              disabled={deleteMutation.isPending || !deleteOtp.trim()}
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
