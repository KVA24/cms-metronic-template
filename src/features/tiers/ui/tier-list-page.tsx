import { Fragment, useEffect, useMemo, useState } from 'react';
import { Tier } from '@/features/tiers/api/tierApi';
import { useDebounce } from '@/shared/hooks';
import { useTranslations } from '@/shared/hooks/use-translations';
import { UserRole } from '@/shared/lib/rbac';
import { usePaginationParams, useUrlParams } from '@/shared/lib/url-params';
import { useTierDeleteDialog } from '@/shared/stores/ui-store';
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
  Eye,
  LoaderCircleIcon,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDeleteTier, useTierListQuery } from '../hooks/use-tier-queries';

export function TierListPage() {
  const navigate = useNavigate();
  const { t } = useTranslations();

  const { page, limit, setPage, setLimit } = usePaginationParams();
  const { getParam, updateParams } = useUrlParams({
    defaults: { page: 0, limit: 10 },
  });

  const [localSearch, setLocalSearch] = useState({
    searchId: getParam('id') || '',
    searchName: getParam('name') || '',
    searchCode: getParam('code') || '',
  });

  const debouncedSearchId = useDebounce(localSearch.searchId, 500);
  const debouncedSearchName = useDebounce(localSearch.searchName, 500);
  const debouncedSearchCode = useDebounce(localSearch.searchCode, 500);

  // Update URL params when filters change
  useEffect(() => {
    updateParams({
      id: debouncedSearchId || null,
      name: debouncedSearchName || null,
      code: debouncedSearchCode || null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchId, debouncedSearchName, debouncedSearchCode]);

  // Memoize query params to prevent unnecessary refetches
  const queryParams = useMemo(
    () => ({
      page,
      size: limit,
      id: debouncedSearchId ? debouncedSearchId : undefined,
      name: debouncedSearchName || undefined,
      code: debouncedSearchCode || undefined,
    }),
    [page, limit, debouncedSearchId, debouncedSearchName, debouncedSearchCode],
  );

  // React Query - Fetch tier list
  const {
    data: tierListData,
    isLoading,
    error: queryError,
  } = useTierListQuery(queryParams);

  const tiers = tierListData?.data || [];
  const total = tierListData?.pageInfo?.totalCount || 0;
  const pageCount = tierListData?.pageInfo?.totalPage || 0;
  const error = queryError?.message || null;

  // React Query - Mutations
  const deleteMutation = useDeleteTier();

  // UI state from Zustand
  const deleteDialog = useTierDeleteDialog();
  const [deleteOtp, setDeleteOtp] = useState('');

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
    navigate('/tiers/create');
  };

  const handleView = (tier: Tier) => {
    navigate(`/tiers/view/${tier.id}`);
  };

  const handleEdit = (tier: Tier) => {
    navigate(`/tiers/edit/${tier.id}`);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteOtp.trim()) {
      return;
    }

    if (deleteDialog.tier) {
      try {
        await deleteMutation.mutateAsync({
          id: deleteDialog.tier.id,
          otpCode: deleteOtp,
        });
        setDeleteOtp('');
        deleteDialog.close();
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  const columns = useMemo<ColumnDef<Tier>[]>(
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
        sortingFn: 'basic',
        size: 80,
      },
      {
        id: 'name',
        accessorFn: (row) => row.name,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('TIERS.PAGE.TABLE.NAME')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="font-medium">{info.row.original.name}</span>
        ),
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
        cell: (info) => <span>{info.row.original.code}</span>,
        enableSorting: true,
        sortingFn: 'text',
        size: 150,
      },
      {
        id: 'rank',
        accessorFn: (row) => row.rank,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('TIERS.PAGE.TABLE.RANK')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="text-center">{info.row.original.rank}</span>
        ),
        enableSorting: true,
        sortingFn: 'basic',
        size: 100,
      },
      {
        id: 'actions',
        header: () => (
          <span className="text-right block">{t('COMMON.ACTIONS')}</span>
        ),
        cell: (info) => {
          const tier = info.row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleView(tier)}
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
                  onClick={() => handleEdit(tier)}
                  aria-label="Edit"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </PermissionGuard>
              {/*<PermissionGuard*/}
              {/*  requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}*/}
              {/*>*/}
              {/*  <Button*/}
              {/*    variant="ghost"*/}
              {/*    size="sm"*/}
              {/*    onClick={() => deleteDialog.open(tier)}*/}
              {/*    aria-label="Delete"*/}
              {/*  >*/}
              {/*    <Trash2 className="h-4 w-4 text-destructive" />*/}
              {/*  </Button>*/}
              {/*</PermissionGuard>*/}
            </div>
          );
        },
        enableSorting: false,
        size: 150,
      },
    ],
    [handleView, handleEdit, deleteDialog],
  );

  const table = useReactTable({
    columns,
    data: tiers,
    pageCount: pageCount,
    getRowId: (row: Tier) => row.id,
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
                {t('TIERS.PAGE.ADD_BUTTON')}
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
            emptyMessage={t('TIERS.PAGE.TABLE.EMPTY')}
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
                <CardTitle>{t('TIERS.PAGE.TABLE.TITLE')}</CardTitle>
                <CardToolbar>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
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
            <AlertDialogTitle>{t('TIERS.PAGE.DELETE.TITLE')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('COMMON.ARE_YOU_SURE_YOU_WANT_TO_DELETE_NAME_THIS_ACTION_C', {
                name: deleteDialog.tier?.name,
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
