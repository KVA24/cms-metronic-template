'use client';

import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/atoms/button';
import { Calendar } from '@/shared/ui/atoms/calendar';
import { DateInput, TimeField } from '@/shared/ui/atoms/datefield';
import { InputAddon, InputGroup } from '@/shared/ui/atoms/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/atoms/popover';
import { Time } from '@internationalized/date';
import { format } from 'date-fns';
import { CalendarIcon, Clock3, X } from 'lucide-react';

interface DatePickerProps {
  value?: Date | string;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: Date;
  max?: Date;
  className?: string;
  buttonClassName?: string;
  popoverClassName?: string;
  align?: 'start' | 'center' | 'end';
  showClearButton?: boolean;
  dateFormat?: string;
  showTime?: boolean;
  error?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled,
  min,
  max,
  className,
  buttonClassName,
  popoverClassName,
  align = 'start',
  showClearButton = true,
  dateFormat = 'dd/MM/yyyy',
  showTime = false,
  error = false,
}: DatePickerProps) {
  const selectedDate = value
    ? typeof value === 'string'
      ? new Date(value)
      : value
    : undefined;

  // Validate that selectedDate is a valid Date object
  const isValidDate =
    selectedDate &&
    selectedDate instanceof Date &&
    !isNaN(selectedDate.getTime());

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(undefined);
  };

  const displayFormat = showTime ? `${dateFormat} HH:mm:ss` : dateFormat;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          disabled={disabled}
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !isValidDate && 'text-muted-foreground',
            error && 'border-destructive border-1',
            className,
            buttonClassName,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="overflow-hidden text-ellipsis">
            {isValidDate
              ? format(selectedDate as Date, displayFormat)
              : placeholder}
          </span>
          {showClearButton && isValidDate && (
            <X
              className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn('w-auto p-0', popoverClassName)}
        align={align}
        side="bottom"
        collisionPadding={8}
      >
        <div className="p-3">
          <Calendar
            mode="single"
            selected={isValidDate ? selectedDate : undefined}
            onSelect={onChange}
            disabled={(date) => {
              // Apply min/max constraints
              if (min && date < min) {
                return true;
              }
              if (max && date > max) {
                return true;
              }
              return false;
            }}
            initialFocus
          />
          {showTime && isValidDate && selectedDate && (
            <div className="mt-3 pt-3 border-t">
              <InputGroup className="w-full">
                <InputAddon mode="icon">
                  <Clock3 className="h-4 w-4" />
                </InputAddon>
                <TimeField
                  value={
                    new Time(
                      (selectedDate as Date).getHours(),
                      (selectedDate as Date).getMinutes(),
                      (selectedDate as Date).getSeconds(),
                    )
                  }
                  onChange={(time) => {
                    if (!selectedDate || !time) return;
                    const newDate = new Date(selectedDate as Date);
                    newDate.setHours(time.hour || 0);
                    newDate.setMinutes(time.minute || 0);
                    newDate.setSeconds(time.second || 0);
                    onChange?.(newDate);
                  }}
                >
                  <DateInput />
                </TimeField>
              </InputGroup>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
