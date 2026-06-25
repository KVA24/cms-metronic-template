'use client';

import { JSX, useCallback, useMemo } from 'react';
import { MENU_SIDEBAR } from '@/shared/config/menu.config';
import { MenuConfig, MenuItem } from '@/shared/config/types';
import { useTranslations } from '@/shared/hooks/use-translations';
import { filterMenuByRole, useUserRole } from '@/shared/lib/rbac';
import { cn } from '@/shared/lib/utils';
import {
  AccordionMenu,
  AccordionMenuClassNames,
  AccordionMenuGroup,
  AccordionMenuItem,
  AccordionMenuLabel,
  AccordionMenuSub,
  AccordionMenuSubContent,
  AccordionMenuSubTrigger,
} from '@/shared/ui/atoms/accordion-menu';
import { Badge } from '@/shared/ui/atoms/badge';
import { ChevronDown } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSettings } from '@/app/providers/settings-provider';

export function SidebarMenu() {
  const { pathname } = useLocation();
  const userRole = useUserRole();
  const { t } = useTranslations();
  const { settings } = useSettings();

  // Check if sidebar is in dark mode
  const isDarkSidebar =
    settings.layouts.demo1.sidebarTheme === 'dark' ||
    pathname.includes('dark-sidebar');

  // Filter menu based on user role
  const filteredMenu = useMemo(() => {
    return filterMenuByRole(MENU_SIDEBAR, userRole);
  }, [userRole]);

  // Memoize matchPath to prevent unnecessary re-renders
  const matchPath = useCallback(
    (path: string): boolean =>
      path === pathname || (path.length > 1 && pathname.startsWith(path)),
    [pathname],
  );

  // Get translated title
  const getTitle = (item: MenuItem): string => {
    if (item.translationKey) {
      return t(item.translationKey);
    }
    return item.title || '';
  };

  // Global classNames for consistent styling
  const classNames: AccordionMenuClassNames = {
    root: 'lg:ps-1 space-y-3',
    group: 'gap-px',
    label:
      'uppercase text-xs font-medium text-muted-foreground/70 pt-2.25 pb-px',
    separator: '',
    item: 'h-8 hover:bg-transparent text-accent-foreground hover:text-primary data-[selected=true]:text-primary data-[selected=true]:bg-muted data-[selected=true]:font-medium',
    sub: '',
    subTrigger:
      'h-8 hover:bg-transparent text-accent-foreground hover:text-primary data-[selected=true]:text-primary data-[selected=true]:bg-muted data-[selected=true]:font-medium',
    subContent: 'py-0',
    indicator: '',
  };

  const buildMenu = (items: MenuConfig): JSX.Element[] => {
    return items.map((item: MenuItem, index: number) => {
      if (item.heading) {
        return buildMenuHeading(item, index);
      } else if (item.disabled) {
        return buildMenuItemRootDisabled(item, index);
      } else {
        return buildMenuItemRoot(item, index);
      }
    });
  };

  const buildMenuItemRoot = (item: MenuItem, index: number): JSX.Element => {
    if (item.children) {
      // Build popup content with children links (only direct children without nested children)
      const popupContent = (
        <div className={cn('flex flex-col gap-0', isDarkSidebar && 'dark')}>
          {item.children.map((child, childIndex) => {
            if (child.disabled) {
              return (
                <div
                  key={childIndex}
                  className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm rounded-md text-muted-foreground opacity-50 cursor-not-allowed"
                >
                  <span className="font-medium">{getTitle(child)}</span>
                  <Badge variant="secondary" size="sm">
                    Soon
                  </Badge>
                </div>
              );
            }

            return (
              <Link
                key={childIndex}
                to={child.path || '#'}
                className={cn(
                  'flex items-center justify-between gap-4 px-4 py-2.5 text-sm rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
                  matchPath(child.path || '') &&
                    'bg-accent text-accent-foreground',
                )}
              >
                <span className="font-medium">{getTitle(child)}</span>
                {child.children && (
                  <ChevronDown className="size-3.5 -rotate-90 opacity-60" />
                )}
              </Link>
            );
          })}
        </div>
      );

      const itemValue = item.path || `root-${index}`;

      return (
        <AccordionMenuSub key={itemValue} value={itemValue}>
          <AccordionMenuSubTrigger
            className="text-sm font-medium"
            showHoverPopup={true}
            popupContent={popupContent}
            value={itemValue}
          >
            {item.icon && <item.icon data-slot="accordion-menu-icon" />}
            <span data-slot="accordion-menu-title">{getTitle(item)}</span>
          </AccordionMenuSubTrigger>
          <AccordionMenuSubContent
            type="single"
            collapsible
            parentValue={itemValue}
            className="ps-6"
          >
            <AccordionMenuGroup>
              {buildMenuItemChildren(item.children, 1)}
            </AccordionMenuGroup>
          </AccordionMenuSubContent>
        </AccordionMenuSub>
      );
    } else {
      return (
        <AccordionMenuItem
          key={item.path || `item-${index}`}
          value={item.path || ''}
          className="text-sm font-medium"
        >
          <Link to={item.path || '#'} className="flex items-center grow gap-2">
            {item.icon && <item.icon data-slot="accordion-menu-icon" />}
            <span data-slot="accordion-menu-title">{getTitle(item)}</span>
          </Link>
        </AccordionMenuItem>
      );
    }
  };

  const buildMenuItemRootDisabled = (
    item: MenuItem,
    index: number,
  ): JSX.Element => {
    return (
      <AccordionMenuItem
        key={`disabled-${item.path || index}`}
        value={`disabled-${index}`}
        className="text-sm font-medium"
      >
        {item.icon && <item.icon data-slot="accordion-menu-icon" />}
        <span data-slot="accordion-menu-title">{getTitle(item)}</span>
        {item.disabled && (
          <Badge variant="secondary" size="sm" className="ms-auto me-[-10px]">
            Soon
          </Badge>
        )}
      </AccordionMenuItem>
    );
  };

  const buildMenuItemChildren = (
    items: MenuConfig,
    level: number = 0,
  ): JSX.Element[] => {
    return items.map((item: MenuItem, index: number) => {
      if (item.disabled) {
        return buildMenuItemChildDisabled(item, index, level);
      } else {
        return buildMenuItemChild(item, index, level);
      }
    });
  };

  const buildMenuItemChild = (
    item: MenuItem,
    index: number,
    level: number = 0,
  ): JSX.Element => {
    if (item.children) {
      return (
        <AccordionMenuSub
          key={item.path || `child-${level}-${index}`}
          value={item.path || `child-${level}-${index}`}
        >
          <AccordionMenuSubTrigger className="text-[13px]">
            {item.collapse ? (
              <span className="text-muted-foreground">
                <span className="hidden [[data-state=open]>span>&]:inline">
                  {item.collapseTitle}
                </span>
                <span className="inline [[data-state=open]>span>&]:hidden">
                  {item.expandTitle}
                </span>
              </span>
            ) : (
              getTitle(item)
            )}
          </AccordionMenuSubTrigger>
          <AccordionMenuSubContent
            type="single"
            collapsible
            parentValue={item.path || `child-${level}-${index}`}
            className={cn(
              'ps-4',
              !item.collapse && 'relative',
              !item.collapse && (level > 0 ? '' : ''),
            )}
          >
            <AccordionMenuGroup>
              {buildMenuItemChildren(
                item.children,
                item.collapse ? level : level + 1,
              )}
            </AccordionMenuGroup>
          </AccordionMenuSubContent>
        </AccordionMenuSub>
      );
    } else {
      return (
        <AccordionMenuItem
          key={item.path || `child-${level}-${index}`}
          value={item.path || ''}
          className="text-[13px]"
        >
          <Link to={item.path || '#'}>{getTitle(item)}</Link>
        </AccordionMenuItem>
      );
    }
  };

  const buildMenuItemChildDisabled = (
    item: MenuItem,
    index: number,
    level: number = 0,
  ): JSX.Element => {
    return (
      <AccordionMenuItem
        key={`disabled-child-${level}-${item.path || index}`}
        value={`disabled-child-${level}-${index}`}
        className="text-[13px]"
      >
        <span data-slot="accordion-menu-title">{getTitle(item)}</span>
        {item.disabled && (
          <Badge variant="secondary" size="sm" className="ms-auto me-[-10px]">
            Soon
          </Badge>
        )}
      </AccordionMenuItem>
    );
  };

  const buildMenuHeading = (item: MenuItem, index: number): JSX.Element => {
    return <AccordionMenuLabel key={item.heading || `heading-${index}`}>{item.heading}</AccordionMenuLabel>;
  };

  return (
    <div className="kt-scrollable-y-hover flex grow shrink-0 py-5 px-5 lg:max-h-[calc(100vh-5.5rem)]">
      <AccordionMenu
        selectedValue={pathname}
        matchPath={matchPath}
        type="single"
        collapsible
        classNames={classNames}
      >
        {buildMenu(filteredMenu)}
      </AccordionMenu>
    </div>
  );
}
