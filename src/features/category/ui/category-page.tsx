import { Fragment, useEffect, useMemo, useState } from 'react';
import { Category, CategoryStatus } from '@/features/category/api/categoryApi';
import {
  useCategoryDetail,
  useCategoryList,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/features/category/hooks/use-category-queries';
import { useDebounce } from '@/shared/hooks';
import { useTranslations as useTranslationsHook } from '@/shared/hooks/use-translations';
import { UserRole } from '@/shared/lib/rbac';
import { usePaginationParams, useUrlParams } from '@/shared/lib/url-params';
import {
  useCategoryDeleteDialog,
  useCategoryDrawer,
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
import { toast } from 'sonner';
import { CategoryDrawer } from './category-drawer';

function StatusBadge({ status }: { status: CategoryStatus }) {
  const statusVariants: Record<CategoryStatus, 'success' | 'secondary'> = {
    ACTIVE: 'success',
    INACTIVE: 'secondary',
  };

  return <Badge variant={statusVariants[status]}>{status}</Badge>;
}

export function CategoryPage() {
  const { t } = useTranslationsHook();

  const { page, limit, setPage, setLimit } = usePaginationParams();
  const { getParam, updateParams } = useUrlParams({
    defaults: { page: 0, limit: 10 },
  });

  const [localSearch, setLocalSearch] = useState({
    searchName: getParam('name') || '',
    status: getParam('status') || '',
  });

  const debouncedSearchName = useDebounce(localSearch.searchName, 500);
  const debouncedStatus = useDebounce(localSearch.status, 500);

  // Update URL params when filters change
  useEffect(() => {
    updateParams({
      name: debouncedSearchName || null,
      status: debouncedStatus || null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchName, debouncedStatus]);

  // Memoize query params to prevent unnecessary refetches
  const queryParams = useMemo(
    () => ({
      page,
      size: limit,
      name: debouncedSearchName || undefined,
      status: debouncedStatus ? (debouncedStatus as CategoryStatus) : undefined,
    }),
    [page, limit, debouncedSearchName, debouncedStatus],
  );

  // React Query - Fetch category list
  const {
    data: categoryListData,
    isLoading,
    error: queryError,
  } = useCategoryList(queryParams);

  const categories = categoryListData?.data || [];
  const total = categoryListData?.pageInfo?.totalCount || 0;
  const error = queryError?.message || null;

  // React Query - Mutations
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  // UI state from Zustand
  const drawer = useCategoryDrawer();
  const deleteDialog = useCategoryDeleteDialog();

  const [detailCategoryId, setDetailCategoryId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>(
    'create',
  );
  const [deleteOtp, setDeleteOtp] = useState('');

  // Fetch category detail when detailCategoryId changes
  const {
    data: detailData,
    isFetching: isDetailFetching,
    error: detailError,
  } = useCategoryDetail(detailCategoryId || undefined, {
    enabled: !!detailCategoryId,
  });

  // Handle detail fetch completion or error
  useEffect(() => {
    if (!isDetailFetching && detailCategoryId) {
      if (detailData) {
        drawer.open(detailData);
      } else if (detailError) {
        toast.error(t('CATEGORY.PAGE.ERROR.LOAD_FAILED'));
      }
      setDetailCategoryId(null);
    }
  }, [detailData, detailError, isDetailFetching, detailCategoryId, drawer, t]);

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

  const handlePaginationChange = (updater: any) => {
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
    setDrawerMode('create');
    drawer.open();
  };

  const handleView = (category: Category) => {
    setDetailCategoryId(category.id);
    setDrawerMode('view');
  };

  const handleEdit = (category: Category) => {
    setDetailCategoryId(category.id);
    setDrawerMode('edit');
  };

  const handleEditFromView = () => {
    setDrawerMode('edit');
  };

  const handleDrawerSubmit = async (data: any) => {
    try {
      if (drawer.category) {
        await updateMutation.mutateAsync({
          id: drawer.category.id,
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

    if (deleteDialog.category) {
      try {
        await deleteMutation.mutateAsync({
          id: deleteDialog.category.id,
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
  const columns = useMemo<ColumnDef<Category>[]>(
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
        cell: (info) => (
          <span className="font-medium">{info.row.original.name}</span>
        ),
        enableSorting: true,
        sortingFn: 'text',
        size: 150,
      },
      {
        id: 'status',
        accessorFn: (row) => row.status,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.STATUS_1')} column={column} />
        ),
        cell: (info) => <StatusBadge status={info.row.original.status} />,
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
          const category = info.row.original;
          const isLoadingThis = detailCategoryId === category.id;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleView(category)}
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
                  onClick={() => handleEdit(category)}
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
                  onClick={() => deleteDialog.open(category)}
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
    [t, deleteDialog, detailCategoryId],
  );

  // Create table instance
  const table = useReactTable({
    columns,
    data: categories,
    pageCount: total > 0 ? Math.ceil(total / limit) : 0,
    getRowId: (row: Category) => row.id,
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
                {t('CATEGORY.PAGE.ADD_BUTTON')}
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
            emptyMessage={t('CATEGORY.PAGE.TABLE.EMPTY')}
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
                <CardTitle>{t('CATEGORY.PAGE.TABLE.TITLE')}</CardTitle>
                <CardToolbar>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t('CATEGORY.PAGE.SEARCH_NAME_PLACEHOLDER')}
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

                    <div>
                      <Select
                        value={localSearch.status || ''}
                        onValueChange={(value) =>
                          setLocalSearch({ ...localSearch, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('CATEGORY.PAGE.STATUS_PLACEHOLDER')}
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

      <CategoryDrawer
        open={drawer.isOpen}
        onClose={drawer.close}
        onSubmit={handleDrawerSubmit}
        category={drawer.category}
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
              {t('CATEGORY.PAGE.DELETE.TITLE')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('COMMON.ARE_YOU_SURE_YOU_WANT_TO_DELETE_NAME_THIS_ACTION_C', {
                name: deleteDialog.category?.name,
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

export default CategoryPage;
