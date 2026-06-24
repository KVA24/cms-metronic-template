import {Fragment, useEffect, useMemo, useState} from 'react';
import {Currency} from '@/features/currency/api/currencyApi';
import {useDebounce} from '@/shared/hooks';
import {useTranslations} from '@/shared/hooks/use-translations';
import {UserRole} from '@/shared/lib/rbac';
import {usePaginationParams, useUrlParams} from '@/shared/lib/url-params';
import {useCurrencyDeleteDialog, useCurrencyDrawer,} from '@/shared/stores/ui-store';
import {Alert, AlertIcon, AlertTitle} from '@/shared/ui/atoms/alert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/atoms/alert-dialog';
import {Badge} from '@/shared/ui/atoms/badge';
import {Button} from '@/shared/ui/atoms/button';
import {Card, CardFooter, CardHeader, CardTable, CardTitle, CardToolbar,} from '@/shared/ui/atoms/card';
import {DataGrid} from '@/shared/ui/atoms/data-grid';
import {DataGridColumnHeader} from '@/shared/ui/atoms/data-grid-column-header';
import {DataGridPagination} from '@/shared/ui/atoms/data-grid-pagination';
import {DataGridTable} from '@/shared/ui/atoms/data-grid-table';
import {Input} from '@/shared/ui/atoms/input';
import {Label} from '@/shared/ui/atoms/label';
import {ScrollArea, ScrollBar} from '@/shared/ui/atoms/scroll-area';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/shared/ui/atoms/select';
import {Toolbar, ToolbarActions, ToolbarHeading, ToolbarPageTitle,} from '@/shared/ui/molecules/common/toolbar';
import {Container} from '@/shared/ui/molecules/container';
import {PermissionGuard} from '@/shared/ui/molecules/permission-guard';
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
import {AlertCircle, Edit, Eye, LoaderCircleIcon, Plus, Search,} from 'lucide-react';
import {toast} from 'sonner';
import {
  useCreateCurrency,
  useCurrencyDetail,
  useCurrencyList,
  useDeleteCurrency,
  useUpdateCurrency,
} from '../hooks/use-currency-queries';
import {CurrencyDrawer} from './currency-drawer';

export function CurrencyPage() {
  const {t} = useTranslations();
  
  // URL params management
  const {page, limit, setPage, setLimit} = usePaginationParams();
  const {getParam, updateParams} = useUrlParams({
    defaults: {page: 0, limit: 10},
  });
  
  // Local state for search filters
  const [localSearch, setLocalSearch] = useState({
    searchId: getParam('id') || '',
    searchName: getParam('name') || '',
    sourceType: getParam('sourceType') || '',
  });
  
  const debouncedSearchId = useDebounce(localSearch.searchId, 500);
  const debouncedSearchName = useDebounce(localSearch.searchName, 500);
  const debouncedSourceType = useDebounce(localSearch.sourceType, 500);
  
  // Update URL params when filters change
  useEffect(() => {
    updateParams({
      id: debouncedSearchId || null,
      name: debouncedSearchName || null,
      sourceType: debouncedSourceType || null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchId, debouncedSearchName, debouncedSourceType]);
  
  // Memoize query params to prevent unnecessary refetches
  const queryParams = useMemo(
    () => ({
      page,
      size: limit,
      id: debouncedSearchId || undefined,
      name: debouncedSearchName || undefined,
      sourceType: debouncedSourceType
        ? (debouncedSourceType as 'INTERNAL' | 'EXTERNAL')
        : undefined,
    }),
    [page, limit, debouncedSearchId, debouncedSearchName, debouncedSourceType],
  );
  
  // React Query - Fetch currency list
  const {
    data: currencyListData,
    isLoading,
    error: queryError,
  } = useCurrencyList(queryParams);
  
  const currencies = currencyListData?.data || [];
  const total = currencyListData?.pageInfo?.totalCount || 0;
  const error = queryError?.message || null;
  
  // React Query - Mutations
  const createMutation = useCreateCurrency();
  const updateMutation = useUpdateCurrency();
  const deleteMutation = useDeleteCurrency();
  
  // UI state from Zustand
  const drawer = useCurrencyDrawer();
  const deleteDialog = useCurrencyDeleteDialog();
  
  const [detailCurrencyId, setDetailCurrencyId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>(
    'create',
  );
  const [deleteOtp, setDeleteOtp] = useState('');
  
  // Fetch currency detail when detailCurrencyId changes
  const {
    data: detailData,
    isFetching: isDetailFetching,
    error: detailError,
  } = useCurrencyDetail(detailCurrencyId || undefined, {
    enabled: !!detailCurrencyId,
  });
  
  // Handle detail fetch completion or error
  useEffect(() => {
    if (!isDetailFetching && detailCurrencyId) {
      if (detailData) {
        drawer.open(detailData);
      } else if (detailError) {
        toast.error(t('CURRENCY.PAGE.ERROR.LOAD_FAILED'));
      }
      setDetailCurrencyId(null);
    }
  }, [detailData, detailError, isDetailFetching, detailCurrencyId, drawer, t]);
  
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
  
  const handleView = (currency: Currency) => {
    setDetailCurrencyId(currency.id);
    setDrawerMode('view');
  };
  
  const handleEdit = (currency: Currency) => {
    setDetailCurrencyId(currency.id);
    setDrawerMode('edit');
  };
  
  const handleEditFromView = () => {
    setDrawerMode('edit');
  };
  
  const handleDrawerSubmit = async (data: any) => {
    try {
      if (drawer.currency) {
        await updateMutation.mutateAsync({
          id: drawer.currency.id,
          data,
        });
        drawer.close();
      } else {
        await createMutation.mutateAsync({data});
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
    
    if (deleteDialog.currency) {
      try {
        await deleteMutation.mutateAsync({
          id: deleteDialog.currency.id,
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
  const columns = useMemo<ColumnDef<Currency>[]>(
    () => [
      {
        id: 'id',
        accessorFn: (row) => row.id,
        header: ({column}) => (
          <DataGridColumnHeader title={t('COMMON.ID')} column={column}/>
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
        header: ({column}) => (
          <DataGridColumnHeader title={t('COMMON.CURRENCY')} column={column}/>
        ),
        cell: (info) => <span>{info.row.original.name}</span>,
        enableSorting: true,
        sortingFn: 'text',
        size: 150,
      },
      {
        id: 'code',
        accessorFn: (row) => row.code,
        header: ({column}) => (
          <DataGridColumnHeader title={t('COMMON.CODE')} column={column}/>
        ),
        cell: (info) => (
          <span className="font-medium">{info.row.original.code}</span>
        ),
        enableSorting: true,
        sortingFn: 'alphanumeric',
        size: 120,
      },
      {
        id: 'sourceType',
        accessorFn: (row) => row.sourceType,
        header: ({column}) => (
          <DataGridColumnHeader
            title={t('COMMON.SOURCE_TYPE')}
            column={column}
          />
        ),
        cell: (info) => {
          const sourceType = info.row.original.sourceType;
          return (
            <Badge
              variant={sourceType === 'INTERNAL' ? 'primary' : 'secondary'}
            >
              {sourceType}
            </Badge>
          );
        },
        enableSorting: true,
        sortingFn: 'text',
        size: 120,
      },
      {
        id: 'isPoint',
        accessorFn: (row) => row.isPoint,
        header: ({column}) => (
          <DataGridColumnHeader
            title={t('CURRENCY.PAGE.TABLE.IS_POINT')}
            column={column}
          />
        ),
        cell: (info) => {
          const isPoint = info.row.original.isPoint;
          return (
            <Badge variant={isPoint ? 'success' : 'secondary'}>
              {isPoint ? t('COMMON.YES') : t('COMMON.NO')}
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
          const currency = info.row.original;
          const isLoadingThis = detailCurrencyId === currency.id;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleView(currency)}
                aria-label="View"
                disabled={isLoadingThis}
              >
                {isLoadingThis ? (
                  <LoaderCircleIcon className="h-4 w-4 animate-spin"/>
                ) : (
                  <Eye className="h-4 w-4"/>
                )}
              </Button>
              
              <PermissionGuard requiredRoles={[UserRole.ADMIN]}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(currency)}
                  aria-label="Edit"
                  disabled={isLoadingThis}
                >
                  {isLoadingThis ? (
                    <LoaderCircleIcon className="h-4 w-4 animate-spin"/>
                  ) : (
                    <Edit className="h-4 w-4"/>
                  )}
                </Button>
              </PermissionGuard>
              {/*<PermissionGuard requiredRoles={[UserRole.ADMIN]}>*/}
              {/*  <Button*/}
              {/*    variant="ghost"*/}
              {/*    size="sm"*/}
              {/*    onClick={() => deleteDialog.open(currency)}*/}
              {/*    aria-label="Delete"*/}
              {/*    disabled={isLoadingThis}*/}
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
    [t, deleteDialog, detailCurrencyId],
  );
  
  // Create table instance
  const table = useReactTable({
    columns,
    data: currencies,
    pageCount: total > 0 ? Math.ceil(total / limit) : 0,
    getRowId: (row: Currency) => row.id,
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
            <ToolbarPageTitle/>
          </ToolbarHeading>
          <ToolbarActions>
            <PermissionGuard requiredRoles={[UserRole.ADMIN]}>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2"/>
                {t('CURRENCY.PAGE.ADD_BUTTON')}
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
                <AlertCircle/>
              </AlertIcon>
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}
          
          <DataGrid
            table={table}
            recordCount={total || 0}
            isLoading={isLoading}
            loadingMode="skeleton"
            emptyMessage={t('CURRENCY.PAGE.TABLE.EMPTY')}
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
                <CardTitle>{t('CURRENCY.PAGE.TABLE.TITLE')}</CardTitle>
                <CardToolbar>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
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
                      <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
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
                    
                    <div>
                      <Select
                        value={localSearch.sourceType || ''}
                        onValueChange={(value) =>
                          setLocalSearch({...localSearch, sourceType: value})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'CURRENCY.PAGE.SOURCE_TYPE_PLACEHOLDER',
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INTERNAL">INTERNAL</SelectItem>
                          <SelectItem value="EXTERNAL">EXTERNAL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardToolbar>
              </CardHeader>
              <CardTable>
                <ScrollArea>
                  <DataGridTable/>
                  <ScrollBar orientation="horizontal"/>
                </ScrollArea>
              </CardTable>
              <CardFooter className="flex items-center justify-between">
                <DataGridPagination/>
              </CardFooter>
            </Card>
          </DataGrid>
        </div>
      </Container>
      
      <CurrencyDrawer
        open={drawer.isOpen}
        onClose={drawer.close}
        onSubmit={handleDrawerSubmit}
        currency={drawer.currency}
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
              {t('CURRENCY.PAGE.DELETE.TITLE')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('COMMON.ARE_YOU_SURE_YOU_WANT_TO_DELETE_NAME_THIS_ACTION_C', {
                name: deleteDialog.currency?.name,
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
                  <LoaderCircleIcon className="h-4 w-4 animate-spin"/>
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
