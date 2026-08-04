import { toAbsoluteUrl } from '@/shared/lib/helpers';
import {
  AccordionMenu,
  AccordionMenuGroup,
  AccordionMenuItem,
} from '@/shared/ui/atoms/accordion-menu';
import { Badge, BadgeDot } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { EllipsisVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SearchUsersItem } from './types';

export function SearchUsers({
  items,
  more,
}: {
  items: SearchUsersItem[];
  more?: boolean;
}) {
  return (
    <AccordionMenu
      type="single"
      collapsible
      classNames={{
        separator: '-mx-2 mb-2.5',
      }}
    >
      <AccordionMenuGroup>
        <div className="m-2 grid gap-2">
          {items.map((item) => (
            <AccordionMenuItem key={item.name} value={item.name} asChild>
              <div className="flex items-center justify-between gap-2">
                {/* User avatar and info */}
                <div className="flex items-center gap-2.5">
                  <img
                    src={toAbsoluteUrl(`/media/avatars/${item.avatar}`)}
                    className="size-9 shrink-0 rounded-full"
                    alt={item.name}
                  />
                  <div className="flex flex-col">
                    <Link
                      to="#"
                      className="text-mono hover:text-primary-active mb-px text-sm font-semibold"
                    >
                      {item.name}
                    </Link>
                    <span className="text-muted-foreground text-sm font-normal">
                      {item.email} connections
                    </span>
                  </div>
                </div>

                {/* Status badge and action button */}
                <div className="flex items-center gap-2.5">
                  <Badge
                    size="md"
                    variant={item.color}
                    appearance="light"
                    shape="circle"
                  >
                    <BadgeDot /> {item.label}
                  </Badge>

                  <Button variant="ghost" mode="icon">
                    <EllipsisVertical />
                  </Button>
                </div>
              </div>
            </AccordionMenuItem>
          ))}
        </div>
        {/* Conditional "Go to Users" button */}
        {!more || (
          <AccordionMenuItem className="px-4 pt-2" value={''}>
            <Button variant="outline" className="mx-auto w-full max-w-full">
              Go to Users
            </Button>
          </AccordionMenuItem>
        )}
      </AccordionMenuGroup>
    </AccordionMenu>
  );
}
