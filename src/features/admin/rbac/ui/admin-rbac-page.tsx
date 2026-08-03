import { useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import type { AdminRoleCode } from '@/shared/permissions';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Alert, AlertDescription, AlertIcon } from '@/shared/ui/atoms/alert';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/shared/ui/atoms/card';
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
import { AlertCircle, Check, LockKeyhole, Minus, X } from 'lucide-react';
import {
  useAdminRoleMatrix,
  useAdminSystemRoles,
} from '../hooks/use-admin-rbac';
import {
  ADMIN_RBAC_ACTIONS,
  type AdminRbacActionState,
} from '../model/admin-rbac';

function PermissionState({
  state,
  label,
}: {
  state: AdminRbacActionState;
  label: string;
}) {
  if (state === 'GRANTED') {
    return (
      <span className="inline-flex text-green-700 dark:text-green-400" title={label}>
        <Check aria-hidden="true" className="size-4" />
        <span className="sr-only">{label}</span>
      </span>
    );
  }
  if (state === 'DENIED') {
    return (
      <span className="inline-flex text-red-700 dark:text-red-400" title={label}>
        <X aria-hidden="true" className="size-4" />
        <span className="sr-only">{label}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex text-muted-foreground" title={label}>
      <Minus aria-hidden="true" className="size-4" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function AdminRbacPage() {
  const session = useAuthSession();
  const { t } = useTranslations();
  const requesterRole = session?.roleCode as AdminRoleCode;
  const [selectedRole, setSelectedRole] =
    useState<AdminRoleCode>('CMS_ADMIN');
  const roles = useAdminSystemRoles(requesterRole);
  const matrix = useAdminRoleMatrix(requesterRole, selectedRole);
  const stateLabels: Record<AdminRbacActionState, string> = {
    GRANTED: t('ADMIN_RBAC.GRANTED'),
    DENIED: t('ADMIN_RBAC.DENIED'),
    NOT_APPLICABLE: t('ADMIN_RBAC.NOT_APPLICABLE'),
  };

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('ADMIN_RBAC.TITLE')}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {t('ADMIN_RBAC.DESCRIPTION')}
          </p>
        </div>
        <Badge variant="secondary" appearance="light">
          <LockKeyhole aria-hidden="true" />
          {t('ADMIN_RBAC.READ_ONLY')}
        </Badge>
      </div>

      {roles.isLoading ? (
        <div className="space-y-4" aria-label={t('COMMON.LOADING')}>
          <Skeleton className="h-10 w-full max-w-2xl" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : roles.error ? (
        <Alert variant="destructive" appearance="light">
          <AlertIcon><AlertCircle /></AlertIcon>
          <AlertDescription className="flex items-center justify-between gap-4">
            {t('ADMIN_RBAC.ERROR')}
            <Button variant="outline" onClick={() => roles.refetch()}>
              {t('COMMON.RETRY')}
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <div>
          <div
            className="flex max-w-full gap-2 overflow-x-auto"
            role="group"
            aria-label={t('ADMIN_RBAC.ROLE_TABS')}
          >
            {roles.data?.map((role) => (
              <Button
                key={role.code}
                variant={selectedRole === role.code ? 'mono' : 'outline'}
                aria-pressed={selectedRole === role.code}
                onClick={() => setSelectedRole(role.code)}
              >
                {role.name}
              </Button>
            ))}
          </div>

          <Card className="mt-5">
            <CardHeader className="gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold leading-none tracking-tight">
                  {matrix.data?.role.name ?? selectedRole}
                </h2>
                <Badge variant="success" appearance="light">
                  {t('COMMON.STATUS.ACTIVE')}
                </Badge>
              </div>
              <CardDescription>
                {t('ADMIN_RBAC.SEED_VERSION', {
                  version: matrix.data?.role.seedVersion ?? '-',
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {matrix.isLoading ? (
                <Skeleton className="h-80 w-full" aria-label={t('COMMON.LOADING')} />
              ) : matrix.error ? (
                <Alert variant="destructive" appearance="light">
                  <AlertIcon><AlertCircle /></AlertIcon>
                  <AlertDescription className="flex items-center justify-between gap-4">
                    {t('ADMIN_RBAC.MATRIX_ERROR')}
                    <Button variant="outline" onClick={() => matrix.refetch()}>
                      {t('COMMON.RETRY')}
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('ADMIN_RBAC.MODULE')}</TableHead>
                      {ADMIN_RBAC_ACTIONS.map((action) => (
                        <TableHead key={action} className="text-center">
                          {t(`ADMIN_RBAC.ACTIONS.${action}`)}
                        </TableHead>
                      ))}
                      <TableHead className="text-center">
                        {t('ADMIN_RBAC.FULL')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matrix.data?.modules.map((module) => (
                      <TableRow key={module.code}>
                        <TableCell className="font-medium">
                          {t(`ADMIN_RBAC.MODULES.${module.code}`)}
                        </TableCell>
                        {ADMIN_RBAC_ACTIONS.map((action) => (
                          <TableCell key={action} className="text-center">
                            <PermissionState
                              state={module.actions[action]}
                              label={stateLabels[module.actions[action]]}
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-center">
                          <PermissionState
                            state={module.full ? 'GRANTED' : 'DENIED'}
                            label={module.full ? stateLabels.GRANTED : stateLabels.DENIED}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Container>
  );
}
