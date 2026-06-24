import { Fragment, useEffect, useMemo, useState } from 'react';
import { activityLogKeys } from '@/features/activity-log/hooks/use-activity-log-queries';
import { useDebounce, useTranslations } from '@/shared/hooks';
import { formatDate } from '@/shared/lib/date-utils';
import { useUrlParams } from '@/shared/lib/url-params';
import { Alert, AlertIcon, AlertTitle } from '@/shared/ui/atoms/alert';
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
import { DataGridTable } from '@/shared/ui/atoms/data-grid-table';
import DateRangePicker from '@/shared/ui/atoms/date-range-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/atoms/dialog';
import { Input } from '@/shared/ui/atoms/input';
import { ScrollArea, ScrollBar } from '@/shared/ui/atoms/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/atoms/select';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/shared/ui/molecules/common/toolbar';
import { Container } from '@/shared/ui/molecules/container';
import { useQueryClient } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  AlertCircle,
  ChevronLeftIcon,
  ChevronRightIcon,
  Eye,
  Search,
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import {
  ActionLog,
  activityLogApi,
  ActivityLogListParams,
} from '../api/activityLogApi';
import { useActivityLogList } from '../hooks/use-activity-log-queries';

export function ActivityLogPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslations();
  // URL params management
  const { getParam, getNumberParam, updateParams } = useUrlParams({
    defaults: { limit: 10 },
  });

  const limit = getNumberParam('limit', 10);

  // Local state for filters
  const [localFilters, setLocalFilters] = useState({
    username: getParam('username') || '',
    accountRole: getParam('accountRole') || '',
    actionType: getParam('actionType') || '',
  });

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const fromParam = getParam('dateFrom');
    const toParam = getParam('dateTo');
    if (fromParam && toParam) {
      return {
        from: new Date(fromParam),
        to: new Date(toParam),
      };
    }
    return undefined;
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedLog, setSelectedLog] = useState<ActionLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Cursor state for pagination - track history of cursors
  const [cursorHistory, setCursorHistory] = useState<number[]>([]);
  const [currentCursor, setCurrentCursor] = useState<number | undefined>(
    undefined,
  );
  const [direction, setDirection] = useState<'next' | 'pre' | undefined>(
    undefined,
  );

  const debouncedUsername = useDebounce(localFilters.username, 500);

  // Memoize query params to prevent unnecessary refetches
  const queryParams = useMemo<ActivityLogListParams>(() => {
    const params: ActivityLogListParams = { limit };

    if (debouncedUsername) params.username = debouncedUsername;
    if (localFilters.accountRole) params.accountRole = localFilters.accountRole;
    if (localFilters.actionType) params.actionType = localFilters.actionType;

    // Only add date filters if both from and to are selected
    if (dateRange?.from && dateRange?.to) {
      params.gte = formatDate(dateRange.from, 'yyyy-MM-dd');
      params.lte = formatDate(dateRange.to, 'yyyy-MM-dd');
    }

    // Add cursor for pagination
    if (currentCursor && direction === 'next') {
      params.next = currentCursor;
    } else if (currentCursor && direction === 'pre') {
      params.pre = currentCursor;
    }

    return params;
  }, [
    limit,
    debouncedUsername,
    localFilters.accountRole,
    localFilters.actionType,
    dateRange,
    currentCursor,
    direction,
  ]);

  // React Query - Fetch activity logs
  const {
    data: activityLogData,
    isLoading,
    error: queryError,
  } = useActivityLogList(queryParams);

  // Update URL params when filters change
  useEffect(() => {
    updateParams({
      username: debouncedUsername || null,
      accountRole: localFilters.accountRole || null,
      actionType: localFilters.actionType || null,
      dateFrom: dateRange?.from
        ? formatDate(dateRange.from, 'yyyy-MM-dd')
        : null,
      dateTo: dateRange?.to ? formatDate(dateRange.to, 'yyyy-MM-dd') : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedUsername,
    localFilters.accountRole,
    localFilters.actionType,
    dateRange,
  ]);

  // Preload next page data
  useEffect(() => {
    if (!activityLogData?.metadata) return;

    const metadata = activityLogData.metadata;

    // Preload next page if available
    if (metadata.hasNextPage && metadata.next) {
      const nextParams: ActivityLogListParams = {
        ...queryParams,
        next: metadata.next,
        pre: undefined,
      };
      queryClient.prefetchQuery({
        queryKey: activityLogKeys.list(nextParams),
        queryFn: () => activityLogApi.getList(nextParams),
      });
    }
  }, [activityLogData?.metadata, queryParams, queryClient]);

  // Reset cursors when filters change
  useEffect(() => {
    setCursorHistory([]);
    setCurrentCursor(undefined);
    setDirection(undefined);
  }, [
    debouncedUsername,
    localFilters.accountRole,
    localFilters.actionType,
    dateRange,
    limit,
  ]);

  const logs = activityLogData?.data || [];
  const metadata = activityLogData?.metadata || {
    next: null,
    pre: null,
    hasNextPage: false,
    hasPrePage: false,
    pageSize: 10,
  };
  const error = queryError?.message || null;

  const handleClearFilters = () => {
    setLocalFilters({
      username: '',
      accountRole: '',
      actionType: '',
    });
    setDateRange(undefined);
    updateParams({
      username: null,
      accountRole: null,
      actionType: null,
      dateFrom: null,
      dateTo: null,
    });
    setCursorHistory([]);
    setCurrentCursor(undefined);
    setDirection(undefined);
  };

  const handleRowClick = (log: ActionLog) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  const handlePrevious = () => {
    if (metadata.hasPrePage && cursorHistory.length > 0) {
      const newHistory = [...cursorHistory];
      const previousCursor = newHistory.pop();
      setCursorHistory(newHistory);
      setCurrentCursor(previousCursor);
      setDirection(previousCursor ? 'next' : undefined);
    }
  };

  const handleNext = () => {
    if (metadata.next && metadata.hasNextPage) {
      if (currentCursor !== undefined || cursorHistory.length === 0) {
        setCursorHistory([...cursorHistory, currentCursor ?? 0]);
      }
      setCurrentCursor(metadata.next);
      setDirection('next');
    }
  };

  const handlePageSizeChange = (value: string) => {
    updateParams({ limit: parseInt(value, 10) });
    setCursorHistory([]);
    setCurrentCursor(undefined);
    setDirection(undefined);
  };

  const getActionTypeVariant = (actionType: string) => {
    switch (actionType) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'warning';
      case 'DELETE':
        return 'destructive';
      case 'ADD':
        return 'success';
      case 'SUBTRACT':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive';
      case 'USER':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  // Define columns
  const columns = useMemo<ColumnDef<ActionLog>[]>(
    () => [
      {
        id: 'username',
        accessorFn: (row) => row.username,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.USERNAME')} column={column} />
        ),
        cell: (info) => (
          <span className="font-medium">{info.row.original.username}</span>
        ),
        enableSorting: true,
        sortingFn: 'text',
      },
      {
        id: 'accountRole',
        accessorFn: (row) => row.accountRole,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.ROLE')} column={column} />
        ),
        cell: (info) => {
          const role = info.row.original.accountRole;
          return <Badge variant={getRoleVariant(role)}>{role}</Badge>;
        },
        enableSorting: true,
        sortingFn: 'text',
      },
      {
        id: 'actionType',
        accessorFn: (row) => row.actionType,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('ACTIVITY_LOG.PAGE.TABLE.ACTION')}
            column={column}
          />
        ),
        cell: (info) => {
          const actionType = info.row.original.actionType;
          return (
            <Badge variant={getActionTypeVariant(actionType)}>
              {actionType}
            </Badge>
          );
        },
        enableSorting: true,
        sortingFn: 'text',
      },
      {
        id: 'module',
        accessorFn: (row) => row.module,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('ACTIVITY_LOG.PAGE.TABLE.MODULE')}
            column={column}
          />
        ),
        cell: (info) => <span>{info.row.original.module}</span>,
        enableSorting: true,
        sortingFn: 'text',
      },
      {
        id: 'detail',
        accessorFn: (row) => row.detail,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('ACTIVITY_LOG.DETAIL.DETAIL')}
            column={column}
          />
        ),
        cell: (info) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(info.row.original);
            }}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
        ),
        enableSorting: false,
      },
      // {
      //   id: 'ipClient',
      //   accessorFn: (row) => row.ipClient,
      //   header: ({ column }) => (
      //     <DataGridColumnHeader
      //       title={t('ACTIVITY_LOG.PAGE.TABLE.IP_ADDRESS')}
      //       column={column}
      //     />
      //   ),
      //   cell: (info) => (
      //     <span className="font-mono text-sm">
      //       {info.row.original.ipClient}
      //     </span>
      //   ),
      //   enableSorting: false,
      // },
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
    ],

    [],
  );

  // Create table instance
  const table = useReactTable({
    columns,
    data: logs,
    getRowId: (row: ActionLog) => String(row.id),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    meta: {
      onRowClick: handleRowClick,
    },
  });

  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle />
          </ToolbarHeading>
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
            recordCount={logs.length}
            isLoading={isLoading}
            loadingMode="skeleton"
            emptyMessage={t('ACTIVITY_LOG.PAGE.TABLE.EMPTY')}
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
              <CardHeader className="py-4">
                <CardTitle>{t('ACTIVITY_LOG.PAGE.TABLE.TITLE')}</CardTitle>
                <CardToolbar className="py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={t(
                            'ACTIVITY_LOG.PAGE.SEARCH_PLACEHOLDER',
                          )}
                          value={localFilters.username}
                          onChange={(e) =>
                            setLocalFilters({
                              ...localFilters,
                              username: e.target.value,
                            })
                          }
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <Select
                        value={localFilters.accountRole || ''}
                        onValueChange={(value) => {
                          setLocalFilters({
                            ...localFilters,
                            accountRole: value,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'ACTIVITY_LOG.PAGE.ROLE_PLACEHOLDER',
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">
                            {t('ACTIVITY_LOG.ROLES.ADMIN')}
                          </SelectItem>
                          <SelectItem value="USER">
                            {t('ACTIVITY_LOG.ROLES.USER')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Select
                        value={localFilters.actionType || ''}
                        onValueChange={(value) => {
                          setLocalFilters({
                            ...localFilters,
                            actionType: value,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'ACTIVITY_LOG.PAGE.ACTION_PLACEHOLDER',
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CREATE">
                            {t('ACTIVITY_LOG.ACTION_TYPES.CREATE')}
                          </SelectItem>
                          <SelectItem value="UPDATE">
                            {t('ACTIVITY_LOG.ACTION_TYPES.UPDATE')}
                          </SelectItem>
                          <SelectItem value="DELETE">
                            {t('COMMON.DELETE')}
                          </SelectItem>
                          <SelectItem value="ADD">
                            {t('COMMON.ADD')}
                          </SelectItem>
                          <SelectItem value="SUBTRACT">
                            {t('COMMON.SUBTRACT')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="lg:col-span-2">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <DateRangePicker
                            start={dateRange?.from ?? null}
                            end={dateRange?.to ?? null}
                            onApply={(range) => setDateRange(range)}
                            clearable={true}
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            onClick={handleClearFilters}
                            className="whitespace-nowrap"
                          >
                            {t('COMMON.CLEAR_FILTERS')}
                          </Button>
                        </div>
                      </div>
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
              <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2.5 pt-2.5 sm:pt-0 order-1 sm:order-2">
                <div className="text-sm text-muted-foreground text-nowrap order-2 sm:order-1">
                  {t('ACTIVITY_LOG.PAGE.SHOWING', { count: logs.length })}
                </div>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <Select
                    value={String(limit)}
                    onValueChange={handlePageSizeChange}
                  >
                    <SelectTrigger className="w-[100px]" clearable={false}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">
                        {t('COMMON.PAGE_SIZE', { size: '10' })}
                      </SelectItem>
                      <SelectItem value="20">
                        {t('COMMON.PAGE_SIZE', { size: '20' })}
                      </SelectItem>
                      <SelectItem value="50">
                        {t('COMMON.PAGE_SIZE', { size: '50' })}
                      </SelectItem>
                      <SelectItem value="100">
                        {t('COMMON.PAGE_SIZE', { size: '100' })}
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={!metadata.hasPrePage || isLoading}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    {t('COMMON.PREVIOUS')}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={!metadata.hasNextPage || isLoading}
                  >
                    {t('COMMON.NEXT')}
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </DataGrid>
        </div>
      </Container>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col gap-0">
          <DialogHeader>
            <DialogTitle>{t('ACTIVITY_LOG.DETAIL.TITLE')}</DialogTitle>
            <DialogDescription>
              {t('ACTIVITY_LOG.DETAIL.DESCRIPTION')}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="overflow-y-auto max-h-[calc(85vh-120px)] pr-2">
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    {t('COMMON.DESCRIPTION')}
                  </div>
                  <div className="text-sm">{selectedLog.description}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    {t('ACTIVITY_LOG.DETAIL.DETAIL')}
                  </div>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto whitespace-pre-wrap break-words">
                    {JSON.stringify(selectedLog.detail, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}
