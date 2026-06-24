import { Fragment, useEffect, useMemo, useState } from 'react';
import { GameReward } from '@/features/game-rewards/api/gameRewardsApi';
import { useDebounce } from '@/shared/hooks';
import { useTranslations } from '@/shared/hooks/use-translations';
import { formatNumber } from '@/shared/lib';
import { UserRole } from '@/shared/lib/rbac';
import { usePaginationParams, useUrlParams } from '@/shared/lib/url-params';
import {
  useGameRewardDeleteDialog,
  useGameRewardDrawer,
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
import { toast } from 'sonner';
import {
  useCreateGameReward,
  useDeleteGameReward,
  useGameRewardDetail,
  useGameRewardsList,
  useUpdateGameReward,
} from '../hooks/use-game-rewards-queries';
import { GameRewardDrawer } from './game-rewards-drawer';

export function GameRewardsPage() {
  const { t } = useTranslations();

  // URL params management
  const { page, limit, setPage, setLimit } = usePaginationParams();
  const { getParam, updateParams } = useUrlParams({
    defaults: { page: 0, limit: 10 },
  });

  // Local state for search filters
  const [localSearch, setLocalSearch] = useState({
    searchId: getParam('id') || '',
    searchRewardName: getParam('rewardName') || '',
    searchType: getParam('type') || '',
  });

  const debouncedSearchId = useDebounce(localSearch.searchId, 500);
  const debouncedSearchRewardName = useDebounce(
    localSearch.searchRewardName,
    500,
  );
  const debouncedSearchType = useDebounce(localSearch.searchType, 500);

  // Update URL params when filters change
  useEffect(() => {
    updateParams({
      id: debouncedSearchId || null,
      rewardName: debouncedSearchRewardName || null,
      type: debouncedSearchType || null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchId, debouncedSearchRewardName, debouncedSearchType]);

  // Memoize query params to prevent unnecessary refetches
  const queryParams = useMemo(
    () => ({
      page,
      size: limit,
      id: debouncedSearchId || undefined,
      rewardName: debouncedSearchRewardName || undefined,
      type: debouncedSearchType || undefined,
    }),
    [
      page,
      limit,
      debouncedSearchId,
      debouncedSearchRewardName,
      debouncedSearchType,
    ],
  );

  // React Query - Fetch game rewards list
  const {
    data: gameRewardsListData,
    isLoading,
    error: queryError,
  } = useGameRewardsList(queryParams);

  const gameRewards = gameRewardsListData?.data || [];
  const total = gameRewardsListData?.metadata?.total || 0;
  const totalPages = gameRewardsListData?.metadata?.totalPages || 0;
  const error = queryError?.message || null;

  // React Query - Mutations
  const createMutation = useCreateGameReward();
  const updateMutation = useUpdateGameReward();
  const deleteMutation = useDeleteGameReward();

  // UI state from Zustand
  const drawer = useGameRewardDrawer();
  const deleteDialog = useGameRewardDeleteDialog();

  const [detailGameRewardId, setDetailGameRewardId] = useState<string | null>(
    null,
  );
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>(
    'create',
  );

  // Fetch game reward detail when detailGameRewardId changes
  const {
    data: detailData,
    isFetching: isDetailFetching,
    error: detailError,
  } = useGameRewardDetail(detailGameRewardId || undefined, {
    enabled: !!detailGameRewardId,
  });

  // Handle detail fetch completion or error
  useEffect(() => {
    if (!isDetailFetching && detailGameRewardId) {
      if (detailData) {
        drawer.open(detailData);
      } else if (detailError) {
        toast.error(t('GAME_REWARDS.PAGE.ERROR.LOAD_FAILED'));
      }
      setDetailGameRewardId(null);
    }
  }, [
    detailData,
    detailError,
    isDetailFetching,
    detailGameRewardId,
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

  const handleView = (gameReward: GameReward) => {
    setDetailGameRewardId(gameReward.id);
    setDrawerMode('view');
  };

  const handleEdit = (gameReward: GameReward) => {
    setDetailGameRewardId(gameReward.id);
    setDrawerMode('edit');
  };

  const handleEditFromView = () => {
    setDrawerMode('edit');
  };

  const handleDrawerSubmit = async (data: any) => {
    try {
      if (drawer.gameReward) {
        await updateMutation.mutateAsync({
          id: drawer.gameReward.id,
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
    if (deleteDialog.gameReward) {
      try {
        await deleteMutation.mutateAsync({
          id: deleteDialog.gameReward.id,
          otpCode: '',
        });
        deleteDialog.close();
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  // Define columns for DataGrid
  const columns = useMemo<ColumnDef<GameReward>[]>(
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
        id: 'rewardName',
        accessorFn: (row) => row.rewardName,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('GAME_REWARDS.PAGE.TABLE.REWARD_NAME')}
            column={column}
          />
        ),
        cell: (info) => <span>{info.row.original.rewardName}</span>,
        enableSorting: true,
        sortingFn: 'text',
        size: 150,
      },
      {
        id: 'value',
        accessorFn: (row) => row.value,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.VALUE')} column={column} />
        ),
        cell: (info) => <span>{formatNumber(info.row.original.value)}</span>,
        enableSorting: true,
        sortingFn: 'basic',
        size: 100,
      },
      {
        id: 'type',
        accessorFn: (row) => row.type,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.TYPE')} column={column} />
        ),
        cell: (info) => (
          <Badge variant="secondary">{info.row.original.type}</Badge>
        ),
        enableSorting: true,
        sortingFn: 'text',
        size: 120,
      },
      {
        id: 'isDefault',
        accessorFn: (row) => row.isDefault,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('GAME_REWARDS.PAGE.TABLE.IS_DEFAULT')}
            column={column}
          />
        ),
        cell: (info) => {
          const isDefault = info.row.original.isDefault;
          return (
            <Badge variant={isDefault ? 'success' : 'secondary'}>
              {isDefault ? t('COMMON.YES') : t('COMMON.NO')}
            </Badge>
          );
        },
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
          const gameReward = info.row.original;
          const isLoadingThis = detailGameRewardId === gameReward.id;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleView(gameReward)}
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
                  onClick={() => handleEdit(gameReward)}
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
                  onClick={() => deleteDialog.open(gameReward)}
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
    [t, deleteDialog, detailGameRewardId],
  );

  // Create table instance
  const table = useReactTable({
    columns,
    data: gameRewards,
    pageCount: totalPages || 0,
    getRowId: (row: GameReward) => row.id,
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
                {t('GAME_REWARDS.PAGE.ADD_BUTTON')}
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
            emptyMessage={t('GAME_REWARDS.PAGE.TABLE.EMPTY')}
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
                <CardTitle>{t('GAME_REWARDS.PAGE.TABLE.TITLE')}</CardTitle>
                <CardToolbar className={'hidden'}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t(
                          'GAME_REWARDS.PAGE.SEARCH_ID_PLACEHOLDER',
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

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t(
                          'GAME_REWARDS.PAGE.SEARCH_REWARD_NAME_PLACEHOLDER',
                        )}
                        value={localSearch.searchRewardName}
                        onChange={(e) =>
                          setLocalSearch({
                            ...localSearch,
                            searchRewardName: e.target.value,
                          })
                        }
                        className="pl-10"
                      />
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t(
                          'GAME_REWARDS.PAGE.SEARCH_TYPE_PLACEHOLDER',
                        )}
                        value={localSearch.searchType}
                        onChange={(e) =>
                          setLocalSearch({
                            ...localSearch,
                            searchType: e.target.value,
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

      <GameRewardDrawer
        open={drawer.isOpen}
        onClose={drawer.close}
        onSubmit={handleDrawerSubmit}
        gameReward={drawer.gameReward}
        isLoading={createMutation.isPending || updateMutation.isPending}
        mode={drawerMode}
        onEdit={handleEditFromView}
      />

      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            deleteDialog.close();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('GAME_REWARDS.PAGE.DELETE.TITLE')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('COMMON.ARE_YOU_SURE_YOU_WANT_TO_DELETE_NAME_THIS_ACTION_C', {
                name: deleteDialog.gameReward?.rewardName,
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
