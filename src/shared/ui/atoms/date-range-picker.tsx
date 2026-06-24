import React, { useEffect, useState } from 'react';
import { Button } from '@/shared/ui/atoms/button';
import { Calendar } from '@/shared/ui/atoms/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/atoms/popover';
import { format } from 'date-fns';
import { CalendarDays, X } from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface DateRangePickerProps {
  start?: Date | null;
  end?: Date | null;
  onApply?: (range: DateRange | undefined) => void;
  disabled?: boolean;
  clearable?: boolean;
  maxMonths?: number;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  start,
  end,
  onApply,
  disabled,
  clearable,
  maxMonths,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    start || end
      ? { from: start ?? undefined, to: end ?? undefined }
      : undefined,
  );
  const [rangeError, setRangeError] = useState<string>('');

  // Calculate the number of months between two dates (considering both month and day)
  // From 02/03 to 02/06 = 3 months (from day 02 of month 3 to day 02 of month 6)
  // From 02/03 to 03/06 = more than 3 months
  const calculateMonthsDifference = (from: Date, to: Date): number => {
    let months = 0;
    const startDate = new Date(from);
    
    while (true) {
      // Move forward by 1 month, add 1 day for inclusive comparison
      const nextMonth = new Date(startDate.getFullYear(), startDate.getMonth() + months + 1, startDate.getDate() + 1);
      
      // If nextMonth exceeds to date, we've found the limit
      if (nextMonth > to) {
        break;
      }
      months++;
    }
    
    return months;
  };

  // Validate date range doesn't exceed maxMonths
  const validateDateRange = (range: DateRange | undefined): boolean => {
    if (!maxMonths || !range?.from || !range?.to) {
      setRangeError('');
      return true;
    }

    const monthsDiff = calculateMonthsDifference(range.from, range.to);
    if (monthsDiff > maxMonths - 1) {
      setRangeError(`Date range cannot exceed ${maxMonths} months`);
      return false;
    }
    setRangeError('');
    return true;
  };

  // Calculate default month (previous month if no date range selected)
  const getDefaultMonth = () => {
    if (dateRange?.from) {
      return dateRange.from;
    }
    // Return previous month as default
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - 1, 1);
  };

  // Sync dateRange with props when they change externally
  useEffect(() => {
    setDateRange(
      start || end
        ? { from: start ?? undefined, to: end ?? undefined }
        : undefined,
    );
  }, [start, end]);

  // Validate range when it changes (real-time validation)
  useEffect(() => {
    validateDateRange(dateRange);
  }, [dateRange, maxMonths]);

  const handleApply = () => {
    if (validateDateRange(dateRange)) {
      setIsOpen(false);
      onApply?.(dateRange);
    }
  };

  const handleResetTemp = () => {
    setDateRange(undefined);
    setRangeError('');
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDateRange(undefined); // Clear local state immediately
    onApply?.(undefined); // Notify parent
  };

  const formatDateRange = () => {
    if (!dateRange?.from) {
      return <span className="text-muted-foreground">Pick a date range</span>;
    }

    if (dateRange.to) {
      return (
        <span className="truncate">
          {format(dateRange.from, 'dd/MM/yyyy')} -{' '}
          {format(dateRange.to, 'dd/MM/yyyy')}
        </span>
      );
    }

    return (
      <span className="truncate">{format(dateRange.from, 'dd/MM/yyyy')}</span>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant="outline"
          className="w-full justify-start text-left font-normal text-foreground overflow-hidden"
          disabled={disabled}
        >
          <CalendarDays size={16} className="mr-2 shrink-0" />
          <span className="truncate flex-1 min-w-0">{formatDateRange()}</span>
          {dateRange && !disabled && clearable && (
            <X
              size={16}
              className="ml-2 shrink-0 hover:text-destructive"
              onClick={handleReset}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          defaultMonth={getDefaultMonth()}
          selected={dateRange}
          onSelect={setDateRange}
          numberOfMonths={2}
          disabled={disabled}
        />
        {rangeError && (
          <div className="text-sm text-destructive bg-destructive/10 border-t border-destructive/20 px-3 py-2">
            {rangeError}
          </div>
        )}
        <div className="flex items-center justify-end gap-1.5 border-t border-border p-3">
          <Button
            variant="outline"
            onClick={handleResetTemp}
            className="text-foreground"
            disabled={!dateRange || !clearable}
          >
            Reset
          </Button>
          <Button onClick={handleApply} disabled={!!rangeError}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;
