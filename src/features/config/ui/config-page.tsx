import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Config, configApi } from '@/features/config/api/configApi';
import {
  useConfigList,
  useCreateConfig,
  useDeleteConfig,
  useUpdateConfig,
} from '@/features/config/hooks/use-config-queries';
import { useDebounce } from '@/shared/hooks';
import { useTranslations } from '@/shared/hooks/use-translations';
import logger from '@/shared/lib/logger';
import { UserRole } from '@/shared/lib/rbac';
import { usePaginationParams, useUrlParams } from '@/shared/lib/url-params';
import {
  useConfigDeleteDialog,
  useConfigDrawer,
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
  LoaderCircleIcon,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfigDrawer } from './config-drawer';

export function ConfigPage() {
  const { t } = useTranslations();

  // URL params management
  const { page, limit, setPage, setLimit } = usePaginationParams();
  const { getParam, updateParams } = useUrlParams({
    defaults: { page: 0, limit: 10 },
  });

  // Local state for search filters
  const [localSearch, setLocalSearch] = useState({
    searchKey: getParam('search'),
    searchCategory: getParam('category'),
  });

  const debouncedSearchKey = useDebounce(localSearch.searchKey, 500);
  const debouncedSearchCategory = useDebounce(localSearch.searchCategory, 500);

  // Update URL with debounced values
  useEffect(() => {
    updateParams({
      search: debouncedSearchKey || null,
      category: debouncedSearchCategory || null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchKey, debouncedSearchCategory]);

  // Memoize query params to prevent unnecessary refetches
  const queryParams = useMemo(
    () => ({
      page,
      size: limit,
      keyConfig: debouncedSearchKey || undefined,
      category: debouncedSearchCategory || undefined,
    }),
    [page, limit, debouncedSearchKey, debouncedSearchCategory],
  );

  // React Query - Fetch config list
  const {
    data: configListData,
    isLoading,
    error: queryError,
  } = useConfigList(queryParams);

  const configs = configListData?.data || [];
  const total = configListData?.pageInfo?.totalCount || 0;
  const error = queryError?.message || null;

  // React Query - Mutations
  const createMutation = useCreateConfig();
  const updateMutation = useUpdateConfig();
  const deleteMutation = useDeleteConfig();

  // UI state from Zustand
  const drawer = useConfigDrawer();
  const deleteDialog = useConfigDeleteDialog();

  // Local state
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [deleteOtp, setDeleteOtp] = useState('');

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
    drawer.open();
  };

  const handleEdit = useCallback(async (config: Config) => {
    setEditingConfigId(config.id);
    try {
      // Fetch detail từ API
      const detail = await configApi.getDetail(config.id);
      drawer.open(detail);
    } catch (error) {
      toast.error('Failed to load config details');
    } finally {
      setEditingConfigId(null);
    }
  }, []);

  const handleDrawerSubmit = async (data: any) => {
    try {
      if (drawer.config) {
        logger.log('Updating config', data);
        await updateMutation.mutateAsync({
          id: drawer.config.id,
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

    if (deleteDialog.config) {
      try {
        await deleteMutation.mutateAsync({
          id: deleteDialog.config.id,
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
  const columns = useMemo<ColumnDef<Config>[]>(
    () => [
      {
        id: 'id',
        accessorFn: (row) => row.id,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.ID')} column={column} />
        ),
        cell: (info) => <span className="">{info.row.original.id}</span>,
        enableSorting: true,
        sortingFn: 'basic',
        size: 100,
      },
      {
        id: 'key',
        accessorFn: (row) => row.keyConfig,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('CONFIG.PAGE.TABLE.KEY')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="font-medium">{info.row.original.keyConfig}</span>
        ),
        enableSorting: true,
        sortingFn: 'text',
        size: 150,
      },
      {
        id: 'value',
        accessorFn: (row) => row.valueConfig,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.VALUE')} column={column} />
        ),
        cell: (info) => (
          <span className="truncate block max-w-xs">
            {info.row.original.valueConfig}
          </span>
        ),
        enableSorting: true,
        sortingFn: 'text',
        size: 200,
      },
      {
        id: 'actions',
        header: () => (
          <span className="text-right block">{t('COMMON.ACTIONS')}</span>
        ),
        cell: (info) => {
          const config = info.row.original;
          const isLoadingThis = editingConfigId === config.id;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(config)}
                aria-label={t('COMMON.EDIT')}
                disabled={isLoadingThis}
              >
                {isLoadingThis ? (
                  <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <Edit className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  deleteDialog.open(config);
                }}
                aria-label={t('COMMON.DELETE')}
                disabled={isLoadingThis}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        },
        enableSorting: false,
        size: 120,
      },
    ],
    [t, editingConfigId, handleEdit, deleteDialog],
  );

  // Create table instance
  const table = useReactTable({
    columns,
    data: configs,
    pageCount: total > 0 ? Math.ceil(total / limit) : 0,
    getRowId: (row: Config) => row.id,
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
                {t('CONFIG.PAGE.ADD_BUTTON')}
              </Button>
            </PermissionGuard>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <div className="space-y-4">
          {/* Error alert */}
          {error && (
            <Alert variant="destructive" appearance="light">
              <AlertIcon>
                <AlertCircle />
              </AlertIcon>
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}

          {/* DataGrid - Responsive */}
          <DataGrid
            table={table}
            recordCount={total || 0}
            isLoading={isLoading}
            loadingMode="skeleton"
            emptyMessage={t('CONFIG.PAGE.TABLE.EMPTY')}
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
                <CardTitle>{t('CONFIG.PAGE.TABLE.TITLE')}</CardTitle>
                <CardToolbar>
                  {/* Search filters - Responsive */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t('CONFIG.PAGE.SEARCH_PLACEHOLDER')}
                        value={localSearch.searchKey}
                        onChange={(e) =>
                          setLocalSearch({
                            ...localSearch,
                            searchKey: e.target.value,
                          })
                        }
                        className="pl-10"
                      />
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

      <ConfigDrawer
        open={drawer.isOpen}
        onClose={drawer.close}
        onSubmit={handleDrawerSubmit}
        config={drawer.config}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => {
          // Only allow closing when not loading
          if (!open && !deleteMutation.isPending) {
            setDeleteOtp(''); // Reset OTP when closing
            deleteDialog.close();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('CONFIG.PAGE.DELETE.TITLE')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('CONFIG.PAGE.DELETE.DESCRIPTION', {
                key: deleteDialog.config?.keyConfig || '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="delete-otp">{t('COMMON.INPUT.OTP')}</Label>
            <Input
              id="delete-otp"
              type="text"
              placeholder={t('COMMON.INPUT.OTP')}
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
                e.preventDefault(); // Prevent default dialog close
                handleDeleteConfirm().then();
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
