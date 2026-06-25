'use client';

import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import { Accordion as AccordionPrimitive } from 'radix-ui';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface AccordionMenuContextValue {
  matchPath: (href: string) => boolean;
  selectedValue: string | undefined;
  setSelectedValue: React.Dispatch<React.SetStateAction<string | undefined>>;
  classNames?: AccordionMenuClassNames;
  nestedStates: Record<string, string | string[]>;
  setNestedStates: React.Dispatch<
    React.SetStateAction<Record<string, string | string[]>>
  >;
  onItemClick?: (value: string, event: React.MouseEvent) => void;
  isExpanded?: (value: string) => boolean;
}

interface AccordionMenuClassNames {
  root?: string;
  group?: string;
  label?: string;
  separator?: string;
  item?: string;
  sub?: string;
  subTrigger?: string;
  subContent?: string;
  subWrapper?: string;
  indicator?: string;
}

interface AccordionMenuProps {
  selectedValue?: string;
  matchPath?: (href: string) => boolean;
  classNames?: AccordionMenuClassNames;
  onItemClick?: (value: string, event: React.MouseEvent) => void;
}

const AccordionMenuContext = React.createContext<AccordionMenuContextValue>({
  matchPath: () => false,
  selectedValue: '',
  setSelectedValue: () => {},
  nestedStates: {},
  setNestedStates: () => {},
  isExpanded: () => false,
});

function AccordionMenu({
  className,
  matchPath = () => false,
  classNames,
  children,
  selectedValue,
  onItemClick,
  ...props
}: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root> &
  AccordionMenuProps) {
  const [internalSelectedValue, setInternalSelectedValue] = React.useState<
    string | undefined
  >(selectedValue);
  React.useEffect(() => {
    setInternalSelectedValue(selectedValue);
  }, [selectedValue]);

  const matchPathRef = React.useRef(matchPath);
  matchPathRef.current = matchPath;

  const initialNestedStates = React.useMemo(() => {
    const getActiveChain = (
      nodes: React.ReactNode,
      chain: string[] = [],
    ): string[] => {
      let result: string[] = [];
      React.Children.forEach(nodes, (node) => {
        if (React.isValidElement(node)) {
          const { value, children } = node.props as {
            value?: string;
            children?: React.ReactNode;
          };
          const newChain = value ? [...chain, value] : chain;
          if (value && (value === selectedValue || matchPathRef.current(value))) {
            result = newChain;
          } else if (children) {
            const childChain = getActiveChain(children, newChain);
            if (childChain.length > 0) {
              result = childChain;
            }
          }
        }
      });
      return result;
    };

    const chain = getActiveChain(children);
    const trimmedChain =
      chain.length > 1 ? chain.slice(0, chain.length - 1) : chain;
    const mapping: Record<string, string | string[]> = {};
    if (trimmedChain.length > 0) {
      if (props.type === 'multiple') {
        mapping['root'] = trimmedChain;
      } else {
        mapping['root'] = trimmedChain[0];
        for (let i = 0; i < trimmedChain.length - 1; i++) {
          mapping[trimmedChain[i]] = trimmedChain[i + 1];
        }
      }
    }
    return mapping;
     
  }, [children, selectedValue, props.type]);

  const [nestedStates, setNestedStates] =
    React.useState<Record<string, string | string[]>>(initialNestedStates);
  const multipleValue = React.useMemo(() => (
    Array.isArray(nestedStates['root'])
      ? nestedStates['root']
      : typeof nestedStates['root'] === 'string'
        ? [nestedStates['root']]
        : []
  ) as string[], [nestedStates]);
  const singleValue = (nestedStates['root'] ?? '') as string;

  // Function to check if an item is expanded
  const isExpanded = React.useCallback(
    (value: string) => {
      if (props.type === 'multiple') {
        return multipleValue.includes(value);
      }
      return singleValue === value;
    },
    [props.type, multipleValue, singleValue],
  );

  return (
    <AccordionMenuContext.Provider
      value={{
        matchPath,
        selectedValue: internalSelectedValue,
        setSelectedValue: setInternalSelectedValue,
        classNames,
        onItemClick,
        nestedStates,
        setNestedStates,
        isExpanded,
      }}
    >
      {props.type === 'single' ? (
        <AccordionPrimitive.Root
          data-slot="accordion-menu"
          value={singleValue}
          className={cn('w-full', classNames?.root, className)}
          onValueChange={(value: string) =>
            setNestedStates((prev) => ({ ...prev, root: value }))
          }
          {...props}
          role="menu"
        >
          {children}
        </AccordionPrimitive.Root>
      ) : (
        <AccordionPrimitive.Root
          data-slot="accordion-menu"
          value={multipleValue}
          className={cn('w-full', classNames?.root, className)}
          onValueChange={(value: string | string[]) =>
            setNestedStates((prev) => ({ ...prev, root: value }))
          }
          {...props}
          role="menu"
        >
          {children}
        </AccordionPrimitive.Root>
      )}
    </AccordionMenuContext.Provider>
  );
}

type AccordionMenuGroupProps = React.ComponentPropsWithoutRef<'div'>;

function AccordionMenuGroup({
  children,
  className,
  ...props
}: AccordionMenuGroupProps) {
  const { classNames } = React.use(AccordionMenuContext);
  return (
    <div
      data-slot="accordion-menu-group"
      role="group"
      className={cn('space-y-0.5', classNames?.group, className)}
      {...props}
    >
      {children}
    </div>
  );
}

type AccordionMenuLabelProps = React.ComponentPropsWithoutRef<'div'>;

function AccordionMenuLabel({
  children,
  className,
  ...props
}: AccordionMenuLabelProps) {
  const { classNames } = React.use(AccordionMenuContext);

  return (
    <div
      data-slot="accordion-menu-label"
      role="presentation"
      className={cn(
        'px-2 py-1.5 text-xs font-medium text-muted-foreground',
        classNames?.label,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type AccordionMenuSeparatorProps = React.ComponentPropsWithoutRef<'div'>;

function AccordionMenuSeparator({
  className,
  ...props
}: AccordionMenuSeparatorProps) {
  const { classNames } = React.use(AccordionMenuContext);
  return (
    <div
      data-slot="accordion-menu-separator"
      role="separator"
      className={cn('my-1 h-px bg-border', classNames?.separator, className)}
      {...props}
    />
  );
}

const itemVariants = cva(
  'relative cursor-pointer select-none flex w-full text-start items-center text-foreground rounded-lg gap-2 px-2 py-1.5 text-sm outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground disabled:opacity-50 disabled:bg-transparent focus-visible:bg-accent focus-visible:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:opacity-60 [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0 [&_a]:flex [&>a]:w-full [&>a]:items-center [&>a]:gap-2',
  {
    variants: {
      variant: {
        default: '',
        destructive:
          'text-destructive hover:text-destructive focus:text-destructive hover:bg-destructive/5 focus:bg-destructive/5 data-[active=true]:bg-destructive/5',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function AccordionMenuItem({
  className,
  children,
  variant,
  asChild,
  onClick,
  ...props
}: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> &
  VariantProps<typeof itemVariants> & {
    onClick?: React.MouseEventHandler<HTMLElement>;
  }) {
  const { classNames, selectedValue, matchPath, onItemClick } =
    React.use(AccordionMenuContext);

  // Check if children is a Link component by checking if it's a valid element
  const hasLinkChild =
    React.isValidElement(children) &&
    (children.type === 'a' ||
      (typeof children.type === 'function' &&
        (children.type as any).displayName?.includes('Link')));

  return (
    <AccordionPrimitive.Item className="flex" {...props}>
      <AccordionPrimitive.Header className="flex w-full">
        <AccordionPrimitive.Trigger
          asChild={hasLinkChild || asChild}
          data-slot="accordion-menu-item"
          className={cn(itemVariants({ variant }), classNames?.item, className)}
          onClick={(e) => {
            // Only prevent default if not a Link child
            if (!hasLinkChild) {
              if (onItemClick) {
                onItemClick(props.value, e);
              }

              if (onClick) {
                onClick(e);
              }
              e.preventDefault();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !hasLinkChild) {
              e.preventDefault();
              const target = e.currentTarget as HTMLElement;
              const firstChild = target.firstElementChild as HTMLElement | null;
              if (firstChild) {
                firstChild.click();
              }
            }
          }}
          data-selected={
            matchPath(props.value as string) || selectedValue === props.value
              ? 'true'
              : undefined
          }
        >
          {children}
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
    </AccordionPrimitive.Item>
  );
}

function AccordionMenuSub({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>) {
  const { classNames } = React.use(AccordionMenuContext);
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-menu-sub"
      className={cn(classNames?.sub, className)}
      {...props}
    >
      {children}
    </AccordionPrimitive.Item>
  );
}

function AccordionMenuSubTrigger({
  className,
  children,
  showHoverPopup = false,
  popupContent,
  value,
}: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & {
  showHoverPopup?: boolean;
  popupContent?: React.ReactNode;
  value?: string;
}) {
  const { classNames, isExpanded } = React.use(AccordionMenuContext);
  const [isHovered, setIsHovered] = React.useState(false);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Check if this item is currently expanded
  const expanded = value ? isExpanded?.(value) : false;

  // Add/remove class to body when popup is open to keep sidebar expanded
  React.useEffect(() => {
    if (isHovered && showHoverPopup && !expanded) {
      document.body.classList.add('sidebar-popup-open');
    } else {
      document.body.classList.remove('sidebar-popup-open');
    }

    return () => {
      document.body.classList.remove('sidebar-popup-open');
    };
  }, [isHovered, showHoverPopup, expanded]);

  const handleMouseEnter = () => {
    // Only show popup if not expanded
    // if (showHoverPopup && !expanded) {
    //   hoverTimeoutRef.current = setTimeout(() => {
    //     setIsHovered(true);
    //   }, 300); // 300ms delay before showing popup
    // }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(false);
  };

  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const triggerContent = (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-menu-sub-trigger"
        className={cn(
          'w-full relative flex items-center cursor-pointer select-none text-start rounded-lg gap-2 px-2 py-1.5 text-sm outline-hidden text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground [&_svg]:pointer-events-none [&_svg:not([role=img]):not([class*=text-])]:opacity-60 [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
          classNames?.subTrigger,
          className,
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <>
          {children}
          <ChevronDown
            data-slot="accordion-menu-sub-indicator"
            className={cn(
              'ms-auto size-3.5! shrink-0 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:-rotate-180',
            )}
          />
        </>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );

  if (showHoverPopup && popupContent && !expanded) {
    return (
      <Popover open={isHovered} onOpenChange={setIsHovered}>
        <PopoverTrigger asChild>{triggerContent}</PopoverTrigger>
        <PopoverContent
          side="right"
          align="start"
          sideOffset={0}
          collisionPadding={0}
          className="w-auto min-w-[200px] p-2 !z-[9999] bg-background border-border"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
        >
          {popupContent}
        </PopoverContent>
      </Popover>
    );
  }

  return triggerContent;
}

type AccordionMenuSubContentProps = (
  | (React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> & {
      type: 'single';
      collapsible: boolean;
      defaultValue?: string;
    })
  | (React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> & {
      type: 'multiple';
      collapsible?: boolean;
      defaultValue?: string | string[];
    })
) & {
  parentValue: string;
};

function AccordionMenuSubContent({
  className,
  children,
  type,
  collapsible,
  defaultValue,
  parentValue,
  ...props
}: AccordionMenuSubContentProps) {
  const { nestedStates, setNestedStates, classNames } =
    React.use(AccordionMenuContext);
  let currentValue;
  if (type === 'multiple') {
    const stateValue = nestedStates[parentValue];
    if (Array.isArray(stateValue)) {
      currentValue = stateValue;
    } else if (typeof stateValue === 'string') {
      currentValue = [stateValue];
    } else if (defaultValue) {
      currentValue = Array.isArray(defaultValue)
        ? defaultValue
        : [defaultValue];
    } else {
      currentValue = [];
    }
  } else {
    currentValue = nestedStates[parentValue] ?? defaultValue ?? '';
  }

  return (
    <AccordionPrimitive.Content
      data-slot="accordion-menu-sub-content"
      className={cn(
        'ps-5',
        'overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
        classNames?.subContent,
        className,
      )}
      {...props}
    >
      {type === 'multiple' ? (
        <AccordionPrimitive.Root
          className={cn('w-full py-0.5', classNames?.subWrapper)}
          type="multiple"
          value={currentValue as string[]}
          role="menu"
          data-slot="accordion-menu-sub-wrapper"
          onValueChange={(value: string | string[]) => {
            const newValue = Array.isArray(value) ? value : [value];
            setNestedStates((prev) => ({ ...prev, [parentValue]: newValue }));
          }}
        >
          {children}
        </AccordionPrimitive.Root>
      ) : (
        <AccordionPrimitive.Root
          className={cn('w-full py-0.5', classNames?.subWrapper)}
          type="single"
          collapsible={collapsible}
          value={currentValue as string}
          role="menu"
          data-slot="accordion-menu-sub-wrapper"
          onValueChange={(value: string | string[]) =>
            setNestedStates((prev) => ({ ...prev, [parentValue]: value }))
          }
        >
          {children}
        </AccordionPrimitive.Root>
      )}
    </AccordionPrimitive.Content>
  );
}

type AccordionMenuIndicatorProps = React.ComponentPropsWithoutRef<'span'>;

function AccordionMenuIndicator({
  className,
  ...props
}: AccordionMenuIndicatorProps) {
  const { classNames } = React.use(AccordionMenuContext);
  return (
    <span
      aria-hidden="true"
      data-slot="accordion-menu-indicator"
      className={cn(
        'ms-auto flex items-center font-medium',
        classNames?.indicator,
        className,
      )}
      {...props}
    />
  );
}

export {
  AccordionMenu,
  AccordionMenuGroup,
  AccordionMenuIndicator,
  AccordionMenuItem,
  AccordionMenuLabel,
  AccordionMenuSeparator,
  AccordionMenuSub,
  AccordionMenuSubContent,
  AccordionMenuSubTrigger,
  type AccordionMenuClassNames,
};
