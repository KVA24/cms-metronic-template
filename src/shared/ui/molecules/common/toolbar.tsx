import { ReactNode } from 'react';
import { useMenu } from '@/shared/hooks/use-menu';
import { usePortalMenu } from '@/shared/hooks/use-portal-menu';
import { useTranslations } from '@/shared/hooks/use-translations';
import { useLocation } from 'react-router-dom';

const Toolbar = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
      {children}
    </div>
  );
};

const ToolbarActions = ({ children }: { children: ReactNode }) => {
  return <div className="flex items-center gap-2.5">{children}</div>;
};

const ToolbarPageTitle = ({ text }: { text?: string }) => {
  const { pathname } = useLocation();
  const { getCurrentItem } = useMenu(pathname);
  const menu = usePortalMenu();
  const item = getCurrentItem(menu);
  const { t } = useTranslations();
  const itemTitle = item?.translationKey ? t(item.translationKey) : item?.title;

  return (
    <h1 className="text-xl font-medium leading-none text-mono">
      {text ?? itemTitle}
    </h1>
  );
};

const ToolbarDescription = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex items-center gap-2 text-sm font-normal text-secondary-foreground">
      {children}
    </div>
  );
};

const ToolbarHeading = ({ children }: { children: ReactNode }) => {
  return <div className="flex flex-col justify-center gap-2">{children}</div>;
};

export {
  Toolbar,
  ToolbarActions,
  ToolbarPageTitle,
  ToolbarHeading,
  ToolbarDescription,
};
