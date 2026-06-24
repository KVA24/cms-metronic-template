import { Fragment, useEffect, useMemo, useState } from 'react';
import { useDebounce } from '@/shared/hooks';
import { useTranslations } from '@/shared/hooks/use-translations';
import { UserRole } from '@/shared/lib/rbac';
import { storage } from '@/shared/lib/storage';
import { usePaginationParams, useUrlParams } from '@/shared/lib/url-params';
import { useEventDeleteDialog } from '@/shared/stores/ui-store';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/atoms/popover';
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
import { Event } from '../api/eventApi';
import { useDeleteEvent, useEventList } from '../hooks/use-event-queries';

export function EventListPage() {
  const navigate = useNavigate();
  const { t } = useTranslations();

  // URL params management
  const { page, limit, setPage, setLimit } = usePaginationParams();
  const { getParam, updateParams } = useUrlParams({
    defaults: { page: 0, limit: 10 },
  });

  // Local state for search filters
  const [localSearch, setLocalSearch] = useState({
    searchId: getParam('id'),
    searchName: getParam('name'),
  });

  // Delete dialog state from store
  const deleteDialog = useEventDeleteDialog();
  const [deleteOtp, setDeleteOtp] = useState('');

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

  // React Query hooks
  const { data: eventData, isLoading, error } = useEventList(queryParams);

  const events = eventData?.data || [];
  const total = eventData?.pageInfo?.totalCount || 0;

  const deleteEventMutation = useDeleteEvent();

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
    storage.removeItem('event_form_draft');
    navigate('/event-schemas/create');
  };

  const handleView = (event: Event) => {
    navigate(`/event-schemas/view/${event.id}`);
  };

  const handleEdit = (event: Event) => {
    navigate(`/event-schemas/edit/${event.id}`);
  };

  const handleDeleteClick = (event: Event) => {
    deleteDialog.open(event);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.event) {
      return;
    }

    if (!deleteOtp.trim()) {
      return;
    }

    await deleteEventMutation.mutateAsync({
      id: deleteDialog.event.id,
      otpCode: deleteOtp,
    });

    setDeleteOtp('');
    deleteDialog.close();
  };

  // Define columns for DataGrid
  const columns = useMemo<ColumnDef<Event>[]>(
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
        id: 'properties',
        accessorFn: (row) => row.properties?.length || 0,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('EVENTS.PAGE.TABLE.PROPERTIES')}
            column={column}
          />
        ),
        cell: (info) => {
          const properties = info.row.original.properties || [];
          const count = properties.length;

          if (count === 0) {
            return <span>{t('COMMON.NO')}</span>;
          }

          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={'ghost'}>
                  <Eye />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 max-h-96 overflow-auto">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">
                    {t('EVENTS.PAGE.TABLE.PROPERTIES')}
                  </h4>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-80">
                    {JSON.stringify(properties, null, 2)}
                  </pre>
                </div>
              </PopoverContent>
            </Popover>
          );
        },
        enableSorting: true,
        sortingFn: 'basic',
        size: 120,
      },
      {
        id: 'actions',
        header: () => (
          <span className="text-right block">{t('COMMON.ACTIONS')}</span>
        ),
        cell: (info) => {
          const event = info.row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleView(event)}
                aria-label="View"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <PermissionGuard requiredRoles={[UserRole.ADMIN]}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(event)}
                  aria-label="Edit"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </PermissionGuard>
              <PermissionGuard requiredRoles={[UserRole.ADMIN]}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(event)}
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
    data: events,
    pageCount: total > 0 ? Math.ceil(total / limit) : 0,
    getRowId: (row: Event) => row.id,
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
                {t('EVENTS.PAGE.ADD_BUTTON')}
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

          <DataGrid
            table={table}
            recordCount={total || 0}
            isLoading={isLoading}
            loadingMode="skeleton"
            emptyMessage={t('EVENTS.PAGE.TABLE.EMPTY')}
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
                <CardTitle>{t('EVENTS.PAGE.TABLE.TITLE')}</CardTitle>
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
          if (!open && !deleteEventMutation.isPending) {
            setDeleteOtp('');
            deleteDialog.close();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('EVENTS.PAGE.DELETE.TITLE')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('COMMON.ARE_YOU_SURE_YOU_WANT_TO_DELETE_NAME_THIS_ACTION_C', {
                name: deleteDialog.event?.name,
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
              disabled={deleteEventMutation.isPending}
              maxLength={6}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteEventMutation.isPending}>
              {t('COMMON.CANCEL')}
            </AlertDialogCancel>
            <Button
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm().then();
              }}
              disabled={deleteEventMutation.isPending || !deleteOtp.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEventMutation.isPending ? (
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
