import { useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Alert, AlertDescription, AlertIcon } from '@/shared/ui/atoms/alert';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent } from '@/shared/ui/atoms/card';
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
import {
  useTenantAccountRoles,
  useTenantAccounts,
} from '../hooks/use-tenant-accounts';
import {
  TENANT_ACCOUNT_DEFAULT_QUERY,
  type TenantAccountQuery,
} from '../model/tenant-account';

export function TenantAccountListPage() {
  const session = useAuthSession();
  const { t } = useTranslations();
  const [query, setQuery] = useState(TENANT_ACCOUNT_DEFAULT_QUERY);
  const [draft, setDraft] = useState(query);
  const accounts = useTenantAccounts(session, query);
  const roles = useTenantAccountRoles(session);
  const canCreate = session?.permissions.includes('users.create');
  const selectClassName =
    'h-9 w-full rounded-md border border-input bg-background px-3 text-sm';
  const apply = () => setQuery({ ...draft, page: 1 });

  return (
    <Container width="fluid" className="space-y-5 pb-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {t('TENANT_ACCOUNTS.TITLE')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('TENANT_ACCOUNTS.DESCRIPTION')}
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link to="/tenant/account/users/new">
              <Plus /> {t('TENANT_ACCOUNTS.ADD')}
            </Link>
          </Button>
        )}
      </header>

      <Card>
        <CardContent className="grid gap-4 pt-5 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end">
          <label className="space-y-1 text-sm">
            <span>{t('TENANT_ACCOUNTS.KEYWORD')}</span>
            <Input
              value={draft.search ?? ''}
              placeholder={t('TENANT_ACCOUNTS.KEYWORD_PLACEHOLDER')}
              onChange={(event) =>
                setDraft({ ...draft, search: event.target.value || undefined })
              }
              onKeyDown={(event) => event.key === 'Enter' && apply()}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>{t('TENANT_ACCOUNTS.ROLE')}</span>
            <select
              className={selectClassName}
              value={draft.roleId ?? ''}
              onChange={(event) =>
                setDraft({ ...draft, roleId: event.target.value || undefined })
              }
            >
              <option value="">{t('TENANT_ACCOUNTS.ALL_ROLES')}</option>
              {roles.data?.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
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
                    (event.target.value as TenantAccountQuery['status']) ||
                    undefined,
                })
              }
            >
              <option value="">{t('TENANT_ACCOUNTS.ALL_STATUSES')}</option>
              <option value="ACTIVE">{t('COMMON.STATUS.ACTIVE')}</option>
              <option value="INACTIVE">{t('COMMON.STATUS.INACTIVE')}</option>
              <option value="LOCKED">{t('COMMON.STATUS.LOCKED')}</option>
            </select>
          </label>
          <Button onClick={apply}>{t('COMMON.APPLY')}</Button>
        </CardContent>
      </Card>

      {accounts.isLoading ? (
        <Skeleton className="h-72 w-full" aria-label={t('COMMON.LOADING')} />
      ) : accounts.isError || !accounts.data ? (
        <Alert variant="destructive">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertDescription>{t('TENANT_ACCOUNTS.ERROR')}</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardContent className="pt-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('TENANT_ACCOUNTS.USERNAME')}</TableHead>
                  <TableHead>{t('TENANT_ACCOUNTS.FULL_NAME')}</TableHead>
                  <TableHead>{t('TENANT_ACCOUNTS.EMAIL')}</TableHead>
                  <TableHead>{t('TENANT_ACCOUNTS.ROLE')}</TableHead>
                  <TableHead>{t('COMMON.STATUS_1')}</TableHead>
                  <TableHead>{t('COMMON.ACTIONS')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.data.items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-12 text-center text-muted-foreground"
                    >
                      {t('TENANT_ACCOUNTS.EMPTY')}
                    </TableCell>
                  </TableRow>
                ) : (
                  accounts.data.items.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">
                        {account.username}
                      </TableCell>
                      <TableCell>{account.fullName}</TableCell>
                      <TableCell>{account.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={account.roleActive ? 'info' : 'secondary'}
                          appearance="light"
                        >
                          {account.roleName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            account.status === 'ACTIVE'
                              ? 'success'
                              : account.status === 'LOCKED'
                                ? 'destructive'
                                : 'secondary'
                          }
                          appearance="light"
                        >
                          {t(`COMMON.STATUS.${account.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-3">
                          <Link
                            className="text-primary hover:underline"
                            to={`/tenant/account/users/${account.id}`}
                          >
                            {t('COMMON.VIEW')}
                          </Link>
                          {account.canEdit && (
                            <Link
                              className="text-primary hover:underline"
                              to={`/tenant/account/users/${account.id}/edit`}
                            >
                              {t('COMMON.EDIT')}
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {t('TENANT_ACCOUNTS.PAGE', {
                  page: accounts.data.page,
                  total: accounts.data.totalPages,
                  count: accounts.data.totalItems,
                })}
              </span>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  aria-label={t('COMMON.PREVIOUS')}
                  disabled={accounts.data.page <= 1}
                  onClick={() => setQuery({ ...query, page: query.page - 1 })}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label={t('COMMON.NEXT')}
                  disabled={accounts.data.page >= accounts.data.totalPages}
                  onClick={() => setQuery({ ...query, page: query.page + 1 })}
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
