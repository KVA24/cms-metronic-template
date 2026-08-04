import { toAbsoluteUrl } from '@/shared/lib/helpers';
import {
  AccordionMenu,
  AccordionMenuGroup,
  AccordionMenuItem,
} from '@/shared/ui/atoms/accordion-menu';
import { Button } from '@/shared/ui/atoms/button';
import { AvatarGroup } from '@/shared/ui/molecules/common/avatar-group';
import { Link } from 'react-router-dom';
import { SearchIntegrationsItem } from './types';

export function SearchIntegrations({
  items,
  more,
}: {
  items: SearchIntegrationsItem[];
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
        <div className="grid gap-2 px-2">
          {items.map((item) => (
            <AccordionMenuItem key={item.name} value={item.name} asChild>
              <div className="flex items-center justify-between gap-2">
                <div className="flex grow items-center gap-2">
                  {/* Logo */}
                  <div className="border-border bg-accent/60 flex size-10 shrink-0 items-center justify-center rounded-full border">
                    <img
                      src={toAbsoluteUrl(`/media/brand-logos/${item.logo}`)}
                      className="size-6 shrink-0"
                      alt={item.name}
                    />
                  </div>

                  {/* Name and description */}
                  <div className="flex flex-col gap-0.5">
                    <Link
                      to="#"
                      className="text-mono hover:text-primary-active text-sm font-semibold"
                    >
                      {item.name}
                    </Link>
                    <span className="text-secondary-foreground text-xs font-medium">
                      {item.description}
                    </span>
                  </div>
                </div>

                {/* Team avatars */}
                <div className="flex shrink-0 justify-end">
                  <AvatarGroup group={item.team} />
                </div>
              </div>
            </AccordionMenuItem>
          ))}
        </div>
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
