import React, { useEffect, useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/atoms/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/atoms/popover';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface MonthRangePickerProps {
  start?: Date | null;
  end?: Date | null;
  onApply?: (range: DateRange | undefined) => void;
  disabled?: boolean;
  clearable?: boolean;
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const QUICK_RANGES = [
  {
    label: 'This year',
    getValue: () => {
      const now = new Date();
      return {
        from: new Date(now.getFullYear(), 0, 1),
        to: new Date(now.getFullYear(), now.getMonth(), 1),
      };
    },
  },
  {
    label: 'Last year',
    getValue: () => {
      const now = new Date();
      return {
        from: new Date(now.getFullYear() - 1, 0, 1),
        to: new Date(now.getFullYear() - 1, 11, 1),
      };
    },
  },
  {
    label: 'Last 6 months',
    getValue: () => {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      return {
        from: sixMonthsAgo,
        to: new Date(now.getFullYear(), now.getMonth(), 1),
      };
    },
  },
  {
    label: 'Last 12 months',
    getValue: () => {
      const now = new Date();
      const twelveMonthsAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 12,
        1,
      );
      return {
        from: twelveMonthsAgo,
        to: new Date(now.getFullYear(), now.getMonth(), 1),
      };
    },
  },
];

const MonthRangePicker: React.FC<MonthRangePickerProps> = ({
  start,
  end,
  onApply,
  disabled,
  clearable,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    start || end
      ? { from: start ?? undefined, to: end ?? undefined }
      : undefined,
  );
  const [currentYear, setCurrentYear] = useState(() =>
    new Date().getFullYear(),
  );

  useEffect(() => {
    setDateRange(
      start || end
        ? { from: start ?? undefined, to: end ?? undefined }
        : undefined,
    );
  }, [start, end]);

  const handleMonthClick = (year: number, month: number) => {
    const selectedDate = new Date(year, month, 1);

    if (!dateRange?.from || (dateRange?.from && dateRange?.to)) {
      // First selection or start new selection after complete range
      setDateRange({ from: selectedDate, to: undefined });
    } else {
      // Second selection
      if (selectedDate < dateRange.from) {
        setDateRange({ from: selectedDate, to: dateRange.from });
      } else {
        setDateRange({ from: dateRange.from, to: selectedDate });
      }
    }
  };

  const isMonthInRange = (year: number, month: number) => {
    if (!dateRange?.from) return false;
    const date = new Date(year, month, 1);
    if (!dateRange.to) return date.getTime() === dateRange.from.getTime();
    return date >= dateRange.from && date <= dateRange.to;
  };

  const isMonthStart = (year: number, month: number) => {
    if (!dateRange?.from) return false;
    return new Date(year, month, 1).getTime() === dateRange.from.getTime();
  };

  const isMonthEnd = (year: number, month: number) => {
    if (!dateRange?.to) return false;
    return new Date(year, month, 1).getTime() === dateRange.to.getTime();
  };

  const handleApply = () => {
    setIsOpen(false);
    if (dateRange?.from) {
      const from = startOfMonth(dateRange.from);
      const to = dateRange.to
        ? endOfMonth(dateRange.to)
        : endOfMonth(dateRange.from);
      onApply?.({ from, to });
    } else {
      onApply?.(undefined);
    }
  };

  const handleReset = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDateRange(undefined);
    if (!e) return;
    onApply?.(undefined);
  };

  const handleQuickRange = (range: DateRange) => {
    setDateRange(range);
  };

  const isQuickRangeActive = (rangeGetter: () => DateRange) => {
    if (!dateRange?.from || !dateRange?.to) return false;
    const range = rangeGetter();
    if (!range.from || !range.to) return false;
    return (
      dateRange.from.getTime() === range.from.getTime() &&
      dateRange.to.getTime() === range.to.getTime()
    );
  };

  const formatDateRange = () => {
    if (!dateRange?.from) {
      return <span className="text-muted-foreground">Pick a month range</span>;
    }
    const fromStr = format(dateRange.from, 'MMM yyyy');
    const toStr = dateRange.to ? format(dateRange.to, 'MMM yyyy') : fromStr;
    return (
      <span className="truncate">
        {fromStr} - {toStr}
      </span>
    );
  };

  const renderMonthButton = (year: number, monthIndex: number) => {
    const month = MONTHS[monthIndex];
    return (
      <Button
        key={`${year}-${monthIndex}`}
        variant="ghost"
        className={cn(
          'size-8 w-10 text-xs font-medium rounded-sm px-0',
          !isMonthInRange(year, monthIndex) &&
            'bg-muted hover:bg-muted/80 text-muted-foreground',
          isMonthInRange(year, monthIndex) &&
            'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
          isMonthStart(year, monthIndex) &&
            isMonthEnd(year, monthIndex) &&
            'rounded-md',
          isMonthStart(year, monthIndex) &&
            !isMonthEnd(year, monthIndex) &&
            'rounded-r-none',
          isMonthEnd(year, monthIndex) &&
            !isMonthStart(year, monthIndex) &&
            'rounded-l-none',
          isMonthInRange(year, monthIndex) &&
            !isMonthStart(year, monthIndex) &&
            !isMonthEnd(year, monthIndex) &&
            '',
        )}
        onClick={() => handleMonthClick(year, monthIndex)}
      >
        {month}
      </Button>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id="month-range"
          variant="outline"
          className="w-full justify-start text-left font-normal text-foreground overflow-hidden"
          disabled={disabled}
        >
          <CalendarDays size={16} className="mr-2 flex-shrink-0" />
          <span className="truncate flex-1 min-w-0">{formatDateRange()}</span>
          {dateRange && !disabled && clearable && (
            <X
              size={16}
              className="ml-2 flex-shrink-0 hover:text-destructive"
              onClick={handleReset}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          {/* Month Grid */}
          <div className="p-3">
            {/* Year Navigation */}
            <div className="flex items-center justify-center gap-6 mb-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentYear(currentYear - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>

              <div className="flex gap-12 w-full justify-between">
                <span className="font-semibold text-sm w-10 text-center">
                  {currentYear}
                </span>
                <span className="font-semibold text-sm w-10 text-center">
                  {currentYear + 1}
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentYear(currentYear + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Month Grid - 3 rows x 8 columns */}
            <div className="space-y-1.5">
              {[0, 4, 8].map((startIdx) => (
                <div key={startIdx} className="flex gap-1">
                  {[...Array(4)].map((_, i) =>
                    renderMonthButton(currentYear, startIdx + i),
                  )}
                  {[...Array(4)].map((_, i) =>
                    renderMonthButton(currentYear + 1, startIdx + i),
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Ranges */}
          <div className="p-3 space-y-1 w-[120px] border-l">
            {QUICK_RANGES.map((range) => (
              <Button
                key={range.label}
                variant={
                  isQuickRangeActive(range.getValue) ? 'primary' : 'outline'
                }
                className="w-full justify-start text-xs font-normal h-8 px-2"
                onClick={() => handleQuickRange(range.getValue())}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-1.5 border-t border-border p-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleReset()}
            className="text-foreground h-8"
            disabled={!dateRange}
          >
            Reset
          </Button>
          <Button size="sm" onClick={handleApply} className="h-8">
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MonthRangePicker;
