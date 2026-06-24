import { Fragment, useEffect, useMemo, useState } from 'react';
import { MetadataSchema } from '@/features/metadata/api/metadataApi';
import { useDebounce } from '@/shared/hooks';
import { useTranslations } from '@/shared/hooks/use-translations';
import { formatDate } from '@/shared/lib/date-utils.ts';
import { UserRole } from '@/shared/lib/rbac';
import { storage } from '@/shared/lib/storage';
import { usePaginationParams, useUrlParams } from '@/shared/lib/url-params';
import { useMetadataDeleteDialog } from '@/shared/stores/ui-store';
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
import { ScrollArea, ScrollBar } from '@/shared/ui/atoms/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/ui/atoms/tabs';
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
import {
  useDeleteMetadata,
  useMetadataList,
} from '../hooks/use-metadata-queries';

export function MetadataListPage() {
  const navigate = useNavigate();
  const { t } = useTranslations();

  // URL params management
  const { page, limit, setPage, setLimit } = usePaginationParams();
  const { getParam, updateParams } = useUrlParams({
    defaults: { page: 0, limit: 10 },
  });

  // Tab state
  const [activeTab, setActiveTab] = useState<'standard' | 'nested'>('standard');

  // Local state for search filters
  const [localSearch, setLocalSearch] = useState({
    searchId: getParam('id'),
    searchName: getParam('name'),
  });

  // Delete dialog state from store
  const deleteDialog = useMetadataDeleteDialog();

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
      level: activeTab === 'nested' ? 2 : 1,
    }),
    [page, limit, debouncedSearchId, debouncedSearchName, activeTab],
  );

  // React Query hooks
  const { data: metadataData, isLoading, error } = useMetadataList(queryParams);

  const deleteMetadataMutation = useDeleteMetadata();

  const metadata = metadataData?.data || [];
  const total = metadataData?.pageInfo?.totalCount || 0;

  const [sorting, setSorting] = useState<SortingState>([]);

  // DataGrid state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: page,
    pageSize: limit,
  });

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
    storage.removeItem('metadata_form_draft');
    if (activeTab === 'nested') {
      navigate('/metadata/create?level=2');
    } else {
      navigate('/metadata/create?level=1');
    }
  };

  const handleView = (schema: MetadataSchema) => {
    navigate(`/metadata/view/${schema.id}`);
  };

  const handleEdit = (schema: MetadataSchema) => {
    navigate(`/metadata/edit/${schema.id}`);
  };

  const handleDeleteClick = (schema: MetadataSchema) => {
    deleteDialog.open(schema);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.schema) return;

    await deleteMetadataMutation.mutateAsync({
      id: deleteDialog.schema.id,
    });

    deleteDialog.close();
  };

  // Define columns for DataGrid
  const columns = useMemo<ColumnDef<MetadataSchema>[]>(
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
          <DataGridColumnHeader
            title={
              activeTab === 'standard'
                ? t('METADATA.PAGE.TABLE.CATEGORY_NAME')
                : t('METADATA.PAGE.TABLE.OBJECT_NAME')
            }
            column={column}
          />
        ),
        cell: (info) => <span>{info.row.original.name}</span>,
        enableSorting: true,
        sortingFn: 'text',
        size: 200,
      },
      {
        id: 'level',
        accessorFn: (row) => row.level,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('METADATA.PAGE.TABLE.NUMBER_OF_METADATA')}
            column={column}
          />
        ),
        cell: (info) => <span>{info.row.original.metadata?.length || 0} </span>,
        enableSorting: true,
        sortingFn: 'basic',
        size: 100,
      },
      {
        id: 'metadata',
        accessorFn: (row) => row.metadata?.length || 0,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.METADATA')} column={column} />
        ),
        cell: (info) => (
          <span>
            {info.row.original.metadata?.map((m) => m.name).join(', ')}
          </span>
        ),
        enableSorting: true,
        sortingFn: 'basic',
        size: 120,
      },
      {
        id: 'createdAt',
        accessorFn: (row) => row.createdAt,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('ACTIVITY_LOG.PAGE.TABLE.DATE')}
            column={column}
          />
        ),
        cell: (info) => (
          <div className="text-sm flex flex-col">
            <span>{formatDate(info.row.original.createdAt, 'dd/MM/yyyy')}</span>
            <span>{formatDate(info.row.original.createdAt, 'HH:mm:ss')}</span>
          </div>
        ),
        enableSorting: true,
        sortingFn: 'datetime',
      },
      {
        id: 'actions',
        header: () => (
          <span className="text-right block">{t('COMMON.ACTIONS')}</span>
        ),
        cell: (info) => {
          const schema = info.row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleView(schema)}
                aria-label="View"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <PermissionGuard requiredRoles={[UserRole.ADMIN]}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(schema)}
                  aria-label="Edit"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </PermissionGuard>
              <PermissionGuard requiredRoles={[UserRole.ADMIN]}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(schema)}
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
    [handleView, handleEdit],
  );

  // Create table instance
  const table = useReactTable({
    columns,
    data: metadata,
    pageCount: total > 0 ? Math.ceil(total / limit) : 0,
    getRowId: (row: MetadataSchema) => row.id,
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
                {t('METADATA.PAGE.ADD_BUTTON')}
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
              <AlertTitle>
                {error instanceof Error ? error.message : 'An error occurred'}
              </AlertTitle>
            </Alert>
          )}

          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as 'standard' | 'nested')
            }
          >
            <TabsList>
              <TabsTrigger value="standard">
                {t('METADATA.PAGE.TAB_STANDARD')}
              </TabsTrigger>
              <TabsTrigger value="nested">
                {t('METADATA.PAGE.TAB_NESTED')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              <DataGrid
                table={table}
                recordCount={total || 0}
                isLoading={isLoading}
                loadingMode="skeleton"
                emptyMessage={t('METADATA.PAGE.TABLE.EMPTY')}
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
                    <CardTitle>
                      {activeTab === 'nested'
                        ? t('METADATA.PAGE.TABLE.TITLE_NESTED')
                        : t('METADATA.PAGE.TABLE.TITLE_STANDARD')}
                    </CardTitle>
                    <CardToolbar>
                      <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-4">
                        {/*<div className="relative">*/}
                        {/*  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />*/}
                        {/*  <Input*/}
                        {/*    placeholder={t(*/}
                        {/*      'METADATA.PAGE.SEARCH_ID_PLACEHOLDER',*/}
                        {/*    )}*/}
                        {/*    value={localSearch.searchId}*/}
                        {/*    onChange={(e) =>*/}
                        {/*      setLocalSearch({*/}
                        {/*        ...localSearch,*/}
                        {/*        searchId: e.target.value,*/}
                        {/*      })*/}
                        {/*    }*/}
                        {/*    className="pl-10"*/}
                        {/*  />*/}
                        {/*</div>*/}

                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={t(
                              'METADATA.PAGE.SEARCH_NAME_PLACEHOLDER',
                            )}
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
            </TabsContent>
          </Tabs>
        </div>
      </Container>

      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => {
          if (!open && !deleteMetadataMutation.isPending) {
            deleteDialog.close();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('METADATA.PAGE.DELETE.TITLE')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('COMMON.ARE_YOU_SURE_YOU_WANT_TO_DELETE_NAME_THIS_ACTION_C', {
                name: deleteDialog.schema?.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMetadataMutation.isPending}>
              {t('COMMON.CANCEL')}
            </AlertDialogCancel>
            <Button
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm().then();
              }}
              disabled={deleteMetadataMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMetadataMutation.isPending ? (
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
