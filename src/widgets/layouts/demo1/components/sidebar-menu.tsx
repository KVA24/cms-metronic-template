import type { MenuItem } from '@/shared/config/types';
import { usePortalMenu } from '@/shared/hooks/use-portal-menu';
import { useTranslations } from '@/shared/hooks/use-translations';
import { cn } from '@/shared/lib/utils';
import { NavLink } from 'react-router-dom';

export function SidebarMenu() {
  const menu = usePortalMenu();
  const { t } = useTranslations();

  const getTitle = (item: MenuItem) =>
    item.translationKey ? t(item.translationKey) : (item.title ?? '');

  const linkClassName = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex min-h-8 items-center gap-2 rounded-md px-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-primary/10 hover:text-primary',
      isActive && 'bg-muted text-primary dark:text-sky-300',
    );

  return (
    <nav
      className="kt-scrollable-y-hover flex shrink-0 grow px-5 py-5 lg:max-h-[calc(100vh-5.5rem)]"
      aria-label={t('SIDEBAR.NAVIGATION')}
    >
      <ul className="w-full space-y-1">
        {menu.map((item) => (
          <li key={item.path ?? item.translationKey ?? item.title}>
            {item.path ? (
              <NavLink to={item.path} className={linkClassName}>
                {item.icon && (
                  <item.icon aria-hidden="true" className="size-4" />
                )}
                <span data-slot="sidebar-menu-title">{getTitle(item)}</span>
              </NavLink>
            ) : (
              <div className="pt-2">
                <div className="text-muted-foreground flex min-h-8 items-center gap-2 px-3 text-xs font-semibold uppercase">
                  {item.icon && (
                    <item.icon aria-hidden="true" className="size-4" />
                  )}
                  <span data-slot="sidebar-menu-title">{getTitle(item)}</span>
                </div>
                <ul className="space-y-1 ps-5">
                  {item.children?.map((child) => (
                    <li key={child.path ?? child.translationKey ?? child.title}>
                      <NavLink to={child.path ?? '#'} className={linkClassName}>
                        <span data-slot="sidebar-menu-title">
                          {getTitle(child)}
                        </span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
