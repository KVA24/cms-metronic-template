import {Fragment, useEffect, useMemo, useState} from 'react';
import {RedemptionTransaction} from '@/features/redemption-transactions/api/redemptionTransactionApi';
import {useDebounce} from '@/shared/hooks';
import {useTranslations} from '@/shared/hooks/use-translations';
import {formatDate} from '@/shared/lib/date-utils';
import {useUrlParams} from '@/shared/lib/url-params';
import {Alert, AlertIcon, AlertTitle} from '@/shared/ui/atoms/alert';
import {Badge} from '@/shared/ui/atoms/badge';
import {Button} from '@/shared/ui/atoms/button';
import {Card, CardFooter, CardHeader, CardTable, CardTitle, CardToolbar,} from '@/shared/ui/atoms/card';
import {DataGrid} from '@/shared/ui/atoms/data-grid';
import {DataGridColumnHeader} from '@/shared/ui/atoms/data-grid-column-header';
import {DataGridTable} from '@/shared/ui/atoms/data-grid-table';
import DateRangePicker from '@/shared/ui/atoms/date-range-picker';
import {Input} from '@/shared/ui/atoms/input';
import {ScrollArea, ScrollBar} from '@/shared/ui/atoms/scroll-area';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/shared/ui/atoms/select';
import {Toolbar, ToolbarHeading, ToolbarPageTitle,} from '@/shared/ui/molecules/common/toolbar';
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
import {AlertCircle, ChevronLeft, ChevronRight, Download, Search} from 'lucide-react';
import {DateRange} from 'react-day-picker';
import {
  useExportRedemptionTransactions,
  useRedemptionTransactionList
} from '../hooks/use-redemption-transaction-queries';
import {useAllRewardCatalogs} from '@/features/redemption-package/hooks/use-redemption-package-queries';
import {UserRole} from "@/shared/lib/rbac";
import {PermissionGuard} from "@/shared/ui/molecules/permission-guard.tsx";

const DEFAULT_PAGE_SIZE = 20;

export function RedemptionTransactionPage() {
  const {t} = useTranslations();
  const {getParam, getNumberParam, updateParams} = useUrlParams({
    defaults: {pageSize: DEFAULT_PAGE_SIZE},
  });
  
  const pageSize = getNumberParam('pageSize', DEFAULT_PAGE_SIZE);
  
  // Local state for search filters — initialized from URL
  const [transactionId, setTransactionId] = useState(getParam('transactionId') || '');
  const [referenceId, setReferenceId] = useState(getParam('referenceId') || '');
  const [cardNumber, setCardNumber] = useState(getParam('cardNumber') || '');
  const [status, setStatus] = useState(getParam('status') || '');
  const [rewardCatalogId, setRewardCatalogId] = useState(getParam('rewardCatalogId') || '');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const fromDate = getParam('fromDate');
    const toDate = getParam('toDate');
    
    // If URL params exist, use them
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        return {from, to};
      }
    }
    
    // Default: three months ago to today
    const today = new Date();
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
    return {from: threeMonthsAgo, to: today};
  });
  
  // Fetch all reward catalogs for the select dropdown
  const {data: allRewardCatalogs = []} = useAllRewardCatalogs();
  
  // Cursor-based pagination
  const [cursor, setCursor] = useState<{ value?: string | number; direction?: 'NEXT' | 'PREV' }>({});
  
  const debouncedTransactionId = useDebounce(transactionId, 500);
  const debouncedReferenceId = useDebounce(referenceId, 500);
  const debouncedCardNumber = useDebounce(cardNumber, 500);
  const debouncedRewardCatalogId = useDebounce(rewardCatalogId, 500);
  
  // Reset cursor when filters change
  useEffect(() => {
    setCursor({});
  }, [debouncedTransactionId, debouncedReferenceId, debouncedCardNumber, debouncedRewardCatalogId, status, dateRange, pageSize]);
  
  // Sync filters to URL
  useEffect(() => {
    updateParams({
      transactionId: debouncedTransactionId || null,
      referenceId: debouncedReferenceId || null,
      cardNumber: debouncedCardNumber || null,
      rewardCatalogId: debouncedRewardCatalogId || null,
      status: status || null,
      fromDate: dateRange?.from ? formatDate(dateRange.from, 'yyyy-MM-dd') : null,
      toDate: dateRange?.to ? formatDate(dateRange.to, 'yyyy-MM-dd') : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTransactionId, debouncedReferenceId, debouncedCardNumber, debouncedRewardCatalogId, status, dateRange]);
  
  const queryParams = useMemo(
    () => ({
      transactionId: debouncedTransactionId || undefined,
      referenceId: debouncedReferenceId || undefined,
      cardNumber: debouncedCardNumber || undefined,
      rewardCatalogId: debouncedRewardCatalogId ? String(debouncedRewardCatalogId) : undefined,
      status: status || undefined,
      fromDate: dateRange?.from ? formatDate(dateRange.from, "yyyy-MM-dd") : undefined,
      toDate: dateRange?.to ? formatDate(dateRange.to, "yyyy-MM-dd") : undefined,
      cursor: cursor.value,
      direction: cursor.direction,
      pageSize,
    }),
    [debouncedTransactionId, debouncedReferenceId, debouncedCardNumber, debouncedRewardCatalogId, status, dateRange, cursor, pageSize],
  );
  
  const {
    data,
    isLoading,
    error: queryError,
  } = useRedemptionTransactionList(queryParams);
  
  const exportMutation = useExportRedemptionTransactions();
  
  const transactions = data?.data || [];
  const metadata = data?.metadata;
  const error = queryError?.message || null;
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize,
  });
  
  const handleClear = () => {
    setTransactionId('');
    setReferenceId('');
    setCardNumber('');
    setStatus('');
    setRewardCatalogId('');
    setCursor({});
  };
  
  const handlePageSizeChange = (value: string) => {
    updateParams({pageSize: parseInt(value, 10)});
    setCursor({});
  };
  
  const handlePrevious = () => {
    if (metadata && metadata.hasPrevPage && metadata.prev !== undefined) {
      setCursor({value: metadata.prev, direction: 'PREV'});
    }
  };
  
  const handleNext = () => {
    if (metadata && metadata.hasNextPage && metadata.next !== undefined) {
      setCursor({value: metadata.next, direction: 'NEXT'});
    }
  };
  
  const handleExport = () => {
    exportMutation.mutate({
      transactionId: debouncedTransactionId || undefined,
      referenceId: debouncedReferenceId || undefined,
      cardNumber: debouncedCardNumber || undefined,
      rewardCatalogId: debouncedRewardCatalogId ? String(debouncedRewardCatalogId) : undefined,
      status: status || undefined,
      fromDate: dateRange?.from ? formatDate(dateRange.from, "yyyy-MM-dd") : undefined,
      toDate: dateRange?.to ? formatDate(dateRange.to, "yyyy-MM-dd") : undefined,
    });
  };
  
  const columns = useMemo<ColumnDef<RedemptionTransaction>[]>(
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
        enableSorting: false,
        size: 100,
      },
      {
        id: 'referenceId',
        accessorFn: (row) => row.referenceId,
        header: ({column}) => (
          <DataGridColumnHeader
            title="Partner ID"
            column={column}
          />
        ),
        cell: (info) => {
          const row = info.row.original;
          return (
            <span className="font-mono text-xs">{row.referenceId || '-'}</span>
          );
        },
        enableSorting: false,
        size: 120,
      },
      {
        id: 'cardNumber',
        accessorFn: (row) => row.cardNumber,
        header: ({column}) => (
          <DataGridColumnHeader
            title="Card Number"
            column={column}
          />
        ),
        cell: (info) => {
          const row = info.row.original;
          return (
            <span className="font-mono text-xs">{row.cardNumber || '-'}</span>
          );
        },
        enableSorting: false,
        size: 140,
      },
      {
        id: 'rewardInfo',
        header: ({column}) => (
          <DataGridColumnHeader
            title={t('REDEMPTION_TRANSACTION.PAGE.TABLE.REWARD')}
            column={column}
          />
        ),
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex flex-col">
              <span className="text-xs font-medium">{row.rewardCatalogName}</span>
            </div>
          );
        },
        enableSorting: false,
        size: 200,
      },
      {
        id: 'pointCost',
        accessorFn: (row) => row.pointCostSnapshot,
        header: ({column}) => (
          <DataGridColumnHeader
            title={t('REDEMPTION_TRANSACTION.PAGE.TABLE.POINT_COST')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="font-semibold text-primary text-xs">
            {info.row.original.pointCostSnapshot}
          </span>
        ),
        enableSorting: false,
        size: 100,
      },
      {
        id: 'status',
        accessorFn: (row) => row.status,
        header: ({column}) => (
          <DataGridColumnHeader title={t('COMMON.STATUS_1')} column={column}/>
        ),
        cell: (info) => {
          const s = info.row.original.status;
          const variant =
            s === 'SUCCESS'
              ? 'success'
              : s === 'PENDING'
                ? 'warning'
                : s === 'FAILED'
                  ? 'destructive'
                  : 'primary';
          return (
            <Badge variant={variant as 'success' | 'warning' | 'destructive' | 'secondary'}>
              {s}
            </Badge>
          );
        },
        enableSorting: false,
        size: 120,
      },
      {
        id: 'createdAt',
        accessorFn: (row) => row.createdAt,
        header: ({column}) => (
          <DataGridColumnHeader title={t('COMMON.CREATED_AT')} column={column}/>
        ),
        cell: (info) => (
          <span className="text-xs">
            {formatDate(new Date(info.row.original.createdAt), 'dd/MM/yyyy HH:mm:ss')}
          </span>
        ),
        enableSorting: false,
        size: 160,
      },
    ],
    [t],
  );
  
  const table = useReactTable({
    columns,
    data: transactions,
    pageCount: -1,
    getRowId: (row: RedemptionTransaction) => row.id.toString(),
    state: {pagination, sorting},
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
            <ToolbarPageTitle/>
          </ToolbarHeading>
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
            recordCount={transactions.length}
            isLoading={isLoading}
            loadingMode="skeleton"
            emptyMessage={t('REDEMPTION_TRANSACTION.PAGE.TABLE.EMPTY')}
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
                <CardTitle></CardTitle>
                <CardToolbar>
                  <div className="space-y-4">
                    {/* First row: Search filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      {/* Keyword search (TransID) */}
                      <div className="relative col-span-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                        <Input
                          placeholder="Search by TransID"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      {/* Partner ID search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                        <Input
                          placeholder="Search by Partner ID"
                          value={referenceId}
                          onChange={(e) => setReferenceId(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      {/* Card Number search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                        <Input
                          placeholder="Search by Card Number"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      {/* Reward Catalog ID */}
                      <Select
                        value={rewardCatalogId || ""}
                        onValueChange={setRewardCatalogId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('REDEMPTION_TRANSACTION.PAGE.SEARCH_REWARD_CATALOG_ID')}/>
                        </SelectTrigger>
                        <SelectContent>
                          {allRewardCatalogs.map((catalog) => (
                            <SelectItem key={catalog.id} value={String(catalog.id)}>
                              {catalog.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Second row: Status, Date range, and buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      {/* Status select */}
                      <Select value={status || ""} onValueChange={setStatus}>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('REDEMPTION_TRANSACTION.PAGE.STATUS_ALL')}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">
                            {t('REDEMPTION_TRANSACTION.PAGE.STATUS_PENDING')}
                          </SelectItem>
                          <SelectItem value="SUCCESS">
                            {t('REDEMPTION_TRANSACTION.PAGE.STATUS_SUCCESS')}
                          </SelectItem>
                          <SelectItem value="FAILED">
                            {t('REDEMPTION_TRANSACTION.PAGE.STATUS_FAILED')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {/* Date range picker */}
                      <div className="col-span-2">
                        <DateRangePicker
                          start={dateRange?.from ?? null}
                          end={dateRange?.to ?? null}
                          onApply={(range) => setDateRange(range)}
                          clearable={false}
                          maxMonths={3}
                        />
                      </div>
                      
                      {/* Spacer */}
                      
                      {/* Clear filters and Export buttons */}
                      <div className="flex gap-2 justify-end lg:col-span-2">
                        <Button
                          variant="outline"
                          onClick={handleClear}
                          className="whitespace-nowrap"
                        >
                          {t('COMMON.CLEAR_FILTERS')}
                        </Button>
                        <PermissionGuard requiredRoles={[UserRole.ADMIN]}>
                          <Button
                            variant="outline"
                            onClick={handleExport}
                            disabled={exportMutation.isPending || transactions.length === 0}
                            className="whitespace-nowrap"
                          >
                            <Download className="h-4 w-4 mr-2"/>
                            Export
                          </Button>
                        </PermissionGuard>
                      </div>
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
                  {t('GAME_TRANSACTIONS.SHOWING', {count: transactions.length})}
                </div>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="w-25" clearable={false}>
                      <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">
                        {t('COMMON.PAGE_SIZE', {size: '5'})}
                      </SelectItem>
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
                    disabled={!metadata || !metadata.hasPrevPage || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4"/>
                    {t('COMMON.PREVIOUS')}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={!metadata || !metadata.hasNextPage || isLoading}
                  >
                    {t('COMMON.NEXT')}
                    <ChevronRight className="h-4 w-4"/>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </DataGrid>
        </div>
      </Container>
    </Fragment>
  );
}
