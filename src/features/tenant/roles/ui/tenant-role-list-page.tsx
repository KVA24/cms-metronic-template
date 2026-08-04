import { useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Alert, AlertDescription, AlertIcon } from '@/shared/ui/atoms/alert';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/atoms/dialog';
import { Input } from '@/shared/ui/atoms/input';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/atoms/table';
import { Container } from '@/shared/ui/molecules/container';
import { AlertCircle, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useTenantRoleMutations,
  useTenantRoles,
} from '../hooks/use-tenant-roles';
import {
  TENANT_ROLE_DEFAULT_QUERY,
  type TenantRoleListItem,
  type TenantRoleQuery,
} from '../model/tenant-role';

export function TenantRoleListPage() {
  const session = useAuthSession();
  const { t } = useTranslations();
  const [query, setQuery] = useState(TENANT_ROLE_DEFAULT_QUERY);
  const [draft, setDraft] = useState(query);
  const roles = useTenantRoles(session, query);
  const mutations = useTenantRoleMutations(session);
  const [selectedRole, setSelectedRole] = useState<TenantRoleListItem | null>(
    null,
  );
  const canCreate = session?.permissions.includes('roles.create');

  const apply = () => setQuery({ ...draft, page: 1 });
  const selectClassName =
    'h-9 w-full rounded-md border border-input bg-background px-3 text-sm';
  const confirmDelete = async () => {
    if (!selectedRole) return;
    try {
      await mutations.remove.mutateAsync(selectedRole.id);
      toast.success(t('TENANT_ROLES.DELETE.SUCCESS'));
      setSelectedRole(null);
    } catch (error) {
      const code = error instanceof Error ? error.message : 'UNKNOWN';
      toast.error(
        code === 'ROLE_IN_USE'
          ? t('TENANT_ROLES.DELETE.IN_USE')
          : t('TENANT_ROLES.DELETE.ERROR'),
      );
    }
  };

  return (
    <Container width="fluid" className="space-y-5 pb-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t('TENANT_ROLES.TITLE')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('TENANT_ROLES.DESCRIPTION')}
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link to="/tenant/account/roles/new">
              <Plus /> {t('TENANT_ROLES.ADD')}
            </Link>
          </Button>
        )}
      </header>

      <Card>
        <CardContent className="grid gap-4 pt-5 md:grid-cols-[2fr_1fr_auto] md:items-end">
          <label className="space-y-1 text-sm">
            <span>{t('TENANT_ROLES.KEYWORD')}</span>
            <Input
              value={draft.search ?? ''}
              placeholder={t('TENANT_ROLES.KEYWORD_PLACEHOLDER')}
              onChange={(event) =>
                setDraft({ ...draft, search: event.target.value || undefined })
              }
              onKeyDown={(event) => event.key === 'Enter' && apply()}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>{t('COMMON.STATUS_1')}</span>
            <select
              className={selectClassName}
              value={draft.status ?? ''}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  status:
                    (event.target.value as TenantRoleQuery['status']) ||
                    undefined,
                })
              }
            >
              <option value="">{t('TENANT_ROLES.ALL_STATUSES')}</option>
              <option value="ACTIVE">{t('COMMON.STATUS.ACTIVE')}</option>
              <option value="INACTIVE">{t('COMMON.STATUS.INACTIVE')}</option>
            </select>
          </label>
          <Button onClick={apply}>{t('COMMON.APPLY')}</Button>
        </CardContent>
      </Card>

      {roles.isLoading ? (
        <Skeleton className="h-72 w-full" aria-label={t('COMMON.LOADING')} />
      ) : roles.isError || !roles.data ? (
        <Alert variant="destructive">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertDescription>{t('TENANT_ROLES.ERROR')}</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardContent className="pt-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('TENANT_ROLES.CODE')}</TableHead>
                  <TableHead>{t('TENANT_ROLES.NAME')}</TableHead>
                  <TableHead>{t('TENANT_ROLES.REMARK')}</TableHead>
                  <TableHead>{t('TENANT_ROLES.TYPE')}</TableHead>
                  <TableHead>{t('COMMON.STATUS_1')}</TableHead>
                  <TableHead>{t('TENANT_ROLES.USERS')}</TableHead>
                  <TableHead>{t('COMMON.ACTIONS')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.data.items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-muted-foreground py-12 text-center"
                    >
                      {t('TENANT_ROLES.EMPTY')}
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.data.items.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.code}</TableCell>
                      <TableCell>{role.name}</TableCell>
                      <TableCell className="max-w-72 truncate">
                        {role.description || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            role.type === 'SYSTEM' ? 'info' : 'secondary'
                          }
                          appearance="light"
                        >
                          {t(`TENANT_ROLES.TYPES.${role.type}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            role.status === 'ACTIVE' ? 'success' : 'secondary'
                          }
                          appearance="light"
                        >
                          {t(`COMMON.STATUS.${role.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>{role.assignedUsers}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-3">
                          <Link
                            className="text-primary hover:underline"
                            to={`/tenant/account/roles/${role.id}`}
                          >
                            {t('COMMON.VIEW')}
                          </Link>
                          {role.canEdit && (
                            <Link
                              className="text-primary hover:underline"
                              to={`/tenant/account/roles/${role.id}/edit`}
                            >
                              {t('COMMON.EDIT')}
                            </Link>
                          )}
                          {role.canDelete && (
                            <button
                              type="button"
                              className="text-destructive hover:underline"
                              onClick={() => setSelectedRole(role)}
                            >
                              {t('COMMON.DELETE')}
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="text-muted-foreground mt-4 flex items-center justify-between text-sm">
              <span>
                {t('TENANT_ROLES.PAGE', {
                  page: roles.data.page,
                  total: roles.data.totalPages,
                  count: roles.data.totalItems,
                })}
              </span>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  aria-label={t('COMMON.PREVIOUS')}
                  disabled={roles.data.page <= 1}
                  onClick={() => setQuery({ ...query, page: query.page - 1 })}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label={t('COMMON.NEXT')}
                  disabled={roles.data.page >= roles.data.totalPages}
                  onClick={() => setQuery({ ...query, page: query.page + 1 })}
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <Dialog
        open={Boolean(selectedRole)}
        onOpenChange={(open) => !open && setSelectedRole(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('TENANT_ROLES.DELETE.TITLE')}</DialogTitle>
            <DialogDescription>
              {t('TENANT_ROLES.DELETE.DESCRIPTION', {
                code: selectedRole?.code,
                name: selectedRole?.name,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRole(null)}>
              {t('COMMON.CANCEL')}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={mutations.remove.isPending}
            >
              {mutations.remove.isPending
                ? t('COMMON.DELETING')
                : t('TENANT_ROLES.DELETE.CONFIRM')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
