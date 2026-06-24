import { useMemo, useState } from 'react';
import {
  useActiveUsersStatistics,
  useDashboardActiveUsers,
  useDashboardPoints,
  usePointsBudgetStatistics,
  useTierStatistics,
} from '@/features/campaigns/hooks/use-campaign-queries';
import { useTranslations } from '@/shared/hooks';
import { Button } from '@/shared/ui/atoms/button.tsx';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/atoms/card';
import DateRangePicker from '@/shared/ui/atoms/date-range-picker';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/atoms/tooltip';
import { format, startOfMonth } from 'date-fns';
import { Award, Download, LoaderCircleIcon, RefreshCw, Users } from 'lucide-react';
import Chart from 'react-apexcharts';

interface CampaignDashboardTabProps {
  campaignId: string;
}

export function CampaignDashboardTab({
  campaignId,
}: CampaignDashboardTabProps) {
  const { t } = useTranslations();

  // Date ranges for charts - default from start of month to today
  const [usersDateRange, setUsersDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const [pointsDateRange, setPointsDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  // Format dates for API
  const usersFromDate = format(usersDateRange.from, 'yyyy-MM-dd');
  const usersToDate = format(usersDateRange.to, 'yyyy-MM-dd');
  const pointsFromDate = format(pointsDateRange.from, 'yyyy-MM-dd');
  const pointsToDate = format(pointsDateRange.to, 'yyyy-MM-dd');

  // Fetch data from APIs with default values
  const {
    data: activeUsersData = {
      totalUniqueUsers: 0,
      dauToday: 0,
      dauGrowthRate: 0,
      mauThisMonth: 0,
      mauGrowthRate: 0,
    },
    isLoading: isLoadingActiveUsers,
    refetch: refetchActiveUsers,
  } = useActiveUsersStatistics(campaignId);
  
  const {
    data: tierData = {
      tiers: [],
      totalCount: 0,
    },
    isLoading: isLoadingTier,
    refetch: refetchTier,
  } = useTierStatistics(campaignId);
  
  const {
    data: pointsBudgetData = {
      totalPoints: 0,
      avgPointsPerUser: 0,
      budgetUsedRate: 0,
      budget: 0,
      budgetOrigin: 0,
    },
    isLoading: isLoadingPointsBudget,
    refetch: refetchPointsBudget,
  } = usePointsBudgetStatistics(campaignId);
  
  const {
    data: dashboardPointsData = {
      totalPoints: 0,
      daily: [],
    },
    isLoading: isLoadingDashboardPoints,
    refetch: refetchDashboardPoints,
  } = useDashboardPoints(campaignId, pointsFromDate, pointsToDate);
  
  const {
    data: dashboardUsersData = {
      totalUniqueUsers: 0,
      daily: [],
    },
    isLoading: isLoadingDashboardUsers,
    refetch: refetchDashboardUsers,
  } = useDashboardActiveUsers(campaignId, usersFromDate, usersToDate);

  // Refresh all data
  const handleRefreshAll = () => {
    refetchActiveUsers();
    refetchTier();
    refetchPointsBudget();
    refetchDashboardPoints();
    refetchDashboardUsers();
  };

  // Prepare tier chart data
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

  const tierEntries = useMemo(() => {
    if (!tierData?.tiers || tierData.tiers.length === 0) return [];

    return tierData.tiers.map((tier, i) => ({
      name: tier.tierName || 'Unknown',
      code: tier.tierCode || '',
      count: tier.count || 0,
      percentage: (tier.percentage || 0).toFixed(2),
      color:
        TIER_COLORS[tier.tierName] ??
        TIER_COLOR_FALLBACKS[i % TIER_COLOR_FALLBACKS.length],
    }));
  }, [tierData]);

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
                label: 'Transactions',
                fontSize: '13px',
                color: '#6B7280',
                fontWeight: 400,
                formatter: () =>
                  (tierData?.totalCount ?? 0).toLocaleString('vi-VN'),
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
          formatter: (val: number) => `${val.toLocaleString('vi-VN')} transactions`,
        },
      },
    }),
    [tierEntries, tierData],
  );

  const tierChartSeries = useMemo(
    () => tierEntries.map((t) => t.count),
    [tierEntries],
  );

  const usersChartOptions = useMemo(() => {
    const categories =
      dashboardUsersData?.daily?.map((d) => {
        const date = new Date(d.date);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }) ?? [];

    return {
      chart: {
        type: 'bar' as const,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false,
            customIcons: [],
          },
        },
      },
      plotOptions: { bar: { columnWidth: '60%', borderRadius: 2 } },
      colors: ['#3B82F6', '#3B82F6'],
      fill: { opacity: [0.35, 1] },
      dataLabels: { enabled: false },
      stroke: { show: true, width: [0, 2], colors: ['transparent', '#3B82F6'] },
      xaxis: {
        categories,
        tickAmount: Math.min(6, categories.length),
        labels: {
          style: { fontSize: '11px' },
          rotate: -45,
          rotateAlways: false,
        },
      },
      yaxis: {
        labels: {
          style: { fontSize: '11px' },
          formatter: (v: number) => {
            if (v >= 1000000) {
              return `${(v / 1000000).toFixed(1)}M`;
            } else if (v >= 1000) {
              return `${Math.floor(v / 1000)}k`;
            }
            return Math.floor(v).toString();
          },
        },
        forceNiceScale: true,
        decimalsInFloat: 0,
      },
      tooltip: {
        theme: 'light' as const,
        y: { formatter: (v: number) => `${v.toLocaleString('vi-VN')} users` },
        x: {
          formatter: (_val: number, opts: any) => {
            const date = dashboardUsersData?.daily?.[opts.dataPointIndex]?.date;
            return date ? format(new Date(date), 'dd/MM/yyyy') : '';
          },
        },
      },
      legend: {
        show: true,
        position: 'top' as const,
        markers: {
          customHTML: [
            () =>
              `<span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:#3B82F6;opacity:0.35;vertical-align:middle;"></span>`,
            () =>
              `<span style="display:inline-block;width:16px;height:2px;background:#3B82F6;vertical-align:middle;border-radius:2px;"></span>`,
          ] as any,
        },
      },
    };
  }, [dashboardUsersData]);

  const usersChartSeries = useMemo(() => {
    const data = dashboardUsersData?.daily?.map((d) => d.userCount || 0) ?? [];
    return [
      {
        name: t('CAMPAIGNS.DASHBOARD.ACTIVE_USERS_BARS'),
        type: 'bar' as const,
        data,
      },
      {
        name: t('CAMPAIGNS.DASHBOARD.TREND_LINE'),
        type: 'line' as const,
        data,
      },
    ];
  }, [dashboardUsersData, t]);

  const pointsChartOptions = useMemo(() => {
    const categories =
      dashboardPointsData?.daily?.map((d) => {
        const date = new Date(d.date);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }) ?? [];

    return {
      chart: {
        type: 'bar' as const,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false,
            customIcons: [],
          },
        },
      },
      plotOptions: { bar: { columnWidth: '60%', borderRadius: 2 } },
      colors: ['#10B981', '#10B981'],
      fill: { opacity: [0.35, 1] },
      dataLabels: { enabled: false },
      stroke: { show: true, width: [0, 2], colors: ['transparent', '#10B981'] },
      xaxis: {
        categories,
        tickAmount: Math.min(6, categories.length),
        labels: {
          style: { fontSize: '11px' },
          rotate: -45,
          rotateAlways: false,
        },
      },
      yaxis: {
        labels: {
          style: { fontSize: '11px' },
          formatter: (v: number) => {
            if (v >= 1000000) {
              return `${(v / 1000000).toFixed(1)}M`;
            } else if (v >= 1000) {
              return `${Math.floor(v / 1000)}k`;
            }
            return Math.floor(v).toString();
          },
        },
        forceNiceScale: true,
        decimalsInFloat: 0,
      },
      tooltip: {
        theme: 'light' as const,
        y: { formatter: (v: number) => `${v.toLocaleString('vi-VN')} pts` },
        x: {
          formatter: (_val: number, opts: any) => {
            const date = dashboardPointsData?.daily?.[opts.dataPointIndex]?.date;
            return date ? format(new Date(date), 'dd/MM/yyyy') : '';
          },
        },
      },
      legend: {
        show: true,
        position: 'top' as const,
        markers: {
          customHTML: [
            () =>
              `<span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:#10B981;opacity:0.35;vertical-align:middle;"></span>`,
            () =>
              `<span style="display:inline-block;width:16px;height:2px;background:#10B981;vertical-align:middle;border-radius:2px;"></span>`,
          ] as any,
        },
      },
    };
  }, [dashboardPointsData]);

  const pointsChartSeries = useMemo(() => {
    const data = dashboardPointsData?.daily?.map((d) => d.totalPoints || 0) ?? [];
    return [
      {
        name: t('CAMPAIGNS.DASHBOARD.POINTS_BARS'),
        type: 'bar' as const,
        data,
      },
      {
        name: t('CAMPAIGNS.DASHBOARD.TREND_LINE'),
        type: 'line' as const,
        data,
      },
    ];
  }, [dashboardPointsData, t]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div />
        <div className="flex items-center gap-3">
          <Button onClick={handleRefreshAll} variant={'outline'}>
            <RefreshCw className="w-4 h-4" />
            {t('CAMPAIGNS.DASHBOARD.REFRESH')}
          </Button>
          <Button>
            <Download className="w-4 h-4" />
            {t('CAMPAIGNS.DASHBOARD.EXPORT')}
          </Button>
        </div>
      </div>

      {/* Active Users */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">
          {t('CAMPAIGNS.DASHBOARD.ACTIVE_USERS')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total */}
          {isLoadingActiveUsers ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <LoaderCircleIcon className="h-8 w-8 animate-spin text-muted-foreground"/>
              </CardContent>
            </Card>
          ) : (
            <div
              className="rounded-xl p-6 text-white"
              style={{ background: 'linear-gradient(135deg, #60a5fa, #2563eb)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 opacity-80" />
              </div>
              <p className="text-3xl font-bold mb-1">
                {(activeUsersData?.totalUniqueUsers ?? 0).toLocaleString('vi-VN')}
              </p>
              <p className="text-blue-100 text-sm">
                {t('CAMPAIGNS.DASHBOARD.TOTAL_ACTIVE_USERS')}
              </p>
            </div>
          )}

          {/* DAU */}
          {isLoadingActiveUsers ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <LoaderCircleIcon className="h-8 w-8 animate-spin text-muted-foreground"/>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold cursor-default ${(activeUsersData?.dauGrowthRate ?? 0) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {(activeUsersData?.dauGrowthRate ?? 0) >= 0 ? '+' : ''}
                        {(activeUsersData?.dauGrowthRate ?? 0).toFixed(1)}%
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t('CAMPAIGNS.DASHBOARD.TOOLTIP.DAU_GROWTH')}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {(activeUsersData?.dauToday ?? 0).toLocaleString('vi-VN')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('CAMPAIGNS.DASHBOARD.DAU')}
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-muted-foreground mt-2 cursor-default">
                      {activeUsersData?.totalUniqueUsers
                        ? (
                            activeUsersData.dauToday /
                            activeUsersData.totalUniqueUsers
                          ).toFixed(1)
                        : '0'}
                      % {t('CAMPAIGNS.DASHBOARD.OF_TOTAL')}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('CAMPAIGNS.DASHBOARD.TOOLTIP.DAU_OF_TOTAL')}
                  </TooltipContent>
                </Tooltip>
              </CardContent>
            </Card>
          )}

          {/* MAU */}
          {isLoadingActiveUsers ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <LoaderCircleIcon className="h-8 w-8 animate-spin text-muted-foreground"/>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold cursor-default ${(activeUsersData?.mauGrowthRate ?? 0) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {(activeUsersData?.mauGrowthRate ?? 0) >= 0 ? '+' : ''}
                        {(activeUsersData?.mauGrowthRate ?? 0).toFixed(1)}%
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t('CAMPAIGNS.DASHBOARD.TOOLTIP.MAU_GROWTH')}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {(activeUsersData?.mauThisMonth ?? 0).toLocaleString('vi-VN')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('CAMPAIGNS.DASHBOARD.MAU')}
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-muted-foreground mt-2 cursor-default">
                      {activeUsersData?.totalUniqueUsers
                        ? (
                            activeUsersData.mauThisMonth /
                            activeUsersData.totalUniqueUsers
                          ).toFixed(1)
                        : '0'}
                      % {t('CAMPAIGNS.DASHBOARD.OF_TOTAL')}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('CAMPAIGNS.DASHBOARD.TOOLTIP.MAU_OF_TOTAL')}
                  </TooltipContent>
                </Tooltip>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Users by Tier + Points Earned */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tier Pie */}
        {isLoadingTier ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <LoaderCircleIcon className="h-8 w-8 animate-spin text-muted-foreground"/>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t('CAMPAIGNS.DASHBOARD.ACTIONS_BY_TIER')}
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
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-xs text-gray-400 cursor-default">
                                {tier.percentage}%
                              </p>
                            </TooltipTrigger>
                            <TooltipContent>
                              {t('CAMPAIGNS.DASHBOARD.TOOLTIP.TIER_PERCENTAGE')}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t('CAMPAIGNS.DASHBOARD.NO_TIER_DATA')}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Points Earned */}
        {isLoadingPointsBudget ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <LoaderCircleIcon className="h-8 w-8 animate-spin text-muted-foreground"/>
            </CardContent>
          </Card>
        ) : (
          <div
            className="rounded-xl p-6 text-white"
            style={{ background: 'linear-gradient(135deg, #4ade80, #16a34a)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Award className="w-7 h-7" />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold cursor-default">
                    {(pointsBudgetData?.budgetUsedRate ?? 0).toFixed(2)}%
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {t('CAMPAIGNS.DASHBOARD.TOOLTIP.BUDGET_USAGE')}
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-4xl font-bold mb-2">
              {(pointsBudgetData?.totalPoints ?? 0).toLocaleString('vi-VN')}
            </p>
            <p className="text-sm opacity-90 mb-4">
              {t('CAMPAIGNS.DASHBOARD.TOTAL_POINTS_EARNED')}
            </p>
            <div className="border-t border-white/20 pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-75">
                  {t('CAMPAIGNS.DASHBOARD.AVG_PER_USER')}:
                </span>
                <span className="font-semibold">
                  {Math.floor(
                    pointsBudgetData?.avgPointsPerUser ?? 0,
                  ).toLocaleString('vi-VN')}{' '}
                  pts
                </span>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="opacity-75">
                    {t('CAMPAIGNS.DASHBOARD.BUDGET_USAGE')}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-semibold cursor-default">
                        {(pointsBudgetData?.budgetUsedRate ?? 0).toFixed(1)}%
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t('CAMPAIGNS.DASHBOARD.TOOLTIP.BUDGET_USAGE')}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      (pointsBudgetData?.budgetUsedRate ?? 0) >= 80
                        ? 'bg-red-500'
                        : (pointsBudgetData?.budgetUsedRate ?? 0) >= 60
                          ? 'bg-orange-500'
                          : 'bg-white'
                    }`}
                    style={{
                      width: `${(pointsBudgetData?.budgetUsedRate ?? 0).toFixed(1)}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs mt-2 opacity-75">
                  <span>
                    {((pointsBudgetData?.budgetOrigin || 0) - (pointsBudgetData?.budget || 0)).toLocaleString('vi-VN')} pts
                    used
                  </span>
                  <span>
                    {(pointsBudgetData?.budgetOrigin ?? 0).toLocaleString(
                      'vi-VN',
                    )}{' '}
                    pts total
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Daily Users Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
          <CardTitle className="text-base">
            {t('CAMPAIGNS.DASHBOARD.DAILY_USERS_TREND')}
          </CardTitle>
          <div>
            <DateRangePicker
              start={usersDateRange.from}
              end={usersDateRange.to}
              onApply={(range) => {
                if (range?.from && range?.to) {
                  setUsersDateRange({ from: range.from, to: range.to });
                }
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingDashboardUsers ? (
            <div className="flex items-center justify-center h-[300px]">
              <LoaderCircleIcon className="h-8 w-8 animate-spin text-muted-foreground"/>
            </div>
          ) : (
            <Chart
              options={usersChartOptions}
              series={usersChartSeries}
              type="line"
              height={300}
            />
          )}
        </CardContent>
      </Card>

      {/* Daily Points Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
          <CardTitle className="text-base">
            {t('CAMPAIGNS.DASHBOARD.DAILY_POINTS_TREND')}
          </CardTitle>
          <div>
            <DateRangePicker
              start={pointsDateRange.from}
              end={pointsDateRange.to}
              onApply={(range) => {
                if (range?.from && range?.to) {
                  setPointsDateRange({ from: range.from, to: range.to });
                }
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingDashboardPoints ? (
            <div className="flex items-center justify-center h-[300px]">
              <LoaderCircleIcon className="h-8 w-8 animate-spin text-muted-foreground"/>
            </div>
          ) : (
            <Chart
              options={pointsChartOptions}
              series={pointsChartSeries}
              type="line"
              height={300}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
