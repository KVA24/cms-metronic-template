import type { PortalType } from '@/shared/contracts';

export function getPortalFromSearchParam(value: string | null): PortalType {
  return value?.toUpperCase() === 'TENANT' ? 'TENANT' : 'ADMIN';
}

export function getPortalForPath(path: string): PortalType | null {
  if (path === '/admin' || path.startsWith('/admin/')) return 'ADMIN';
  if (path === '/tenant' || path.startsWith('/tenant/')) return 'TENANT';
  return null;
}

export function isPathAllowedForPortal(
  path: string,
  portalType: PortalType,
): boolean {
  return getPortalForPath(path) === portalType;
}

export function getPortalLoginPath(
  portalType: PortalType,
  nextPath?: string,
): string {
  const query = new URLSearchParams({ portal: portalType.toLowerCase() });

  if (nextPath && isPathAllowedForPortal(nextPath, portalType)) {
    query.set('next', nextPath);
  }

  return `/auth/login?${query.toString()}`;
}
