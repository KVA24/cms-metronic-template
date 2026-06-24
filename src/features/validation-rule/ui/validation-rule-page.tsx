import { Fragment, useEffect, useMemo, useState } from 'react';
import { ValidationRule } from '@/features/validation-rule/api/validationRuleApi';
import { useDebounce } from '@/shared/hooks';
import { useTranslations } from '@/shared/hooks/use-translations';
import { UserRole } from '@/shared/lib/rbac';
import { usePaginationParams, useUrlParams } from '@/shared/lib/url-params';
import {
  useValidationRuleDeleteDialog,
  useValidationRuleDrawer,
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
import { toast } from 'sonner';
import {
  useCreateValidationRule,
  useDeleteValidationRule,
  useUpdateValidationRule,
  useValidationRuleDetail,
  useValidationRuleList,
} from '../hooks/use-validation-rule-queries';
import { ValidationRuleDrawer } from './validation-rule-drawer';

export function ValidationRulePage() {
  const { t } = useTranslations();

  // URL params management
  const { page, limit, setPage, setLimit } = usePaginationParams();
  const { getParam, updateParams } = useUrlParams({
    defaults: { page: 0, limit: 10 },
  });

  // Local state for search filters
  const [localSearch, setLocalSearch] = useState({
    searchId: getParam('id') || '',
    searchName: getParam('name') || '',
  });

  const debouncedSearchId = useDebounce(localSearch.searchId, 500);
  const debouncedSearchName = useDebounce(localSearch.searchName, 500);

  // Update URL params when filters change
  useEffect(() => {
    updateParams({
      id: debouncedSearchId || null,
      name: debouncedSearchName || null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchId, debouncedSearchName]);

  // Memoize query params to prevent unnecessary refetches
  const queryParams = useMemo(
    () => ({
      page,
      size: limit,
      id: debouncedSearchId || undefined,
      name: debouncedSearchName || undefined,
    }),
    [page, limit, debouncedSearchId, debouncedSearchName],
  );

  // React Query - Fetch validation rule list
  const {
    data: validationRuleListData,
    isLoading,
    error: queryError,
  } = useValidationRuleList(queryParams);

  const validationRules = validationRuleListData?.data || [];
  const total = validationRuleListData?.pageInfo?.totalCount || 0;
  const error = queryError?.message || null;

  // React Query - Mutations
  const createMutation = useCreateValidationRule();
  const updateMutation = useUpdateValidationRule();
  const deleteMutation = useDeleteValidationRule();

  // UI state from Zustand
  const drawer = useValidationRuleDrawer();
  const deleteDialog = useValidationRuleDeleteDialog();

  const [detailValidationRuleId, setDetailValidationRuleId] = useState<
    string | null
  >(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>(
    'create',
  );
  const [deleteOtp, setDeleteOtp] = useState('');

  // Fetch validation rule detail when detailValidationRuleId changes
  const {
    data: detailData,
    isFetching: isDetailFetching,
    error: detailError,
  } = useValidationRuleDetail(detailValidationRuleId || undefined, {
    enabled: !!detailValidationRuleId,
  });

  // Handle detail fetch completion or error
  useEffect(() => {
    if (!isDetailFetching && detailValidationRuleId) {
      if (detailData) {
        drawer.open(detailData);
      } else if (detailError) {
        toast.error(t('VALIDATION_RULES.PAGE.ERROR.LOAD_FAILED'));
      }
      setDetailValidationRuleId(null);
    }
  }, [
    detailData,
    detailError,
    isDetailFetching,
    detailValidationRuleId,
    drawer,
    t,
  ]);

  // DataGrid state
  const [sorting, setSorting] = useState<SortingState>([]);

  // DataGrid pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: page,
    pageSize: limit,
  });

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

    // Update URL (which will trigger fetch via react-query)
    if (newPagination.pageIndex !== page) {
      setPage(newPagination.pageIndex);
    }
    if (newPagination.pageSize !== limit) {
      setLimit(newPagination.pageSize);
    }
  };

  const handleAdd = () => {
    setDrawerMode('create');
    drawer.open();
  };

  const handleView = (validationRule: ValidationRule) => {
    setDetailValidationRuleId(validationRule.id);
    setDrawerMode('view');
  };

  const handleEdit = (validationRule: ValidationRule) => {
    setDetailValidationRuleId(validationRule.id);
    setDrawerMode('edit');
  };

  const handleEditFromView = () => {
    setDrawerMode('edit');
    // Drawer will automatically re-render with new mode
  };

  const handleDrawerSubmit = async (data: any) => {
    try {
      if (drawer.validationRule) {
        await updateMutation.mutateAsync({
          id: drawer.validationRule.id,
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

    if (deleteDialog.validationRule) {
      try {
        await deleteMutation.mutateAsync({
          id: deleteDialog.validationRule.id,
          otpCode: deleteOtp,
        });
        setDeleteOtp('');
        deleteDialog.close();
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  // Define columns for DataGrid
  const columns = useMemo<ColumnDef<ValidationRule>[]>(
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
        sortingFn: 'alphanumeric',
        size: 100,
      },
      {
        id: 'name',
        accessorFn: (row) => row.name,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('COMMON.NAME')} column={column} />
        ),
        cell: (info) => (
          <span className="font-medium">{info.row.original.name}</span>
        ),
        enableSorting: true,
        sortingFn: 'text',
        size: 150,
      },
      {
        id: 'rule',
        accessorFn: (row) => row.rule,
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t('VALIDATION_RULES.PAGE.TABLE.RULE')}
            column={column}
          />
        ),
        cell: (info) => {
          const rule = info.row.original.rule || [];
          const count = rule.length;

          if (count === 0) {
            return <span>{t('COMMON.NO')}</span>;
          }

          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={'ghost'}>
                  <Eye />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 max-h-96 overflow-auto">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">
                    {t('VALIDATION_RULES.PAGE.TABLE.RULE')}
                  </h4>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-80">
                    {JSON.stringify(rule, null, 2)}
                  </pre>
                </div>
              </PopoverContent>
            </Popover>
          );
        },
        enableSorting: true,
        sortingFn: 'text',
        size: 300,
      },
      {
        id: 'actions',
        header: () => (
          <span className="text-right block">{t('COMMON.ACTIONS')}</span>
        ),
        cell: (info) => {
          const validationRule = info.row.original;
          const isLoadingThis = detailValidationRuleId === validationRule.id;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleView(validationRule)}
                aria-label="View"
                disabled={isLoadingThis}
              >
                {isLoadingThis ? (
                  <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <PermissionGuard
                requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(validationRule)}
                  aria-label="Edit"
                  disabled={isLoadingThis}
                >
                  {isLoadingThis ? (
                    <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <Edit className="h-4 w-4" />
                  )}
                </Button>
              </PermissionGuard>
              <PermissionGuard
                requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteDialog.open(validationRule)}
                  aria-label="Delete"
                  disabled={isLoadingThis}
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
    [t, deleteDialog, detailValidationRuleId],
  );

  // Create table instance
  const table = useReactTable({
    columns,
    data: validationRules,
    pageCount: total > 0 ? Math.ceil(total / limit) : 0,
    getRowId: (row: ValidationRule) => row.id,
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
    manualPagination: true, // Server-side pagination
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
                {t('VALIDATION_RULES.PAGE.ADD_BUTTON')}
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
            emptyMessage={t('VALIDATION_RULES.PAGE.TABLE.EMPTY')}
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
                <CardTitle>{t('VALIDATION_RULES.PAGE.TABLE.TITLE')}</CardTitle>
                <CardToolbar>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t(
                          'VALIDATION_RULES.PAGE.SEARCH_ID_PLACEHOLDER',
                        )}
                        value={localSearch.searchId}
                        onChange={(e) =>
                          setLocalSearch({
                            ...localSearch,
                            searchId: e.target.value,
                          })
                        }
                        className="pl-10"
                      />
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t(
                          'VALIDATION_RULES.PAGE.SEARCH_NAME_PLACEHOLDER',
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

      <ValidationRuleDrawer
        open={drawer.isOpen}
        onClose={drawer.close}
        onSubmit={handleDrawerSubmit}
        validationRule={drawer.validationRule}
        isLoading={createMutation.isPending || updateMutation.isPending}
        mode={drawerMode}
        onEdit={handleEditFromView}
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
              {t('VALIDATION_RULES.PAGE.DELETE.TITLE')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('COMMON.ARE_YOU_SURE_YOU_WANT_TO_DELETE_NAME_THIS_ACTION_C', {
                name: deleteDialog.validationRule?.name,
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
    </Fragment>
  );
}
