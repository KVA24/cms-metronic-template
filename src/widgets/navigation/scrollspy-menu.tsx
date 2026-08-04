import { cn } from '@/shared/lib/utils';

export interface ScrollspyMenuItem {
  title: string;
  target?: string;
  active?: boolean;
  children?: ScrollspyMenuItem[];
}

export type ScrollspyMenuItems = Array<ScrollspyMenuItem>;

export interface ScrollspyMenuProps {
  items: ScrollspyMenuItem[];
}

const ScrollspyMenu = ({ items }: ScrollspyMenuProps) => {
  const buildAnchor = (item: ScrollspyMenuItem, indent: boolean = false) => {
    return (
      <div
        key={item.target || item.title}
        data-scrollspy-anchor={item.target}
        className={cn(
          'text-accent-foreground hover:text-primary data-[active=true]:bg-accent data-[active=true]:text-primary flex cursor-pointer items-center rounded-lg border border-transparent py-1.5 ps-2.5 pe-2.5 data-[active=true]:font-medium',
          indent ? 'gap-3.5' : 'gap-1.5',
        )}
      >
        <span className="[[data-active=true]>&]:before:bg-primary relative start-px flex w-1.5 before:absolute before:top-0 before:size-1.5 before:-translate-x-2/4 before:-translate-y-2/4 before:rounded-full rtl:-start-[5px]"></span>
        {item.title}
      </div>
    );
  };

  const buildSubAnchors = (items: ScrollspyMenuItems) => {
    return items.map((item) => {
      return buildAnchor(item, true);
    });
  };

  const renderChildren = (items: ScrollspyMenuItems) => {
    return items.map((item) => {
      if (item.children) {
        return (
          <div key={item.target || item.title} className="flex flex-col">
            <div className="text-mono py-2.5 ps-6 pe-2.5 text-sm font-semibold">
              {item.title}
            </div>
            <div className="flex flex-col">
              {buildSubAnchors(item.children)}
            </div>
          </div>
        );
      } else {
        return buildAnchor(item);
      }
    });
  };

  return (
    <div className="before:border-border relative flex grow flex-col text-sm before:absolute before:start-[11px] before:top-0 before:bottom-0 before:border-s">
      {renderChildren(items)}
    </div>
  );
};

export { ScrollspyMenu };
