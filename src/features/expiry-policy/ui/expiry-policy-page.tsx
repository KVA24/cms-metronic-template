import { Fragment, useEffect, useMemo, useState } from 'react';
import { ExpiryPolicy } from '@/features/expiry-policy/api/expiryPolicyApi';
import {
  useCreateExpiryPolicy,
  useDeleteExpiryPolicy,
  useExpiryPolicyDetail,
  useExpiryPolicyList,
  useUpdateExpiryPolicy,
} from '@/features/expiry-policy/hooks/use-expiry-policy-queries';
import { ExpiryPolicyDrawer } from '@/features/expiry-policy/ui/expiry-policy-drawer';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { useTranslations } from '@/shared/hooks/use-translations';
import { UserRole } from '@/shared/lib/rbac';
import { usePaginationParams, useUrlParams } from '@/shared/lib/url-params';
import {
  useExpiryPolicyDeleteDialog,
  useExpiryPolicyDrawer,
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
import { StatusBadge } from '@/shared/ui/molecules/status-badge.tsx';
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

export function ExpiryPolicyPage() {
  const { t } = useTranslations();

  // URL params management
  const { page, limit, setPage, setLimit } = usePaginationParams();
  const { getParam, updateParams } = useUrlParams({
    defaults: { page: 0, limit: 10 },
  });

  // Local state for search filters
  const [localSearch, setLocalSearch] = useState({
    searchId: getParam('id') || '',
    searchCode: getParam('code') || '',
    searchType: getParam('type') || '',
  });

  const debouncedSearchId = useDebounce(localSearch.searchId, 500);
  const debouncedSearchCode = useDebounce(localSearch.searchCode, 500);
  const debouncedSearchType = useDebounce(localSearch.searchType, 500);

  // Update URL params when filters change
  useEffect(() => {
    updateParams({
      id: debouncedSearchId || null,
      code: debouncedSearchCode || null,
      type: debouncedSearchType || null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchId, debouncedSearchCode, debouncedSearchType]);

  // Memoize query params to prevent unnecessary refetches
  const queryParams = useMemo(
    () => ({
      page,
      size: limit,
      id: debouncedSearchId || undefined,
      code: debouncedSearchCode || undefined,
      type: debouncedSearchType
        ? (debouncedSearchType as
            | 'FIXED_DAYS'
            | 'FIXED_MONTH'
            | 'FIXED_YEAR'
            | 'TIER_BASED'
            | 'NO_EXPIRED')
        : undefined,
    }),
    [page, limit, debouncedSearchId, debouncedSearchCode, debouncedSearchType],
  );

  // React Query - Fetch expiry policy list
  const {
    data: expiryPolicyListData,
    isLoading,
    error: queryError,
  } = useExpiryPolicyList(queryParams);

  const expiryPolicies = expiryPolicyListData?.data || [];
  const total = expiryPolicyListData?.pageInfo?.totalCount || 0;
  const error = queryError?.message || null;

  // React Query - Mutations
  const createMutation = useCreateExpiryPolicy();
  const updateMutation = useUpdateExpiryPolicy();
  const deleteMutation = useDeleteExpiryPolicy();

  // UI state from Zustand
  const drawer = useExpiryPolicyDrawer();
  const deleteDialog = useExpiryPolicyDeleteDialog();

  const [detailExpiryPolicyId, setDetailExpiryPolicyId] = useState<
    string | null
  >(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>(
    'create',
  );
  const [deleteOtp, setDeleteOtp] = useState('');

  // Fetch expiry policy detail when detailExpiryPolicyId changes
  const {
    data: detailData,
    isFetching: isDetailFetching,
    error: detailError,
  } = useExpiryPolicyDetail(detailExpiryPolicyId || undefined, {
    enabled: !!detailExpiryPolicyId,
  });

  // Handle detail fetch completion or error
  useEffect(() => {
    if (!isDetailFetching && detailExpiryPolicyId) {
      if (detailData) {
        drawer.open(detailData);
      } else if (detailError) {
        toast.error(t('EXPIRY_POLICY.PAGE.ERROR.LOAD_FAILED'));
      }
      setDetailExpiryPolicyId(null);
    }
  }, [
    detailData,
    detailError,
    isDetailFetching,
    detailExpiryPolicyId,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const handleView = (expiryPolicy: ExpiryPolicy) => {
    setDetailExpiryPolicyId(expiryPolicy.id);
    setDrawerMode('view');
  };

  const handleEdit = (expiryPolicy: ExpiryPolicy) => {
    setDetailExpiryPolicyId(expiryPolicy.id);
    setDrawerMode('edit');
  };

  const handleEditFromView = () => {
    setDrawerMode('edit');
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDrawerSubmit = async (data: any) => {
    const { otpCode, configValue: _cv, config, ...rest } = data;
    const dto = { ...rest, config: config ?? null };

    try {
      if (drawer.expiryPolicy) {
        await updateMutation.mutateAsync({
          id: drawer.expiryPolicy.id,
          data: { ...dto, otpCode },
        });
        drawer.close();
      } else {
        await createMutation.mutateAsync({
          data: { ...dto, otpCode },
        });
        drawer.close();
      }
    } catch {
      // Error handled by mutation
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteOtp.trim()) {
      return;
    }

    if (deleteDialog.expiryPolicy) {
      try {
        await deleteMutation.mutateAsync({
          id: deleteDialog.expiryPolicy.id,
          otpCode: deleteOtp,
        });
        setDeleteOtp('');
        deleteDialog.close();
      } catch {
        // Error handled by mutation
      }
    }
  };

  // Define columns for DataGrid
  const columns = useMemo<ColumnDef<ExpiryPolicy>[]>(
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
      // {
      //   id: 'code',
      //   accessorFn: (row) => row.code,
      //   header: ({ column }) => (
      //     <DataGridColumnHeader title={t('COMMON.CODE')} column={column} />
      //   ),
      //   cell: (info) => (
      //     <span className="font-medium">{info.row.original.code}</span>
      //   ),
      //   enableSorting: true,
      //   sortingFn: 'alphanumeric',
      //   size: 120,
      // },
      {
        id: 'name',
        accessorFn: (row) => row.name,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.NAME')} column={column} />
        ),
        cell: (info) => <span>{info.row.original.name}</span>,
        enableSorting: true,
        sortingFn: 'text',
        size: 150,
      },
      {
        id: 'type',
        accessorFn: (row) => row.type,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.TYPE')} column={column} />
        ),
        cell: (info) => {
          const type = info.row.original.type;
          return (
            <Badge variant="secondary">
              {t(`EXPIRY_POLICY.TYPES.${type}`)}
            </Badge>
          );
        },
        enableSorting: true,
        sortingFn: 'text',
        size: 120,
      },
      {
        id: 'currencyId',
        accessorFn: (row) => row.currencyId,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('EXPIRY_POLICY.PAGE.TABLE.CURRENCY_ID')}
            column={column}
          />
        ),
        cell: (info) => <span>{info.row.original.currencyId}</span>,
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
          const expiryPolicy = info.row.original;
          const isLoadingThis = detailExpiryPolicyId === expiryPolicy.id;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleView(expiryPolicy)}
                aria-label="View"
                disabled={isLoadingThis}
              >
                {isLoadingThis ? (
                  <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>

              <PermissionGuard
                requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(expiryPolicy)}
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
              <PermissionGuard
                requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteDialog.open(expiryPolicy)}
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
    [t, deleteDialog, detailExpiryPolicyId],
  );

  // Create table instance
  const table = useReactTable({
    columns,
    data: expiryPolicies,
    pageCount: total > 0 ? Math.ceil(total / limit) : 0,
    getRowId: (row: ExpiryPolicy) => row.id,
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
            <PermissionGuard
              requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}
            >
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                {t('EXPIRY_POLICY.PAGE.ADD_BUTTON')}
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
            emptyMessage={t('EXPIRY_POLICY.PAGE.TABLE.EMPTY')}
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
                <CardTitle>{t('EXPIRY_POLICY.PAGE.TABLE.TITLE')}</CardTitle>
                <CardToolbar>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
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

                    <Select
                      value={localSearch.searchType || ''}
                      onValueChange={(value) =>
                        setLocalSearch({ ...localSearch, searchType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            'EXPIRY_POLICY.PAGE.FILTER_TYPE_PLACEHOLDER',
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FIXED_DAYS">
                          {t('EXPIRY_POLICY.TYPES.FIXED_DAYS')}
                        </SelectItem>
                        <SelectItem value="FIXED_MONTH">
                          {t('EXPIRY_POLICY.TYPES.FIXED_MONTH')}
                        </SelectItem>
                        <SelectItem value="FIXED_YEAR">
                          {t('EXPIRY_POLICY.TYPES.FIXED_YEAR')}
                        </SelectItem>
                        {/*<SelectItem value="TIER_BASED">*/}
                        {/*  {t('EXPIRY_POLICY.TYPES.TIER_BASED')}*/}
                        {/*</SelectItem>*/}
                        <SelectItem value="NO_EXPIRED">
                          {t('EXPIRY_POLICY.TYPES.NO_EXPIRED')}
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

      <ExpiryPolicyDrawer
        open={drawer.isOpen}
        onClose={drawer.close}
        onSubmit={handleDrawerSubmit}
        expiryPolicy={drawer.expiryPolicy}
        isLoading={
          createMutation.isPending ||
          updateMutation.isPending ||
          isDetailFetching
        }
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
              {t('EXPIRY_POLICY.PAGE.DELETE.TITLE')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('EXPIRY_POLICY.PAGE.DELETE.DESCRIPTION', {
                name: deleteDialog.expiryPolicy?.name,
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
