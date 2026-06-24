import {Fragment, useEffect, useMemo, useState} from 'react';
import {useDebounce, useTranslations} from '@/shared/hooks';
import {formatNumber} from '@/shared/lib';
import {formatDate} from '@/shared/lib/date-utils';
import {useUrlParams} from '@/shared/lib/url-params';
import {Button} from '@/shared/ui/atoms/button';
import {Card, CardFooter, CardHeader, CardTable, CardTitle, CardToolbar,} from '@/shared/ui/atoms/card';
import {DataGrid} from '@/shared/ui/atoms/data-grid';
import {DataGridColumnHeader} from '@/shared/ui/atoms/data-grid-column-header';
import {DataGridTable} from '@/shared/ui/atoms/data-grid-table';
import DateRangePicker from '@/shared/ui/atoms/date-range-picker';
import {Input} from '@/shared/ui/atoms/input';
import {ScrollArea, ScrollBar} from '@/shared/ui/atoms/scroll-area';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/shared/ui/atoms/select';
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {ChevronLeft, ChevronRight, Download, Search,} from 'lucide-react';
import {DateRange} from 'react-day-picker';
import {CampaignTransaction} from '../api/campaignApi';
import {useCampaignTransactions, useExportCampaignTransactions} from '../hooks/use-campaign-queries';

const DEFAULT_PAGE_SIZE = 20;

interface CampaignHistoryTabProps {
  campaignId: string;
  totalTransaction?: number;
  totalPointAwarded?: number;
}

export function CampaignHistoryTab({campaignId, totalTransaction, totalPointAwarded}: CampaignHistoryTabProps) {
  const {t} = useTranslations();
  const {getParam, getNumberParam, updateParams} = useUrlParams({
    defaults: {limit: DEFAULT_PAGE_SIZE},
  });
  
  const limit = getNumberParam('limit', DEFAULT_PAGE_SIZE);
  
  // Local filter state — initialized from URL
  const [localSearch, setLocalSearch] = useState({
    transactionId: getParam('transactionId') || '',
    userId: getParam('userId') || '',
    referenceId: getParam('referenceId') || '',
    userName: getParam('userName') || '',
    cardNumber: getParam('cardNumber') || '',
  });
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const from = getParam('from');
    const to = getParam('to');
    if (from && to) return {from: new Date(from), to: new Date(to)};
    return undefined;
  });
  
  // Cursor state for pagination
  const [cursor, setCursor] = useState<{ next?: string | null; pre?: string | null }>({});
  
  const debouncedTransactionId = useDebounce(localSearch.transactionId, 500);
  const debouncedUserId = useDebounce(localSearch.userId, 500);
  const debouncedReferenceId = useDebounce(localSearch.referenceId, 500);
  const debouncedUserName = useDebounce(localSearch.userName, 500);
  const debouncedCardNumber = useDebounce(localSearch.cardNumber, 500);
  
  // Reset cursor when filters change
  useEffect(() => {
    setCursor({});
  }, [
    debouncedTransactionId,
    debouncedUserId,
    debouncedReferenceId,
    debouncedUserName,
    debouncedCardNumber,
    dateRange,
    limit,
  ]);
  
  // Sync filter changes to URL
  useEffect(() => {
    updateParams({
      transactionId: debouncedTransactionId || null,
      userId: debouncedUserId || null,
      referenceId: debouncedReferenceId || null,
      userName: debouncedUserName || null,
      cardNumber: debouncedCardNumber || null,
      from: dateRange?.from ? formatDate(dateRange.from, 'yyyy-MM-dd') : null,
      to: dateRange?.to ? formatDate(dateRange.to, 'yyyy-MM-dd') : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedTransactionId,
    debouncedUserId,
    debouncedReferenceId,
    debouncedUserName,
    debouncedCardNumber,
    dateRange,
  ]);
  
  const queryParams = useMemo(
    () => ({
      campaignId,
      transactionId: debouncedTransactionId || undefined,
      userId: debouncedUserId || undefined,
      referenceId: debouncedReferenceId || undefined,
      userName: debouncedUserName || undefined,
      cardNumber: debouncedCardNumber || undefined,
      gte: dateRange?.from ? formatDate(dateRange.from, 'yyyy-MM-dd') : undefined,
      lte: dateRange?.to ? formatDate(dateRange.to, 'yyyy-MM-dd') : undefined,
      next: cursor.next || undefined,
      pre: cursor.pre || undefined,
      limit: limit,
    }),
    [
      campaignId,
      debouncedTransactionId,
      debouncedUserId,
      debouncedReferenceId,
      debouncedUserName,
      debouncedCardNumber,
      dateRange,
      cursor,
      limit,
    ],
  );
  
  // Fetch campaign transactions
  const {
    data,
    isLoading,
    error: queryError,
  } = useCampaignTransactions(queryParams);
  
  const transactions = data?.data || [];
  const metadata = data?.metadata;
  const error = queryError?.message || null;
  
  // Export mutation
  const exportMutation = useExportCampaignTransactions();
  
  const handleExport = () => {
    const exportParams = {
      campaignId,
      ...(debouncedTransactionId && {transactionId: debouncedTransactionId}),
      ...(debouncedUserId && {userId: debouncedUserId}),
      ...(debouncedReferenceId && {referenceId: debouncedReferenceId}),
      ...(debouncedUserName && {userName: debouncedUserName}),
      ...(debouncedCardNumber && {cardNumber: debouncedCardNumber}),
      ...(dateRange?.from && {gte: formatDate(dateRange.from, 'yyyy-MM-dd')}),
      ...(dateRange?.to && {lte: formatDate(dateRange.to, 'yyyy-MM-dd')}),
    };
    
    exportMutation.mutate(exportParams);
  };
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: limit,
  });
  
  const handleClear = () => {
    setLocalSearch({
      transactionId: '',
      userId: '',
      referenceId: '',
      userName: '',
      cardNumber: '',
    });
    setDateRange(undefined);
    setCursor({});
  };
  
  const handlePageSizeChange = (value: string) => {
    updateParams({limit: parseInt(value, 10)});
    setCursor({});
    window.scrollTo({top: 0, behavior: 'smooth'});
  };
  
  const handlePrevious = () => {
    if (metadata?.hasPrePage && metadata?.pre !== undefined && metadata?.pre !== null) {
      setCursor({pre: metadata.pre});
    }
    window.scrollTo({top: 0, behavior: 'smooth'});
  };
  
  const handleNext = () => {
    if (metadata?.hasNextPage && metadata?.next !== undefined && metadata?.next !== null) {
      setCursor({next: metadata.next});
    }
    window.scrollTo({top: 0, behavior: 'smooth'});
  };
  
  // Define columns
  const columns = useMemo<ColumnDef<CampaignTransaction>[]>(
    () => [
      {
        id: 'transactionId',
        accessorFn: (row) => row.transactionId,
        header: ({column}) => (
          <DataGridColumnHeader
            title={t('CAMPAIGNS.HISTORY.TRANSACTION_ID')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="font-mono text-xs">
            {info.row.original.transactionId}
          </span>
        ),
        enableSorting: false,
        size: 100,
      },
      {
        id: 'userId',
        accessorFn: (row) => row.userId,
        header: ({column}) => (
          <DataGridColumnHeader title={t('COMMON.USER_ID')} column={column}/>
        ),
        cell: (info) => (
          <span className="font-mono text-xs">{info.row.original.userId}</span>
        ),
        enableSorting: false,
        size: 120,
      },
      {
        id: 'referenceId',
        accessorFn: (row) => row.referenceId,
        header: ({column}) => (
          <DataGridColumnHeader title={t('COMMON.PARTNER_ID')} column={column}/>
        ),
        cell: (info) => (
          <span className="font-mono text-xs">{info.row.original.referenceId}</span>
        ),
        enableSorting: false,
        size: 120,
      },
      {
        id: 'userName',
        accessorFn: (row) => row.userName,
        header: ({column}) => (
          <DataGridColumnHeader
            title={t('CAMPAIGNS.HISTORY.USER_NAME')}
            column={column}
          />
        ),
        cell: (info) => <span className="text-xs">{info.row.original.userName || '-'}</span>,
        enableSorting: false,
        size: 150,
      },
      {
        id: 'cardNumber',
        accessorFn: (row) => row.cardNumber,
        header: ({column}) => (
          <DataGridColumnHeader
            title={t('CAMPAIGNS.HISTORY.CARD_NUMBER')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="font-mono text-xs">
            {info.row.original.cardNumber || '-'}
          </span>
        ),
        enableSorting: false,
        size: 150,
      },
      {
        id: 'createdAt',
        accessorFn: (row) => row.createdAt,
        header: ({column}) => (
          <DataGridColumnHeader
            title={t('CAMPAIGNS.HISTORY.CREATED_AT')}
            column={column}
          />
        ),
        cell: (info) => (
          <div className="text-xs flex flex-col">
            <span>
              {formatDate(info.row.original.createdAt, 'dd/MM/yyyy')}
            </span>
            <span>{formatDate(info.row.original.createdAt, 'HH:mm:ss')}</span>
          </div>
        ),
        enableSorting: true,
        sortingFn: 'datetime',
        size: 140,
      },
      {
        id: 'points',
        accessorFn: (row) => row.points,
        header: ({column}) => (
          <DataGridColumnHeader title={t('COMMON.POINTS_AWARDED')} column={column}/>
        ),
        cell: (info) => {
          const points = info.row.original.points;
          return (
            <span
              className={`font-semibold ${points >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {points >= 0 ? '+' : ''}
              {formatNumber(points)}
            </span>
          );
        },
        enableSorting: true,
        sortingFn: 'basic',
        size: 100,
      },
      {
        id: 'note',
        accessorFn: (row) => row.note,
        header: ({column}) => (
          <DataGridColumnHeader
            title={t('COMMON.NOTE')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="font-mono text-xs">
            {info.row.original.note || '-'}
          </span>
        ),
        enableSorting: false,
        size: 150,
      },
    ],
    [t],
  );
  
  // Create table instance
  const table = useReactTable({
    columns,
    data: transactions,
    pageCount: -1, // unknown with cursor pagination
    getRowId: (row: CampaignTransaction) => row.transactionId,
    state: {
      pagination,
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });
  
  return (
    <Fragment>
      <div className="space-y-4">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-4 py-3">
            {error}
          </div>
        )}
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('CAMPAIGNS.HISTORY.TOTAL_TRANSACTIONS')}
              </CardTitle>
            </CardHeader>
            <div className="p-4">
              <div className="text-2xl font-bold text-blue-500">
                {formatNumber(totalTransaction || '---')}
              </div>
            </div>
          </Card>
          
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('CAMPAIGNS.HISTORY.TOTAL_POINTS_AWARDED')}
              </CardTitle>
            </CardHeader>
            <div className="p-4">
              <div className="text-2xl font-bold text-green-500">
                {formatNumber(totalPointAwarded || '---')}
              </div>
            </div>
          </Card>
        </div>
        
        <DataGrid
          table={table}
          recordCount={transactions.length}
          isLoading={isLoading}
          loadingMode="skeleton"
          emptyMessage={t('CAMPAIGNS.HISTORY.EMPTY')}
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
              <CardTitle>{t('CAMPAIGNS.HISTORY.TITLE')}</CardTitle>
              <CardToolbar>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                    <Input
                      placeholder={t(
                        'CAMPAIGNS.HISTORY.SEARCH_TRANSACTION_ID',
                      )}
                      value={localSearch.transactionId}
                      onChange={(e) =>
                        setLocalSearch({
                          ...localSearch,
                          transactionId: e.target.value,
                        })
                      }
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                    <Input
                      placeholder={t('CAMPAIGNS.HISTORY.SEARCH_USER_ID')}
                      value={localSearch.userId}
                      onChange={(e) =>
                        setLocalSearch({
                          ...localSearch,
                          userId: e.target.value,
                        })
                      }
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                    <Input
                      placeholder={t('CAMPAIGNS.HISTORY.SEARCH_PARTNER_ID')}
                      value={localSearch.referenceId}
                      onChange={(e) =>
                        setLocalSearch({
                          ...localSearch,
                          referenceId: e.target.value,
                        })
                      }
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                    <Input
                      placeholder={t('CAMPAIGNS.HISTORY.SEARCH_USER_NAME')}
                      value={localSearch.userName}
                      onChange={(e) =>
                        setLocalSearch({
                          ...localSearch,
                          userName: e.target.value,
                        })
                      }
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                    <Input
                      placeholder={t('CAMPAIGNS.HISTORY.SEARCH_CARD_NUMBER')}
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
                  
                  <div>
                    <DateRangePicker
                      start={dateRange?.from ?? null}
                      end={dateRange?.to ?? null}
                      onApply={(range) => setDateRange(range)}
                      clearable={true}
                    />
                  </div>
                  
                  <div className="flex justify-end col-span-1 sm:col-span-2 lg:col-span-6 gap-2">
                    <Button
                      variant="outline"
                      onClick={handleClear}
                      className="whitespace-nowrap"
                    >
                      {t('COMMON.CLEAR_FILTERS')}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleExport}
                      disabled={exportMutation.isPending || isLoading}
                      className="whitespace-nowrap"
                    >
                      <Download className="h-4 w-4 mr-2"/>
                      {exportMutation.isPending
                        ? t('CAMPAIGNS.HISTORY.EXPORTING')
                        : t('CAMPAIGNS.HISTORY.EXPORT_EXCEL')}
                    </Button>
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
                {t('CAMPAIGNS.HISTORY.SHOWING', {count: transactions.length})}
              </div>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <Select
                  value={String(limit)}
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
                  <ChevronLeft className="h-4 w-4"/>
                  {t('COMMON.PREVIOUS')}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={!metadata?.hasNextPage || isLoading}
                >
                  {t('COMMON.NEXT')}
                  <ChevronRight className="h-4 w-4"/>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </DataGrid>
      </div>
    </Fragment>
  );
}
