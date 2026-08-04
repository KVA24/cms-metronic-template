import { useTranslations } from '@/shared/hooks/use-translations';
import type { AdminRoleCode } from '@/shared/permissions';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { Container } from '@/shared/ui/molecules/container';
import { useParams } from 'react-router-dom';
import { useAdminTenantRevenue } from '../hooks/use-admin-tenant-revenue';
import { AdminTenantRevenueEditor } from './admin-tenant-revenue-editor';

export function AdminTenantRevenueFormPage() {
  const { tenantId = '', brandId = '' } = useParams();
  const session = useAuthSession();
  const { t } = useTranslations();
  const result = useAdminTenantRevenue(
    tenantId,
    brandId,
    session?.roleCode as AdminRoleCode,
  );
  if (result.isLoading)
    return (
      <Container className="space-y-4 py-6">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-96 w-full" />
      </Container>
    );
  if (!result.data || result.error)
    return (
      <Container className="text-destructive py-8 text-sm">
        {t('ADMIN_TENANT_REVENUE.ERRORS.LOAD_ERROR')}
      </Container>
    );
  return (
    <AdminTenantRevenueEditor
      key={result.data.config?.version ?? 'new'}
      data={result.data}
    />
  );
}
