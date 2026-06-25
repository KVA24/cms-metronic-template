import { useMemo, useReducer, useState } from 'react';
import {
  useCampaignStatistics,
  useCustomerDashboard,
  useCustomerStatistics,
  useDailyPointChart,
  useDashboardCurrencies,
  useExportTop100Users,
  useMembershipTierStatistics,
  useMonthlyPointChart,
  usePointStatistic,
  useTop100Users,
  useTransactionUsers,
} from '@/features/dashboards/hooks/use-dashboard-queries';
import { UserRole } from '@/shared/lib/rbac';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from '@/shared/ui/atoms/alert';
import { Button } from '@/shared/ui/atoms/button.tsx';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/atoms/card';
import DateRangePicker from '@/shared/ui/atoms/date-range-picker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/atoms/dialog';
import MonthRangePicker from '@/shared/ui/atoms/month-range-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/atoms/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/atoms/tooltip';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/shared/ui/molecules/common/toolbar';
import { Container } from '@/shared/ui/molecules/container';
import { PermissionGuard } from '@/shared/ui/molecules/permission-guard.tsx';
import { format, startOfMonth } from 'date-fns';
import {
  AlertCircle,
  Download,
  LoaderCircleIcon,
  Target,
  TrendingDown,
  TrendingUp,
  TrophyIcon,
  Users,
} from 'lucide-react';
import Chart from 'react-apexcharts';
import { DateRange } from 'react-day-picker';
import { useTranslation } from 'react-i18next';

const TIER_COLORS: Record<string, string> = {
  Silver: '#9CA3AF',
  Gold: '#EAB308',
  Diamond: '#8B5CF6',
  Platinum: '#3B82F6',
  Bronze: '#CD7F32',
};
const TIER_COLOR_FALLBACKS = [
  '#9CA3AF',
  '#EAB308',
  '#8B5CF6',
  '#3B82F6',
  '#10B981',
];

type DashboardChartKey = 'customer' | 'dpe' | 'mpe' | 'dpd' | 'mpd';

interface DashboardChartState {
  openDialog: DashboardChartKey | null;
  chartDateRange: DateRange | undefined;
  dpeChartDateRange: DateRange | undefined;
  mpeChartDateRange: DateRange | undefined;
  dpdChartDateRange: DateRange | undefined;
  mpdChartDateRange: DateRange | undefined;
}

type DashboardChartAction =
  | { type: 'dialogChanged'; dialog: DashboardChartKey; open: boolean }
  | {
      type: 'dateRangeChanged';
      field: Exclude<keyof DashboardChartState, 'openDialog'>;
      value: DateRange | undefined;
    };

const defaultDailyRange = () => ({
  from: startOfMonth(new Date()),
  to: new Date(),
});

const defaultMonthlyRange = () => {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  return {
    from: sixMonthsAgo,
    to: new Date(now.getFullYear(), now.getMonth(), 1),
  };
};

function createDashboardChartState(): DashboardChartState {
  return {
    openDialog: null,
    chartDateRange: defaultDailyRange(),
    dpeChartDateRange: defaultDailyRange(),
    mpeChartDateRange: defaultMonthlyRange(),
    dpdChartDateRange: defaultDailyRange(),
    mpdChartDateRange: defaultMonthlyRange(),
  };
}

function dashboardChartReducer(
  state: DashboardChartState,
  action: DashboardChartAction,
): DashboardChartState {
  switch (action.type) {
    case 'dialogChanged':
      return {
        ...state,
        openDialog: action.open ? action.dialog : null,
      };
    case 'dateRangeChanged':
      return {
        ...state,
        [action.field]: action.value,
      };
    default:
      return state;
  }
}

const DashboardPage = () => {
  const { t } = useTranslation();
  const [chartState, dispatchChartState] = useReducer(
    dashboardChartReducer,
    undefined,
    createDashboardChartState,
  );
  const {
    openDialog,
    chartDateRange,
    dpeChartDateRange,
    mpeChartDateRange,
    dpdChartDateRange,
    mpdChartDateRange,
  } = chartState;

  // Currency state
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<string>('');

  // Fetch currencies from dashboard API
  const { data: currencies = [], isLoading: isLoadingCurrencies } =
    useDashboardCurrencies();

  // Set default currency when currencies are loaded
  useMemo(() => {
    if (currencies.length > 0 && !selectedCurrencyId) {
      setSelectedCurrencyId(currencies[0].id);
    }
  }, [currencies, selectedCurrencyId]);

  // Format dates for chart API
  const chartFromDate = useMemo(
    () =>
      chartDateRange?.from
        ? format(chartDateRange.from, 'yyyy-MM-dd')
        : format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    [chartDateRange?.from],
  );

  const chartToDate = useMemo(
    () =>
      chartDateRange?.to
        ? format(chartDateRange.to, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
    [chartDateRange?.to],
  );

  // Format dates for point charts
  const dpeFromDate = useMemo(
    () =>
      dpeChartDateRange?.from
        ? format(dpeChartDateRange.from, 'yyyy-MM-dd')
        : format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    [dpeChartDateRange?.from],
  );
  const dpeToDate = useMemo(
    () =>
      dpeChartDateRange?.to
        ? format(dpeChartDateRange.to, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
    [dpeChartDateRange?.to],
  );

  const mpeFromDate = useMemo(
    () =>
      mpeChartDateRange?.from
        ? format(mpeChartDateRange.from, 'yyyy-MM-dd')
        : format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    [mpeChartDateRange?.from],
  );
  const mpeToDate = useMemo(
    () =>
      mpeChartDateRange?.to
        ? format(mpeChartDateRange.to, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
    [mpeChartDateRange?.to],
  );

  const dpdFromDate = useMemo(
    () =>
      dpdChartDateRange?.from
        ? format(dpdChartDateRange.from, 'yyyy-MM-dd')
        : format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    [dpdChartDateRange?.from],
  );
  const dpdToDate = useMemo(
    () =>
      dpdChartDateRange?.to
        ? format(dpdChartDateRange.to, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
    [dpdChartDateRange?.to],
  );

  const mpdFromDate = useMemo(
    () =>
      mpdChartDateRange?.from
        ? format(mpdChartDateRange.from, 'yyyy-MM-dd')
        : format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    [mpdChartDateRange?.from],
  );
  const mpdToDate = useMemo(
    () =>
      mpdChartDateRange?.to
        ? format(mpdChartDateRange.to, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
    [mpdChartDateRange?.to],
  );

  // Fetch all dashboard data (without date params)
  // Fetch dashboard data separately with individual loading states
  const {
    data: customerStatistics,
    isLoading: isLoadingCustomerStatistics,
    error: customerStatisticsError,
  } = useCustomerStatistics();

  const {
    data: campaignStatistics,
    isLoading: isLoadingCampaignStatistics,
    error: campaignStatisticsError,
  } = useCampaignStatistics();

  const {
    data: membershipTier,
    isLoading: isLoadingMembershipTier,
    error: membershipTierError,
  } = useMembershipTierStatistics();

  const { data: transactionUsers, isLoading: isLoadingTransactionUsers } =
    useTransactionUsers();

  const { data: pointStatistic, isLoading: isLoadingPointStatistic } =
    usePointStatistic(selectedCurrencyId);

  // Fetch customer dashboard data separately with date range
  const {
    data: customerDashboard = [],
    isLoading: isLoadingCustomerDashboard,
  } = useCustomerDashboard(chartFromDate, chartToDate);

  // Fetch point chart data with currencyId
  const { data: dpeChartData = [], isLoading: isLoadingDpeChart } =
    useDailyPointChart(dpeFromDate, dpeToDate, selectedCurrencyId);
  const { data: mpeChartData = [], isLoading: isLoadingMpeChart } =
    useMonthlyPointChart(mpeFromDate, mpeToDate, selectedCurrencyId);
  const { data: dpdChartData = [], isLoading: isLoadingDpdChart } =
    useDailyPointChart(dpdFromDate, dpdToDate, selectedCurrencyId);
  const { data: mpdChartData = [], isLoading: isLoadingMpdChart } =
    useMonthlyPointChart(mpdFromDate, mpdToDate, selectedCurrencyId);

  // Fetch top 100 users with currencyId
  const { data: top100Users = [], isLoading: isLoadingTop100Users } =
    useTop100Users(selectedCurrencyId);

  // Export top 100 users mutation
  const exportTop100UsersMutation = useExportTop100Users();

  // Handle export top 100 users
  const handleExportTop100Users = () => {
    if (selectedCurrencyId) {
      exportTop100UsersMutation.mutate(selectedCurrencyId);
    }
  };

  // Chart data for customer dashboard line chart - MEMOIZED
  const customerChartOptions = useMemo(
    () => ({
      chart: {
        type: 'line' as const,
        toolbar: {
          show: true,
        },
        zoom: {
          enabled: false,
        },
        download: {
          enabled: true,
        },
      },
      stroke: {
        curve: 'smooth' as const,
        width: 3,
      },
      xaxis: {
        categories: customerDashboard.map((item) => {
          // Convert date string to dd/MM format (short format)
          const date = new Date(item.date);
          return `${date.getDate()}/${date.getMonth() + 1}`;
        }),
        type: 'category' as const,
        tickAmount: Math.min(10, customerDashboard.length),
        labels: {
          rotate: -45,
          rotateAlways: false,
          style: {
            fontSize: '11px',
          },
          trim: false,
        },
        tickPlacement: 'on',
      },
      yaxis: {
        title: {
          text: t('DASHBOARD.CUSTOMER_DASHBOARD.TOTAL_USERS'),
        },
        labels: {
          style: {
            fontSize: '11px',
          },
          formatter: (value: number) => {
            if (value >= 1000000) {
              return `${(value / 1000000).toFixed(1)}M`;
            } else if (value >= 1000) {
              return `${Math.floor(value / 1000)}k`;
            }
            return Math.round(value).toString();
          },
        },
        forceNiceScale: true,
        decimalsInFloat: 0,
      },
      tooltip: {
        theme: 'light' as const,
        x: {
          formatter: (_val: number, opts: any) => {
            const date = customerDashboard[opts.dataPointIndex]?.date;
            return date ? format(new Date(date), 'dd/MM/yyyy') : '';
          },
        },
        y: {
          formatter: (value: number) =>
            `${value.toLocaleString('vi-VN')} users`,
        },
      },
      grid: {
        borderColor: '#e7e7e7',
        row: {
          colors: ['#f3f3f3', 'transparent'],
          opacity: 0.5,
        },
      },
      markers: {
        size: 4,
        hover: {
          size: 6,
        },
      },
    }),
    [customerDashboard, t],
  );

  const customerChartSeries = useMemo(
    () => [
      {
        name: t('DASHBOARD.CUSTOMER_DASHBOARD.TOTAL_USERS'),
        data: customerDashboard.map((item) => item.total),
      },
    ],
    [customerDashboard, t],
  );

  // Helper function to create point chart options - MEMOIZED with useCallback
  const createPointChartOptions = useMemo(
    () =>
      (
        data: any[],
        type: 'earn' | 'burn',
        title: string,
        chartType: 'daily' | 'monthly',
      ) => {
        const categories = data.map((item) => {
          if (chartType === 'daily') {
            const date = new Date(item.label);
            return format(date, 'dd/MM/yyyy');
          }
          return item.label;
        });

        const color = type === 'earn' ? '#16a34a' : '#ea580c';

        return {
          chart: {
            type: 'line' as const,
            toolbar: { show: true },
            zoom: {
              enabled: false,
            },
            download: {
              enabled: true,
            },
          },
          stroke: {
            curve: 'smooth' as const,
            width: 3,
          },
          colors: [color],
          xaxis: {
            categories,
            type: 'category' as const,
            tickAmount: Math.min(10, categories.length),
            labels: {
              rotate: -45,
              rotateAlways: false,
              style: { fontSize: '11px' },
              trim: false,
            },
            tickPlacement: 'on',
          },
          yaxis: {
            title: { text: title },
            labels: {
              style: { fontSize: '11px' },
              formatter: (value: number) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                else if (value >= 1000) return `${Math.floor(value / 1000)}k`;
                return Math.round(value).toString();
              },
            },
            forceNiceScale: true,
            decimalsInFloat: 0,
          },
          tooltip: {
            theme: 'light' as const,
            x: {
              show: true,
            },
            y: {
              formatter: (value: number) =>
                `${value.toLocaleString('vi-VN')} pts`,
            },
          },
          grid: {
            borderColor: '#e7e7e7',
            row: {
              colors: ['#f3f3f3', 'transparent'],
              opacity: 0.5,
            },
          },
          markers: {
            size: 4,
            hover: { size: 6 },
          },
        };
      },
    [],
  );

  // DPE Chart - MEMOIZED
  const dpeChartOptions = useMemo(
    () =>
      createPointChartOptions(
        dpeChartData,
        'earn',
        t('DASHBOARD.POINT_STATS.DAILY_EARNED'),
        'daily',
      ),
    [dpeChartData, createPointChartOptions, t],
  );
  const dpeChartSeries = useMemo(
    () => [{ name: 'DPE', data: dpeChartData.map((item) => item.earnTotal) }],
    [dpeChartData],
  );

  // MPE Chart - MEMOIZED
  const mpeChartOptions = useMemo(
    () =>
      createPointChartOptions(
        mpeChartData,
        'earn',
        t('DASHBOARD.POINT_STATS.MONTHLY_EARNED'),
        'monthly',
      ),
    [mpeChartData, createPointChartOptions, t],
  );
  const mpeChartSeries = useMemo(
    () => [{ name: 'MPE', data: mpeChartData.map((item) => item.earnTotal) }],
    [mpeChartData],
  );

  // DPD Chart - MEMOIZED
  const dpdChartOptions = useMemo(
    () =>
      createPointChartOptions(
        dpdChartData,
        'burn',
        t('DASHBOARD.POINT_STATS.DAILY_DEDUCTED'),
        'daily',
      ),
    [dpdChartData, createPointChartOptions, t],
  );
  const dpdChartSeries = useMemo(
    () => [{ name: 'DPD', data: dpdChartData.map((item) => item.burnTotal) }],
    [dpdChartData],
  );

  // MPD Chart - MEMOIZED
  const mpdChartOptions = useMemo(
    () =>
      createPointChartOptions(
        mpdChartData,
        'burn',
        t('DASHBOARD.POINT_STATS.MONTHLY_DEDUCTED'),
        'monthly',
      ),
    [mpdChartData, createPointChartOptions, t],
  );
  const mpdChartSeries = useMemo(
    () => [{ name: 'MPD', data: mpdChartData.map((item) => item.burnTotal) }],
    [mpdChartData],
  );

  // Pie chart data for membership tiers
  const tierEntries = useMemo(() => {
    if (!membershipTier?.items) return [];

    const totalUsers = membershipTier.items.reduce(
      (sum, item) => sum + item.totalUser,
      0,
    );

    return membershipTier.items.map((item, i) => ({
      name: item.tierName,
      count: item.totalUser,
      percentage:
        totalUsers > 0 ? Math.round((item.totalUser / totalUsers) * 100) : 0,
      color:
        TIER_COLORS[item.tierName] ??
        TIER_COLOR_FALLBACKS[i % TIER_COLOR_FALLBACKS.length],
    }));
  }, [membershipTier]);

  const tierChartOptions = useMemo(
    () => ({
      chart: { type: 'donut' as const, sparkline: { enabled: false } },
      labels: tierEntries.map((t) => t.name),
      colors: tierEntries.map((t) => t.color),
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Users',
                fontSize: '13px',
                color: '#6B7280',
                fontWeight: 400,
                formatter: () =>
                  (membershipTier?.totalUser ?? 0).toLocaleString('vi-VN'),
              },
              value: {
                show: true,
                fontSize: '26px',
                fontWeight: 700,
                color: '#111827',
              },
            },
          },
        },
      },
      dataLabels: { enabled: false },
      legend: { show: false },
      stroke: { width: 0 },
      tooltip: {
        y: {
          formatter: (val: number) => `${val.toLocaleString('vi-VN')} users`,
        },
      },
    }),
    [tierEntries, membershipTier?.totalUser],
  );

  const tierChartSeries = useMemo(
    () => tierEntries.map((t) => t.count),
    [tierEntries],
  );

  // Campaign table data
  const campaignTableData = campaignStatistics?.campaigns || [];

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle />
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container>
        <div className="space-y-6">
          {/* Show errors if any */}
          {(customerStatisticsError ||
            campaignStatisticsError ||
            membershipTierError) && (
            <Alert variant="destructive" appearance="light">
              <AlertIcon>
                <AlertCircle />
              </AlertIcon>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="break-all">
                {customerStatisticsError?.message ||
                  campaignStatisticsError?.message ||
                  membershipTierError?.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Members Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">
              {t('DASHBOARD.CUSTOMER_STATS.TITLE')}
            </h2>

            {/* Customer Statistics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Main Customer Card - Blue */}
              {isLoadingCustomerStatistics ? (
                <>
                  <Card>
                    <CardContent className="flex items-center justify-center py-12">
                      <LoaderCircleIcon className="h-8 w-8 animate-spin text-muted-foreground" />
                    </CardContent>
                  </Card>

                  {/* Secondary Stats Card Loading */}
                  <Card className="border border-gray-200">
                    <CardContent className="flex items-center justify-center py-12">
                      <LoaderCircleIcon className="h-8 w-8 animate-spin text-muted-foreground" />
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  <Card
                    className="bg-gradient-to-br from-blue-400 to-blue-600 border-0 text-white cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() =>
                      dispatchChartState({
                        type: 'dialogChanged',
                        dialog: 'customer',
                        open: true,
                      })
                    }
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-8">
                        <Users className="size-6" />
                      </div>
                      <div className="text-5xl font-bold mb-2">
                        {customerStatistics?.totalUsers.toLocaleString() || 0}
                      </div>
                      <div className="text-blue-100 text-lg">
                        {t('DASHBOARD.CUSTOMER_STATS.TOTAL_MEMBERS')}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Secondary Stats Card */}
                  <Card className="border border-gray-200">
                    <CardContent className="pt-6">
                      <div className="space-y-6">
                        {/* Daily New Users */}
                        <div className="flex items-start justify-between">
                          <div className="w-full">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="bg-green-200 p-1.5 rounded-md">
                                <Users className="w-5 h-5 text-green-500" />
                              </div>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={`${customerStatistics?.newUsersGrowth && customerStatistics?.newUsersGrowth > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} px-2 py-1 rounded-full text-xs font-semibold cursor-default`}
                                  >
                                    {(
                                      customerStatistics?.newUsersGrowth || 0
                                    ).toFixed(1)}
                                    %
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {t('DASHBOARD.TOOLTIP.NEW_USERS_GROWTH')}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <div className="text-gray-500 text-sm mb-1">
                              {t('DASHBOARD.CUSTOMER_STATS.DAILY_NEW_USERS')}
                            </div>
                            <div className="text-3xl font-bold text-gray-900">
                              {customerStatistics?.dailyNewUsers.toLocaleString() ||
                                0}
                            </div>
                          </div>
                        </div>

                        {/* Monthly New Users */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-gray-500 text-sm mb-1">
                              {t('DASHBOARD.CUSTOMER_STATS.MONTHLY_NEW_USERS')}
                            </div>
                            <div className="text-3xl font-bold text-green-600">
                              {customerStatistics?.monthlyNewUsers.toLocaleString() ||
                                0}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Membership Tier Pie Chart */}
              {isLoadingMembershipTier ? (
                <Card className="lg:col-span-2">
                  <CardContent className="flex items-center justify-center py-12">
                    <LoaderCircleIcon className="h-8 w-8 animate-spin text-muted-foreground" />
                  </CardContent>
                </Card>
              ) : (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>
                      {t('DASHBOARD.MEMBERSHIP_TIERS.TITLE')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tierEntries.length > 0 ? (
                      <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6">
                        {/* Donut chart */}
                        <div className="flex-shrink-0 w-full lg:w-auto flex justify-center">
                          <div className="w-full max-w-xs lg:max-w-sm">
                            <Chart
                              options={tierChartOptions}
                              series={tierChartSeries}
                              type="donut"
                              height={280}
                            />
                          </div>
                        </div>
                        {/* Custom legend */}
                        <div className="w-full lg:flex-1 space-y-3 lg:space-y-4 overflow-hidden flex flex-col justify-center">
                          {tierEntries.map((tier) => (
                            <div
                              key={tier.name}
                              className="flex items-center justify-between gap-2 px-2 lg:px-0"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: tier.color }}
                                />
                                <span className="text-sm text-gray-700 truncate">
                                  {tier.name}
                                </span>
                              </div>
                              <div className="text-right flex-shrink-0 whitespace-nowrap">
                                <p className="text-base lg:text-lg font-bold text-gray-900 leading-tight">
                                  {tier.count.toLocaleString('vi-VN')}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {tier.percentage}%
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        {t('DASHBOARD.MEMBERSHIP_TIERS.NO_DATA')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Transaction Users Cards - DTU and MTU */}
              {isLoadingTransactionUsers ? (
                <>
                  <Card>
                    <CardContent className="flex items-center justify-center py-12">
                      <LoaderCircleIcon className="h-8 w-8 animate-spin text-muted-foreground" />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="flex items-center justify-center py-12">
                      <LoaderCircleIcon className="h-8 w-8 animate-spin text-muted-foreground" />
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  {/* DTU Card */}
                  <Card className="bg-gradient-to-br from-cyan-400 to-cyan-600 border-0 text-white col-span-2">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-2">
                        <Users className="size-6" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`${(transactionUsers?.dtuGrowth || 0) >= 0 ? 'bg-white/20 text-white' : 'bg-red-300/30 text-red-200'} px-2 py-1 rounded-full text-xs font-semibold cursor-default`}
                            >
                              {(transactionUsers?.dtuGrowth || 0) >= 0
                                ? '+'
                                : ''}
                              {(transactionUsers?.dtuGrowth || 0).toFixed(1)}%
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t('DASHBOARD.TOOLTIP.DTU_GROWTH')}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="text-5xl font-bold mb-2">
                        {transactionUsers?.dtuCount.toLocaleString() || 0}
                      </div>
                      <div className="text-cyan-100 text-lg mb-6">
                        {t('DASHBOARD.TRANSACTION_USERS.DTU')}
                      </div>
                      <div className="border-t border-white/20 pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-white font-semibold">
                            {(transactionUsers?.dtuPercentage || 0).toFixed(2)}{' '}
                            {t(
                              'DASHBOARD.TRANSACTION_USERS.PERCENTAGE_OF_TOTAL',
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* MTU Card */}
                  <Card className="bg-gradient-to-br from-indigo-400 to-indigo-600 border-0 text-white col-span-2">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-2">
                        <Users className="size-6" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`${(transactionUsers?.mtuGrowth || 0) >= 0 ? 'bg-white/20 text-white' : 'bg-red-300/30 text-red-200'} px-2 py-1 rounded-full text-xs font-semibold cursor-default`}
                            >
                              {(transactionUsers?.mtuGrowth || 0) >= 0
                                ? '+'
                                : ''}
                              {(transactionUsers?.mtuGrowth || 0).toFixed(1)}%
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t('DASHBOARD.TOOLTIP.MTU_GROWTH')}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="text-5xl font-bold mb-2">
                        {transactionUsers?.mtuCount.toLocaleString() || 0}
                      </div>
                      <div className="text-indigo-100 text-lg mb-6">
                        {t('DASHBOARD.TRANSACTION_USERS.MTU')}
                      </div>
                      <div className="border-t border-white/20 pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-white font-semibold">
                            {(transactionUsers?.mtuPercentage || 0).toFixed(2)}{' '}
                            {t(
                              'DASHBOARD.TRANSACTION_USERS.PERCENTAGE_OF_TOTAL',
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>

          {/* Point Statistics Section */}
          <div className="space-y-4">
            {/* Section Header with Currency Selector */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                {t('DASHBOARD.POINT_STATS.TITLE')}
              </h2>
              <div className="w-64">
                {isLoadingCurrencies ? (
                  <div className="flex items-center justify-center h-10">
                    <LoaderCircleIcon className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Select
                    value={selectedCurrencyId}
                    onValueChange={setSelectedCurrencyId}
                    disabled={isLoadingCurrencies}
                  >
                    <SelectTrigger clearable={false}>
                      <SelectValue
                        placeholder={t('DASHBOARD.SELECT_CURRENCY')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.id} value={currency.id}>
                          {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Points Earned */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-3">
                {t('DASHBOARD.POINT_STATS.POINTS_EARNED')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* DPE Card */}
                {isLoadingPointStatistic || !selectedCurrencyId ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-12">
                      <LoaderCircleIcon className="h-8 w-8 animate-spin text-muted-foreground" />
                    </CardContent>
                  </Card>
                ) : (
                  <div
                    className="rounded-xl p-4 text-white cursor-pointer hover:shadow-lg transition-shadow"
                    style={{
                      background: 'linear-gradient(135deg, #4ade80, #16a34a)',
                    }}
                    onClick={() =>
                      dispatchChartState({
                        type: 'dialogChanged',
                        dialog: 'dpe',
                        open: true,
                      })
                    }
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-white/20 p-1.5 rounded-lg">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-sm leading-none">
                            DPE
                          </div>
                          <div className="text-white/80 text-xs">
                            Daily Points Earned
                          </div>
                        </div>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-white/20 text-white text-xs font-semibold px-2 py-1 rounded-full cursor-default">
                            {(pointStatistic?.dpeCard?.growth ?? 0) >= 0
                              ? '+'
                              : ''}
                            {(pointStatistic?.dpeCard?.growth ?? 0).toFixed(1)}%
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t('DASHBOARD.TOOLTIP.DPE_GROWTH')}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="text-white text-xs bg-white/20 p-1 rounded-md">
                      {currencies.find((c) => c.id === selectedCurrencyId)
                        ?.name || ''}
                    </span>
                    <div className="text-4xl font-bold mt-2 mb-1">
                      {(pointStatistic?.dpeCard?.total ?? 0).toLocaleString(
                        'vi-VN',
                      )}
                    </div>
                    <div className="text-white/80 text-sm mb-4">
                      {t('DASHBOARD.POINT_STATS.DAILY_EARNED')}
                    </div>
                    <div className="border-t border-white/20 pt-3 text-white/80 text-xs">
                      {t('DASHBOARD.POINT_STATS.AVG_PER_USER')}:{' '}
                      {(
                        pointStatistic?.dpeCard?.avgPerUser ?? 0
                      ).toLocaleString()}{' '}
                      {t('DASHBOARD.POINT_STATS.POINTS_PER_USER_TODAY')}
                    </div>
                  </div>
                )}

                {/* MPE Card */}
                {isLoadingPointStatistic || !selectedCurrencyId ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-12">
                      <LoaderCircleIcon className="h-8 w-8 animate-spin text-muted-foreground" />
                    </CardContent>
                  </Card>
                ) : (
                  <div
                    className="rounded-xl p-4 text-white cursor-pointer hover:shadow-lg transition-shadow"
                    style={{
                      background: 'linear-gradient(135deg, #4ade80, #15803d)',
                    }}
                    onClick={() =>
                      dispatchChartState({
                        type: 'dialogChanged',
                        dialog: 'mpe',
                        open: true,
                      })
                    }
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-white/20 p-1.5 rounded-lg">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-sm leading-none">
                            MPE
                          </div>
                          <div className="text-white/80 text-xs">
                            Monthly Points Earned
                          </div>
                        </div>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-white/20 text-white text-xs font-semibold px-2 py-1 rounded-full cursor-default">
                            {(pointStatistic?.mpeCard?.growth ?? 0) >= 0
                              ? '+'
                              : ''}
                            {(pointStatistic?.mpeCard?.growth ?? 0).toFixed(1)}%
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t('DASHBOARD.TOOLTIP.MPE_GROWTH')}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="text-white text-xs bg-white/20 p-1 rounded-md">
                      {currencies.find((c) => c.id === selectedCurrencyId)
                        ?.name || ''}
                    </span>
                    <div className="text-4xl font-bold mt-2 mb-1">
                      {(pointStatistic?.mpeCard?.total ?? 0).toLocaleString(
                        'vi-VN',
                      )}
                    </div>
                    <div className="text-white/80 text-sm mb-4">
                      {t('DASHBOARD.POINT_STATS.MONTHLY_EARNED')}
                    </div>
                    <div className="border-t border-white/20 pt-3 text-white/80 text-xs">
                      {t('DASHBOARD.POINT_STATS.AVG_PER_USER')}:{' '}
                      {(
                        pointStatistic?.mpeCard?.avgPerUser ?? 0
                      ).toLocaleString()}{' '}
                      {t('DASHBOARD.POINT_STATS.POINTS_PER_USER_MONTH')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Points Deducted */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-3">
                {t('DASHBOARD.POINT_STATS.POINTS_DEDUCTED')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* DPD Card */}
                {isLoadingPointStatistic || !selectedCurrencyId ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-12">
                      <LoaderCircleIcon className="h-8 w-8 animate-spin text-muted-foreground" />
                    </CardContent>
                  </Card>
                ) : (
                  <div
                    className="rounded-xl p-4 text-white cursor-pointer hover:shadow-lg transition-shadow"
                    style={{
                      background: 'linear-gradient(135deg, #fb923c, #ea580c)',
                    }}
                    onClick={() =>
                      dispatchChartState({
                        type: 'dialogChanged',
                        dialog: 'dpd',
                        open: true,
                      })
                    }
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-white/20 p-1.5 rounded-lg">
                          <TrendingDown className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-sm leading-none">
                            DPD
                          </div>
                          <div className="text-white/80 text-xs">
                            Daily Points Deducted
                          </div>
                        </div>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-white/20 text-white text-xs font-semibold px-2 py-1 rounded-full cursor-default">
                            {(pointStatistic?.dpdCard?.growth ?? 0) >= 0
                              ? '+'
                              : ''}
                            {(pointStatistic?.dpdCard?.growth ?? 0).toFixed(1)}%
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t('DASHBOARD.TOOLTIP.DPD_GROWTH')}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="text-white text-xs bg-white/20 p-1 rounded-md">
                      {currencies.find((c) => c.id === selectedCurrencyId)
                        ?.name || ''}
                    </span>
                    <div className="text-4xl font-bold mb-1">
                      {(pointStatistic?.dpdCard?.total ?? 0).toLocaleString(
                        'vi-VN',
                      )}
                    </div>
                    <div className="text-white/80 text-sm mb-4">
                      {t('DASHBOARD.POINT_STATS.DAILY_DEDUCTED')}
                    </div>
                    <div className="border-t border-white/20 pt-3 text-white/80 text-xs">
                      Earn vs Burn ratio:{' '}
                      {(pointStatistic?.dpdCard?.earnBurnRatio ?? 0).toFixed(2)}
                      :1
                    </div>
                  </div>
                )}

                {/* MPD Card */}
                {isLoadingPointStatistic || !selectedCurrencyId ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-12">
                      <LoaderCircleIcon className="h-8 w-8 animate-spin text-muted-foreground" />
                    </CardContent>
                  </Card>
                ) : (
                  <div
                    className="rounded-xl p-4 text-white cursor-pointer hover:shadow-lg transition-shadow"
                    style={{
                      background: 'linear-gradient(135deg, #f87171, #dc2626)',
                    }}
                    onClick={() =>
                      dispatchChartState({
                        type: 'dialogChanged',
                        dialog: 'mpd',
                        open: true,
                      })
                    }
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-white/20 p-1.5 rounded-lg">
                          <TrendingDown className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-sm leading-none">
                            MPD
                          </div>
                          <div className="text-white/80 text-xs">
                            Monthly Points Deducted
                          </div>
                        </div>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-white/20 text-white text-xs font-semibold px-2 py-1 rounded-full cursor-default">
                            {(pointStatistic?.mpdCard?.growth ?? 0) >= 0
                              ? '+'
                              : ''}
                            {(pointStatistic?.mpdCard?.growth ?? 0).toFixed(1)}%
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t('DASHBOARD.TOOLTIP.MPD_GROWTH')}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="text-white text-xs bg-white/20 p-1 rounded-md">
                      {currencies.find((c) => c.id === selectedCurrencyId)
                        ?.name || ''}
                    </span>
                    <div className="text-4xl font-bold mt-2 mb-1">
                      {(pointStatistic?.mpdCard?.total ?? 0).toLocaleString(
                        'vi-VN',
                      )}
                    </div>
                    <div className="text-white/80 text-sm mb-4">
                      {t('DASHBOARD.POINT_STATS.MONTHLY_DEDUCTED')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top 100 Users Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <TrophyIcon />
                {t('DASHBOARD.TOP_100_USERS.TITLE')}
              </h2>
              <PermissionGuard requiredRoles={[UserRole.ADMIN]}>
                <Button
                  onClick={handleExportTop100Users}
                  disabled={
                    exportTop100UsersMutation.isPending ||
                    isLoadingTop100Users ||
                    top100Users.length === 0
                  }
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  {exportTop100UsersMutation.isPending
                    ? t('DASHBOARD.TOP_100_USERS.EXPORTING') || 'Exporting...'
                    : t('DASHBOARD.TOP_100_USERS.EXPORT')}
                </Button>
              </PermissionGuard>
            </div>

            {isLoadingTop100Users ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <LoaderCircleIcon className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : top100Users.length > 0 ? (
              <Card>
                <CardContent className="p-4">
                  <div
                    className="overflow-y-auto"
                    style={{ maxHeight: '480px' }}
                  >
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b">
                          <th className="text-center py-3 px-4 font-medium text-muted-foreground uppercase text-xs w-15">
                            {t('DASHBOARD.TOP_100_USERS.RANK')}
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground uppercase text-xs">
                            {t('DASHBOARD.TOP_100_USERS.USER_ID')}
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground uppercase text-xs">
                            {t('DASHBOARD.TOP_100_USERS.PARTNER_USER_ID')}
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground uppercase text-xs">
                            {t('DASHBOARD.TOP_100_USERS.FULL_NAME')}
                          </th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground uppercase text-xs">
                            {t('DASHBOARD.TOP_100_USERS.TOTAL_POINTS')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {top100Users.map((user) => (
                          <tr
                            key={`${user.userId}-${user.rank}`}
                            className="border-b hover:bg-muted/50"
                          >
                            <td className="text-center p-4">
                              <div className="inline-flex items-center justify-center">
                                {user.rank === 1 ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-400 text-white font-bold rounded-full text-xs">
                                    1
                                  </span>
                                ) : user.rank === 2 ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-400 text-white font-bold rounded-full text-xs">
                                    2
                                  </span>
                                ) : user.rank === 3 ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 bg-orange-600 text-white font-bold rounded-full text-xs">
                                    3
                                  </span>
                                ) : (
                                  <span className="text-gray-600 font-medium">
                                    {user.rank}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="text-left p-4 font-medium text-gray-900">
                              {user.userId}
                            </td>
                            <td className="text-left p-4 text-gray-700">
                              {user.partnerUserId}
                            </td>
                            <td className="text-left p-4 font-medium text-gray-900">
                              {user.fullName}
                            </td>
                            <td className="text-right p-4 text-blue-600 font-bold">
                              {user.totalPoints.toLocaleString('vi-VN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium text-foreground mb-2">
                    {t('DASHBOARD.TOP_100_USERS.NO_DATA_TITLE')}
                  </p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {t('DASHBOARD.TOP_100_USERS.NO_DATA_DESCRIPTION')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Campaigns Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">
              {t('DASHBOARD.CAMPAIGN_STATS.TITLE')}
            </h2>

            {/* Charts Section - Campaign Statistics */}
            {isLoadingCampaignStatistics ? (
              <div className="grid grid-cols-1 gap-4">
                <Card className="w-fit">
                  <CardContent className="flex items-center justify-center py-12 px-20">
                    <LoaderCircleIcon className="h-8 w-8 animate-spin text-muted-foreground" />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4">
                  {/* Campaign Statistics */}
                  <Card className="w-fit">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-start gap-3">
                        {/* Icon */}
                        <Target
                          size={36}
                          className="text-purple-600 dark:text-purple-400"
                        />

                        {/* Number */}
                        <p className="text-3xl font-bold text-foreground leading-none">
                          {campaignStatistics?.activeCampaigns || 0}
                        </p>

                        {/* Labels */}
                        <div className="space-y-1">
                          <p className="text-base text-muted-foreground">
                            {t('DASHBOARD.CAMPAIGN_STATS.ACTIVE_CAMPAIGNS')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t('DASHBOARD.CAMPAIGN_STATS.TOTAL_CAMPAIGNS')}:{' '}
                            {campaignStatistics?.totalCampaigns || 0} campaigns
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Campaign Details Table */}
                {campaignTableData.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {t('DASHBOARD.CAMPAIGN_STATS.CAMPAIGN_DETAILS')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4 font-medium text-muted-foreground uppercase text-xs">
                                {t('DASHBOARD.CAMPAIGN_STATS.CAMPAIGN_NAME')}
                              </th>
                              <th className="text-center py-3 px-4 font-medium text-muted-foreground uppercase text-xs">
                                {t('DASHBOARD.CAMPAIGN_STATS.USERS')}
                              </th>
                              <th className="text-center py-3 px-4 font-medium text-muted-foreground uppercase text-xs">
                                {t('DASHBOARD.CAMPAIGN_STATS.EXECUTIONS')}
                              </th>
                              <th className="text-center py-3 px-4 font-medium text-muted-foreground uppercase text-xs">
                                {t('DASHBOARD.CAMPAIGN_STATS.POINTS_EARNED')}
                              </th>
                              <th className="text-right py-3 px-4 font-medium text-muted-foreground uppercase text-xs w-[200px]">
                                % {t('DASHBOARD.CAMPAIGN_STATS.BUDGET_USED')}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {campaignTableData.map((campaign) => {
                              const budgetPercentage =
                                campaign.budgetOrigin > 0
                                  ? (campaign.pointsEarned /
                                      campaign.budgetOrigin) *
                                    100
                                  : 0;

                              // Determine color based on remaining percentage
                              let progressColor = 'bg-red-500';
                              if (budgetPercentage <= 59) {
                                progressColor = 'bg-green-500';
                              } else if (budgetPercentage <= 79) {
                                progressColor = 'bg-orange-500';
                              } else if (budgetPercentage <= 100) {
                                progressColor = 'bg-red-500';
                              }

                              return (
                                <tr
                                  key={campaign.campaignId}
                                  className="border-b hover:bg-muted/50"
                                >
                                  <td className="text-left p-4 font-medium">
                                    {campaign.campaignName}
                                  </td>
                                  <td className="text-center p-4">
                                    {campaign.userCount.toLocaleString('vi-VN')}
                                  </td>
                                  <td className="text-center p-4">
                                    {campaign.executionCount.toLocaleString(
                                      'vi-VN',
                                    )}
                                  </td>
                                  <td className="text-center p-4 text-blue-600 font-medium">
                                    {campaign.pointsEarned.toLocaleString(
                                      'vi-VN',
                                    )}
                                  </td>
                                  <td className="p-4">
                                    <div className="flex flex-col items-end gap-1">
                                      <div className="flex items-center gap-2 w-full">
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full ${progressColor} transition-all`}
                                            style={{
                                              width: `${Math.min(budgetPercentage, 100)}%`,
                                            }}
                                          />
                                        </div>
                                        <span
                                          className={`text-sm font-semibold min-w-[45px] text-right ${
                                            budgetPercentage <= 59
                                              ? 'text-green-500'
                                              : budgetPercentage <= 79
                                                ? 'text-orange-500'
                                                : budgetPercentage <= 100
                                                  ? 'text-red-500'
                                                  : 'text-red-500'
                                          }`}
                                        >
                                          {budgetPercentage.toFixed(1)}%
                                        </span>
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        Budget:{' '}
                                        {campaign.budgetOrigin.toLocaleString(
                                          'vi-VN',
                                        )}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {t('DASHBOARD.CAMPAIGN_STATS.CAMPAIGN_DETAILS')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                          <Target className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-lg font-medium text-foreground mb-2">
                          {t('DASHBOARD.CAMPAIGN_STATS.NO_DATA_TITLE')}
                        </p>
                        <p className="text-sm text-muted-foreground max-w-md">
                          {t('DASHBOARD.CAMPAIGN_STATS.NO_DATA_DESCRIPTION')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </Container>

      {/* Customer Dashboard Chart Dialog */}
      <Dialog
        open={openDialog === 'customer'}
        onOpenChange={(open) =>
          dispatchChartState({
            type: 'dialogChanged',
            dialog: 'customer',
            open,
          })
        }
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t('DASHBOARD.CUSTOMER_DASHBOARD.TITLE')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Date Range Picker for Chart */}
            <div className="flex justify-end">
              <DateRangePicker
                start={chartDateRange?.from || null}
                end={chartDateRange?.to || null}
                onApply={(range) =>
                  dispatchChartState({
                    type: 'dateRangeChanged',
                    field: 'chartDateRange',
                    value: range,
                  })
                }
              />
            </div>

            {/* Chart */}
            <div>
              {isLoadingCustomerDashboard ? (
                <div className="flex items-center justify-center h-100">
                  <LoaderCircleIcon className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : customerDashboard.length > 0 ? (
                <Chart
                  options={customerChartOptions}
                  series={customerChartSeries}
                  type="line"
                  height={400}
                />
              ) : (
                <div className="flex items-center justify-center h-100 text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DPE Chart Dialog */}
      <Dialog
        open={openDialog === 'dpe'}
        onOpenChange={(open) =>
          dispatchChartState({
            type: 'dialogChanged',
            dialog: 'dpe',
            open,
          })
        }
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>DPE - Daily Points Earned</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end">
              <DateRangePicker
                start={dpeChartDateRange?.from || null}
                end={dpeChartDateRange?.to || null}
                onApply={(range) =>
                  dispatchChartState({
                    type: 'dateRangeChanged',
                    field: 'dpeChartDateRange',
                    value: range,
                  })
                }
              />
            </div>
            <div>
              {isLoadingDpeChart ? (
                <div className="flex items-center justify-center h-100">
                  <LoaderCircleIcon className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : dpeChartData.length > 0 ? (
                <Chart
                  options={dpeChartOptions}
                  series={dpeChartSeries}
                  type="line"
                  height={400}
                />
              ) : (
                <div className="flex items-center justify-center h-100 text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MPE Chart Dialog */}
      <Dialog
        open={openDialog === 'mpe'}
        onOpenChange={(open) =>
          dispatchChartState({
            type: 'dialogChanged',
            dialog: 'mpe',
            open,
          })
        }
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>MPE - Monthly Points Earned</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end">
              <MonthRangePicker
                start={mpeChartDateRange?.from || null}
                end={mpeChartDateRange?.to || null}
                onApply={(range) =>
                  dispatchChartState({
                    type: 'dateRangeChanged',
                    field: 'mpeChartDateRange',
                    value: range,
                  })
                }
              />
            </div>
            <div>
              {isLoadingMpeChart ? (
                <div className="flex items-center justify-center h-100">
                  <LoaderCircleIcon className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : mpeChartData.length > 0 ? (
                <Chart
                  options={mpeChartOptions}
                  series={mpeChartSeries}
                  type="line"
                  height={400}
                />
              ) : (
                <div className="flex items-center justify-center h-100 text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DPD Chart Dialog */}
      <Dialog
        open={openDialog === 'dpd'}
        onOpenChange={(open) =>
          dispatchChartState({
            type: 'dialogChanged',
            dialog: 'dpd',
            open,
          })
        }
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>DPD - Daily Points Deducted</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end">
              <DateRangePicker
                start={dpdChartDateRange?.from || null}
                end={dpdChartDateRange?.to || null}
                onApply={(range) =>
                  dispatchChartState({
                    type: 'dateRangeChanged',
                    field: 'dpdChartDateRange',
                    value: range,
                  })
                }
              />
            </div>
            <div>
              {isLoadingDpdChart ? (
                <div className="flex items-center justify-center h-100">
                  <LoaderCircleIcon className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : dpdChartData.length > 0 ? (
                <Chart
                  options={dpdChartOptions}
                  series={dpdChartSeries}
                  type="line"
                  height={400}
                />
              ) : (
                <div className="flex items-center justify-center h-100 text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MPD Chart Dialog */}
      <Dialog
        open={openDialog === 'mpd'}
        onOpenChange={(open) =>
          dispatchChartState({
            type: 'dialogChanged',
            dialog: 'mpd',
            open,
          })
        }
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>MPD - Monthly Points Deducted</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end">
              <MonthRangePicker
                start={mpdChartDateRange?.from || null}
                end={mpdChartDateRange?.to || null}
                onApply={(range) =>
                  dispatchChartState({
                    type: 'dateRangeChanged',
                    field: 'mpdChartDateRange',
                    value: range,
                  })
                }
              />
            </div>
            <div>
              {isLoadingMpdChart ? (
                <div className="flex items-center justify-center h-100">
                  <LoaderCircleIcon className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : mpdChartData.length > 0 ? (
                <Chart
                  options={mpdChartOptions}
                  series={mpdChartSeries}
                  type="line"
                  height={400}
                />
              ) : (
                <div className="flex items-center justify-center h-100 text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { DashboardPage };
