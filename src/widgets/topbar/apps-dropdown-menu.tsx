import { ReactNode } from 'react';
import { toAbsoluteUrl } from '@/shared/lib/helpers';
import { Button } from '@/shared/ui/atoms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/ui/atoms/dropdown-menu';
import { Switch } from '@/shared/ui/atoms/switch';
import { Link } from 'react-router-dom';

interface DropdownAppsItem {
  logo: string;
  title: string;
  description: string;
  checkbox: boolean;
}

export function AppsDropdownMenu({ trigger }: { trigger: ReactNode }) {
  const items: DropdownAppsItem[] = [
    {
      logo: 'jira.svg',
      title: 'Jira',
      description: 'Project management',
      checkbox: false,
    },
    {
      logo: 'inferno.svg',
      title: 'Inferno',
      description: 'Ensures healthcare app',
      checkbox: true,
    },
    {
      logo: 'evernote.svg',
      title: 'Evernote',
      description: 'Notes management app',
      checkbox: true,
    },
    {
      logo: 'gitlab.svg',
      title: 'Gitlab',
      description: 'DevOps platform',
      checkbox: false,
    },
    {
      logo: 'google-webdev.svg',
      title: 'Google webdev',
      description: 'Building web experiences',
      checkbox: true,
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-[325px] p-0" side="bottom" align="end">
        <div className="text-secondary-foreground border-b-border flex items-center justify-between gap-2.5 border-b px-5 py-3 text-xs font-medium">
          <span>Apps</span>
          <span>Enabled</span>
        </div>
        <div className="scrollable-y-auto divide-border flex max-h-[400px] flex-col divide-y">
          {items.map((item) => (
            <div
              key={item.title}
              className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-accent/60 border-border flex size-10 shrink-0 items-center justify-center rounded-full border">
                  <img
                    src={toAbsoluteUrl(`/media/brand-logos/${item.logo}`)}
                    className="size-6"
                    alt={item.title}
                  />
                </div>

                <div className="flex flex-col">
                  <span className="text-mono hover:text-primary-active text-sm font-semibold">
                    {item.title}
                  </span>
                  <span className="text-secondary-foreground text-xs font-medium">
                    {item.description}
                  </span>
                </div>
              </div>
              <Switch defaultChecked={item.checkbox} size="sm"></Switch>
            </div>
          ))}
        </div>
        <div className="border-t-border grid border-t p-5">
          <Button asChild variant="outline" size="sm">
            <Link to="/account/api-keys">Go to Apps</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
