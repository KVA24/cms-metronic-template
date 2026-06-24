import { ReactNode } from 'react';
import { MenuConfig } from '@/shared/config/types';
import { useMenu } from '@/shared/hooks/use-menu';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/atoms/badge';
import { NavigationMenuLink } from '@/shared/ui/atoms/navigation-menu';
import { Link, useLocation } from 'react-router-dom';

const MegaMenuSubHighlighted = (items: MenuConfig) => {
  const { pathname } = useLocation();
  const { isActive } = useMenu(pathname);

  const buildItems = (items: MenuConfig): ReactNode => {
    return items.map((item, index) => {
      return (
        <NavigationMenuLink key={index} asChild>
          <Link
            key={index}
            {...(isActive(item.path) && { 'data-active': true })}
            to={item.path || ''}
            className={cn(
              'border border-transparent hover:border-border hover:bg-background',
              'flex flex-row items-center gap-2.5 px-2.5 py-2 rounded-md text-sm',
              '[&_svg]:text-muted-foreground hover:[&_svg]:text-primary [&[data-active=true]_svg]:text-primary',
            )}
          >
            {item.icon && <item.icon className="size-4" />}

            {item.title}

            {item.disabled && (
              <Badge variant="secondary" size="sm">
                Soon
              </Badge>
            )}

            {item.badge && (
              <Badge variant="primary" size="sm" appearance="light">
                {item.badge}
              </Badge>
            )}
          </Link>
        </NavigationMenuLink>
      );
    });
  };

  return buildItems(items);
};

export { MegaMenuSubHighlighted };
