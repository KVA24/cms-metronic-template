import { Fragment } from 'react';
import { MENU_SIDEBAR } from '@/shared/config/menu.config';
import { MenuItem } from '@/shared/config/types';
import { useBreadcrumb } from '@/shared/contexts/breadcrumb-context';
import { useMenu } from '@/shared/hooks/use-menu';
import { cn } from '@/shared/lib/utils';
import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function Breadcrumb() {
  const { pathname } = useLocation();
  const { getBreadcrumb, isActive } = useMenu(pathname);
  const { customBreadcrumb } = useBreadcrumb();
  const menuItems: MenuItem[] = getBreadcrumb(MENU_SIDEBAR);

  // Always start with Home
  const homeItem: MenuItem = {
    title: 'Home',
    path: '/',
    icon: Home,
  };

  // Build items array
  let items: MenuItem[];
  if (pathname === '/') {
    items = [homeItem];
  } else if (customBreadcrumb) {
    // Use custom breadcrumb if provided by page
    items = [homeItem, ...customBreadcrumb];
  } else {
    // Use default menu-based breadcrumb
    items = [homeItem, ...menuItems];
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.25 text-xs lg:text-sm font-medium mb-0">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        const active = item.path ? isActive(item.path) : false;
        const isHome = index === 0;

        return (
          <Fragment key={item.path || `root-${index}`}>
            {item.path && !last ? (
              <Link
                to={item.path}
                className={cn(
                  'hover:text-primary transition-colors',
                  active ? 'text-mono' : 'text-secondary-foreground',
                )}
                key={`link-${item.path}`}
              >
                {isHome ? <Home className="size-3.5" /> : item.title}
              </Link>
            ) : (
              <span
                className={cn(
                  active ? 'text-mono' : 'text-secondary-foreground',
                )}
                key={`span-${item.path || index}`}
              >
                {isHome ? <Home className="size-3.5" /> : item.title}
              </span>
            )}
            {!last && (
              <ChevronRight
                className="size-3.5 text-muted-foreground"
                key={`separator-${item.path || index}`}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
