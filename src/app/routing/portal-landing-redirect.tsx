import { getFirstPermittedPath } from '@/shared/config/menu.config';
import type { PortalType } from '@/shared/contracts';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Navigate } from 'react-router-dom';

export function PortalLandingRedirect({
  portalType,
}: {
  portalType?: PortalType;
}) {
  const session = useAuthSession();
  const targetPortal = portalType ?? session?.portalType;

  if (!session || !targetPortal || session.portalType !== targetPortal) {
    return <Navigate to="/error/403" replace />;
  }

  return (
    <Navigate
      to={getFirstPermittedPath(targetPortal, session.permissions)}
      replace
    />
  );
}
