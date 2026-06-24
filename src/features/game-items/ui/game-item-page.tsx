import { Fragment, useEffect, useMemo, useState } from 'react';
import { GameItem } from '@/features/game-items/api/gameItemApi';
import { useTranslations } from '@/shared/hooks/use-translations';
import { UserRole } from '@/shared/lib/rbac';
import { usePaginationParams, useUrlParams } from '@/shared/lib/url-params';
import {
  useGameItemDeleteDialog,
  useGameItemDrawer,
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
  useCreateGameItem,
  useDeleteGameItem,
  useGameItemDetail,
  useGameItemList,
  useUpdateGameItem,
} from '../hooks/use-game-item-queries';
import { GameItemDrawer } from './game-item-drawer';

export function GameItemPage() {
  const { t } = useTranslations();

  const { page, limit, setPage, setLimit } = usePaginationParams();
  const { getParam, updateParams } = useUrlParams({
    defaults: { page: 0, limit: 10 },
  });

  const [localSearch, setLocalSearch] = useState({
    code: getParam('code') || '',
    name: getParam('name') || '',
    type: getParam('type') || '',
    sourceType: getParam('sourceType') || '',
  });

  useEffect(() => {
    updateParams({
      code: localSearch.code || null,
      name: localSearch.name || null,
      type: localSearch.type || null,
      sourceType: localSearch.sourceType || null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    localSearch.code,
    localSearch.name,
    localSearch.type,
    localSearch.sourceType,
  ]);

  const queryParams = useMemo(
    () => ({
      page,
      size: limit,
      code: localSearch.code || undefined,
      name: localSearch.name || undefined,
      type: localSearch.type || undefined,
      sourceType: localSearch.sourceType || undefined,
    }),
    [
      page,
      limit,
      localSearch.code,
      localSearch.name,
      localSearch.type,
      localSearch.sourceType,
    ],
  );

  const {
    data: listData,
    isLoading,
    error: queryError,
  } = useGameItemList(queryParams);

  const items = listData?.data || [];
  const total = listData?.metadata?.total || 0;
  const totalPages = listData?.metadata?.totalPages || 0;
  const error = queryError?.message || null;

  const createMutation = useCreateGameItem();
  const updateMutation = useUpdateGameItem();
  const deleteMutation = useDeleteGameItem();

  const drawer = useGameItemDrawer();
  const deleteDialog = useGameItemDeleteDialog();

  const [detailId, setDetailId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>(
    'create',
  );

  const {
    data: detailData,
    isFetching: isDetailFetching,
    error: detailError,
  } = useGameItemDetail(detailId || undefined, { enabled: !!detailId });

  useEffect(() => {
    if (!isDetailFetching && detailId) {
      if (detailData) {
        drawer.open(detailData);
      } else if (detailError) {
        toast.error(t('GAME_ITEMS.PAGE.ERROR.LOAD_FAILED'));
      }
      setDetailId(null);
    }
  }, [detailData, detailError, isDetailFetching, detailId, drawer, t]);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: page,
    pageSize: limit,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    setPagination({ pageIndex: page, pageSize: limit });
  }, [page, limit]);

  const handlePaginationChange = (updater: any) => {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    if (next.pageIndex !== page) setPage(next.pageIndex);
    if (next.pageSize !== limit) setLimit(next.pageSize);
  };

  const handleAdd = () => {
    setDrawerMode('create');
    drawer.open();
  };
  const handleView = (item: GameItem) => {
    setDetailId(item.id);
    setDrawerMode('view');
  };
  const handleEdit = (item: GameItem) => {
    setDetailId(item.id);
    setDrawerMode('edit');
  };

  const handleDrawerSubmit = async (data: any) => {
    try {
      if (drawer.gameItem) {
        await updateMutation.mutateAsync({
          id: drawer.gameItem.id,
          data,
        });
      } else {
        await createMutation.mutateAsync({
          data,
        });
      }
      drawer.close();
    } catch {
      // Error handled by mutation
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.gameItem) {
      try {
        await deleteMutation.mutateAsync({
          id: deleteDialog.gameItem.id,
          otpCode: '',
        });
        deleteDialog.close();
      } catch {
        // Error handled by mutation
      }
    }
  };

  const columns = useMemo<ColumnDef<GameItem>[]>(
    () => [
      {
        id: 'id',
        accessorFn: (row) => row.id,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.ID')} column={column} />
        ),
        cell: (info) => <span className="text-sm">{info.row.original.id}</span>,
        enableSorting: true,
        sortingFn: 'text',
        size: 120,
      },
      {
        id: 'name',
        accessorFn: (row) => row.name,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.NAME')} column={column} />
        ),
        cell: (info) => <span className="">{info.row.original.name}</span>,
        enableSorting: true,
        sortingFn: 'text',
        size: 180,
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
        size: 120,
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
        id: 'sourceType',
        accessorFn: (row) => row.sourceType,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('COMMON.SOURCE_TYPE')}
            column={column}
          />
        ),
        cell: (info) => (
          <Badge variant="outline">{info.row.original.sourceType}</Badge>
        ),
        enableSorting: true,
        sortingFn: 'text',
        size: 140,
      },
      {
        id: 'actions',
        header: () => (
          <span className="text-right block">{t('COMMON.ACTIONS')}</span>
        ),
        cell: (info) => {
          const item = info.row.original;
          const isLoadingThis = detailId === item.itemId;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleView(item)}
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
                  onClick={() => handleEdit(item)}
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
                  onClick={() => deleteDialog.open(item)}
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
    [t, deleteDialog, detailId],
  );

  const table = useReactTable({
    columns,
    data: items,
    pageCount: totalPages || 0,
    getRowId: (row: GameItem) => row.itemId,
    state: { pagination, sorting },
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
            <PermissionGuard requiredRoles={[UserRole.ADMIN]}>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                {t('GAME_ITEMS.PAGE.ADD_BUTTON')}
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
            recordCount={total}
            isLoading={isLoading}
            loadingMode="skeleton"
            emptyMessage={t('GAME_ITEMS.PAGE.TABLE.EMPTY')}
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
                <CardTitle>{t('GAME_ITEMS.PAGE.TABLE.TITLE')}</CardTitle>
                <CardToolbar className="hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t(
                          'GAME_ITEMS.PAGE.SEARCH_CODE_PLACEHOLDER',
                        )}
                        value={localSearch.code}
                        onChange={(e) =>
                          setLocalSearch({
                            ...localSearch,
                            code: e.target.value,
                          })
                        }
                        className="pl-10"
                      />
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t(
                          'GAME_ITEMS.PAGE.SEARCH_NAME_PLACEHOLDER',
                        )}
                        value={localSearch.name}
                        onChange={(e) =>
                          setLocalSearch({
                            ...localSearch,
                            name: e.target.value,
                          })
                        }
                        className="pl-10"
                      />
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t(
                          'GAME_ITEMS.PAGE.SEARCH_TYPE_PLACEHOLDER',
                        )}
                        value={localSearch.type}
                        onChange={(e) =>
                          setLocalSearch({
                            ...localSearch,
                            type: e.target.value,
                          })
                        }
                        className="pl-10"
                      />
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t(
                          'GAME_ITEMS.PAGE.SEARCH_SOURCE_TYPE_PLACEHOLDER',
                        )}
                        value={localSearch.sourceType}
                        onChange={(e) =>
                          setLocalSearch({
                            ...localSearch,
                            sourceType: e.target.value,
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

      <GameItemDrawer
        open={drawer.isOpen}
        onClose={drawer.close}
        onSubmit={handleDrawerSubmit}
        gameItem={drawer.gameItem}
        isLoading={createMutation.isPending || updateMutation.isPending}
        mode={drawerMode}
        onEdit={() => setDrawerMode('edit')}
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
              {t('GAME_ITEMS.PAGE.DELETE.TITLE')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('COMMON.ARE_YOU_SURE_YOU_WANT_TO_DELETE_NAME_THIS_ACTION_C', {
                name: deleteDialog.gameItem?.name,
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
