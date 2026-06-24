'use client';

import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/ui/atoms/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/atoms/popover';
import { Check, ChevronsUpDown, X } from 'lucide-react';

export interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  showClearButton?: boolean;
  showSelectedBelow?: boolean;
  disabled?: boolean;
  error?: boolean;
}

export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = 'Select items...',
  emptyText = 'No items.',
  className,
  showClearButton = true,
  showSelectedBelow = false,
  disabled = false,
  error = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [visibleCount, setVisibleCount] = React.useState(value.length);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const badgeRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const [triggerWidth, setTriggerWidth] = React.useState<number | undefined>();
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null);

  // Track trigger width for popover
  React.useEffect(() => {
    if (!triggerRef.current) return;
    const ro = new ResizeObserver(() => {
      setTriggerWidth(triggerRef.current?.offsetWidth);
    });
    ro.observe(triggerRef.current);
    setTriggerWidth(triggerRef.current.offsetWidth);
    return () => ro.disconnect();
  }, []);

  const handleSelect = (selectedValue: string) => {
    const newValue = value.includes(selectedValue)
      ? value.filter((v) => v !== selectedValue)
      : [...value, selectedValue];
    onChange?.(newValue);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.([]);
  };

  const handleRemoveItem = (e: React.MouseEvent, itemValue: string) => {
    e.stopPropagation();
    onChange?.(value.filter((v) => v !== itemValue));
  };

  const selectedOptions = options.filter((option) =>
    value.includes(option.value),
  );

  // Calculate how many badges can fit - optimized to create observer only once
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const calculateVisibleItems = () => {
      if (selectedOptions.length === 0) {
        setVisibleCount(0);
        return;
      }

      const containerWidth = container.offsetWidth;
      const moreButtonWidth = 80; // Approximate width for "+X more" badge
      const clearButtonWidth = showClearButton ? 24 : 0;
      const chevronWidth = 24;
      const padding = 8;
      const availableWidth =
        containerWidth -
        moreButtonWidth -
        clearButtonWidth -
        chevronWidth -
        padding;

      let totalWidth = 0;
      let count = 0;

      for (let i = 0; i < badgeRefs.current.length; i++) {
        const badge = badgeRefs.current[i];
        if (!badge) continue;

        const badgeWidth = badge.offsetWidth + 4; // 4px for gap
        if (totalWidth + badgeWidth > availableWidth) {
          break;
        }
        totalWidth += badgeWidth;
        count++;
      }

      // If all items fit, show all
      if (count === selectedOptions.length) {
        setVisibleCount(selectedOptions.length);
      } else {
        // Show fewer items to make room for "+X more"
        setVisibleCount(Math.max(1, count));
      }
    };

    // Create ResizeObserver only once
    if (!resizeObserverRef.current) {
      resizeObserverRef.current = new ResizeObserver(calculateVisibleItems);
      resizeObserverRef.current.observe(container);
    }

    // Recalculate when dependencies change
    calculateVisibleItems();

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, [selectedOptions.length, showClearButton]);

  const displayItems = selectedOptions.slice(0, visibleCount);
  const remainingCount = selectedOptions.length - visibleCount;

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between',
              error && 'border-destructive',
              className,
            )}
            disabled={disabled}
          >
            <div
              ref={containerRef}
              className="flex flex-1 items-center gap-1 overflow-hidden"
            >
              {value.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                <>
                  {/* Hidden badges for measurement */}
                  <div className="invisible absolute flex gap-1">
                    {selectedOptions.map((option, index) => (
                      <Badge
                        key={option.value}
                        ref={(el: any) => (badgeRefs.current[index] = el)}
                        variant="secondary"
                        className="flex items-center gap-1 whitespace-nowrap"
                      >
                        {option.label}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                  </div>

                  {/* Visible badges */}
                  {displayItems.map((option) => (
                    <Badge
                      key={option.value}
                      variant="secondary"
                      className="flex items-center gap-1 whitespace-nowrap"
                    >
                      {option.label}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={(e) => handleRemoveItem(e, option.value)}
                      />
                    </Badge>
                  ))}
                  {remainingCount > 0 && (
                    <Badge variant="secondary" className="whitespace-nowrap">
                      +{remainingCount} more
                    </Badge>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-1 ml-2">
              {showClearButton && value.length > 0 && (
                <X
                  className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                  onClick={handleClear}
                />
              )}
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0"
          align="start"
          style={{ width: triggerWidth ? `${triggerWidth}px` : undefined }}
        >
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => handleSelect(option.value)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          isSelected ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {showSelectedBelow && selectedOptions.length > 0 && (
        <div className="flex flex-col gap-2">
          {selectedOptions.map((option) => (
            <Badge
              key={option.value}
              variant="secondary"
              className="flex items-center justify-between gap-1 text-xs"
            >
              {option.label}
              {!disabled && (
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={(e) => handleRemoveItem(e, option.value)}
                />
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
