import { Input } from '@/shared/ui/atoms/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/atoms/select';
import { Search } from 'lucide-react';

export interface SelectInputOption {
  value: string;
  label: string;
}

export interface SelectInputProps {
  selectValue: string;
  selectOptions: SelectInputOption[];
  inputValue: string;
  onSelectChange: (value: string) => void;
  onInputChange: (value: string) => void;
  inputPlaceholder?: string;
  selectPlaceholder?: string;
  selectWidth?: string;
  disabled?: boolean;
  showSearchIcon?: boolean;
  clearInputOnSelectChange?: boolean;
  className?: string;
}

export function SelectInput({
  selectValue,
  selectOptions,
  inputValue,
  onSelectChange,
  onInputChange,
  inputPlaceholder,
  selectPlaceholder,
  selectWidth = 'w-[160px]',
  disabled = false,
  showSearchIcon = true,
  clearInputOnSelectChange = true,
  className = '',
}: SelectInputProps) {
  const handleSelectChange = (value: string) => {
    onSelectChange(value);
    if (clearInputOnSelectChange) {
      onInputChange('');
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <div className="max-w-[160px]">
        <Select
          value={selectValue}
          onValueChange={handleSelectChange}
          disabled={disabled}
        >
          <SelectTrigger className={selectWidth} clearable={false}>
            <SelectValue placeholder={selectPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {selectOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="relative flex-1">
        {showSearchIcon && (
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
        <Input
          placeholder={inputPlaceholder}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          className={showSearchIcon ? 'pl-10' : ''}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
