import { Fragment, useEffect, useMemo, useState } from 'react';
import { useDebounce } from '@/shared/hooks';
import { useTranslations } from '@/shared/hooks/use-translations';
import { UserRole } from '@/shared/lib/rbac';
import { usePaginationParams, useUrlParams } from '@/shared/lib/url-params';
import {
  useAccountDeleteDialog,
  useAccountDrawer,
  useAccountQRDialog,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/atoms/dialog';
import { Input } from '@/shared/ui/atoms/input';
import { Label } from '@/shared/ui/atoms/label';
import { ScrollArea, ScrollBar } from '@/shared/ui/atoms/scroll-area';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/shared/ui/molecules/common/toolbar';
import { Container } from '@/shared/ui/molecules/container';
import { PermissionGuard } from '@/shared/ui/molecules/permission-guard';
import { StatusBadge } from '@/shared/ui/molecules/status-badge';
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
  LoaderCircleIcon,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-react';
import { Account } from '../api/accountApi';
import {
  useAccountList,
  useAccountQRCode,
  useCreateAccount,
  useDeleteAccount,
  useResetAccountSalt,
  useUpdateAccount,
  useUpdateAccountStatus,
} from '../hooks/use-account-queries';
import { AccountDrawer } from './account-drawer';

export function AccountPage() {
  const { t } = useTranslations();

  // URL params management
  const { page, limit, setPage, setLimit } = usePaginationParams();
  const { getParam, updateParams } = useUrlParams({
    defaults: { page: 0, limit: 10 },
  });

  // Local state for search
  const [localSearch, setLocalSearch] = useState({
    username: getParam('username') || '',
  });

  const debouncedUsername = useDebounce(localSearch.username, 500);

  // Update URL params when filters change
  useEffect(() => {
    updateParams({
      username: debouncedUsername || null,
    });
    // eslint-disable-next-line react-doctor/exhaustive-deps
  }, [debouncedUsername]);

  // Memoize query params to prevent unnecessary refetches
  const queryParams = useMemo(
    () => ({
      page,
      size: limit,
      username: debouncedUsername || undefined,
    }),
    [page, limit, debouncedUsername],
  );

  // React Query - Fetch account list
  const {
    data: accountListData,
    isLoading,
    error: queryError,
  } = useAccountList(queryParams);

  const accounts = accountListData?.data || [];
  const total = accountListData?.pageInfo?.totalCount || 0;
  const error = queryError?.message || null;

  // React Query - Mutations
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const deleteMutation = useDeleteAccount();
  const updateStatusMutation = useUpdateAccountStatus();
  const resetSaltMutation = useResetAccountSalt();

  // UI state from Zustand
  const drawer = useAccountDrawer();
  const deleteDialog = useAccountDeleteDialog();
  const qrDialog = useAccountQRDialog();

  // Local state
  const [deleteOtp, setDeleteOtp] = useState('');
  const [statusConfirm, setStatusConfirm] = useState<{
    account: Account;
    targetStatus: 'ACTIVE' | 'INACTIVE';
  } | null>(null);
  const [statusOtp, setStatusOtp] = useState('');
  const [statusOtpError, setStatusOtpError] = useState('');

  // Fetch QR code when dialog opens
  const { data: qrCodeData, isLoading: isLoadingQR } = useAccountQRCode(
    qrDialog.account?.username,
    {
      enabled: qrDialog.isOpen && !!qrDialog.account,
    },
  );

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

  // Handle pagination change from DataGrid
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
    drawer.open();
  };

  const handleDrawerSubmit = async (data: any) => {
    try {
      if (drawer.account) {
        await updateMutation.mutateAsync({
          id: drawer.account.id,
          data,
        });
        drawer.close();
      } else {
        await createMutation.mutateAsync({ data });
        drawer.close();
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteOtp.trim()) {
      return;
    }

    if (deleteDialog.account) {
      try {
        await deleteMutation.mutateAsync({
          id: deleteDialog.account.id,
          otpCode: deleteOtp,
        });
        setDeleteOtp('');
        deleteDialog.close();
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!statusOtp.trim()) {
      setStatusOtpError(t('COMMON.OTP_REQUIRED') || 'OTP is required');
      return;
    }

    if (statusOtp.length !== 6) {
      setStatusOtpError(
        t('COMMON.OTP_MUST_BE_6_DIGITS') || 'OTP must be 6 digits',
      );
      return;
    }

    if (statusConfirm) {
      try {
        await updateStatusMutation.mutateAsync({
          id: statusConfirm.account.id,
          status: statusConfirm.targetStatus,
          otpCode: statusOtp,
        });
        setStatusConfirm(null);
        setStatusOtp('');
        setStatusOtpError('');
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  const handleResetSalt = async () => {
    if (qrDialog.account?.username) {
      try {
        await resetSaltMutation.mutateAsync({
          username: qrDialog.account.username,
        });
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  // Define columns for DataGrid
  const columns = useMemo<ColumnDef<Account>[]>(
    () => [
      {
        id: 'id',
        accessorFn: (row) => row.id,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.ID')} column={column} />
        ),
        cell: (info) => (
          <span className="font-medium">{info.row.original.id}</span>
        ),
        enableSorting: true,
        sortingFn: 'alphanumeric',
        size: 150,
      },
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
        size: 150,
      },
      {
        id: 'role',
        accessorFn: (row) => row.roles,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.ROLE')} column={column} />
        ),
        cell: (info) => {
          const role = info.row.original.roles[0]?.roleCode;
          const variant =
            role === 'ADMIN'
              ? 'destructive'
              : role === 'AGENCY'
                ? 'primary'
                : 'secondary';
          return <Badge variant={variant}>{role}</Badge>;
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
          const account = info.row.original;
          const isToggling = updateStatusMutation.isPending;
          const isActive = account.status === 'ACTIVE';
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => qrDialog.open(account)}
                aria-label="View QR Code"
                disabled={isToggling}
              >
                <QrCode className="h-4 w-4" />
              </Button>
              <PermissionGuard requiredRoles={[UserRole.ADMIN]}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const isActive = account.status === 'ACTIVE';
                    setStatusConfirm({
                      account,
                      targetStatus: isActive ? 'INACTIVE' : 'ACTIVE',
                    });
                  }}
                  aria-label={isActive ? 'Deactivate' : 'Activate'}
                  disabled={isToggling}
                >
                  {isActive ? (
                    <ToggleRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </PermissionGuard>
              <PermissionGuard requiredRoles={[UserRole.ADMIN]}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteDialog.open(account)}
                  aria-label="Delete"
                  disabled={isToggling}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </PermissionGuard>
            </div>
          );
        },
        enableSorting: false,
        size: 150,
      },
    ],
    [qrDialog, deleteDialog, t, updateStatusMutation],
  );

  // Create table instance
  const table = useReactTable({
    columns,
    data: accounts,
    pageCount: total > 0 ? Math.ceil(total / limit) : 0,
    getRowId: (row: Account) => row.id,
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
            <PermissionGuard requiredRoles={[UserRole.ADMIN]}>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                {t('ACCOUNT.PAGE.ADD_BUTTON')}
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
            emptyMessage={t('ACCOUNT.PAGE.TABLE.EMPTY')}
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
                <CardTitle>{t('ACCOUNT.PAGE.TABLE.TITLE')}</CardTitle>
                <CardToolbar>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t('ACCOUNT.PAGE.SEARCH_PLACEHOLDER')}
                        value={localSearch.username}
                        onChange={(e) =>
                          setLocalSearch({
                            ...localSearch,
                            username: e.target.value,
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

      <AccountDrawer
        key={drawer.account?.id || 'new'}
        open={drawer.isOpen}
        onClose={drawer.close}
        onSubmit={handleDrawerSubmit}
        account={drawer.account}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

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
              {t('ACCOUNT.PAGE.DELETE.TITLE')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('ACCOUNT.PAGE.DELETE.DESCRIPTION', {
                username: deleteDialog.account?.username,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="delete-otp">{t('COMMON.OTP_CODE')}</Label>
            <Input
              id="delete-otp"
              type="text"
              placeholder={t('ACCOUNT.PAGE.DELETE.OTP_PLACEHOLDER')}
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

      <Dialog
        open={qrDialog.isOpen}
        onOpenChange={(open) => !open && qrDialog.close()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('ACCOUNT.PAGE.QR.TITLE')}</DialogTitle>
            <DialogDescription>
              {t('ACCOUNT.PAGE.QR.DESCRIPTION')}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6">
            {isLoadingQR || resetSaltMutation.isPending ? (
              <div className="flex items-center gap-2">
                <LoaderCircleIcon className="h-6 w-6 animate-spin" />
                <span>{t('ACCOUNT.PAGE.QR.LOADING')}</span>
              </div>
            ) : qrCodeData ? (
              <img src={qrCodeData} alt="QR Code" className="w-64 h-64" />
            ) : (
              <p className="text-muted-foreground">
                {t('ACCOUNT.PAGE.QR.ERROR')}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleResetSalt}
              disabled={resetSaltMutation.isPending || isLoadingQR}
            >
              {resetSaltMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                  {t('COMMON.RESETTING')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  {t('COMMON.RESET')}
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={statusConfirm !== null}
        onOpenChange={(open) => {
          if (!open && !updateStatusMutation.isPending) {
            setStatusConfirm(null);
            setStatusOtp('');
            setStatusOtpError('');
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('ACCOUNT.PAGE.CHANGE_STATUS_TITLE')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('ACCOUNT.PAGE.CHANGE_STATUS_DESCRIPTION', {
                username: statusConfirm?.account.username,
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
                value={statusOtp}
                onChange={(e) => {
                  setStatusOtp(e.target.value);
                  setStatusOtpError('');
                }}
                maxLength={6}
                disabled={updateStatusMutation.isPending}
              />
              {statusOtpError && (
                <span className="text-xs text-destructive">
                  {statusOtpError}
                </span>
              )}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateStatusMutation.isPending}>
              {t('COMMON.CANCEL')}
            </AlertDialogCancel>
            <Button
              onClick={handleConfirmStatusChange}
              disabled={updateStatusMutation.isPending || !statusOtp.trim()}
            >
              {updateStatusMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                  {t('ACCOUNT.PAGE.UPDATING_STATUS')}
                </span>
              ) : (
                t('COMMON.CONFIRM')
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Fragment>
  );
}
