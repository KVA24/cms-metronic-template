import React from 'react';
import { useSharedEvents } from '@/features/shared';
import { useTranslations } from '@/shared/hooks/use-translations';
import { Button } from '@/shared/ui/atoms/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/atoms/form';
import { Input } from '@/shared/ui/atoms/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/atoms/select';
import { Switch } from '@/shared/ui/atoms/switch';
import { Plus, Trash2 } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import type { EventPropertyDataType } from '../api/eventApi';

// ─── Constraint Config ────────────────────────────────────────────────────────

type ConstraintField = {
  key: string;
  type: 'number' | 'text' | 'array' | 'boolean' | 'select';
  placeholder?: string;
  translationKey: string;
};

const CONSTRAINT_CONFIGS: Record<EventPropertyDataType, ConstraintField[]> = {
  TEXT: [
    {
      key: 'minLength',
      type: 'number',
      translationKey: 'METADATA.CONSTRAINTS.MIN_LENGTH',
    },
    {
      key: 'maxLength',
      type: 'number',
      translationKey: 'METADATA.CONSTRAINTS.MAX_LENGTH',
    },
    {
      key: 'exactLength',
      type: 'number',
      translationKey: 'METADATA.CONSTRAINTS.EXACT_LENGTH',
    },
    {
      key: 'equalToAnyOf',
      type: 'array',
      placeholder: 'Type & hit enter',
      translationKey: 'METADATA.CONSTRAINTS.EQUAL_TO_ANY_OF',
    },
    {
      key: 'notEqualToAnyOf',
      type: 'array',
      placeholder: 'Type & hit enter',
      translationKey: 'METADATA.CONSTRAINTS.NOT_EQUAL_TO_ANY_OF',
    },
  ],
  NUMBER: [
    {
      key: 'lessThan',
      type: 'number',
      translationKey: 'METADATA.CONSTRAINTS.LESS_THAN',
    },
    {
      key: 'lessThanOrEqual',
      type: 'number',
      translationKey: 'METADATA.CONSTRAINTS.LESS_THAN_OR_EQUAL',
    },
    {
      key: 'greaterThan',
      type: 'number',
      translationKey: 'METADATA.CONSTRAINTS.GREATER_THAN',
    },
    {
      key: 'greaterThanOrEqual',
      type: 'number',
      translationKey: 'METADATA.CONSTRAINTS.GREATER_THAN_OR_EQUAL',
    },
    {
      key: 'equalToAnyOf',
      type: 'array',
      placeholder: 'Type & hit enter',
      translationKey: 'METADATA.CONSTRAINTS.EQUAL_TO_ANY_OF',
    },
    {
      key: 'notEqualToAnyOf',
      type: 'array',
      placeholder: 'Type & hit enter',
      translationKey: 'METADATA.CONSTRAINTS.NOT_EQUAL_TO_ANY_OF',
    },
  ],
  DATE: [
    {
      key: 'dateFormat',
      type: 'text',
      placeholder: 'dd/mm/yyyy',
      translationKey: 'METADATA.CONSTRAINTS.DATE_FORMAT',
    },
  ],
  DATE_TIME: [
    {
      key: 'datetimeFormat',
      type: 'text',
      placeholder: 'dd/mm/yyyy hh:mm',
      translationKey: 'METADATA.CONSTRAINTS.DATETIME_FORMAT',
    },
  ],
  FLAG: [
    {
      key: 'flag',
      type: 'boolean',
      translationKey: 'METADATA.CONSTRAINTS.FLAG_VALUE',
    },
  ],
  IMAGE_URL: [
    {
      key: 'imageUrl',
      type: 'text',
      placeholder: 'https://example.com/image.jpg',
      translationKey: 'METADATA.CONSTRAINTS.IMAGE_URL',
    },
  ],
  OBJECT: [
    {
      key: 'refSchemaId',
      type: 'select',
      translationKey: 'METADATA.CONSTRAINTS.REF_SCHEMA_ID',
    },
  ],
  GEOPOINT: [
    {
      key: 'latitude',
      type: 'number',
      translationKey: 'METADATA.CONSTRAINTS.LATITUDE',
    },
    {
      key: 'longitude',
      type: 'number',
      translationKey: 'METADATA.CONSTRAINTS.LONGITUDE',
    },
  ],
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface EventConstraintsEditorProps {
  dataType: EventPropertyDataType | '';
  propertyIndex: number;
  isView?: boolean;
}

export function EventConstraintsEditor({
  dataType,
  propertyIndex,
  isView,
}: EventConstraintsEditorProps) {
  const { control } = useFormContext();
  const { t } = useTranslations();
  const constraints =
    CONSTRAINT_CONFIGS[dataType as EventPropertyDataType] || [];

  if (!dataType || constraints.length === 0) return null;

  return (
    <div className="mt-6 pt-6 border-t">
      <h4 className="text-sm font-semibold mb-4">
        {t('METADATA.CONSTRAINTS.TITLE')}
      </h4>
      <div className="space-y-4">
        {constraints.map((constraint) => (
          <FormField
            key={constraint.key}
            control={control}
            name={`properties.${propertyIndex}.constraints.${constraint.key}`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">
                  {t(constraint.translationKey)}
                </FormLabel>
                {constraint.type === 'array' ? (
                  <ArrayConstraintField field={field} disabled={isView} />
                ) : constraint.type === 'boolean' ? (
                  <BooleanConstraintField field={field} disabled={isView} />
                ) : constraint.type === 'select' ? (
                  <SelectConstraintField field={field} disabled={isView} />
                ) : (
                  <FormControl>
                    <Input
                      type={constraint.type}
                      placeholder={
                        constraint.placeholder || t('COMMON.ENTER_VALUE')
                      }
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        field.onChange(
                          constraint.type === 'number'
                            ? e.target.value
                              ? Number(e.target.value)
                              : undefined
                            : e.target.value,
                        );
                      }}
                      disabled={isView}
                      readOnly={isView}
                    />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ArrayConstraintField({
  field,
  disabled,
}: {
  field: any;
  disabled?: boolean;
}) {
  const { t } = useTranslations();
  const values = Array.isArray(field.value) ? field.value : [];
  const [inputValue, setInputValue] = React.useState('');

  const handleAdd = () => {
    if (inputValue.trim()) {
      field.onChange([...values, inputValue.trim()]);
      setInputValue('');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder={t('METADATA.CONSTRAINTS.ARRAY_PLACEHOLDER')}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled || !inputValue.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((value: string, i: number) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full text-sm"
            >
              <span>{value}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() =>
                    field.onChange(
                      values.filter((_: any, idx: number) => idx !== i),
                    )
                  }
                  className="text-destructive hover:text-destructive/80 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BooleanConstraintField({
  field,
  disabled,
}: {
  field: any;
  disabled?: boolean;
}) {
  return (
    <FormControl>
      <div className="flex items-center gap-2">
        <Switch
          checked={field.value || false}
          onCheckedChange={field.onChange}
          disabled={disabled}
        />
        <span className="text-sm text-muted-foreground">
          {field.value ? 'True' : 'False'}
        </span>
      </div>
    </FormControl>
  );
}

function SelectConstraintField({
  field,
  disabled,
}: {
  field: any;
  disabled?: boolean;
}) {
  const { t } = useTranslations();
  const { data, isLoading } = useSharedEvents();
  const events = data?.data || [];

  return (
    <FormControl>
      <Select
        value={field.value || ''}
        onValueChange={field.onChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger>
          <SelectValue
            placeholder={
              isLoading
                ? t('METADATA.CONSTRAINTS.LOADING_SCHEMAS')
                : t('METADATA.CONSTRAINTS.SELECT_SCHEMA')
            }
          />
        </SelectTrigger>
        <SelectContent>
          {events.map((event) => (
            <SelectItem key={event.id} value={event.id}>
              {event.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormControl>
  );
}
