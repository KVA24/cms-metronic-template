import { Fragment, ReactNode } from 'react';
import { MenuItem } from '@/shared/config/types';
import { useMenu } from '@/shared/hooks/use-menu';
import { usePortalMenu } from '@/shared/hooks/use-portal-menu';
import { useTranslations } from '@/shared/hooks/use-translations';
import { cn } from '@/shared/lib/utils';
import { ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export interface ToolbarHeadingProps {
  title?: string | ReactNode;
  description?: string | ReactNode;
}

function Toolbar({ children }: { children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-5 pb-7.5">
      {children}
    </div>
  );
}

function ToolbarActions({ children }: { children?: ReactNode }) {
  return <div className="flex items-center gap-2.5">{children}</div>;
}

function ToolbarBreadcrumbs() {
  const { pathname } = useLocation();
  const { getBreadcrumb, isActive } = useMenu(pathname);
  const menu = usePortalMenu();
  const items: MenuItem[] = getBreadcrumb(menu);
  const { t } = useTranslations();

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="[.header_&]:below-lg:hidden mb-2.5 flex items-center gap-1.25 text-xs font-medium lg:mb-0 lg:text-sm">
      <div className="breadcrumb flex items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const active = item.path ? isActive(item.path) : false;

          return (
            <Fragment key={index}>
              {item.path ? (
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-1',
                    active
                      ? 'text-mono'
                      : 'text-muted-foreground hover:text-primary',
                  )}
                >
                  {item.translationKey ? t(item.translationKey) : item.title}
                </Link>
              ) : (
                <span
                  className={cn(isLast ? 'text-mono' : 'text-muted-foreground')}
                >
                  {item.translationKey ? t(item.translationKey) : item.title}
                </span>
              )}
              {!isLast && (
                <ChevronRight className="muted-foreground size-3.5" />
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function ToolbarHeading({ title = '', description }: ToolbarHeadingProps) {
  const { pathname } = useLocation();
  const { getCurrentItem } = useMenu(pathname);
  const menu = usePortalMenu();
  const item = getCurrentItem(menu);
  const { t } = useTranslations();
  const itemTitle = item?.translationKey ? t(item.translationKey) : item?.title;

  return (
    <div className="flex flex-col justify-center gap-2">
      <h1 className="text-mono text-xl leading-none font-medium">
        {title || itemTitle || 'Untitled'}
      </h1>
      {description && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm font-normal">
          {description}
        </div>
      )}
    </div>
  );
}

export { Toolbar, ToolbarActions, ToolbarBreadcrumbs, ToolbarHeading };
