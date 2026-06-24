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
  }, [triggerRef.current]);

  React.useEffect(() => {
    if (measureRef.current && width) {
      setIsOverflow(measureRef.current.scrollWidth > width - 32);
    }
  }, [value, width]);

  const selectedLabels = value.map((opt) => opt.label).join(', ');

  const renderOptions = () => {
    // check nếu có groupName thì xử lý theo group
    if (options.length > 0 && 'groupName' in (options[0] as any)) {
      return (options as OptionGroup<T>[]).map((group, gi) => (
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
              'w-full justify-between overflow-hidden border border-input rounded-md py-1.5 px-2',
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
            <span className="truncate flex items-center text-sm">
              {value.length > 0 ? (
                isOverflow ? (
                  `${value.length} selected`
                ) : (
                  <div className="flex items-center gap-1">
                    {value.map((option) => (
                      <span
                        key={option.value}
                        className="inline-flex items-center gap-1 px-2 bg-gray-100 text-gray-800 rounded text-sm"
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
                          className="hover:bg-gray-300 rounded-full p-1 transition-colors flex items-center justify-center cursor-pointer"
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
              className="absolute invisible whitespace-nowrap"
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
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
