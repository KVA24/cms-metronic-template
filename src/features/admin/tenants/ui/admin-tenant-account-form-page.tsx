import { useTranslations } from '@/shared/hooks/use-translations';
import type { AdminRoleCode } from '@/shared/permissions';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { Container } from '@/shared/ui/molecules/container';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useAdminTenantAccount,
  useAdminTenantAccounts,
} from '../hooks/use-admin-tenant-accounts';
import { ADMIN_TENANT_ACCOUNT_DEFAULT_QUERY } from '../model/admin-tenant-account';
import { AdminTenantAccountDialog } from './admin-tenant-account-dialog';

export function AdminTenantAccountFormPage({
  mode,
}: {
  mode: 'create' | 'edit';
}) {
  const { tenantId = '', accountId = '' } = useParams();
  const session = useAuthSession();
  const { t } = useTranslations();
  const navigate = useNavigate();
  const roleCode = session?.roleCode as AdminRoleCode;
  const accounts = useAdminTenantAccounts(
    tenantId,
    ADMIN_TENANT_ACCOUNT_DEFAULT_QUERY,
    roleCode,
  );
  const account = useAdminTenantAccount(
    tenantId,
    mode === 'edit' ? accountId : '',
    roleCode,
  );

  if (accounts.isLoading || (mode === 'edit' && account.isLoading))
    return (
      <Container className="space-y-4 py-6">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-[36rem] w-full" />
      </Container>
    );

  if (
    !accounts.data ||
    accounts.isError ||
    (mode === 'create' && !accounts.data.canCreate) ||
    (mode === 'edit' && (!account.data || !accounts.data.canEdit))
  )
    return (
      <Container className="text-destructive py-8 text-sm">
        {t('ADMIN_TENANT_ACCOUNTS.LOAD_ERROR')}
      </Container>
    );

  return (
    <AdminTenantAccountDialog
      tenantId={tenantId}
      mode={mode}
      account={mode === 'edit' ? (account.data ?? null) : null}
      requiresFirstAdmin={accounts.data.requiresFirstAdmin}
      canEdit={accounts.data.canEdit}
      presentation="page"
      onModeChange={(nextMode) => {
        if (nextMode === 'edit' && account.data)
          navigate(
            `/admin/tenants/${tenantId}/accounts/${account.data.id}/edit`,
          );
        else navigate(`/admin/tenants/${tenantId}/accounts`);
      }}
    />
  );
}
