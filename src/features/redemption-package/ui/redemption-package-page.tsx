import { Fragment, useEffect, useMemo, useState } from 'react';
import { RedemptionPackage } from '@/features/redemption-package/api/redemptionPackageApi';
import { useDebounce } from '@/shared/hooks';
import { useTranslations } from '@/shared/hooks/use-translations';
import { UserRole } from '@/shared/lib/rbac';
import { usePaginationParams, useUrlParams } from '@/shared/lib/url-params';
import {
  useRedemptionPackageDeleteDialog,
  useRedemptionPackageDrawer,
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
import { Badge } from '@/shared/ui/atoms/badge';
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
  Eye,
  LoaderCircleIcon,
  Package,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useCreateRedemptionPackage,
  useDeleteRedemptionPackage,
  useRedemptionPackageDetail,
  useRedemptionPackageList,
  useUpdateRedemptionPackage,
} from '../hooks/use-redemption-package-queries';
import { RedemptionPackageDrawer } from './redemption-package-drawer';

export function RedemptionPackagePage() {
  const { t } = useTranslations();
  const navigate = useNavigate();

  // URL params management
  const { page, limit, setPage, setLimit } = usePaginationParams();
  const { getParam, updateParams } = useUrlParams({
    defaults: { page: 0, limit: 10 },
  });

  // Local state for search filters
  const [localSearch, setLocalSearch] = useState({
    searchId: getParam('id') || '',
    searchName: getParam('name') || '',
  });

  const debouncedSearchId = useDebounce(localSearch.searchId, 500);
  const debouncedSearchName = useDebounce(localSearch.searchName, 500);

  // Update URL params when filters change
  useEffect(() => {
    updateParams({
      id: debouncedSearchId || null,
      name: debouncedSearchName || null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchId, debouncedSearchName]);

  // Memoize query params to prevent unnecessary refetches
  const queryParams = useMemo(
    () => ({
      page,
      size: limit,
      id: debouncedSearchId || undefined,
      name: debouncedSearchName || undefined,
    }),
    [page, limit, debouncedSearchId, debouncedSearchName],
  );

  // React Query - Fetch redemption package list
  const {
    data: redemptionPackageListData,
    isLoading,
    error: queryError,
  } = useRedemptionPackageList(queryParams);

  const redemptionPackages = redemptionPackageListData?.content || [];
  const total = redemptionPackageListData?.totalElements || 0;
  const error = queryError?.message || null;

  // React Query - Mutations
  const createMutation = useCreateRedemptionPackage();
  const updateMutation = useUpdateRedemptionPackage();
  const deleteMutation = useDeleteRedemptionPackage();

  // UI state from Zustand
  const drawer = useRedemptionPackageDrawer();
  const deleteDialog = useRedemptionPackageDeleteDialog();

  const [detailRedemptionPackageId, setDetailRedemptionPackageId] = useState<string>(
    '',
  );
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>(
    'create',
  );
  const [deleteOtp, setDeleteOtp] = useState('');

  // Fetch redemption package detail when detailRedemptionPackageId changes
  const {
    data: detailData,
    isFetching: isDetailFetching,
    error: detailError,
  } = useRedemptionPackageDetail(detailRedemptionPackageId, {
    enabled: !!detailRedemptionPackageId,
  });

  // Handle detail fetch completion or error
  useEffect(() => {
    if (!isDetailFetching && detailRedemptionPackageId) {
      if (detailData) {
        drawer.open(detailData);
      } else if (detailError) {
        toast.error(t('REDEMPTION_PACKAGE.PAGE.ERROR.LOAD_FAILED'));
      }
      setDetailRedemptionPackageId('');
    }
  }, [detailData, detailError, isDetailFetching, detailRedemptionPackageId, drawer, t]);

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

  const handleView = (redemptionPackage: RedemptionPackage) => {
    setDetailRedemptionPackageId(redemptionPackage.id.toString());
    setDrawerMode('view');
  };

  const handleEdit = (redemptionPackage: RedemptionPackage) => {
    setDetailRedemptionPackageId(redemptionPackage.id.toString());
    setDrawerMode('edit');
  };

  const handleEditFromView = () => {
    setDrawerMode('edit');
  };

  const handleViewInventory = (redemptionPackage: RedemptionPackage) => {
    navigate(`/redemption-packages/${redemptionPackage.id}/inventory`);
  };

  const handleDrawerSubmit = async (data: any) => {
    try {
      if (drawer.redemptionPackage) {
        await updateMutation.mutateAsync({
          id: drawer.redemptionPackage.id.toString(),
          data,
        });
        drawer.close();
      } else {
        await createMutation.mutateAsync(data);
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

    if (deleteDialog.redemptionPackage) {
      try {
        await deleteMutation.mutateAsync({
          id: deleteDialog.redemptionPackage.id.toString(),
          params: { otpCode: deleteOtp },
        });
        setDeleteOtp('');
        deleteDialog.close();
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  // Define columns for DataGrid
  const columns = useMemo<ColumnDef<RedemptionPackage>[]>(
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
        size: 100,
      },
      {
        id: 'name',
        accessorFn: (row) => row.name,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.NAME')} column={column} />
        ),
        cell: (info) => <span>{info.row.original.name}</span>,
        enableSorting: true,
        sortingFn: 'text',
        size: 200,
      },
      {
        id: 'code',
        accessorFn: (row) => row.code,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.CODE')} column={column} />
        ),
        cell: (info) => (
          <span className="font-medium">{info.row.original.code}</span>
        ),
        enableSorting: true,
        sortingFn: 'alphanumeric',
        size: 120,
      },
      {
        id: 'rewardType',
        accessorFn: (row) => row.rewardType,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('REDEMPTION_PACKAGE.PAGE.TABLE.REWARD_TYPE')}
            column={column}
          />
        ),
        cell: (info) => {
          const rewardType = info.row.original.rewardType;
          return <Badge variant="secondary">{rewardType}</Badge>;
        },
        enableSorting: true,
        sortingFn: 'text',
        size: 120,
      },
      {
        id: 'pointCost',
        accessorFn: (row) => row.pointCost,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('REDEMPTION_PACKAGE.PAGE.TABLE.POINT_COST')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="font-medium">{info.row.original.pointCost}</span>
        ),
        enableSorting: true,
        sortingFn: 'alphanumeric',
        size: 120,
      },
      {
        id: 'availableStock',
        accessorFn: (row) => row.availableStock,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('REDEMPTION_PACKAGE.PAGE.TABLE.AVAILABLE_STOCK')}
            column={column}
          />
        ),
        cell: (info) => <span>{info.row.original.availableStock}</span>,
        enableSorting: true,
        sortingFn: 'alphanumeric',
        size: 120,
      },
      {
        id: 'totalStock',
        accessorFn: (row) => row.totalStock,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('REDEMPTION_PACKAGE.PAGE.TABLE.TOTAL_STOCK')}
            column={column}
          />
        ),
        cell: (info) => <span>{info.row.original.totalStock}</span>,
        enableSorting: true,
        sortingFn: 'alphanumeric',
        size: 120,
      },
      {
        id: 'status',
        accessorFn: (row) => row.status,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.STATUS_1')} column={column} />
        ),
        cell: (info) => {
          const status = info.row.original.status;
          return (
            <Badge variant={status === 'ACTIVE' ? 'success' : 'secondary'}>
              {status}
            </Badge>
          );
        },
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
          const redemptionPackage = info.row.original;
          const isLoadingThis =
            detailRedemptionPackageId === redemptionPackage.id.toString();
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewInventory(redemptionPackage)}
                aria-label="View Inventory"
                title={t('REDEMPTION_PACKAGE.PAGE.VIEW_INVENTORY')}
              >
                <Package className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleView(redemptionPackage)}
                aria-label="View"
                disabled={isLoadingThis}
              >
                {isLoadingThis ? (
                  <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>

              <PermissionGuard requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(redemptionPackage)}
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
              <PermissionGuard requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteDialog.open(redemptionPackage)}
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
        size: 200,
      },
    ],
    [t, deleteDialog, detailRedemptionPackageId, navigate],
  );

  // Create table instance
  const table = useReactTable({
    columns,
    data: redemptionPackages,
    pageCount: total > 0 ? Math.ceil(total / limit) : 0,
    getRowId: (row: RedemptionPackage) => row.id.toString(),
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
            <PermissionGuard requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                {t('REDEMPTION_PACKAGE.PAGE.ADD_BUTTON')}
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
            emptyMessage={t('REDEMPTION_PACKAGE.PAGE.TABLE.EMPTY')}
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
                <CardTitle>{t('REDEMPTION_PACKAGE.PAGE.TABLE.TITLE')}</CardTitle>
                <CardToolbar>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t('COMMON.SEARCH_BY_ID')}
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

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t('COMMON.SEARCH_BY_NAME')}
                        value={localSearch.searchName}
                        onChange={(e) =>
                          setLocalSearch({
                            ...localSearch,
                            searchName: e.target.value,
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

      <RedemptionPackageDrawer
        open={drawer.isOpen}
        onClose={drawer.close}
        onSubmit={handleDrawerSubmit}
        redemptionPackage={drawer.redemptionPackage}
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
              {t('REDEMPTION_PACKAGE.PAGE.DELETE.TITLE')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('COMMON.ARE_YOU_SURE_YOU_WANT_TO_DELETE_NAME_THIS_ACTION_C', {
                name: deleteDialog.redemptionPackage?.name,
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
