import { useMemo } from 'react';
import { getPortalMenu } from '@/shared/config/menu.config';
import type { MenuConfig } from '@/shared/config/types';
import { filterMenuByPermissions } from '@/shared/lib/rbac/menu-filter';
import { useAuthSession } from '@/shared/stores/auth-store';

const EMPTY_MENU: MenuConfig = [];

export function usePortalMenu(): MenuConfig {
  const session = useAuthSession();

  return useMemo(
    () =>
      session
        ? filterMenuByPermissions(
            getPortalMenu(session.portalType),
            session.permissions,
          )
        : EMPTY_MENU,
    [session],
  );
}
