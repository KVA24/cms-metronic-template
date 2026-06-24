import { Fragment, useEffect, useMemo, useState } from 'react';
import { GameTransaction } from '@/features/game-transactions/api/gameTransactionsApi';
import { useGameTransactionsList } from '@/features/game-transactions/hooks/use-game-transactions-queries';
import { useAllGameRewards } from '@/features/game-rewards/hooks/use-game-rewards-queries';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { useTranslations } from '@/shared/hooks/use-translations';
import { formatNumber } from '@/shared/lib';
import { formatDate } from '@/shared/lib/date-utils';
import { useUrlParams } from '@/shared/lib/url-params';
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
import { Input } from '@/shared/ui/atoms/input';
import { ScrollArea, ScrollBar } from '@/shared/ui/atoms/scroll-area';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/shared/ui/molecules/common/toolbar';
import { Container } from '@/shared/ui/molecules/container';
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
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/atoms/select';

const DEFAULT_PAGE_SIZE = 20;

export function GameTransactionsPage() {
  const { t } = useTranslations();
  const { getParam, getNumberParam, updateParams } = useUrlParams({
    defaults: { limit: DEFAULT_PAGE_SIZE },
  });

  const limit = getNumberParam('limit', DEFAULT_PAGE_SIZE);

  const [localSearch, setLocalSearch] = useState({
    userId: getParam('userId') || '',
    transId: getParam('transId') || '',
    cardNumber: getParam('cardNumber') || '',
    referenceId: getParam('referenceId') || '',
  });
  const [rewardId, setRewardId] = useState(getParam('rewardId') || '');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const gte = getParam('gte');
    const lte = getParam('lte');
    if (gte && lte) {
      const fromDate = new Date(gte);
      const toDate = new Date(lte);
      // Validate dates
      if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
        return { from: fromDate, to: toDate };
      }
    }
    return undefined;
  });

  // Fetch all game rewards for the select dropdown
  const { data: allRewards = [] } = useAllGameRewards();

  // Cursor state for pagination
  const [cursor, setCursor] = useState<{ next?: number; pre?: number }>({});

  const debouncedUserId = useDebounce(localSearch.userId, 500);
  const debouncedTransId = useDebounce(localSearch.transId, 500);
  const debouncedCardNumber = useDebounce(localSearch.cardNumber, 500);
  const debouncedReferenceId = useDebounce(localSearch.referenceId, 500);

  // Reset cursor when filters change
  useEffect(() => {
    setCursor({});
  }, [debouncedUserId, debouncedTransId, rewardId, debouncedCardNumber, debouncedReferenceId, dateRange, limit]);

  // Sync filters to URL
  useEffect(() => {
    updateParams({
      userId: debouncedUserId || null,
      transId: debouncedTransId || null,
      rewardId: rewardId || null,
      cardNumber: debouncedCardNumber || null,
      referenceId: debouncedReferenceId || null,
      gte: dateRange?.from ? formatDate(dateRange.from, 'yyyy-MM-dd') : null,
      lte: dateRange?.to ? formatDate(dateRange.to, 'yyyy-MM-dd') : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedUserId, debouncedTransId, rewardId, debouncedCardNumber, debouncedReferenceId, dateRange]);

  const queryParams = useMemo(
    () => ({
      userId: debouncedUserId || undefined,
      transId: debouncedTransId || undefined,
      rewardId: rewardId || undefined,
      cardNumber: debouncedCardNumber || undefined,
      referenceId: debouncedReferenceId || undefined,
      gte: dateRange?.from ? formatDate(dateRange.from, 'yyyy-MM-dd') : undefined,
      lte: dateRange?.to ? formatDate(dateRange.to, 'yyyy-MM-dd') : undefined,
      next: cursor.next,
      pre: cursor.pre,
      limit: limit,
    }),
    [debouncedUserId, debouncedTransId, rewardId, debouncedCardNumber, debouncedReferenceId, dateRange, cursor, limit],
  );

  const {
    data,
    isLoading,
    error: queryError,
  } = useGameTransactionsList(queryParams);

  const entries = data?.data || [];
  const metadata = data?.metadata;
  const error = queryError?.message || null;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: limit,
  });

  const handleClear = () => {
    setLocalSearch({ userId: '', transId: '', cardNumber: '', referenceId: '' });
    setRewardId('');
    setDateRange(undefined);
    setCursor({});
  };

  const handlePageSizeChange = (value: string) => {
    updateParams({ limit: parseInt(value, 10) });
    setCursor({});
  };

  const handlePrevious = () => {
    if (metadata?.hasPrePage && metadata?.pre !== undefined) {
      setCursor({ pre: metadata.pre });
    }
  };

  const handleNext = () => {
    if (metadata?.hasNextPage && metadata?.next !== undefined) {
      setCursor({ next: metadata.next });
    }
  };

  const columns = useMemo<ColumnDef<GameTransaction>[]>(
    () => [
      {
        id: 'transId',
        accessorFn: (row) => row.transId,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('GAME_TRANSACTIONS.TRANS_ID')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="font-mono text-xs">{info.row.original.transId}</span>
        ),
        enableSorting: false,
        size: 280,
      },
      {
        id: 'userId',
        accessorFn: (row) => row.userId,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.USER_ID')} column={column} />
        ),
        cell: (info) => (
          <span className="font-mono text-xs">{info.row.original.userId}</span>
        ),
        enableSorting: false,
        size: 120,
      },
      {
        id: 'fullName',
        accessorFn: (row) => row.fullName,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('GAME_TRANSACTIONS.FULL_NAME')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="text-xs">{info.row.original.fullName || '-'}</span>
        ),
        enableSorting: false,
        size: 150,
      },
      {
        id: 'cardNumber',
        accessorFn: (row) => row.cardNumber,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('GAME_TRANSACTIONS.CARD_NUMBER')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="text-xs ">
            {info.row.original.cardNumber || '-'}
          </span>
        ),
        enableSorting: false,
        size: 150,
      },
      {
        id: 'partnerId',
        accessorFn: (row) => row.referenceId,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('COMMON.PARTNER_ID')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="text-xs ">
            {info.row.original.referenceId || '-'}
          </span>
        ),
        enableSorting: false,
        size: 150,
      },
      {
        id: 'rewardId',
        accessorFn: (row) => row.rewardId,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('GAME_TRANSACTIONS.REWARD_ID')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="font-mono text-xs">
            {info.row.original.rewardId}
          </span>
        ),
        enableSorting: false,
        size: 100,
      },
      {
        id: 'rewardName',
        accessorFn: (row) => row.rewardName,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('GAME_TRANSACTIONS.REWARD_NAME')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="text-xs">{info.row.original.rewardName || '-'}</span>
        ),
        enableSorting: false,
        size: 150,
      },
      {
        id: 'amount',
        accessorFn: (row) => row.amount,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('GAME_TRANSACTIONS.AMOUNT')}
            column={column}
          />
        ),
        cell: (info) => {
          const amt = info.row.original.amount;
          return (
            <span
              className={`font-semibold ${amt >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {amt >= 0 ? '+' : ''}
              {formatNumber(amt)}
            </span>
          );
        },
        enableSorting: true,
        sortingFn: 'basic',
        size: 90,
      },
      {
        id: 'createdAt',
        accessorFn: (row) => row.createdAt,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('COMMON.CREATED_AT')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="text-xs">
            {formatDate(
              new Date(info.row.original.createdAt),
              'dd/MM/yyyy HH:mm:ss',
            )}
          </span>
        ),
        enableSorting: true,
        sortingFn: 'basic',
        size: 160,
      },
    ],
    [t],
  );

  const table = useReactTable({
    columns,
    data: entries,
    pageCount: -1, // unknown with cursor pagination
    getRowId: (row: GameTransaction) => row.transId,
    state: { pagination, sorting },
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
            <ToolbarPageTitle />
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container>
        <div className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-4 py-3">
              {error}
            </div>
          )}

          <DataGrid
            table={table}
            recordCount={entries.length}
            isLoading={isLoading}
            loadingMode="skeleton"
            emptyMessage={t('GAME_TRANSACTIONS.EMPTY')}
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
                <CardTitle>Transactions List</CardTitle>
                <CardToolbar>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t(
                          'GAME_TRANSACTIONS.SEARCH_TRANS_ID_PLACEHOLDER',
                        )}
                        value={localSearch.transId}
                        onChange={(e) =>
                          setLocalSearch({
                            ...localSearch,
                            transId: e.target.value,
                          })
                        }
                        className="pl-10"
                      />
                    </div>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t(
                          'GAME_TRANSACTIONS.SEARCH_USER_ID_PLACEHOLDER',
                        )}
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
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t(
                          'GAME_TRANSACTIONS.SEARCH_CARD_NUMBER_PLACEHOLDER',
                        )}
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

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t(
                          'GAME_TRANSACTIONS.SEARCH_PARTNER_ID',
                        )}
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

                    <Select
                      value={rewardId || ""}
                      onValueChange={setRewardId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('GAME_TRANSACTIONS.SELECT_REWARD_PLACEHOLDER')} />
                      </SelectTrigger>
                      <SelectContent>
                        {allRewards.map((reward) => (
                          <SelectItem key={reward.id} value={String(reward.id)}>
                            {reward.rewardName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="col-span-2">
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
                  <DataGridTable />
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardTable>
              <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2.5 pt-2.5 sm:pt-0 order-1 sm:order-2">
                <div className="text-sm text-muted-foreground text-nowrap order-2 sm:order-1">
                  {t('GAME_TRANSACTIONS.SHOWING', { count: entries.length })}
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
                    disabled={!metadata?.hasPrePage || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t('COMMON.PREVIOUS')}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={!metadata?.hasNextPage || isLoading}
                  >
                    {t('COMMON.NEXT')}
                    <ChevronRight className="h-4 w-4" />
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

export default GameTransactionsPage;
