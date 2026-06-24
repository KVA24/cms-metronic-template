import { Fragment, useEffect, useMemo, useState } from 'react';
import { GamePool, PoolState } from '@/features/game-pools/api/gamePoolsApi';
import {
  useDeleteGamePool,
  useGamePoolsList,
} from '@/features/game-pools/hooks/use-game-pools-queries';
import { useDebounce } from '@/shared/hooks';
import { useTranslations } from '@/shared/hooks/use-translations';
import { UserRole } from '@/shared/lib/rbac';
import { usePaginationParams, useUrlParams } from '@/shared/lib/url-params';
import { useGamePoolDeleteDialog } from '@/shared/stores/ui-store';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/atoms/dialog';
import { DataGrid } from '@/shared/ui/atoms/data-grid';
import { DataGridColumnHeader } from '@/shared/ui/atoms/data-grid-column-header';
import { DataGridPagination } from '@/shared/ui/atoms/data-grid-pagination';
import { DataGridTable } from '@/shared/ui/atoms/data-grid-table';
import { Input } from '@/shared/ui/atoms/input';
import { Label } from '@/shared/ui/atoms/label';
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
  Edit,
  Eye,
  LoaderCircleIcon,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const POOL_STATES: PoolState[] = ['ACTIVE', 'INACTIVE'];

function StateBadge({ state }: { state: PoolState }) {
  const variants: Record<PoolState, 'success' | 'secondary' | 'warning'> = {
    ACTIVE: 'success',
    INACTIVE: 'secondary',
  };
  return <Badge variant={variants[state] ?? 'secondary'}>{state}</Badge>;
}

export function GamePoolsPage() {
  const { t } = useTranslations();
  const navigate = useNavigate();

  const { page, limit, setPage, setLimit } = usePaginationParams();
  const { getParam, updateParams } = useUrlParams({
    defaults: { page: 0, limit: 10 },
  });

  const [localSearch, setLocalSearch] = useState({
    searchCode: getParam('code') || '',
    searchState: getParam('state') || '',
  });

  const [showDeleteOtpDialog, setShowDeleteOtpDialog] = useState(false);
  const [deleteOtpCode, setDeleteOtpCode] = useState('');
  const [deleteOtpError, setDeleteOtpError] = useState('');

  const debouncedCode = useDebounce(localSearch.searchCode, 500);
  const debouncedState = useDebounce(localSearch.searchState, 500);

  useEffect(() => {
    updateParams({
      code: debouncedCode || null,
      state: debouncedState || null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedCode, debouncedState]);

  const queryParams = useMemo(
    () => ({
      page,
      size: limit,
      code: debouncedCode || undefined,
      state: debouncedState || undefined,
    }),
    [page, limit, debouncedCode, debouncedState],
  );

  const {
    data: listData,
    isLoading,
    error: queryError,
  } = useGamePoolsList(queryParams);
  const gamePools = listData?.data || [];
  const total = listData?.metadata?.total || 0;
  const totalPages = listData?.metadata?.totalPages || 0;
  const error = queryError?.message || null;

  const deleteMutation = useDeleteGamePool();
  const deleteDialog = useGamePoolDeleteDialog();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: page,
    pageSize: limit,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    setPagination({ pageIndex: page, pageSize: limit });
  }, [page, limit]);

  const handlePaginationChange = (updater: any) => {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    if (next.pageIndex !== page) setPage(next.pageIndex);
    if (next.pageSize !== limit) setLimit(next.pageSize);
  };

  const handleConfirmDeleteWithOtp = async () => {
    // Validate OTP
    if (!deleteOtpCode || deleteOtpCode.trim().length !== 6) {
      setDeleteOtpError(
        t('COMMON.OTP_MUST_BE_6_DIGITS') || 'OTP must be 6 digits',
      );
      return;
    }

    setDeleteOtpError('');

    if (deleteDialog.gamePool) {
      try {
        await deleteMutation.mutateAsync({
          id: deleteDialog.gamePool.id,
          otpCode: deleteOtpCode,
        });
        deleteDialog.close();
        setShowDeleteOtpDialog(false);
        setDeleteOtpCode('');
        setDeleteOtpError('');
      } catch {
        // handled by mutation
      }
    }
  };

  const columns = useMemo<ColumnDef<GamePool>[]>(
    () => [
      {
        id: 'id',
        accessorFn: (row) => row.id,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.ID')} column={column} />
        ),
        cell: (info) => (
          <span className="font-mono text-xs">{info.row.original.id}</span>
        ),
        enableSorting: true,
        size: 100,
      },
      {
        id: 'code',
        accessorFn: (row) => row.code,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.CODE')} column={column} />
        ),
        cell: (info) => (
          <span className="font-medium">{info.row.original.code}</span>
        ),
        enableSorting: true,
        size: 120,
      },
      {
        id: 'state',
        accessorFn: (row) => row.state,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.STATE')} column={column} />
        ),
        cell: (info) => <StateBadge state={info.row.original.state} />,
        enableSorting: true,
        size: 100,
      },
      {
        id: 'actions',
        header: () => (
          <span className="text-right block">{t('COMMON.ACTIONS')}</span>
        ),
        cell: (info) => {
          const pool = info.row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/game-pools/view/${pool.id}`)}
                aria-label="View"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <PermissionGuard requiredRoles={[UserRole.ADMIN]}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/game-pools/edit/${pool.id}`)}
                  aria-label="Edit"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </PermissionGuard>
              <PermissionGuard requiredRoles={[UserRole.ADMIN]}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    deleteDialog.open(pool);
                    setShowDeleteOtpDialog(true);
                  }}
                  aria-label="Delete"
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
    [t, deleteDialog, navigate],
  );

  const table = useReactTable({
    columns,
    data: gamePools,
    pageCount: totalPages || 0,
    getRowId: (row: GamePool) => row.id,
    state: { pagination, sorting },
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
              <Button onClick={() => navigate('/game-pools/create')}>
                <Plus className="h-4 w-4 mr-2" />
                {t('GAME_POOLS.PAGE.ADD_BUTTON')}
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
            recordCount={total}
            isLoading={isLoading}
            loadingMode="skeleton"
            emptyMessage={t('GAME_POOLS.PAGE.TABLE.EMPTY')}
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
                <CardTitle>{t('GAME_POOLS.PAGE.TABLE.TITLE')}</CardTitle>
                <CardToolbar>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t(
                          'GAME_POOLS.PAGE.SEARCH_CODE_PLACEHOLDER',
                        )}
                        value={localSearch.searchCode}
                        onChange={(e) =>
                          setLocalSearch({
                            ...localSearch,
                            searchCode: e.target.value,
                          })
                        }
                        className="pl-10"
                      />
                    </div>
                    <Select
                      value={localSearch.searchState || ''}
                      onValueChange={(v) =>
                        setLocalSearch({
                          ...localSearch,
                          searchState: v === '' ? '' : v,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            'GAME_POOLS.PAGE.SEARCH_STATE_PLACEHOLDER',
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {POOL_STATES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

      {/* Delete OTP Dialog */}
      <Dialog
        open={showDeleteOtpDialog}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setDeleteOtpCode('');
            setDeleteOtpError('');
          }
          setShowDeleteOtpDialog(open);
        }}
      >
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {t('GAME_POOLS.PAGE.DELETE.OTP_TITLE')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('GAME_POOLS.PAGE.DELETE.OTP_DESCRIPTION')}
            </DialogDescription>
          </DialogHeader>
          <div className="p-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="delete-otp-input">
                {t('COMMON.OTP_CODE')} *
              </Label>
              <Input
                id="delete-otp-input"
                placeholder={t('COMMON.ENTER_6_DIGIT_OTP')}
                value={deleteOtpCode}
                onChange={(e) => {
                  setDeleteOtpCode(e.target.value);
                  setDeleteOtpError('');
                }}
                maxLength={6}
                disabled={deleteMutation.isPending}
                type="text"
                inputMode="numeric"
              />
              {deleteOtpError && (
                <span className="text-xs text-destructive">
                  {deleteOtpError}
                </span>
              )}
            </div>
          </div>
          <DialogFooter className="flex gap-1">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteOtpDialog(false);
                setDeleteOtpCode('');
                setDeleteOtpError('');
              }}
              disabled={deleteMutation.isPending}
            >
              {t('COMMON.CANCEL')}
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmDeleteWithOtp}
              disabled={deleteMutation.isPending}
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}
