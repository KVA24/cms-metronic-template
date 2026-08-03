import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslations } from '@/shared/hooks/use-translations';
import { Button } from '@/shared/ui/atoms/button';

export function TenantForgotPasswordSuccessPage() {
  const { t } = useTranslations();
  return <div className="space-y-5 text-center"><CheckCircle2 className="mx-auto size-12 text-success" /><div><h1 className="text-2xl font-semibold">{t('TENANT_RECOVERY.SUCCESS_TITLE')}</h1><p className="mt-1 text-sm text-muted-foreground">{t('TENANT_RECOVERY.SUCCESS_DESCRIPTION')}</p></div><Button className="w-full" variant="mono" asChild><Link to="/auth/login?portal=tenant">{t('TENANT_RECOVERY.BACK_TO_SIGN_IN')}</Link></Button></div>;
}
