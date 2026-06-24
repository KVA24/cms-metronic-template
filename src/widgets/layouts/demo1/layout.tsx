import { useEffect } from 'react';
import { MENU_SIDEBAR } from '@/shared/config/menu.config';
import { BreadcrumbProvider } from '@/shared/contexts/breadcrumb-context';
import { useMenu } from '@/shared/hooks/use-menu';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { Helmet } from 'react-helmet-async';
import { Outlet, useLocation } from 'react-router-dom';
import { useSettings } from '@/app/providers/settings-provider';
import { Footer } from './components/footer';
import { Header } from './components/header';
import { Sidebar } from './components/sidebar';

export function Demo1Layout() {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const { getCurrentItem } = useMenu(pathname);
  const item = getCurrentItem(MENU_SIDEBAR);
  const { settings, setOption } = useSettings();

  useEffect(() => {
    // Save current scroll position before class change
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    const bodyClass = document.body.classList;

    if (settings.layouts.demo1.sidebarCollapse) {
      bodyClass.add('sidebar-collapse');
    } else {
      bodyClass.remove('sidebar-collapse');
    }

    // Restore scroll position after class change
    requestAnimationFrame(() => {
      window.scrollTo(scrollX, scrollY);
    });
  }, [settings.layouts.demo1.sidebarCollapse]); // Only watch sidebarCollapse

  useEffect(() => {
    // Set current layout
    setOption('layout', 'demo1');
  }, [setOption]);

  useEffect(() => {
    const bodyClass = document.body.classList;

    // Add a class to the body element
    bodyClass.add('demo1');
    bodyClass.add('sidebar-fixed');
    bodyClass.add('header-fixed');

    const timer = setTimeout(() => {
      bodyClass.add('layout-initialized');
    }, 1000); // 1000 milliseconds

    // Remove the class when the component is unmounted
    return () => {
      bodyClass.remove('demo1');
      bodyClass.remove('sidebar-fixed');
      bodyClass.remove('sidebar-collapse');
      bodyClass.remove('header-fixed');
      bodyClass.remove('layout-initialized');
      clearTimeout(timer);
    };
  }, []); // Runs only once on mount

  return (
    <BreadcrumbProvider>
      <Helmet>
        <title>{item?.title}</title>
      </Helmet>

      {!isMobile && <Sidebar />}

      <div className="wrapper flex grow flex-col">
        <Header />

        <main className="grow pt-5" role="content">
          <Outlet />
        </main>

        <Footer />
      </div>
    </BreadcrumbProvider>
  );
}
