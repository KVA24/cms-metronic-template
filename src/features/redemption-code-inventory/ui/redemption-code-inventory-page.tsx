import {Fragment, useEffect, useMemo, useRef, useState} from 'react';
import {
  useImportRewardCodes,
  useRedemptionPackageDetail,
  useRewardCodeInventory,
} from '@/features/redemption-package/hooks/use-redemption-package-queries';
import {useTranslations} from '@/shared/hooks/use-translations';
import {useBreadcrumb} from '@/shared/contexts/breadcrumb-context';
import {usePaginationParams} from '@/shared/lib/url-params';
import {Alert, AlertIcon, AlertTitle} from '@/shared/ui/atoms/alert';
import {Badge} from '@/shared/ui/atoms/badge';
import {Button} from '@/shared/ui/atoms/button';
import {Card, CardFooter, CardHeader, CardTable, CardTitle, CardToolbar,} from '@/shared/ui/atoms/card';
import {DataGrid} from '@/shared/ui/atoms/data-grid';
import {DataGridColumnHeader} from '@/shared/ui/atoms/data-grid-column-header';
import {DataGridPagination} from '@/shared/ui/atoms/data-grid-pagination';
import {DataGridTable} from '@/shared/ui/atoms/data-grid-table';
import {Input} from '@/shared/ui/atoms/input';
import {ScrollArea, ScrollBar} from '@/shared/ui/atoms/scroll-area';
import {Toolbar, ToolbarActions, ToolbarHeading,} from '@/shared/ui/molecules/common/toolbar';
import {Container} from '@/shared/ui/molecules/container';
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
import {AlertCircle, ArrowLeft, LoaderCircleIcon, Upload} from 'lucide-react';
import {useNavigate, useParams} from 'react-router-dom';
import {toast} from 'sonner';
import {formatDate} from "@/shared/lib/date-utils";
import {UserRole} from "@/shared/lib/rbac";
import {PermissionGuard} from "@/shared/ui/molecules/permission-guard.tsx";

interface RedemptionCodeInventory {
  id: number;
  codeValue: string;
  status: string;
  userId: number;
  createdAt: string;
  expiredAt: string
}

export function RedemptionCodeInventoryPage() {
  const {t} = useTranslations();
  const navigate = useNavigate();
  const {id} = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {setCustomBreadcrumb} = useBreadcrumb();
  
  // URL params management
  const {page, limit, setPage, setLimit} = usePaginationParams();
  
  // Fetch package detail for breadcrumb
  const {data: packageDetail} = useRedemptionPackageDetail(id || '', {enabled: !!id});
  
  // Set breadcrumb with package name
  useEffect(() => {
    setCustomBreadcrumb([
      {title: t('SIDEBAR.REDEMPTION_PACKAGE'), path: '/redemption-packages'},
      {title: packageDetail?.name || t('REDEMPTION_CODE_INVENTORY.PAGE.TITLE')},
    ]);
    return () => setCustomBreadcrumb(null);
  }, [packageDetail, setCustomBreadcrumb, t]);
  
  // Memoize query params to prevent unnecessary refetches
  const queryParams = useMemo(
    () => ({
      page,
      size: limit,
    }),
    [page, limit],
  );
  
  // React Query - Fetch inventory list
  const {
    data: inventoryListData,
    isLoading,
    error: queryError,
  } = useRewardCodeInventory(id!, queryParams, {enabled: !!id});
  
  const inventoryCodes = inventoryListData?.content || [];
  const total = inventoryListData?.totalElements || 0;
  const error = queryError?.message || null;
  
  // Import mutation
  const importMutation = useImportRewardCodes();
  
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
  
  const handleBack = () => {
    navigate('/redemption-packages');
  };
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      toast.error('Please select a CSV or Excel file');
      // Reset file input to allow selecting the same file again
      event.target.value = '';
      return;
    }
    
    try {
      await importMutation.mutateAsync({
        rewardCatalogId: id!,
        file,
      });
    } catch (error) {
      // Error handled by mutation
    } finally {
      // Reset file input to allow selecting the same file again
      event.target.value = '';
    }
  };
  
  // Define columns for DataGrid
  const columns = useMemo<ColumnDef<RedemptionCodeInventory>[]>(
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
        id: 'codeValue',
        accessorFn: (row) => row.codeValue,
        header: ({column}) => (
          <DataGridColumnHeader
            title={t('REDEMPTION_CODE_INVENTORY.PAGE.TABLE.CODE_VALUE')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="font-mono font-medium">{info.row.original.codeValue}</span>
        ),
        enableSorting: true,
        sortingFn: 'text',
        size: 200,
      },
      {
        id: 'status',
        accessorFn: (row) => row.status,
        header: ({column}) => (
          <DataGridColumnHeader title={t('COMMON.STATUS_1')} column={column}/>
        ),
        cell: (info) => {
          const status = info.row.original.status;
          return (
            <Badge
              variant={
                status === 'AVAILABLE'
                  ? 'success'
                  : status === 'USED'
                    ? 'secondary'
                    : 'primary'
              }
            >
              {status}
            </Badge>
          );
        },
        enableSorting: true,
        sortingFn: 'text',
        size: 120,
      },
      {
        id: 'userId',
        accessorFn: (row) => row.userId,
        header: ({column}) => (
          <DataGridColumnHeader
            title={t('REDEMPTION_CODE_INVENTORY.PAGE.TABLE.USER_ID')}
            column={column}
          />
        ),
        cell: (info) => {
          const userId = info.row.original.userId;
          return userId ? (
            <span className="font-mono text-xs">{userId}</span>
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
        enableSorting: true,
        sortingFn: 'alphanumeric',
        size: 120,
      },
      {
        id: 'createdAt',
        accessorFn: (row) => row.createdAt,
        header: ({column}) => (
          <DataGridColumnHeader
            title={t('COMMON.CREATED_AT')}
            column={column}
          />
        ),
        cell: (info) => {
          const date = new Date(info.row.original.createdAt);
          return (
            <span className="text-sm">
              {formatDate(date, "dd/MM/yyyy HH:mm:ss")}
            </span>
          );
        },
        enableSorting: true,
        sortingFn: 'datetime',
        size: 180,
      },
      {
        id: 'expiredAt',
        accessorFn: (row) => row.expiredAt,
        header: ({column}) => (
          <DataGridColumnHeader
            title={t('COMMON.EXPIRED_AT')}
            column={column}
          />
        ),
        cell: (info) => {
          const date = new Date(info.row.original.expiredAt);
          return (
            <span className="text-sm">
              {formatDate(date, "dd/MM/yyyy HH:mm:ss")}
            </span>
          );
        },
        enableSorting: true,
        sortingFn: 'datetime',
        size: 180,
      },
    ],
    [t],
  );
  
  // Create table instance
  const table = useReactTable({
    columns,
    data: inventoryCodes,
    pageCount: total > 0 ? Math.ceil(total / limit) : 0,
    getRowId: (row: RedemptionCodeInventory) => row.id.toString(),
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
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2"/>
              {t('COMMON.BACK')}
            </Button>
          </ToolbarHeading>
          <ToolbarActions>
            <PermissionGuard requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}>
              <Button
                onClick={handleImportClick}
                disabled={importMutation.isPending}
              >
                {importMutation.isPending ? (
                  <>
                    <LoaderCircleIcon className="h-4 w-4 mr-2 animate-spin"/>
                    {t('REDEMPTION_CODE_INVENTORY.PAGE.IMPORTING')}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2"/>
                    {t('REDEMPTION_CODE_INVENTORY.PAGE.IMPORT_BUTTON')}
                  </>
                )}
              </Button>
            </PermissionGuard>
            <PermissionGuard requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileChange}
                className="hidden"
              />
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
            emptyMessage={t('REDEMPTION_CODE_INVENTORY.PAGE.TABLE.EMPTY')}
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
                <CardTitle>{t('REDEMPTION_CODE_INVENTORY.PAGE.TABLE.TITLE')}</CardTitle>
                <CardToolbar>
                  <div className="text-sm text-muted-foreground">
                    {t('REDEMPTION_CODE_INVENTORY.PAGE.TABLE.DESCRIPTION')}
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
    </Fragment>
  );
}
