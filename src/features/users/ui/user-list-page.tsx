import {Fragment, useEffect, useMemo, useState} from 'react';
import {Customer, CustomerStatus, UserListParams,} from '@/features/users/api/userApi';
import {useDebounce} from '@/shared/hooks';
import {useTranslations} from '@/shared/hooks/use-translations';
import {formatDate} from '@/shared/lib/date-utils';
import {UserRole} from '@/shared/lib/rbac';
import {useUrlParams} from '@/shared/lib/url-params';
import {Alert, AlertIcon, AlertTitle} from '@/shared/ui/atoms/alert';
import {
  AlertDialog,
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
import {DataGridTable} from '@/shared/ui/atoms/data-grid-table';
import {Input} from '@/shared/ui/atoms/input';
import {Label} from '@/shared/ui/atoms/label';
import {Popover, PopoverContent, PopoverTrigger,} from '@/shared/ui/atoms/popover';
import {ScrollArea, ScrollBar} from '@/shared/ui/atoms/scroll-area';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/shared/ui/atoms/select';
import {Toolbar, ToolbarActions, ToolbarHeading, ToolbarPageTitle,} from '@/shared/ui/molecules/common/toolbar';
import {Container} from '@/shared/ui/molecules/container';
import {PermissionGuard} from '@/shared/ui/molecules/permission-guard';
import {StatusBadge} from '@/shared/ui/molecules/status-badge';
import {ColumnDef, getCoreRowModel, getSortedRowModel, SortingState, useReactTable,} from '@tanstack/react-table';
import {
  AlertCircle,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleDollarSign,
  Download,
  Eye,
  LoaderCircle,
  RecycleIcon,
  Search,
} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {toast} from 'sonner';
import {useExportUsers, useUpdateCustomerStatus, useUserList,} from '../hooks/use-user-queries';
import {AdjustPointDialog} from './adjust-point-dialog';

const ALL_STATUSES: CustomerStatus[] = ['ACTIVE', 'INACTIVE'];

export function UserListPage() {
  const navigate = useNavigate();
  const {t} = useTranslations();
  const {getParam, getNumberParam, updateParams} = useUrlParams({
    defaults: {pageSize: 20},
  });
  
  const pageSize = getNumberParam('pageSize', 20);
  
  // Local filter state — initialized from URL
  const [localSearch, setLocalSearch] = useState({
    id: getParam('id') || '',
    fullName: getParam('fullName') || '',
    cardNumber: getParam('cardNumber') || '',
    tierId: getParam('tierId') || '',
  });
  
  // Status change confirm dialog state
  const [statusConfirm, setStatusConfirm] = useState<{
    customer: Customer;
    targetStatus: CustomerStatus;
  } | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [statusPopoverCustomerId, setStatusPopoverCustomerId] = useState<
    string | null
  >(null);
  const [adjustPointCustomer, setAdjustPointCustomer] =
    useState<Customer | null>(null);
  
  const [sorting, setSorting] = useState<SortingState>([]);
  
  // Cursor state for pagination
  const [cursor, setCursor] = useState<{ next?: string | number; pre?: string | number }>({});
  
  const debouncedId = useDebounce(localSearch.id, 500);
  const debouncedFullName = useDebounce(localSearch.fullName, 500);
  const debouncedCardNumber = useDebounce(localSearch.cardNumber, 500);
  
  // const { data: tierListData } = useTierList();
  // const tierOptions = tierListData ?? [];
  
  const updateStatusMutation = useUpdateCustomerStatus();
  
  // Reset cursor when filters change
  useEffect(() => {
    setCursor({});
  }, [debouncedId, debouncedFullName, debouncedCardNumber, localSearch.tierId, pageSize]);
  
  // Sync filter changes to URL
  useEffect(() => {
    updateParams({
      id: debouncedId || null,
      fullName: debouncedFullName || null,
      cardNumber: debouncedCardNumber || null,
      tierId: localSearch.tierId || null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedId, debouncedFullName, debouncedCardNumber, localSearch.tierId]);
  
  const queryParams = useMemo<UserListParams>(
    () => ({
      pageSize,
      ...(debouncedId && {id: debouncedId}),
      ...(debouncedFullName && {fullName: debouncedFullName}),
      ...(debouncedCardNumber && {cardNumber: debouncedCardNumber}),
      ...(localSearch.tierId && {tierId: Number(localSearch.tierId)}),
      ...(cursor.next && {next: cursor.next}),
      ...(cursor.pre && {pre: cursor.pre}),
    }),
    [pageSize, debouncedId, debouncedFullName, debouncedCardNumber, localSearch.tierId, cursor],
  );
  
  const {
    data: userListData,
    isLoading,
    error: queryError,
  } = useUserList(queryParams);
  
  const customers = userListData?.data?.data || [];
  const metadata = userListData?.data?.metadata;
  const error = queryError?.message || null;
  
  const exportMutation = useExportUsers();
  
  const handleConfirmStatusChange = async () => {
    if (!statusConfirm) return;
    
    // Validate OTP
    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpError('OTP must be 6 digits');
      return;
    }
    
    setOtpError('');
    
    await updateStatusMutation.mutateAsync({
      params: {
        customerId: statusConfirm.customer.customerId,
        status: statusConfirm.targetStatus,
        otpCode: otpCode,
      },
    });
    setStatusConfirm(null);
    setOtpCode('');
  };
  
  const handlePageSizeChange = (value: string) => {
    updateParams({pageSize: parseInt(value, 10)});
    setCursor({});
    window.scrollTo({top: 0, behavior: 'smooth'});
  };
  
  const handlePrevious = () => {
    if (metadata?.hasPrePage && metadata?.pre !== undefined) {
      setCursor({pre: metadata.pre});
    }
    window.scrollTo({top: 0, behavior: 'smooth'});
  };
  
  const handleNext = () => {
    if (metadata?.hasNextPage && metadata?.next !== undefined) {
      setCursor({next: metadata.next});
    }
    window.scrollTo({top: 0, behavior: 'smooth'});
  };
  
  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        id: 'customerId',
        accessorFn: (row) => row.customerId,
        header: ({column}) => (
          <DataGridColumnHeader title={t('COMMON.USER_ID')} column={column}/>
        ),
        cell: (info) => (
          <span className="font-mono text-sm">
            {info.row.original.customerId}
          </span>
        ),
        enableSorting: true,
        size: 100,
      },
      {
        id: 'referenceId',
        accessorFn: (row) => row.referenceId,
        header: ({column}) => (
          <DataGridColumnHeader title={t('COMMON.PARTNER_ID')} column={column}/>
        ),
        cell: (info) => (
          <span className="font-mono text-sm">
            {info.row.original.referenceId}
          </span>
        ),
        enableSorting: true,
        size: 100,
      },
      {
        id: 'fullName',
        accessorFn: (row) => row.fullName,
        header: ({column}) => (
          <DataGridColumnHeader
            title={t('USERS.LIST.COLUMN_FULL_NAME')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="font-medium">{info.row.original.fullName}</span>
        ),
        enableSorting: true,
        size: 180,
      },
      {
        id: 'cardNumber',
        accessorFn: (row) => row.cardNumber,
        header: ({column}) => (
          <DataGridColumnHeader
            title={t('USERS.LIST.COLUMN_CARD_NUMBER')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="font-mono text-sm">
            {info.row.original.cardNumber || '-'}
          </span>
        ),
        enableSorting: false,
        size: 150,
      },
      {
        id: 'customerTier',
        accessorFn: (row) => row.customerTier,
        header: ({column}) => (
          <DataGridColumnHeader
            title={t('USERS.LIST.COLUMN_TIER')}
            column={column}
          />
        ),
        cell: (info) => <span>{info.row.original.customerTier || '-'}</span>,
        enableSorting: true,
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
        size: 110,
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
        cell: (info) => (
          <div className="text-sm flex flex-col">
            <span>{formatDate(info.row.original.createdAt, 'dd/MM/yyyy')}</span>
            <span>{formatDate(info.row.original.createdAt, 'HH:mm:ss')}</span>
          </div>
        ),
        enableSorting: true,
        sortingFn: 'datetime',
        size: 150,
      },
      {
        id: 'actions',
        header: () => (
          <span className="text-right block">{t('COMMON.ACTIONS')}</span>
        ),
        cell: (info) => {
          const customer = info.row.original;
          const isPopoverOpen = statusPopoverCustomerId === customer.customerId;
          return (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/users/${customer.customerId}`);
                }}
                aria-label="View"
              >
                <Eye className="h-4 w-4"/>
              </Button>
              <PermissionGuard requiredRoles={[UserRole.ADMIN]}>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Adjust point"
                  onClick={() => setAdjustPointCustomer(customer)}
                >
                  <CircleDollarSign className="h-4 w-4"/>
                </Button>
              </PermissionGuard>
              <PermissionGuard requiredRoles={[UserRole.ADMIN]}>
                <Popover
                  open={isPopoverOpen}
                  onOpenChange={(open) =>
                    setStatusPopoverCustomerId(
                      open ? customer.customerId : null,
                    )
                  }
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Change status"
                      disabled={updateStatusMutation.isPending}
                    >
                      <RecycleIcon className="h-4 w-4"/>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-36 p-1">
                    <div className="space-y-1">
                      {ALL_STATUSES.filter((s) => s !== customer.status).map(
                        (status) => (
                          <Button
                            key={status}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs"
                            onClick={() => {
                              setStatusConfirm({
                                customer,
                                targetStatus: status,
                              });
                              setStatusPopoverCustomerId(null);
                            }}
                          >
                            <StatusBadge status={status}/>
                          </Button>
                        ),
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </PermissionGuard>
            </div>
          );
        },
        enableSorting: false,
        size: 100,
      },
    ],
    [navigate, statusPopoverCustomerId, t, updateStatusMutation.isPending],
  );
  
  const table = useReactTable({
    columns,
    data: customers,
    getRowId: (row: Customer) => String(row.customerId),
    state: {sorting},
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
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
              <Button
                onClick={() => {
                  // TODO: Uncomment when backend API is ready
                  // exportMutation.mutate(queryParams);
                  
                  // Temporary toast notification
                  toast.warning('This feature will be available soon');
                }}
                disabled={exportMutation.isPending}
              >
                {exportMutation.isPending ? (
                  <>
                    <LoaderCircle className="h-4 w-4 mr-2 animate-spin"/>
                    {t('USERS.LIST.EXPORTING')}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2"/>
                    {t('USERS.LIST.EXPORT')}
                  </>
                )}
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
            recordCount={customers.length}
            isLoading={isLoading}
            loadingMode="skeleton"
            emptyMessage={t('USERS.LIST.EMPTY')}
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
              <CardHeader>
                <CardTitle>{t('USERS.LIST.TITLE')}</CardTitle>
                <CardToolbar className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                      <Input
                        placeholder={t('USERS.LIST.FILTER_ID')}
                        value={localSearch.id}
                        onChange={(e) =>
                          setLocalSearch({
                            ...localSearch,
                            id: e.target.value,
                          })
                        }
                        className="pl-10"
                      />
                    </div>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                      <Input
                        placeholder={t('USERS.LIST.FILTER_FULL_NAME')}
                        value={localSearch.fullName}
                        onChange={(e) =>
                          setLocalSearch({
                            ...localSearch,
                            fullName: e.target.value,
                          })
                        }
                        className="pl-10"
                      />
                    </div>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                      <Input
                        placeholder={t('USERS.LIST.FILTER_CARD_NUMBER')}
                        value={localSearch.cardNumber}
                        onChange={(e) =>
                          setLocalSearch({
                            ...localSearch,
                            cardNumber: e.target.value,
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
                  <DataGridTable/>
                  <ScrollBar orientation="horizontal"/>
                </ScrollArea>
              </CardTable>
              <CardFooter
                className="flex flex-col sm:flex-row justify-between items-center gap-2.5 pt-2.5 sm:pt-0 order-1 sm:order-2">
                <div className="text-sm text-muted-foreground text-nowrap order-2 sm:order-1">
                  {t('COMMON.SHOWING', {count: customers.length})}
                </div>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <Select
                    value={String(pageSize)}
                    onValueChange={handlePageSizeChange}
                  >
                    <SelectTrigger className="w-[100px]" clearable={false}>
                      <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">
                        {t('COMMON.PAGE_SIZE', {size: '10'})}
                      </SelectItem>
                      <SelectItem value="20">
                        {t('COMMON.PAGE_SIZE', {size: '20'})}
                      </SelectItem>
                      <SelectItem value="50">
                        {t('COMMON.PAGE_SIZE', {size: '50'})}
                      </SelectItem>
                      <SelectItem value="100">
                        {t('COMMON.PAGE_SIZE', {size: '100'})}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={!metadata?.hasPrePage || isLoading}
                  >
                    <ChevronLeftIcon className="h-4 w-4"/>
                    {t('COMMON.PREVIOUS')}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={!metadata?.hasNextPage || isLoading}
                  >
                    {t('COMMON.NEXT')}
                    <ChevronRightIcon className="h-4 w-4"/>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </DataGrid>
        </div>
      </Container>
      
      <AlertDialog
        open={!!statusConfirm}
        onOpenChange={(open) => {
          if (!open) {
            setStatusConfirm(null);
            setOtpCode('');
            setOtpError('');
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('USERS.LIST.CHANGE_STATUS_TITLE')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('USERS.LIST.CHANGE_STATUS_DESC', {
                name: statusConfirm?.customer.fullName,
                status: statusConfirm?.targetStatus,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status-otp-input">{t('COMMON.OTP_CODE')} *</Label>
              <Input
                id="status-otp-input"
                type="text"
                placeholder={t('COMMON.ENTER_6_DIGIT_OTP')}
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value);
                  setOtpError('');
                }}
                maxLength={6}
                disabled={updateStatusMutation.isPending}
              />
              {otpError && (
                <span className="text-xs text-destructive">{otpError}</span>
              )}
            </div>
          </div>
          
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStatusConfirm(null);
                setOtpCode('');
                setOtpError('');
              }}
              disabled={updateStatusMutation.isPending}
            >
              {t('COMMON.CANCEL')}
            </Button>
            <Button
              onClick={handleConfirmStatusChange}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <LoaderCircle className="h-4 w-4 animate-spin"/>
                  {t('USERS.LIST.CHANGE_STATUS_UPDATING')}
                </span>
              ) : (
                t('COMMON.CONFIRM')
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AdjustPointDialog
        customer={adjustPointCustomer}
        onClose={() => setAdjustPointCustomer(null)}
      />
    </Fragment>
  );
}
