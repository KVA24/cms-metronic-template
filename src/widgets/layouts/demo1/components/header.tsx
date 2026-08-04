import { useEffect, useState } from 'react';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { useScrollPosition } from '@/shared/hooks/use-scroll-position';
import { toAbsoluteUrl } from '@/shared/lib/helpers';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/atoms/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '@/shared/ui/atoms/sheet';
import { Container } from '@/shared/ui/molecules/container';
// import {SearchDialog} from '@/partials/dialogs/search/search-dialog';
// import {AppsDropdownMenu} from '@/partials/topbar/apps-dropdown-menu';
// import {ChatSheet} from '@/partials/topbar/chat-sheet';
// import {NotificationsSheet} from '@/partials/topbar/notifications-sheet';
import { UserDropdownMenu } from '@/widgets/topbar/user-dropdown-menu';
import { Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Breadcrumb } from './breadcrumb';
// import {MegaMenu} from './mega-menu';
// import { MegaMenuMobile } from './mega-menu-mobile';
import { SidebarMenu } from './sidebar-menu';

export function Header() {
  const [isSidebarSheetOpen, setIsSidebarSheetOpen] = useState(false);
  // const [isMegaMenuSheetOpen, setIsMegaMenuSheetOpen] = useState(false);

  const { pathname } = useLocation();
  const mobileMode = useIsMobile();

  const scrollPosition = useScrollPosition();
  const headerSticky: boolean = scrollPosition > 0;

  // Close sheet when route changes
  useEffect(() => {
    setIsSidebarSheetOpen(false);
    // setIsMegaMenuSheetOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'header bg-background fixed start-0 end-0 top-0 z-10 flex shrink-0 items-stretch border-b border-transparent pe-[var(--removed-body-scroll-bar-size,0px)]',
        headerSticky && 'border-border border-b',
      )}
    >
      <Container className="flex items-stretch justify-between border-b shadow-xs lg:gap-4">
        {/* HeaderLogo */}
        <div className="flex items-center gap-2.5 lg:hidden">
          <Link to="/" className="shrink-0">
            <img
              src={toAbsoluteUrl('/media/app/mini-logo.svg')}
              className="h-[25px] w-full"
              alt="mini-logo"
            />
          </Link>
          <div className="flex items-center">
            {mobileMode && (
              <Sheet
                open={isSidebarSheetOpen}
                onOpenChange={setIsSidebarSheetOpen}
              >
                <SheetTrigger asChild>
                  <Button variant="ghost" mode="icon">
                    <Menu className="text-muted-foreground/70" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  className="w-[275px] gap-0 p-0"
                  side="left"
                  close={false}
                >
                  <SheetHeader className="space-y-0 p-0" />
                  <SheetBody className="overflow-y-auto p-0">
                    <SidebarMenu />
                  </SheetBody>
                </SheetContent>
              </Sheet>
            )}
            {mobileMode && <Breadcrumb />}
            {/*{mobileMode && (*/}
            {/*  <Sheet*/}
            {/*    open={isMegaMenuSheetOpen}*/}
            {/*    onOpenChange={setIsMegaMenuSheetOpen}*/}
            {/*  >*/}
            {/*    <SheetTrigger asChild>*/}
            {/*      <Button variant="ghost" mode="icon">*/}
            {/*        <SquareChevronRight className="text-muted-foreground/70" />*/}
            {/*      </Button>*/}
            {/*    </SheetTrigger>*/}
            {/*    <SheetContent*/}
            {/*      className="p-0 gap-0 w-[275px]"*/}
            {/*      side="left"*/}
            {/*      close={false}*/}
            {/*    >*/}
            {/*      <SheetHeader className="p-0 space-y-0" />*/}
            {/*      <SheetBody className="p-0 overflow-y-auto">*/}
            {/*        <MegaMenuMobile />*/}
            {/*      </SheetBody>*/}
            {/*    </SheetContent>*/}
            {/*  </Sheet>*/}
            {/*)}*/}
          </div>
        </div>

        {!mobileMode && <Breadcrumb />}

        {/*/!* Main Content (MegaMenu or Breadcrumbs) *!/*/}
        {/*{pathname.startsWith('/account') ? (*/}
        {/*  <Breadcrumb/>*/}
        {/*) : (*/}
        {/*  <div>*/}
        {/*    /!*!mobileMode && <MegaMenu/>*!/*/}
        {/*  </div>*/}
        {/*)}*/}

        {/* HeaderTopbar */}
        <div className="flex items-center gap-3">
          {pathname.startsWith('/store-client') ? (
            <></>
          ) : (
            <>
              {/*{!mobileMode && (*/}
              {/*  <SearchDialog*/}
              {/*    trigger={*/}
              {/*      <Button*/}
              {/*        variant="ghost"*/}
              {/*        mode="icon"*/}
              {/*        shape="circle"*/}
              {/*        className="size-9 hover:bg-primary/10 hover:[&_svg]:text-primary"*/}
              {/*      >*/}
              {/*        <Search className="size-4.5!"/>*/}
              {/*      </Button>*/}
              {/*    }*/}
              {/*  />*/}
              {/*)}*/}
              {/*<NotificationsSheet*/}
              {/*  trigger={*/}
              {/*    <Button*/}
              {/*      variant="ghost"*/}
              {/*      mode="icon"*/}
              {/*      shape="circle"*/}
              {/*      className="size-9 hover:bg-primary/10 hover:[&_svg]:text-primary"*/}
              {/*    >*/}
              {/*      <Bell className="size-4.5!"/>*/}
              {/*    </Button>*/}
              {/*  }*/}
              {/*/>*/}
              {/*<ChatSheet*/}
              {/*  trigger={*/}
              {/*    <Button*/}
              {/*      variant="ghost"*/}
              {/*      mode="icon"*/}
              {/*      shape="circle"*/}
              {/*      className="size-9 hover:bg-primary/10 hover:[&_svg]:text-primary"*/}
              {/*    >*/}
              {/*      <MessageCircleMore className="size-4.5!"/>*/}
              {/*    </Button>*/}
              {/*  }*/}
              {/*/>*/}
              {/*<AppsDropdownMenu*/}
              {/*  trigger={*/}
              {/*    <Button*/}
              {/*      variant="ghost"*/}
              {/*      mode="icon"*/}
              {/*      shape="circle"*/}
              {/*      className="size-9 hover:bg-primary/10 hover:[&_svg]:text-primary"*/}
              {/*    >*/}
              {/*      <LayoutGrid className="size-4.5!"/>*/}
              {/*    </Button>*/}
              {/*  }*/}
              {/*/>*/}
              <UserDropdownMenu
                trigger={
                  <img
                    className="size-9 shrink-0 cursor-pointer rounded-full border-2 border-green-500"
                    src={toAbsoluteUrl('/media/avatars/300-2.png')}
                    alt="User Avatar"
                  />
                }
              />
            </>
          )}
        </div>
      </Container>
    </header>
  );
}
