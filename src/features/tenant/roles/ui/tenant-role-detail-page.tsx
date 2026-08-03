import { useMemo } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Alert, AlertDescription, AlertIcon } from '@/shared/ui/atoms/alert';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent, CardHeader } from '@/shared/ui/atoms/card';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { Container } from '@/shared/ui/molecules/container';
import { AlertCircle, ArrowLeft, KeyRound, Pencil } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useTenantRoleDetail } from '../hooks/use-tenant-roles';

export function TenantRoleDetailPage() {
  const { roleId = '' } = useParams();
  const session = useAuthSession();
  const { t, language } = useTranslations();
  const role = useTenantRoleDetail(session, roleId);
  const dateTime = useMemo(
    () =>
      new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [language],
  );

  if (role.isLoading)
    return (
      <Container className="py-8">
        <Skeleton className="h-96 w-full" />
      </Container>
    );
  if (role.isError || !role.data)
    return (
      <Container className="py-8">
        <Alert variant="destructive">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertDescription>{t('TENANT_ROLES.NOT_FOUND')}</AlertDescription>
        </Alert>
      </Container>
    );

  const data = role.data;
  return (
    <Container width="fluid" className="space-y-5 pb-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" className="-ml-3 mb-2">
            <Link to="/tenant/account/roles">
              <ArrowLeft /> {t('COMMON.BACK')}
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">{data.name}</h1>
          <div className="mt-2 flex gap-2">
            <Badge
              variant={data.type === 'SYSTEM' ? 'info' : 'secondary'}
              appearance="light"
            >
              {t(`TENANT_ROLES.TYPES.${data.type}`)}
            </Badge>
            <Badge
              variant={data.status === 'ACTIVE' ? 'success' : 'secondary'}
              appearance="light"
            >
              {t(`COMMON.STATUS.${data.status}`)}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {data.canEdit && (
            <Button asChild variant="outline">
              <Link to={`/tenant/account/roles/${data.id}/edit`}>
                <Pencil /> {t('COMMON.EDIT')}
              </Link>
            </Button>
          )}
          {session?.permissions.includes('roles.permissions') && (
            <Button asChild>
              <Link to={`/tenant/account/roles/${data.id}/permissions`}>
                <KeyRound /> {t('TENANT_ROLES.PERMISSIONS')}
              </Link>
            </Button>
          )}
        </div>
      </header>

      {data.type === 'SYSTEM' && (
        <Alert>
          <AlertIcon>
            <KeyRound />
          </AlertIcon>
          <AlertDescription>
            {t('TENANT_ROLES.SYSTEM_READ_ONLY')}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">{t('TENANT_ROLES.INFORMATION')}</h2>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            {[
              [t('TENANT_ROLES.CODE'), data.code],
              [t('TENANT_ROLES.NAME'), data.name],
              [t('TENANT_ROLES.REMARK'), data.description || '—'],
              [t('TENANT_ROLES.USERS'), String(data.assignedUsers)],
              [
                t('TENANT_ROLES.CREATED'),
                `${data.createdBy} · ${dateTime.format(new Date(data.createdAt))}`,
              ],
              [
                t('TENANT_ROLES.UPDATED'),
                `${data.updatedBy} · ${dateTime.format(new Date(data.updatedAt))}`,
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="mt-1 break-words font-medium">{value}</dd>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">
              {t('TENANT_ROLES.PERMISSION_SUMMARY')}
            </h2>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {data.permissionCoverage}/7
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('TENANT_ROLES.COVERAGE')}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {data.permissions.map((permission) => (
                <Badge key={permission} variant="outline">
                  {permission}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
