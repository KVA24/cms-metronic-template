import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  Campaign,
  campaignApi,
  CampaignStatus,
} from '@/features/campaigns/api/campaignApi';
import {
  useCampaignList,
  useDeleteCampaign,
  useUpdateCampaignStatus,
} from '@/features/campaigns/hooks/use-campaign-queries';
import { AddBudgetDialog } from '@/features/campaigns/ui/add-budget-dialog';
import { useDebounce, useTranslations } from '@/shared/hooks';
import { formatNumber } from '@/shared/lib';
import { formatDate } from '@/shared/lib/date-utils';
import { UserRole } from '@/shared/lib/rbac';
import { storage } from '@/shared/lib/storage';
import { usePaginationParams, useUrlParams } from '@/shared/lib/url-params';
import {
  useAddBudgetDialog,
  useCampaignDeleteDialog,
} from '@/shared/stores/ui-store';
import { Alert, AlertIcon, AlertTitle } from '@/shared/ui/atoms/alert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/atoms/alert-dialog';
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
import { DataGridPagination } from '@/shared/ui/atoms/data-grid-pagination';
import { DataGridTable } from '@/shared/ui/atoms/data-grid-table';
import { Input } from '@/shared/ui/atoms/input';
import { Label } from '@/shared/ui/atoms/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/atoms/popover';
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
  ToolbarActions,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/shared/ui/molecules/common/toolbar';
import { Container } from '@/shared/ui/molecules/container';
import { PermissionGuard } from '@/shared/ui/molecules/permission-guard';
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
import {
  AlertCircle,
  Copy,
  DollarSign,
  Edit,
  Eye,
  LoaderCircleIcon,
  Plus,
  RecycleIcon,
  Search,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

function StatusBadge({ status }: { status: CampaignStatus }) {
  const statusVariants: Record<
    CampaignStatus,
    'success' | 'secondary' | 'warning' | 'destructive'
  > = {
    DRAFT: 'secondary',
    ACTIVE: 'success',
    SCHEDULED: 'warning',
    ENDED: 'destructive',
    PAUSED: 'secondary',
  };

  return <Badge variant={statusVariants[status]}>{status}</Badge>;
}

export function CampaignListPage() {
  const navigate = useNavigate();
  const { t } = useTranslations();

  const { page, limit, setPage, setLimit } = usePaginationParams();
  const { getParam, updateParams } = useUrlParams({
    defaults: { page: 0, limit: 10 },
  });

  const [localSearch, setLocalSearch] = useState({
    searchName: getParam('name') || '',
    status: getParam('status') || '',
  });

  const debouncedSearchName = useDebounce(localSearch.searchName, 500);
  const debouncedStatus = useDebounce(localSearch.status, 500);

  // Update URL params when filters change
  useEffect(() => {
    updateParams({
      name: debouncedSearchName || null,
      status: debouncedStatus || null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchName, debouncedStatus]);

  // Memoize query params to prevent unnecessary refetches
  const queryParams = useMemo(
    () => ({
      page,
      size: limit,
      name: debouncedSearchName || undefined,
      status: debouncedStatus ? (debouncedStatus as CampaignStatus) : undefined,
    }),
    [page, limit, debouncedSearchName, debouncedStatus],
  );

  // React Query - Fetch campaign list
  const {
    data: campaignListData,
    isLoading,
    error: queryError,
  } = useCampaignList(queryParams);

  const campaigns = campaignListData?.data || [];
  const total = campaignListData?.pageInfo?.totalCount || 0;
  const error = queryError?.message || null;

  // React Query - Mutations
  const deleteMutation = useDeleteCampaign();
  const updateStatusMutation = useUpdateCampaignStatus();

  // UI state from Zustand
  const deleteDialog = useCampaignDeleteDialog();
  const addBudgetDialog = useAddBudgetDialog();
  const [deleteOtp, setDeleteOtp] = useState('');
  const [statusPopoverCampaignId, setStatusPopoverCampaignId] = useState<
    Campaign['id'] | null
  >(null);

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

  const handlePaginationChange = (updater: any) => {
    const newPagination =
      typeof updater === 'function' ? updater(pagination) : updater;

    if (newPagination.pageIndex !== page) {
      setPage(newPagination.pageIndex);
    }
    if (newPagination.pageSize !== limit) {
      setLimit(newPagination.pageSize);
    }
  };

  const handleAdd = () => {
    storage.setItem('campaign_form_draft', '');
    navigate('/campaigns/create');
  };

  const handleView = (campaign: Campaign) => {
    navigate(`/campaigns/view/${campaign.id}`);
  };

  const handleEdit = (campaign: Campaign) => {
    navigate(`/campaigns/edit/${campaign.id}`);
  };

  const handleCopy = async (campaign: Campaign) => {
    try {
      const detailData = await campaignApi.getDetail(campaign.id);

      // Format dates to Date objects for the form
      const formattedData = {
        ...detailData,
        startAt: detailData.startAt ? new Date(detailData.startAt) : undefined,
        endAt: detailData.endAt ? new Date(detailData.endAt) : undefined,
        limitationType: detailData.limitationType
          ? detailData.limitationType
          : '',
        rule: detailData.rules ? detailData.rules[0] : undefined,
      };

      storage.setItem('campaign_form_draft', JSON.stringify(formattedData));
      navigate('/campaigns/create');
    } catch (error) {
      console.error('Failed to copy campaign:', error);
      toast.error('Failed to copy campaign');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteOtp.trim()) {
      return;
    }

    if (deleteDialog.campaign) {
      try {
        await deleteMutation.mutateAsync({
          id: deleteDialog.campaign.id,
          otpCode: deleteOtp,
        });
        setDeleteOtp('');
        deleteDialog.close();
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  const handleStatusChange = async (
    campaignId: string,
    targetStatus: CampaignStatus,
  ) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: campaignId,
        targetStatus,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Get available status transitions based on current status
  const getAvailableStatuses = (
    currentStatus: CampaignStatus,
  ): CampaignStatus[] => {
    const transitions: Record<CampaignStatus, CampaignStatus[]> = {
      DRAFT: ['SCHEDULED'],
      SCHEDULED: ['ACTIVE', 'PAUSED'],
      ACTIVE: ['ENDED', 'PAUSED'],
      PAUSED: ['ACTIVE', 'SCHEDULED'],
      ENDED: [],
    };
    return transitions[currentStatus] || [];
  };

  const columns = useMemo<ColumnDef<Campaign>[]>(
    () => [
      // {
      //   id: 'id',
      //   accessorFn: (row) => row.id,
      //   header: ({ column }) => (
      //     <DataGridColumnHeader title={t('COMMON.ID')} column={column} />
      //   ),
      //   cell: (info) => (
      //     <span className="font-mono text-xs">{info.row.original.id}</span>
      //   ),
      //   enableSorting: true,
      //   sortingFn: 'basic',
      //   size: 80,
      // },
      {
        id: 'name',
        accessorFn: (row) => row.name,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.NAME')} column={column} />
        ),
        cell: (info) => (
          <span className="font-medium line-clamp-3">
            {info.row.original.name}
          </span>
        ),
        enableSorting: true,
        sortingFn: 'text',
        size: 150,
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
          <div className="text-sm flex flex-col">
            <span>{formatDate(info.row.original.createdAt, 'dd/MM/yyyy')}</span>
            <span>{formatDate(info.row.original.createdAt, 'HH:mm:ss')}</span>
          </div>
        ),
        enableSorting: true,
        sortingFn: 'datetime',
        size: 100,
      },
      {
        id: 'startDate',
        accessorFn: (row) => row.startAt,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('CAMPAIGNS.PAGE.TABLE.START_DATE')}
            column={column}
          />
        ),
        cell: (info) => (
          <div className="text-sm flex flex-col">
            <span>{formatDate(info.row.original.startAt, 'dd/MM/yyyy')}</span>
            <span>{formatDate(info.row.original.startAt, 'HH:mm:ss')}</span>
          </div>
        ),
        enableSorting: true,
        sortingFn: 'datetime',
        size: 100,
      },
      {
        id: 'endDate',
        accessorFn: (row) => row.endAt,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('CAMPAIGNS.PAGE.TABLE.END_DATE')}
            column={column}
          />
        ),
        cell: (info) => {
          const campaign = info.row.original;
          return campaign.isNoEndDate ? (
            <Badge variant="secondary">
              {t('CAMPAIGNS.PAGE.TABLE.NO_END')}
            </Badge>
          ) : (
            <div className="text-sm flex flex-col">
              <span>{formatDate(campaign.endAt, 'dd/MM/yyyy')}</span>
              <span>{formatDate(campaign.endAt, 'HH:mm:ss')}</span>
            </div>
          );
        },
        enableSorting: true,
        sortingFn: 'datetime',
        size: 100,
      },
      {
        id: 'budgetOrigin',
        accessorFn: (row) => row.budgetOrigin,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('CAMPAIGNS.PAGE.TABLE.BUDGET')}
            column={column}
          />
        ),
        cell: (info) => {
          const campaign = info.row.original.rules[0];
          const budgetRemaining = campaign.budget || 0;
          const budgetOrigin = campaign.budgetOrigin || 0;
          const percentage =
            budgetOrigin > 0
              ? ((budgetRemaining / budgetOrigin) * 100).toFixed(2)
              : '0.0';

          return (
            <div className="flex flex-col text-sm">
              <span className="font-medium">{percentage}%</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatNumber(budgetRemaining)} / {formatNumber(budgetOrigin)}
              </span>
            </div>
          );
        },
        enableSorting: true,
        sortingFn: 'text',
        size: 100,
      },
      {
        id: 'status',
        accessorFn: (row) => row.status,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.STATUS_1')} column={column} />
        ),
        cell: (info) => <StatusBadge status={info.row.original.status} />,
        enableSorting: true,
        sortingFn: 'text',
        size: 100,
      },
      {
        id: 'actions',
        header: () => (
          <span className="text-right block">{t('COMMON.ACTIONS')}</span>
        ),
        cell: (info) => {
          const campaign = info.row.original;
          const isUpdatingStatus = updateStatusMutation.isPending;
          const isOpen = statusPopoverCampaignId === campaign.id;
          const isActive = info.row.original.status === "ACTIVE";

          return (
            <div className="flex justify-end">
              {campaign.status !== 'ENDED' && (
                <PermissionGuard
                  requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}
                >
                  <Popover
                    open={isOpen}
                    onOpenChange={(open) =>
                      setStatusPopoverCampaignId(open ? campaign.id : null)
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Change status"
                        disabled={isUpdatingStatus}
                      >
                        {isUpdatingStatus ? (
                          <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <RecycleIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-40 p-1">
                      <div className="space-y-1">
                        {getAvailableStatuses(campaign.status).map((status) => (
                          <Button
                            key={status}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs"
                            onClick={() => {
                              handleStatusChange(campaign.id, status);
                              setStatusPopoverCampaignId(null);
                            }}
                            disabled={isUpdatingStatus}
                          >
                            {t(`CAMPAIGNS.PAGE.STATUS_${status}`)}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </PermissionGuard>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleView(campaign)}
                aria-label="View"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <PermissionGuard
                requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addBudgetDialog.open(campaign)}
                  aria-label="Add Budget"
                >
                  <DollarSign className="h-4 w-4" />
                </Button>
              </PermissionGuard>
              <PermissionGuard
                requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(campaign)}
                  aria-label="Copy"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </PermissionGuard>
              <PermissionGuard
                requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(campaign)}
                  aria-label="Edit"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </PermissionGuard>
              {!isActive &&
                <PermissionGuard
                  requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteDialog.open(campaign)}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </PermissionGuard>
              }
            </div>
          );
        },
        enableSorting: false,
        size: 150,
      },
    ],
    [
      deleteDialog,
      addBudgetDialog,
      handleCopy,
      handleEdit,
      handleStatusChange,
      handleView,
      statusPopoverCampaignId,
      t,
      updateStatusMutation.isPending,
    ],
  );

  const table = useReactTable({
    columns,
    data: campaigns,
    pageCount: total > 0 ? Math.ceil(total / limit) : 0,
    getRowId: (row: Campaign) => row.id.toString(),
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
    manualPagination: true,
  });

  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle />
          </ToolbarHeading>
          <ToolbarActions>
            <PermissionGuard
              requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}
            >
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                {t('CAMPAIGNS.PAGE.ADD_BUTTON')}
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
                <AlertCircle />
              </AlertIcon>
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}

          <DataGrid
            table={table}
            recordCount={total || 0}
            isLoading={isLoading}
            loadingMode="skeleton"
            emptyMessage={t('CAMPAIGNS.PAGE.TABLE.EMPTY')}
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
                <CardTitle>{t('CAMPAIGNS.PAGE.TABLE.TITLE')}</CardTitle>
                <CardToolbar>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t(
                          'CAMPAIGNS.PAGE.SEARCH_NAME_PLACEHOLDER',
                        )}
                        value={localSearch.searchName}
                        onChange={(e) =>
                          setLocalSearch({
                            ...localSearch,
                            searchName: e.target.value,
                          })
                        }
                        className="pl-10"
                      />
                    </div>

                    <div>
                      <Select
                        value={localSearch.status || ''}
                        onValueChange={(value) =>
                          setLocalSearch({ ...localSearch, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('CAMPAIGNS.PAGE.STATUS_PLACEHOLDER')}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">
                            {t('CAMPAIGNS.PAGE.STATUS_DRAFT')}
                          </SelectItem>
                          <SelectItem value="ACTIVE">
                            {t('COMMON.ACTIVE')}
                          </SelectItem>
                          <SelectItem value="SCHEDULED">
                            {t('CAMPAIGNS.PAGE.STATUS_SCHEDULED')}
                          </SelectItem>
                          <SelectItem value="ENDED">
                            {t('CAMPAIGNS.PAGE.STATUS_ENDED')}
                          </SelectItem>
                          <SelectItem value="PAUSED">
                            {t('CAMPAIGNS.PAGE.STATUS_PAUSED')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
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
              <CardFooter className="flex items-center justify-between">
                <DataGridPagination />
              </CardFooter>
            </Card>
          </DataGrid>
        </div>
      </Container>

      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setDeleteOtp('');
            deleteDialog.close();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('CAMPAIGNS.PAGE.DELETE.TITLE')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('COMMON.ARE_YOU_SURE_YOU_WANT_TO_DELETE_NAME_THIS_ACTION_C', {
                name: deleteDialog.campaign?.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="delete-otp">{t('COMMON.OTP_CODE')}</Label>
            <Input
              id="delete-otp"
              type="text"
              placeholder={t('COMMON.ENTER_6_DIGIT_OTP')}
              value={deleteOtp}
              onChange={(e) => setDeleteOtp(e.target.value)}
              disabled={deleteMutation.isPending}
              maxLength={6}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t('COMMON.CANCEL')}
            </AlertDialogCancel>
            <Button
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              disabled={deleteMutation.isPending || !deleteOtp.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                  {t('COMMON.DELETING')}
                </span>
              ) : (
                t('COMMON.DELETE')
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddBudgetDialog />
    </Fragment>
  );
}

export default CampaignListPage;
