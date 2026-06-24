import { toAbsoluteUrl } from '@/shared/lib/helpers';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/atoms/button';
import { ChevronFirst } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '@/app/providers/settings-provider';

export function SidebarHeader() {
  const { settings, storeOption } = useSettings();

  const handleToggleClick = () => {
    // Save current scroll position
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    storeOption(
      'layouts.demo1.sidebarCollapse',
      !settings.layouts.demo1.sidebarCollapse,
    );

    // Restore scroll position after state update
    requestAnimationFrame(() => {
      window.scrollTo(scrollX, scrollY);
    });
  };

  return (
    <div className="sidebar-header hidden lg:flex items-center relative justify-between px-3 lg:px-6 shrink-0">
      <Link to="/">
        <div className="dark:hidden">
          <img
            src={toAbsoluteUrl('/media/app/default-logo.svg')}
            className="default-logo h-[22px] max-w-none"
            alt="Default Logo"
          />
          <img
            src={toAbsoluteUrl('/media/app/mini-logo.svg')}
            className="small-logo h-[22px] max-w-none"
            alt="Mini Logo"
          />
        </div>
        <div className="hidden dark:block">
          <img
            src={toAbsoluteUrl('/media/app/default-logo-dark.svg')}
            className="default-logo h-[22px] max-w-none"
            alt="Default Dark Logo"
          />
          <img
            src={toAbsoluteUrl('/media/app/mini-logo.svg')}
            className="small-logo h-[22px] max-w-none"
            alt="Mini Logo"
          />
        </div>
      </Link>
      <Button
        onClick={handleToggleClick}
        size="sm"
        mode="icon"
        variant="outline"
        className={cn(
          'size-7 absolute start-full top-2/4 rtl:translate-x-2/4 -translate-x-2/4 -translate-y-2/4',
          settings.layouts.demo1.sidebarCollapse
            ? 'ltr:rotate-180'
            : 'rtl:rotate-180',
        )}
      >
        <ChevronFirst className="size-4!" />
      </Button>
    </div>
  );
}
