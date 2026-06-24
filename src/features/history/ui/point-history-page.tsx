import {Fragment, useEffect, useMemo, useState} from 'react';
import {PointTransaction} from '@/features/history/api/pointHistoryApi';
import {useUserAllActivePartners, useUserPartnerDetail,} from '@/features/users/hooks/use-user-partner-queries';
import {useDebounce} from '@/shared/hooks/use-debounce';
import {useTranslations} from '@/shared/hooks/use-translations';
import {formatDate} from '@/shared/lib/date-utils';
import {useUrlParams} from '@/shared/lib/url-params';
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
import {Toolbar, ToolbarActions, ToolbarHeading, ToolbarPageTitle,} from '@/shared/ui/molecules/common/toolbar';
import {Container} from '@/shared/ui/molecules/container';
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {ChevronLeft, ChevronRight, Download, Search} from 'lucide-react';
import {DateRange} from 'react-day-picker';
import {toast} from 'sonner';
import {useExportPointHistory, usePointHistoryList} from '../hooks/use-point-history-queries';
import {UserRole} from "@/shared/lib/rbac";
import { PermissionGuard } from '@/shared/ui/molecules/permission-guard';

const DEFAULT_PAGE_SIZE = 20;

export function PointHistoryPage() {
  const {t} = useTranslations();
  const {getParam, getNumberParam, updateParams} = useUrlParams({
    defaults: {pageSize: DEFAULT_PAGE_SIZE},
  });
  
  const pageSize = getNumberParam('pageSize', DEFAULT_PAGE_SIZE);
  
  // Local filter state — initialized from URL
  const [localSearch, setLocalSearch] = useState({
    keyword: getParam('keyword') || '',
    partnerId: getParam('partnerId') || '',
    serviceCode: getParam('serviceCode') || '',
    entryDirection: getParam('entryDirection') || '',
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const from = getParam('from');
    const to = getParam('to');
    if (from && to) return {from: new Date(from), to: new Date(to)};
    return undefined;
  });
  
  // Cursor state for pagination
  const [cursor, setCursor] = useState<{ next?: string; pre?: string }>({});
  
  const debouncedKeyword = useDebounce(localSearch.keyword, 500);
  
  // Fetch partners and services
  const {data: partners = [], isLoading: isLoadingPartners} =
    useUserAllActivePartners();
  const {data: selectedPartner, isLoading: isLoadingPartnerDetail} =
    useUserPartnerDetail(localSearch.partnerId, {
      enabled: !!localSearch.partnerId,
    });
  
  const partnersWithServices = useMemo(
    () => partners.filter((partner) => partner.services?.length > 0),
    [partners],
  );
  
  const activeServices = useMemo(
    () => selectedPartner?.services.filter((s) => s.status === 'ACTIVE') || [],
    [selectedPartner],
  );
  
  // Reset serviceCode when partner changes
  useEffect(() => {
    if (localSearch.partnerId) {
      setLocalSearch((prev) => ({...prev, serviceCode: ''}));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch.partnerId]);
  
  // Reset cursor when filters change
  useEffect(() => {
    setCursor({});
  }, [
    debouncedKeyword,
    localSearch.partnerId,
    localSearch.serviceCode,
    localSearch.entryDirection,
    dateRange,
    pageSize,
  ]);
  
  // Sync filter changes to URL
  useEffect(() => {
    updateParams({
      keyword: debouncedKeyword || null,
      partnerId: localSearch.partnerId || null,
      serviceCode: localSearch.serviceCode || null,
      entryDirection: localSearch.entryDirection || null,
      from: dateRange?.from ? formatDate(dateRange.from, 'yyyy-MM-dd') : null,
      to: dateRange?.to ? formatDate(dateRange.to, 'yyyy-MM-dd') : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedKeyword,
    localSearch.partnerId,
    localSearch.serviceCode,
    localSearch.entryDirection,
    dateRange,
  ]);
  
  const queryParams = useMemo(
    () => ({
      keyword: debouncedKeyword || undefined,
      partnerId: localSearch.partnerId || undefined,
      serviceCode: localSearch.serviceCode || undefined,
      entryDirection: localSearch.entryDirection
        ? (localSearch.entryDirection as 'CREDIT' | 'DEBIT')
        : undefined,
      from: dateRange?.from ? formatDate(dateRange.from, 'yyyy-MM-dd') : undefined,
      to: dateRange?.to ? formatDate(dateRange.to, 'yyyy-MM-dd') : undefined,
      next: cursor.next,
      pre: cursor.pre,
      pageSize: pageSize,
    }),
    [
      debouncedKeyword,
      localSearch.partnerId,
      localSearch.serviceCode,
      localSearch.entryDirection,
      dateRange,
      cursor,
      pageSize,
    ],
  );
  
  const {
    data,
    isLoading,
    error: queryError,
  } = usePointHistoryList(queryParams);
  
  const entries = data?.data || [];
  const metadata = data?.metadata;
  const error = queryError?.message || null;
  
  const exportMutation = useExportPointHistory();
  
  const handleExport = () => {
    // TODO: Uncomment when backend API is ready
    // const exportParams = {
    //   keyword: debouncedKeyword || undefined,
    //   partnerId: localSearch.partnerId || undefined,
    //   serviceCode: localSearch.serviceCode || undefined,
    //   entryDirection: localSearch.entryDirection
    //     ? (localSearch.entryDirection as 'CREDIT' | 'DEBIT')
    //     : undefined,
    //   from: dateRange?.from ? formatDate(dateRange.from, 'yyyy-MM-dd') : undefined,
    //   to: dateRange?.to ? formatDate(dateRange.to, 'yyyy-MM-dd') : undefined,
    // };
    // exportMutation.mutate(exportParams);
    
    // Temporary toast notification
    toast.warning('This feature will be available soon');
  };
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize,
  });
  
  const handleClear = () => {
    setLocalSearch({
      keyword: '',
      partnerId: '',
      serviceCode: '',
      entryDirection: '',
    });
    setDateRange(undefined);
    setCursor({});
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
  
  const columns = useMemo<ColumnDef<PointTransaction>[]>(
    () => [
      {
        id: 'id',
        accessorFn: (row) => row.id,
        header: ({column}) => (
          <DataGridColumnHeader title={t('POINT_HISTORY.TRANSACTION_ID')} column={column}/>
        ),
        cell: (info) => (
          <span className="font-mono text-xs">{info.row.original.id}</span>
        ),
        enableSorting: false,
        size: 80,
      },
      {
        id: 'customerId',
        accessorFn: (row) => row.customerId,
        header: ({column}) => (
          <DataGridColumnHeader
            title={t('POINT_HISTORY.USER_ID')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="font-mono text-xs">
            {info.row.original.customerId}
          </span>
        ),
        enableSorting: false,
        size: 120,
      },
      {
        id: 'fullName',
        accessorFn: (row) => row.fullName,
        header: ({column}) => (
          <DataGridColumnHeader
            title={t('POINT_HISTORY.FULL_NAME')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="text-xs">{info.row.original.fullName}</span>
        ),
        enableSorting: false,
        size: 150,
      },
      {
        id: 'cardNumber',
        accessorFn: (row) => row.cardNumber,
        header: ({column}) => (
          <DataGridColumnHeader
            title={t('POINT_HISTORY.CARD_NUMBER')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="text-xs">{info.row.original.cardNumber}</span>
        ),
        enableSorting: false,
        size: 150,
      },
      {
        id: 'partnerId',
        accessorFn: (row) => row.partnerId,
        header: ({column}) => (
          <DataGridColumnHeader
            title={t('POINT_HISTORY.PARTNER_ID')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="font-mono text-xs">
            {info.row.original.partnerId}
          </span>
        ),
        enableSorting: false,
        size: 100,
      },
      {
        id: 'partnerName',
        accessorFn: (row) => row.partnerName,
        header: ({column}) => (
          <DataGridColumnHeader
            title={t('POINT_HISTORY.PARTNER_NAME')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="text-xs">{info.row.original.partnerName}</span>
        ),
        enableSorting: false,
        size: 130,
      },
      {
        id: 'serviceCode',
        accessorFn: (row) => row.serviceCode,
        header: ({column}) => (
          <DataGridColumnHeader
            title={t('POINT_HISTORY.SERVICE_TYPE')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="text-xs">{info.row.original.serviceCode}</span>
        ),
        enableSorting: false,
        size: 140,
      },
      {
        id: 'points',
        accessorFn: (row) => row.points,
        header: ({column}) => (
          <DataGridColumnHeader title={t('POINT_HISTORY.POINTS')} column={column}/>
        ),
        cell: (info) => {
          const dir = info.row.original.entryDirection;
          const pts = info.row.original.points;
          return (
            <span
              className={`font-semibold ${dir === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}
            >
              {dir === 'CREDIT' ? '+' : '-'}
              {pts?.toLocaleString()}
            </span>
          );
        },
        enableSorting: true,
        sortingFn: 'basic',
        size: 100,
      },
      {
        id: 'pointType',
        accessorFn: (row) => row.pointType,
        header: ({column}) => (
          <DataGridColumnHeader
            title={t('POINT_HISTORY.POINT_TYPE')}
            column={column}
          />
        ),
        cell: (info) => {
          const type = info.row.original.pointType;
          const variant =
            type === 'DIAMOND'
              ? 'primary'
              : type === 'GOLD'
                ? 'warning'
                : 'secondary';
          return <Badge variant={variant}>{type}</Badge>;
        },
        enableSorting: false,
        size: 100,
      },
      {
        id: 'occurred_at',
        accessorFn: (row) => row.occurred_at,
        header: ({column}) => (
          <DataGridColumnHeader
            title={t('POINT_HISTORY.DATE_TIME')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="text-xs">{info.row.original.occurred_at}</span>
        ),
        enableSorting: true,
        sortingFn: 'text',
        size: 140,
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
  
  const table = useReactTable({
    columns,
    data: entries,
    pageCount: -1, // unknown with cursor pagination
    getRowId: (row: PointTransaction) => String(row.id),
    state: {pagination, sorting},
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
                onClick={handleExport}
                disabled={exportMutation.isPending}
              >
                <Download className="h-4 w-4 mr-2"/>
                {exportMutation.isPending ? t('POINT_HISTORY.EXPORTING') : t('POINT_HISTORY.EXPORT')}
              </Button>
            </PermissionGuard>
          </ToolbarActions>
        </Toolbar>
      </Container>
      
      <Container>
        <div className="space-y-4">
          {error && (
            <div
              className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-4 py-3">
              {error}
            </div>
          )}
          
          <DataGrid
            table={table}
            recordCount={entries.length}
            isLoading={isLoading}
            loadingMode="skeleton"
            emptyMessage={t('POINT_HISTORY.EMPTY')}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
                    <div className="relative col-span-2">
                      <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                      <Input
                        placeholder={t('POINT_HISTORY.SEARCH_KEYWORD_PLACEHOLDER')}
                        value={localSearch.keyword}
                        onChange={(e) =>
                          setLocalSearch({
                            ...localSearch,
                            keyword: e.target.value,
                          })
                        }
                        className="pl-10"
                      />
                    </div>
                    
                    <div>
                      <Select
                        value={localSearch.partnerId || ''}
                        onValueChange={(value) => {
                          setLocalSearch({
                            ...localSearch,
                            partnerId: value,
                          });
                        }}
                        disabled={isLoadingPartners}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'POINT_HISTORY.FILTER_PARTNER_PLACEHOLDER',
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {partnersWithServices.map((partner) => (
                            <SelectItem key={partner.id} value={partner.id}>
                              {partner.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Select
                        value={localSearch.serviceCode || ''}
                        onValueChange={(value) => {
                          setLocalSearch({
                            ...localSearch,
                            serviceCode: value,
                          });
                        }}
                        disabled={
                          !localSearch.partnerId || isLoadingPartnerDetail
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'POINT_HISTORY.FILTER_SERVICE_PLACEHOLDER',
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {activeServices.map((service) => (
                            <SelectItem key={service.code} value={service.code}>
                              {service.name || service.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Select
                        value={localSearch.entryDirection || ''}
                        onValueChange={(value) => {
                          setLocalSearch({
                            ...localSearch,
                            entryDirection: value,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('POINT_HISTORY.FILTER_DIRECTION_PLACEHOLDER')}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CREDIT">
                            {t('POINT_HISTORY.DIRECTION_EARN')}
                          </SelectItem>
                          <SelectItem value="DEBIT">
                            {t('POINT_HISTORY.DIRECTION_BURN')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <DateRangePicker
                        start={dateRange?.from ?? null}
                        end={dateRange?.to ?? null}
                        onApply={(range) => setDateRange(range)}
                        clearable
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        onClick={handleClear}
                        className="whitespace-nowrap"
                      >
                        {t('COMMON.CLEAR_FILTERS')}
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
                  {t('POINT_HISTORY.SHOWING', {count: entries.length})}
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
      </Container>
    </Fragment>
  );
}

export default PointHistoryPage;
