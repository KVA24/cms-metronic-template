'use client';

import * as React from 'react';
import { isValidElement, ReactNode } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import { cn } from '@/shared/lib/utils';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cva, VariantProps } from 'class-variance-authority';
import { Check, ChevronDown, ChevronUp, XIcon } from 'lucide-react';

// Create a Context for `indicatorPosition` and `indicator` control
const SelectContext = React.createContext<{
  indicatorPosition: 'left' | 'right';
  indicatorVisibility: boolean;
  indicator: ReactNode;
  value?: string | undefined;
  onValueChange?: (value: string) => void;
  error?: string | ReactNode;
  disabled?: boolean;
}>({
  indicatorPosition: 'left',
  indicator: null,
  indicatorVisibility: true,
  value: undefined,
  onValueChange: undefined,
  error: undefined,
  disabled: false,
});

// Root Component
// const Select = ({
//                   indicatorPosition = 'left',
//                   indicatorVisibility = true,
//                   indicator,
//                   error,
//                   ...props
//                 }: {
//   indicatorPosition?: 'left' | 'right';
//   indicatorVisibility?: boolean;
//   indicator?: ReactNode;
//   error?: string | ReactNode;
// } & React.ComponentProps<typeof SelectPrimitive.Root>) => {
//   return (
//     <div className="w-full">
//       <SelectContext.Provider value={{indicatorPosition, indicatorVisibility, indicator}}>
//         <SelectPrimitive.Root {...props} />
//       </SelectContext.Provider>
//       {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
//     </div>
//   );
// };
const Select = ({
  indicatorPosition = 'left',
  indicatorVisibility = true,
  indicator,
  error,
  children,
  value: controlledValue,
  defaultValue,
  onValueChange: onValueChangeProp,
  disabled,
  ...props
}: {
  indicatorPosition?: 'left' | 'right';
  indicatorVisibility?: boolean;
  indicator?: ReactNode;
  error?: string | ReactNode;
  children: React.ReactNode;
} & React.ComponentProps<typeof SelectPrimitive.Root>) => {
  // support uncontrolled when user doesn't pass `value`
  const [internalValue, setInternalValue] = React.useState<string | undefined>(
    defaultValue ?? undefined,
  );

  // value that we expose to context (could be controlled or internal)
  const valueForContext =
    controlledValue !== undefined ? controlledValue : internalValue;

  const handleValueChange = (val: any) => {
    // call parent's onValueChange first
    onValueChangeProp?.(val as any);
    // update internal state only when uncontrolled
    if (controlledValue === undefined) {
      setInternalValue(val);
    }
  };

  return (
    <div className="w-full">
      <SelectContext.Provider
        value={{
          indicatorPosition,
          indicatorVisibility,
          indicator,
          value: valueForContext,
          onValueChange: handleValueChange,
          error,
          disabled,
        }}
      >
        <SelectPrimitive.Root
          {...props}
          disabled={disabled}
          value={controlledValue !== undefined ? controlledValue : undefined}
          defaultValue={
            controlledValue === undefined ? defaultValue : undefined
          }
          onValueChange={handleValueChange}
        >
          {children}
        </SelectPrimitive.Root>
      </SelectContext.Provider>

      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
};

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

// Define size variants for SelectTrigger
const selectTriggerVariants = cva(
  `
    flex bg-background w-full items-center justify-between outline-none border border-input shadow-xs shadow-black/5 transition-shadow
    text-foreground data-placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px]
    focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1
    aria-invalid:border-destructive/60 aria-invalid:ring-destructive/10 dark:aria-invalid:border-destructive dark:aria-invalid:ring-destructive/20
    in-data-[invalid=true]:border-destructive/60 in-data-[invalid=true]:ring-destructive/10  dark:in-data-[invalid=true]:border-destructive dark:in-data-[invalid=true]:ring-destructive/20
  `,
  {
    variants: {
      size: {
        sm: 'h-7 px-2.5 text-xs gap-1 rounded-md',
        md: 'h-8 px-3 text-[0.8125rem] leading-(--text-sm--line-height) gap-1 rounded-md',
        lg: 'h-10 px-4 text-sm gap-1.5 rounded-md',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

// export interface SelectTriggerProps
//   extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
//     VariantProps<typeof selectTriggerVariants> {
// }
//
// function SelectTrigger({className, children, size, ...props}: SelectTriggerProps) {
//   return (
//     <SelectPrimitive.Trigger
//       data-slot="select-trigger"
//       className={cn(selectTriggerVariants({size}), className)}
//       {...props}
//     >
//       {children}
//       <SelectPrimitive.Icon asChild>
//         <ChevronDown className="h-4 w-4 opacity-60 -me-0.5"/>
//       </SelectPrimitive.Icon>
//     </SelectPrimitive.Trigger>
//   );
// }

export interface SelectTriggerProps
  extends
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
    VariantProps<typeof selectTriggerVariants> {
  clearable?: boolean;
}

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(
  (
    {
      className,
      children,
      size,
      clearable = true,
      disabled: disabledProp,
      ...props
    },
    ref,
  ) => {
    const {
      value: ctxValue,
      onValueChange,
      error,
      disabled: disabledFromContext,
    } = React.useContext(SelectContext);

    // Use disabled from prop first, then fall back to context
    const disabled = disabledProp ?? disabledFromContext;

    const hasValue = !!ctxValue;

    return (
      <div className="relative w-full">
        <SelectPrimitive.Trigger
          ref={ref}
          disabled={disabled}
          className={cn(
            selectTriggerVariants({ size }),
            className,
            'w-full',
            error &&
              'border-destructive ring-destructive/20 focus-visible:border-destructive focus-visible:ring-destructive/30',
          )}
          {...props}
        >
          <div
            className={cn(
              'flex-1 text-left truncate',
              clearable && hasValue && 'pr-4',
            )}
          >
            {children}
          </div>
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 opacity-60 -me-0.5" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        {clearable && hasValue && !disabled && (
          <button
            type="button"
            className="absolute right-7 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onValueChange?.(undefined as any);
            }}
          >
            <XIcon className="h-4 w-4 opacity-60 -me-0.5" />
          </button>
        )}
      </div>
    );
  },
);

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        'flex cursor-default items-center justify-center py-1',
        className,
      )}
      {...props}
    >
      <ChevronUp className="h-4 w-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        'flex cursor-default items-center justify-center py-1',
        className,
      )}
      {...props}
    >
      <ChevronDown className="h-4 w-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

function SelectContent({
  className,
  children,
  position = 'popper',
  searchable = false,
  searchPlaceholder,
  onSearchChange,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
}) {
  const [searchValue, setSearchValue] = React.useState('');
  const { t } = useTranslations();

  // Use provided searchPlaceholder or fall back to translation
  const finalSearchPlaceholder = searchPlaceholder || t('COMMON.SEARCH_OPTION');

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearchChange?.(value);
  };

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          'max-w-(--radix-select-trigger-width) relative z-50 max-h-96 min-w-32 overflow-hidden rounded-md border border-border bg-popover shadow-md shadow-black/5 text-secondary-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1.5 data-[side=left]:-translate-x-1.5 data-[side=right]:translate-x-1.5 data-[side=top]:-translate-y-1.5',
          className,
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        {searchable && (
          <div className="border-b border-border p-2">
            <input
              type="text"
              placeholder={finalSearchPlaceholder}
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
            />
          </div>
        )}
        <SelectPrimitive.Viewport
          className={cn(
            'p-1.5',
            position === 'popper' &&
              'h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width)',
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        'py-1.5 ps-8 pe-2 text-xs text-muted-foreground font-medium',
        className,
      )}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>) {
  const { indicatorPosition, indicatorVisibility, indicator } =
    React.useContext(SelectContext);

  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 text-sm outline-hidden text-foreground hover:bg-accent focus:bg-accent data-disabled:pointer-events-none data-disabled:opacity-50 whitespace-normal break-all',
        indicatorPosition === 'left' ? 'ps-8 pe-2' : 'pe-8 ps-2',
        className,
      )}
      {...props}
    >
      {indicatorVisibility &&
        (indicator && isValidElement(indicator) ? (
          indicator
        ) : (
          <span
            className={cn(
              'absolute flex h-3.5 w-3.5 items-center justify-center',
              indicatorPosition === 'left' ? 'start-2' : 'end-2',
            )}
          >
            <SelectPrimitive.ItemIndicator>
              <Check className="h-4 w-4 text-primary" />
            </SelectPrimitive.ItemIndicator>
          </span>
        ))}
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectIndicator({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.ItemIndicator>) {
  const { indicatorPosition } = React.useContext(SelectContext);

  return (
    <span
      data-slot="select-indicator"
      className={cn(
        'absolute flex top-1/2 -translate-y-1/2 items-center justify-center',
        indicatorPosition === 'left' ? 'start-2' : 'end-2',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemIndicator>{children}</SelectPrimitive.ItemIndicator>
    </span>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn('-mx-1.5 my-1.5 h-px bg-border', className)}
      {...props}
    />
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectIndicator,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
