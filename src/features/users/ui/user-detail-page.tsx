import { Fragment, useEffect, useMemo, useState } from 'react';
import { TierHistoryEntry } from '@/features/users/api/membershipTierApi';
import {
  PointEventType,
  PointHistoryEntry,
} from '@/features/users/api/pointHistoryApi';
import { AccountBalance } from '@/features/users/api/userApi';
import { useUserMembershipTier } from '@/features/users/hooks/use-membership-tier-queries';
import { usePointHistoryList } from '@/features/users/hooks/use-point-history-queries';
import {
  useCustomerById,
  useUserBalanceDetail,
} from '@/features/users/hooks/use-user-queries';
import { useBreadcrumb } from '@/shared/contexts/breadcrumb-context';
import { useTranslations } from '@/shared/hooks/use-translations';
import { formatNumber } from '@/shared/lib';
import { formatDate } from '@/shared/lib/date-utils';
import { usePaginationParams } from '@/shared/lib/url-params';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import {
  Card,
  CardContent,
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
import DateRangePicker from '@/shared/ui/atoms/date-range-picker';
import { MultiSelect } from '@/shared/ui/atoms/multi-select';
import { ScrollArea, ScrollBar } from '@/shared/ui/atoms/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/ui/atoms/tabs';
import { Toolbar, ToolbarHeading } from '@/shared/ui/molecules/common/toolbar';
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
import { ArrowLeft, LoaderCircleIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { useNavigate, useParams } from 'react-router-dom';

const EVENT_TYPES: PointEventType[] = [
  'EARN',
  'SPEND',
  'EXPIRE',
  'ADJUST',
  'TRANSFER',
  'REVERSAL',
];

// ─── Customer Info Tab ───────────────────────────────────────────────────────
function CustomerInfoTab({ customerId }: { customerId: string }) {
  const { t } = useTranslations();
  const { data, isLoading } = useCustomerById(customerId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoaderCircleIcon className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const rows = [
    { label: t('COMMON.USER_ID'), value: data?.customerId },
    { label: t('USERS.DETAIL.INFO_FULL_NAME'), value: data?.fullName },
    { label: t('USERS.DETAIL.INFO_CARD_NUMBER'), value: data?.cardNumber },
    // { label: t('USERS.DETAIL.INFO_TIER'), value: data?.customerTier },
    {
      label: t('COMMON.STATUS_1'),
      value: data?.status ? (
        <Badge variant={data.status === 'ACTIVE' ? 'success' : 'secondary'}>
          {data.status}
        </Badge>
      ) : null,
    },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
          {rows.map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center gap-3 py-2 border-b last:border-0"
            >
              <span className="text-sm w-36 shrink-0">
                {label}
              </span>
              <span className="text-sm font-semibold">{value ?? '-'}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Account Balances Card ────────────────────────────────────────────────────
// function AccountBalancesCard({
//                                customerId,
//                              }: {
//   customerId: string | undefined;
// }) {
//   const {data: balances, isLoading} = useUserDetail(customerId);
//   const {t} = useTranslations();
//
//   return (
//     <Card>
//       <CardHeader className="p-4">
//         <CardTitle>{t('USERS.BALANCES.TITLE', {id: customerId})}</CardTitle>
//       </CardHeader>
//       <CardContent>
//         {isLoading ? (
//           <div className="flex items-center justify-center py-8">
//             <LoaderCircleIcon className="h-8 w-8 animate-spin"/>
//           </div>
//         ) : balances && balances.length > 0 ? (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//             {balances.map((b: AccountBalance) => (
//               <div
//                 key={b.accountId}
//                 className="border rounded-lg p-4 space-y-2"
//               >
//                 <div className="flex items-center justify-between">
//                   <span className="font-medium">
//                     {b.currencyDetail?.name ||
//                       t('USERS.BALANCES.CURRENCY_FALLBACK', {
//                         id: b.currencyId,
//                       })}
//                   </span>
//                   <Badge
//                     variant={b.status === 'ACTIVE' ? 'success' : 'secondary'}
//                   >
//                     {b.status}
//                   </Badge>
//                 </div>
//                 <div className="grid grid-cols-3 gap-2 text-sm">
//                   <div>
//                     <p className="text-muted-foreground text-xs">
//                       {t('USERS.BALANCES.LABEL_AVAILABLE')}
//                     </p>
//                     <p className="font-semibold text-green-600">
//                       {b.availablePoints.toLocaleString()}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-muted-foreground text-xs">
//                       {t('USERS.BALANCES.LABEL_HOLD')}
//                     </p>
//                     <p className="font-semibold text-yellow-600">
//                       {b.holdPoints.toLocaleString()}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-muted-foreground text-xs">
//                       {t('USERS.BALANCES.LABEL_PENDING')}
//                     </p>
//                     <p className="font-semibold text-blue-600">
//                       {b.pendingPoints.toLocaleString()}
//                     </p>
//                   </div>
//                 </div>
//                 <p className="text-xs text-muted-foreground">
//                   {t('USERS.BALANCES.AS_OF', {
//                     date: formatDate(b.asOf, 'dd/MM/yyyy HH:mm'),
//                   })}
//                 </p>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="text-muted-foreground text-sm">
//             {t('USERS.BALANCES.EMPTY')}
//           </p>
//         )}
//       </CardContent>
//     </Card>
//   );
// }

// ─── Point History Section ────────────────────────────────────────────────────
function PointHistorySection({
  customerId,
  accountId,
}: {
  customerId: string;
  accountId: string;
}) {
  const { page, limit, setPage, setLimit } = usePaginationParams();
  const { t } = useTranslations();

  const [localSearch, setLocalSearch] = useState({
    eventTypes: [] as PointEventType[],
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch.eventTypes, dateRange]);

  const queryParams = useMemo(
    () => ({
      pageNo: page + 1,
      pageSize: limit,
      customerId,
      accountId,
      eventTypes: localSearch.eventTypes.length
        ? localSearch.eventTypes
        : undefined,
      from: dateRange?.from
        ? formatDate(dateRange.from, 'yyyy-MM-dd')
        : undefined,
      to: dateRange?.to ? formatDate(dateRange.to, 'yyyy-MM-dd') : undefined,
    }),
    [page, limit, customerId, accountId, localSearch.eventTypes, dateRange],
  );

  const { data, isLoading } = usePointHistoryList(queryParams);

  const entries = data?.data?.pagePointHistory?.data || [];
  const total = data?.data?.pagePointHistory?.pageInfo?.totalCount || 0;
  const summary = data?.data;

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: page,
    pageSize: limit,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    setPagination({ pageIndex: page, pageSize: limit });
  }, [page, limit]);

  const handlePaginationChange = (
    updater: PaginationState | ((old: PaginationState) => PaginationState),
  ) => {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    if (next.pageIndex !== page) setPage(next.pageIndex);
    if (next.pageSize !== limit) setLimit(next.pageSize);
  };

  // const handleClear = () => {
  //   setLocalSearch({eventTypes: []});
  //   setDateRange(undefined);
  //   setPage(0);
  // };

  const columns = useMemo<ColumnDef<PointHistoryEntry>[]>(
    () => [
      // {
      //   id: 'entryId',
      //   accessorFn: (row) => row.entryId,
      //   header: ({ column }) => (
      //     <DataGridColumnHeader
      //       title={t('USERS.POINT_HISTORY.COLUMN_ENTRY_ID')}
      //       column={column}
      //     />
      //   ),
      //   cell: (info) => (
      //     <span className="font-mono text-xs">{info.row.original.entryId}</span>
      //   ),
      //   enableSorting: true,
      //   sortingFn: 'basic',
      //   size: 100,
      // },
      {
        id: 'occurredAt',
        accessorFn: (row) => row.occurredAt,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('USERS.POINT_HISTORY.COLUMN_DATE')}
            column={column}
          />
        ),
        cell: (info) => (
          <div className="text-xs flex flex-col">
            <span>{info.row.original.occurredAt.split(' ')[0]}</span>
            <span>{info.row.original.occurredAt.split(' ')[1]}</span>
            {/*<span>{formatDate(info.row.original.occurredAt, 'dd/MM/yyyy')}</span>*/}
            {/*<span>{formatDate(info.row.original.occurredAt, 'HH:mm:ss')}</span>*/}
          </div>
        ),
        enableSorting: true,
        sortingFn: 'datetime',
        size: 160,
      },
      {
        id: 'eventType',
        accessorFn: (row) => row.eventType,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('COMMON.EVENT_TYPE')}
            column={column}
          />
        ),
        cell: (info) => (
          <Badge variant="secondary">{info.row.original.eventType}</Badge>
        ),
        enableSorting: true,
        sortingFn: 'text',
        size: 110,
      },
      {
        id: 'businessContext',
        accessorFn: (row) => row.businessContext,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('USERS.POINT_HISTORY.COLUMN_CONTEXT')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="text-xs">{info.row.original.businessContext}</span>
        ),
        enableSorting: false,
        size: 160,
      },
      {
        id: 'entryDirection',
        accessorFn: (row) => row.entryDirection,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('USERS.POINT_HISTORY.COLUMN_DIRECTION')}
            column={column}
          />
        ),
        cell: (info) => {
          const dir = info.row.original.entryDirection;
          return (
            <Badge variant={dir === 'CREDIT' ? 'success' : 'destructive'}>
              {dir === 'CREDIT' ? 'ADD' : 'SUBTRACT'}
            </Badge>
          );
        },
        enableSorting: true,
        sortingFn: 'text',
        size: 90,
      },
      {
        id: 'points',
        accessorFn: (row) => row.points,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.POINTS')} column={column} />
        ),
        cell: (info) => {
          const dir = info.row.original.entryDirection;
          const pts = info.row.original.points;
          return (
            <span
              className={`font-semibold ${dir === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}
            >
              {dir === 'CREDIT' ? '+' : '-'}
              {formatNumber(pts)}
            </span>
          );
        },
        enableSorting: true,
        sortingFn: 'basic',
        size: 100,
      },
      {
        id: 'snapshotPoints',
        accessorFn: (row) => row.snapshotPoints,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('USERS.POINT_HISTORY.COLUMN_BALANCE_AFTER')}
            column={column}
          />
        ),
        cell: (info) => (
          <span>{formatNumber(info.row.original.snapshotPoints)}</span>
        ),
        enableSorting: true,
        sortingFn: 'basic',
        size: 110,
      },
      {
        id: 'sourceReference',
        accessorFn: (row) => row.sourceReference,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('USERS.POINT_HISTORY.COLUMN_SOURCE_REF')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="text-xs text-muted-foreground">
            {info.row.original.sourceReference || '-'}
          </span>
        ),
        enableSorting: false,
        size: 140,
      },
    ],
    [],
  );

  const table = useReactTable({
    columns,
    data: entries,
    pageCount: total > 0 ? Math.ceil(total / limit) : 0,
    getRowId: (row: PointHistoryEntry) => String(row.entryId),
    state: { pagination, sorting },
    onPaginationChange: handlePaginationChange,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });

  const summaryItems = [
    {
      label: t('USERS.POINT_HISTORY.SUMMARY_AVAILABLE'),
      value: summary?.availablePoints,
      color: 'text-green-600',
    },
    {
      label: t('USERS.POINT_HISTORY.SUMMARY_ACCUMULATED'),
      value: summary?.accumulatedPoints,
      color: 'text-blue-600',
    },
    {
      label: t('USERS.POINT_HISTORY.SUMMARY_EXPIRED'),
      value: summary?.expiredPoints,
      color: 'text-red-500',
    },
    {
      label: t('USERS.POINT_HISTORY.SUMMARY_USED'),
      value: summary?.usedPoints,
      color: 'text-yellow-600',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryItems.map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>
                {value?.toLocaleString() ?? '-'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <DataGrid
        table={table}
        recordCount={total}
        isLoading={isLoading}
        loadingMode="skeleton"
        emptyMessage={t('USERS.POINT_HISTORY.EMPTY')}
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
            <CardTitle>{t('USERS.POINT_HISTORY.TITLE')}</CardTitle>
            <CardToolbar>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <MultiSelect
                  options={EVENT_TYPES.map((et) => ({ value: et, label: et }))}
                  value={localSearch.eventTypes}
                  onChange={(v) =>
                    setLocalSearch({ eventTypes: v as PointEventType[] })
                  }
                  placeholder={t('USERS.POINT_HISTORY.FILTER_EVENT_TYPES')}
                />
                <div className="lg:col-span-2">
                  <DateRangePicker
                    start={dateRange?.from ?? null}
                    end={dateRange?.to ?? null}
                    onApply={(range) => setDateRange(range)}
                    clearable
                  />
                </div>
                {/*<div className="flex justify-end">*/}
                {/*  <Button variant="outline" onClick={handleClear} className="whitespace-nowrap">*/}
                {/*    {t('COMMON.CLEAR_FILTERS')}*/}
                {/*  </Button>*/}
                {/*</div>*/}
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
  );
}

// ─── Membership Tier Section ──────────────────────────────────────────────────
function MembershipTierSection({ customerId }: { customerId: string }) {
  const { t } = useTranslations();
  const { data, isLoading } = useUserMembershipTier(customerId);

  const columns = useMemo<ColumnDef<TierHistoryEntry>[]>(
    () => [
      {
        id: 'changedAt',
        accessorFn: (row) => row.changedAt,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('USERS.MEMBERSHIP_TIER.COLUMN_CHANGED_AT')}
            column={column}
          />
        ),
        cell: (info) => (
          <div className="text-sm flex flex-col">
            <span>{formatDate(info.row.original.changedAt, 'dd/MM/yyyy')}</span>
            <span>{formatDate(info.row.original.changedAt, 'HH:mm:ss')}</span>
          </div>
        ),
        enableSorting: true,
        sortingFn: 'basic',
        size: 160,
      },
      {
        id: 'fromTierName',
        accessorFn: (row) => row.fromTierName,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('USERS.MEMBERSHIP_TIER.COLUMN_FROM_TIER')}
            column={column}
          />
        ),
        cell: (info) => (
          <span className="text-muted-foreground">
            {info.row.original.fromTierName || '-'}
          </span>
        ),
        enableSorting: false,
        size: 150,
      },
      {
        id: 'toTierName',
        accessorFn: (row) => row.toTierName,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('USERS.MEMBERSHIP_TIER.COLUMN_TO_TIER')}
            column={column}
          />
        ),
        cell: (info) => <span>{info.row.original.toTierName}</span>,
        enableSorting: false,
        size: 150,
      },
      {
        id: 'changeReason',
        accessorFn: (row) => row.changeReason,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('USERS.MEMBERSHIP_TIER.COLUMN_REASON')}
            column={column}
          />
        ),
        cell: (info) => <span>{info.row.original.changeReason}</span>,
        enableSorting: false,
        size: 180,
      },
    ],
    [],
  );

  const history = data?.history ?? [];

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    columns,
    data: history,
    getRowId: (_row, i) => String(i),
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoaderCircleIcon className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-muted-foreground text-sm text-center">
            {t('USERS.MEMBERSHIP_TIER.EMPTY')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current tier info */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm whitespace-nowrap">
                {t('USERS.MEMBERSHIP_TIER.CURRENT_TIER')}:
              </span>
              <span className="text-sm font-semibold">{data.tierName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm whitespace-nowrap">
                {t('USERS.MEMBERSHIP_TIER.EFFECTIVE_AT')}:
              </span>
              <div className="text-sm font-semibold flex flex-col">
                {formatDate(data.effectiveAt, 'dd/MM/yyyy HH:mm:ss')}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm whitespace-nowrap">
                {t('USERS.MEMBERSHIP_TIER.NEXT_REVIEW_AT')}:
              </span>
              <div className="text-sm font-semibold flex flex-col">
                {formatDate(data.nextReviewAt, 'dd/MM/yyyy HH:mm:ss')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History table */}
      <DataGrid
        table={table}
        recordCount={history.length}
        isLoading={false}
        loadingMode="skeleton"
        emptyMessage={t('USERS.MEMBERSHIP_TIER.HISTORY_EMPTY')}
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
            <CardTitle>{t('USERS.MEMBERSHIP_TIER.HISTORY_TITLE')}</CardTitle>
          </CardHeader>
          <CardTable>
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
          {/*<CardFooter className="flex items-center justify-between">*/}
          {/*  <DataGridPagination/>*/}
          {/*</CardFooter>*/}
        </Card>
      </DataGrid>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function UserDetailPage() {
  const { id: customerId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setCustomBreadcrumb } = useBreadcrumb();
  const { t } = useTranslations();

  const { data: balances, isLoading: isLoadingBalances } =
    useUserBalanceDetail(customerId);

  useEffect(() => {
    setCustomBreadcrumb([
      { title: t('USERS.DETAIL.BREADCRUMB_CUSTOMERS'), path: '/users' },
      { title: t('USERS.DETAIL.BREADCRUMB_CUSTOMER', { id: customerId }) },
    ]);
    return () => setCustomBreadcrumb(null);
  }, [customerId, setCustomBreadcrumb]);

  const firstAccountId = balances?.[0]?.accountId?.toString() ?? '';

  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <Button variant="outline" onClick={() => navigate('/users')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('USERS.DETAIL.BACK_TO_LIST')}
            </Button>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container>
        <div className="space-y-4">
          <Tabs defaultValue="info">
            <TabsList>
              <TabsTrigger value="info">
                {t('USERS.DETAIL.TAB_INFO')}
              </TabsTrigger>
              <TabsTrigger value="membership">
                {t('USERS.DETAIL.TAB_MEMBERSHIP_TIER')}
              </TabsTrigger>
              <TabsTrigger value="history">
                {t('USERS.DETAIL.TAB_HISTORY')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              {customerId && <CustomerInfoTab customerId={customerId} />}
            </TabsContent>

            <TabsContent value="membership">
              {customerId && <MembershipTierSection customerId={customerId} />}
            </TabsContent>

            <TabsContent value="history">
              {customerId &&
                (isLoadingBalances ? (
                  <div className="flex items-center justify-center py-16">
                    <LoaderCircleIcon className="h-8 w-8 animate-spin" />
                  </div>
                ) : balances && balances.length > 0 ? (
                  <div className="px-4">
                    <Tabs defaultValue={firstAccountId}>
                      <TabsList>
                        {balances.map((b: AccountBalance) => (
                          <TabsTrigger
                            key={b.accountId}
                            value={b.accountId.toString()}
                          >
                            {b.currencyDetail?.name ??
                              t('USERS.BALANCES.CURRENCY_FALLBACK', {
                                id: b.currencyId,
                              })}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {balances.map((b: AccountBalance) => (
                        <TabsContent
                          key={b.accountId}
                          value={b.accountId.toString()}
                        >
                          <PointHistorySection
                            customerId={customerId}
                            accountId={b.accountId.toString()}
                          />
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground text-sm">
                      {t('USERS.BALANCES.EMPTY')}
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>
          </Tabs>
        </div>
      </Container>
    </Fragment>
  );
}
