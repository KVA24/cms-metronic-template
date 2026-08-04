'use client';

import * as React from 'react';
import { cn } from '@/shared/lib/utils.ts';
import { XIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu.tsx';

interface BaseOption {
  label: string;
  value: string;
}

interface OptionGroup<T extends BaseOption> {
  groupName: string;
  options: T[];
}

type Options<T extends BaseOption> = T[] | OptionGroup<T>[];

function hasOptionGroups<T extends BaseOption>(
  options: Options<T>,
): options is OptionGroup<T>[] {
  return options.length > 0 && 'groupName' in options[0];
}

interface MultiSelectProps<T extends BaseOption> {
  label?: string;
  options: Options<T>;
  value: T[];
  onChange: (value: T[]) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export function MultiSelect<T extends BaseOption>({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select',
  disabled = false,
  error,
}: MultiSelectProps<T>) {
  const toggleValue = (opt: T) => {
    if (value.some((v) => v.value === opt.value)) {
      onChange(value.filter((v) => v.value !== opt.value));
    } else {
      onChange([...value, opt]);
    }
  };

  const triggerRef = React.useRef<HTMLDivElement | null>(null);
  const measureRef = React.useRef<HTMLSpanElement | null>(null);
  const [width, setWidth] = React.useState<number>();
  const [isOverflow, setIsOverflow] = React.useState(false);

  React.useEffect(() => {
    if (triggerRef.current) {
      setWidth(triggerRef.current.offsetWidth);
    }
  }, [triggerRef]);

  React.useEffect(() => {
    if (measureRef.current && width) {
      setIsOverflow(measureRef.current.scrollWidth > width - 32);
    }
  }, [value, width]);

  const selectedLabels = value.map((opt) => opt.label).join(', ');

  const renderOptions = () => {
    // check nếu có groupName thì xử lý theo group
    if (hasOptionGroups(options)) {
      return options.map((group, gi) => (
        <React.Fragment key={gi}>
          <DropdownMenuLabel>{group.groupName}</DropdownMenuLabel>
          {group.options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={value.some((v) => v.value === option.value)}
              onCheckedChange={() => toggleValue(option)}
              onSelect={(e) => e.preventDefault()}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
          {gi < options.length - 1 && <DropdownMenuSeparator />}
        </React.Fragment>
      ));
    }

    // nếu không có groupName thì hiển thị list thường
    return (options as T[]).map((option) => (
      <DropdownMenuCheckboxItem
        key={option.value}
        checked={value.some((v) => v.value === option.value)}
        onCheckedChange={() => toggleValue(option)}
        onSelect={(e) => e.preventDefault()}
      >
        {option.label}
      </DropdownMenuCheckboxItem>
    ));
  };

  return (
    <div className="w-full">
      <DropdownMenu>
        <DropdownMenuTrigger disabled={disabled} asChild>
          <div
            ref={triggerRef}
            role="combobox"
            className={cn(
              'border-input w-full justify-between overflow-hidden rounded-md border px-2 py-1.5',
              error && 'border-destructive',
              disabled && 'bg-input-disabled cursor-not-allowed',
            )}
            onPointerDown={(e) => {
              // Nếu click vào X icon thì không mở dropdown
              if (
                (e.target as HTMLElement).closest(
                  'button[aria-label^="Remove"]',
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            <span className="flex items-center truncate text-sm">
              {value.length > 0 ? (
                isOverflow ? (
                  `${value.length} selected`
                ) : (
                  <div className="flex items-center gap-1">
                    {value.map((option) => (
                      <span
                        key={option.value}
                        className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 text-sm text-gray-800"
                      >
                        <span>{option.label}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onChange(
                              value.filter((v) => v.value !== option.value),
                            );
                          }}
                          className="flex cursor-pointer items-center justify-center rounded-full p-1 transition-colors hover:bg-gray-300"
                          aria-label={`Remove ${option.label}`}
                        >
                          <XIcon className="size-3 text-gray-500" />
                        </button>
                      </span>
                    ))}
                  </div>
                )
              ) : (
                placeholder
              )}
            </span>
            <span
              ref={measureRef}
              className="invisible absolute whitespace-nowrap"
            >
              {selectedLabels}
            </span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent style={{ width }}>
          {label && (
            <>
              <DropdownMenuLabel>{label}</DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}
          {renderOptions()}
        </DropdownMenuContent>
      </DropdownMenu>
      {error && <p className="text-destructive mt-1 text-xs">{error}</p>}
    </div>
  );
}
