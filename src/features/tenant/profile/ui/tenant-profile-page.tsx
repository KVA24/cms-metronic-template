import { useTranslations } from '@/shared/hooks/use-translations';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Alert, AlertDescription, AlertIcon } from '@/shared/ui/atoms/alert';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { Container } from '@/shared/ui/molecules/container';
import { AlertCircle } from 'lucide-react';
import { useTenantProfile } from '../hooks/use-tenant-profile';
import { TenantProfileInformationForm } from './tenant-profile-information-form';
import { TenantProfilePasswordForm } from './tenant-profile-password-form';

export function TenantProfilePage() {
  const session = useAuthSession();
  const { t } = useTranslations();
  const profile = useTenantProfile(session);

  if (profile.isLoading)
    return (
      <Container className="py-8">
        <Skeleton className="h-96 w-full" />
      </Container>
    );
  if (!session || profile.isError || !profile.data)
    return (
      <Container className="py-8">
        <Alert variant="destructive">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertDescription>{t('TENANT_PROFILE.ERROR')}</AlertDescription>
        </Alert>
      </Container>
    );

  return (
    <Container width="fluid" className="max-w-4xl space-y-5 pb-8">
      <header>
        <h1 className="text-2xl font-semibold">{t('TENANT_PROFILE.TITLE')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('TENANT_PROFILE.DESCRIPTION')}
        </p>
      </header>
      <TenantProfileInformationForm
        key={`profile-${profile.data.version}`}
        session={session}
        profile={profile.data}
      />
      <TenantProfilePasswordForm
        session={session}
        version={profile.data.version}
      />
    </Container>
  );
}
