import { useMemo } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Alert, AlertDescription, AlertIcon } from '@/shared/ui/atoms/alert';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent, CardHeader } from '@/shared/ui/atoms/card';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { Container } from '@/shared/ui/molecules/container';
import { AlertCircle, ArrowLeft, Pencil } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useTenantAccountDetail } from '../hooks/use-tenant-accounts';

export function TenantAccountDetailPage() {
  const { userId = '' } = useParams();
  const session = useAuthSession();
  const { t, language } = useTranslations();
  const account = useTenantAccountDetail(session, userId);
  const dateTime = useMemo(
    () =>
      new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [language],
  );

  if (account.isLoading)
    return (
      <Container className="py-8">
        <Skeleton className="h-96 w-full" />
      </Container>
    );
  if (account.isError || !account.data)
    return (
      <Container className="py-8">
        <Alert variant="destructive">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertDescription>{t('TENANT_ACCOUNTS.NOT_FOUND')}</AlertDescription>
        </Alert>
      </Container>
    );

  const data = account.data;
  const fields = [
    [t('TENANT_ACCOUNTS.USERNAME'), data.username],
    [t('TENANT_ACCOUNTS.FULL_NAME'), data.fullName],
    [t('TENANT_ACCOUNTS.EMAIL'), data.email || '—'],
    [t('TENANT_ACCOUNTS.PHONE'), data.phone || '—'],
    [t('TENANT_ACCOUNTS.ROLE'), data.roleName],
    [t('TENANT_ACCOUNTS.PASSWORD'), data.passwordMask],
    [
      t('TENANT_ACCOUNTS.CREATED'),
      `${data.createdBy} · ${dateTime.format(new Date(data.createdAt))}`,
    ],
    [
      t('TENANT_ACCOUNTS.UPDATED'),
      `${data.updatedBy} · ${dateTime.format(new Date(data.updatedAt))}`,
    ],
  ];

  return (
    <Container width="fluid" className="space-y-5 pb-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" className="-ml-3 mb-2">
            <Link to="/tenant/account/users">
              <ArrowLeft /> {t('COMMON.BACK')}
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">{data.fullName}</h1>
          <div className="mt-2 flex gap-2">
            <Badge variant="info" appearance="light">
              {data.roleName}
            </Badge>
            <Badge
              variant={data.status === 'ACTIVE' ? 'success' : 'secondary'}
              appearance="light"
            >
              {t(`COMMON.STATUS.${data.status}`)}
            </Badge>
          </div>
        </div>
        {data.canEdit && (
          <Button asChild>
            <Link to={`/tenant/account/users/${data.id}/edit`}>
              <Pencil /> {t('TENANT_ACCOUNTS.EDIT')}
            </Link>
          </Button>
        )}
      </header>

      {!data.roleActive && (
        <Alert variant="destructive">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertDescription>
            {t('TENANT_ACCOUNTS.ROLE_INACTIVE')}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-semibold">{t('TENANT_ACCOUNTS.INFORMATION')}</h2>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="mt-1 break-words font-medium">{value}</dd>
              </div>
            ))}
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('COMMON.STATUS_1')}
              </dt>
              <dd className="mt-1 font-medium">
                {t(`COMMON.STATUS.${data.status}`)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </Container>
  );
}
