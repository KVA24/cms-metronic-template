import { useLocation } from 'react-router-dom';
import { useTranslations } from '@/shared/hooks/use-translations';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Container } from '@/shared/ui/molecules/container';

export function TenantRoutePlaceholderPage() {
  const { t } = useTranslations();
  const { pathname } = useLocation();
  return <Container className="py-8"><Card><CardContent className="py-12 text-center"><h1 className="text-2xl font-semibold">{t('TENANT_ACCESS.ROUTE_READY')}</h1><p className="mt-2 text-sm text-muted-foreground">{pathname}</p></CardContent></Card></Container>;
}
