import { getFirstPermittedPath } from '@/shared/config/menu.config';
import type { PortalType } from '@/shared/contracts';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Navigate } from 'react-router-dom';

export function PortalLandingRedirect({
  portalType,
}: {
  portalType: PortalType;
}) {
  const session = useAuthSession();

  if (!session || session.portalType !== portalType) {
    return <Navigate to="/error/403" replace />;
  }

  return (
    <Navigate
      to={getFirstPermittedPath(portalType, session.permissions)}
      replace
    />
  );
}
