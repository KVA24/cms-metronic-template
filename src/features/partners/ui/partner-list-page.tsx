import {Fragment, useEffect, useMemo, useState} from 'react';
import {Partner} from '@/features/partners/api/partnerApi';
import {useDebounce} from '@/shared/hooks';
import {useTranslations} from '@/shared/hooks/use-translations';
import {formatDate} from '@/shared/lib/date-utils.ts';
import {UserRole} from '@/shared/lib/rbac';
import {storage} from '@/shared/lib/storage';
import {usePaginationParams, useUrlParams} from '@/shared/lib/url-params';
import {usePartnerDeleteDialog} from '@/shared/stores/ui-store';
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
import {StatusBadge} from '@/shared/ui/molecules/status-badge';
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
import {useNavigate} from 'react-router-dom';
import {useDeletePartner, usePartnerList} from '../hooks/use-partner-queries';

export function PartnerListPage() {
  const navigate = useNavigate();
  const {t} = useTranslations();
  
  // URL params management
  const {page, limit, setPage, setLimit} = usePaginationParams();
  const {getParam, updateParams} = useUrlParams({
    defaults: {page: 0, limit: 10},
  });
  
  const [localSearch, setLocalSearch] = useState({
    searchId: getParam('id'),
    searchName: getParam('name'),
    searchCode: getParam('code'),
    status: getParam('status'),
  });
  
  const deleteDialog = usePartnerDeleteDialog();
  const [deleteOtp, setDeleteOtp] = useState('');
  
  const debouncedSearchId = useDebounce(localSearch.searchId, 500);
  const debouncedSearchName = useDebounce(localSearch.searchName, 500);
  const debouncedSearchCode = useDebounce(localSearch.searchCode, 500);
  const debouncedStatus = useDebounce(localSearch.status, 500);
  
  // Update URL params when filters change
  useEffect(() => {
    updateParams({
      id: debouncedSearchId || null,
      name: debouncedSearchName || null,
      code: debouncedSearchCode || null,
      status: debouncedStatus || null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearchId,
    debouncedSearchName,
    debouncedSearchCode,
    debouncedStatus,
  ]);
  
  // Memoize query params to prevent unnecessary refetches
  const queryParams = useMemo(
    () => ({
      page,
      size: limit,
      id: debouncedSearchId || undefined,
      name: debouncedSearchName || undefined,
      code: debouncedSearchCode || undefined,
      status: debouncedStatus || undefined,
    }),
    [
      page,
      limit,
      debouncedSearchId,
      debouncedSearchName,
      debouncedSearchCode,
      debouncedStatus,
    ],
  );
  
  // React Query hooks
  const {
    data: partnerListData,
    isLoading,
    error,
  } = usePartnerList(queryParams);
  
  const deletePartnerMutation = useDeletePartner();
  
  const partnerList = partnerListData?.data || [];
  const total = partnerListData?.pageInfo?.totalCount || 0;
  
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
    storage.removeItem('partner_form_draft');
    navigate('/partners/create');
  };
  
  const handleView = (partner: Partner) => {
    navigate(`/partners/view/${partner.id}`);
  };
  
  const handleEdit = (partner: Partner) => {
    navigate(`/partners/edit/${partner.id}`);
  };
  
  // const handleDeleteClick = (partner: Partner) => {
  //   deleteDialog.open(partner);
  // };
  
  const handleDeleteConfirm = async () => {
    if (!deleteDialog.partner) {
      return;
    }
    
    if (!deleteOtp.trim()) {
      return;
    }
    
    await deletePartnerMutation.mutateAsync({
      id: deleteDialog.partner.id,
      otpCode: deleteOtp,
    });
    
    setDeleteOtp('');
    deleteDialog.close();
  };
  const columns = useMemo<ColumnDef<Partner>[]>(
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
        sortingFn: 'basic',
        size: 80,
      },
      {
        id: 'name',
        accessorFn: (row) => row.name,
        header: ({column}) => (
          <DataGridColumnHeader
            title={t('PARTNERS.PAGE.TABLE.NAME')}
            column={column}
          />
        ),
        cell: (info) => <span>{info.row.original.name}</span>,
        enableSorting: true,
        sortingFn: 'text',
        size: 180,
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
        sortingFn: 'text',
        size: 150,
      },
      {
        id: 'createdAt',
        accessorFn: (row) => row.createdAt,
        header: ({column}) => (
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
        id: 'services',
        accessorFn: (row) => row.services?.length || 0,
        header: ({column}) => (
          <DataGridColumnHeader
            title={t('PARTNERS.PAGE.TABLE.SERVICES')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="text-center">
            {info.row.original.services?.length || 0}
          </span>
        ),
        enableSorting: true,
        sortingFn: 'basic',
        size: 120,
      },
      {
        id: 'status',
        accessorFn: (row) => row.status,
        header: ({column}) => (
          <DataGridColumnHeader title={t('COMMON.STATUS_1')} column={column}/>
        ),
        cell: (info) => <StatusBadge status={info.row.original.status}/>,
        enableSorting: true,
        sortingFn: 'text',
        size: 150,
      },
      {
        id: 'actions',
        header: () => (
          <span className="text-right block">{t('COMMON.ACTIONS')}</span>
        ),
        cell: (info) => {
          const partner = info.row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleView(partner)}
                aria-label="View"
              >
                <Eye className="h-4 w-4"/>
              </Button>
              <PermissionGuard
                requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(partner)}
                  aria-label="Edit"
                >
                  <Edit className="h-4 w-4"/>
                </Button>
              </PermissionGuard>
              {/*<PermissionGuard*/}
              {/*  requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}*/}
              {/*>*/}
              {/*  <Button*/}
              {/*    variant="ghost"*/}
              {/*    size="sm"*/}
              {/*    onClick={() => handleDeleteClick(partner)}*/}
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
    [handleView, handleEdit],
  );
  
  const table = useReactTable({
    columns,
    data: partnerList,
    pageCount: total > 0 ? Math.ceil(total / limit) : 0,
    getRowId: (row: Partner) => row.id.toString(),
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
            <PermissionGuard
              requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}
            >
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2"/>
                {t('PARTNERS.PAGE.ADD_BUTTON')}
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
            emptyMessage={t('PARTNERS.PAGE.TABLE.EMPTY')}
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
                <CardTitle>{t('PARTNERS.PAGE.TABLE.TITLE')}</CardTitle>
                <CardToolbar>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                      <Input
                        placeholder={t('COMMON.SEARCH_BY_CODE')}
                        value={localSearch.searchCode}
                        onChange={(e) =>
                          setLocalSearch({
                            ...localSearch,
                            searchCode: e.target.value,
                          })
                        }
                        className="pl-10"
                      />
                    </div>
                    
                    <div>
                      <Select
                        value={localSearch.status || ''}
                        onValueChange={(value) =>
                          setLocalSearch({
                            ...localSearch,
                            status: value === '' ? '' : value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('PARTNERS.PAGE.STATUS_PLACEHOLDER')}
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
      
      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => {
          if (!open && !deletePartnerMutation.isPending) {
            setDeleteOtp('');
            deleteDialog.close();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('PARTNERS.PAGE.DELETE.TITLE')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('PARTNERS.PAGE.DELETE.DESCRIPTION', {
                name: deleteDialog.partner?.code,
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
              disabled={deletePartnerMutation.isPending}
              maxLength={6}
            />
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePartnerMutation.isPending}>
              {t('COMMON.CANCEL')}
            </AlertDialogCancel>
            <Button
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm().then();
              }}
              disabled={deletePartnerMutation.isPending || !deleteOtp.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePartnerMutation.isPending ? (
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
