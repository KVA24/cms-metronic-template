import React from 'react';
import { MetadataDataType } from '@/features/metadata/api/metadataApi';
import { useMetadataListLevelTwo } from '@/features/metadata/hooks/use-metadata-queries';
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

interface MetadataConstraintsEditorProps {
  dataType: MetadataDataType | '';
  propertyIndex: number;
  isView?: boolean;
}

type ConstraintField = {
  label: string;
  key: string;
  type: 'number' | 'text' | 'array' | 'boolean' | 'select';
  placeholder?: string;
  translationKey: string;
};

const CONSTRAINT_CONFIGS: Record<MetadataDataType, ConstraintField[]> = {
  TEXT: [
    {
      label: 'Min Length',
      key: 'minLength',
      type: 'number',
      translationKey: 'METADATA.CONSTRAINTS.MIN_LENGTH',
    },
    {
      label: 'Max Length',
      key: 'maxLength',
      type: 'number',
      translationKey: 'METADATA.CONSTRAINTS.MAX_LENGTH',
    },
    {
      label: 'Exact Length',
      key: 'exactLength',
      type: 'number',
      translationKey: 'METADATA.CONSTRAINTS.EXACT_LENGTH',
    },
    // {
    //   label: 'Equal to any of',
    //   key: 'equalToAnyOf',
    //   type: 'array',
    //   placeholder: 'Type & hit enter',
    //   translationKey: 'METADATA.CONSTRAINTS.EQUAL_TO_ANY_OF',
    // },
    // {
    //   label: 'Not equal to any of',
    //   key: 'notEqualToAnyOf',
    //   type: 'array',
    //   placeholder: 'Type & hit enter',
    //   translationKey: 'METADATA.CONSTRAINTS.NOT_EQUAL_TO_ANY_OF',
    // },
  ],
  NUMBER: [
    {
      label: 'Less than',
      key: 'lessThan',
      type: 'number',
      translationKey: 'METADATA.CONSTRAINTS.LESS_THAN',
    },
    {
      label: 'Less than or equal',
      key: 'lessThanOrEqual',
      type: 'number',
      translationKey: 'METADATA.CONSTRAINTS.LESS_THAN_OR_EQUAL',
    },
    {
      label: 'Greater than',
      key: 'greaterThan',
      type: 'number',
      translationKey: 'METADATA.CONSTRAINTS.GREATER_THAN',
    },
    {
      label: 'Greater than or equal',
      key: 'greaterThanOrEqual',
      type: 'number',
      translationKey: 'METADATA.CONSTRAINTS.GREATER_THAN_OR_EQUAL',
    },
    {
      label: 'Equal to any of',
      key: 'equalToAnyOf',
      type: 'array',
      placeholder: 'Type & hit enter',
      translationKey: 'METADATA.CONSTRAINTS.EQUAL_TO_ANY_OF',
    },
    {
      label: 'Not equal to any of',
      key: 'notEqualToAnyOf',
      type: 'array',
      placeholder: 'Type & hit enter',
      translationKey: 'METADATA.CONSTRAINTS.NOT_EQUAL_TO_ANY_OF',
    },
  ],
  DATE: [
    {
      label: 'Date Format',
      key: 'dateFormat',
      type: 'text',
      placeholder: 'dd/mm/yyyy',
      translationKey: 'METADATA.CONSTRAINTS.DATE_FORMAT',
    },
  ],
  DATE_TIME: [
    {
      label: 'DateTime Format',
      key: 'datetimeFormat',
      type: 'text',
      placeholder: 'dd/mm/yyyy hh:mm',
      translationKey: 'METADATA.CONSTRAINTS.DATETIME_FORMAT',
    },
  ],
  FLAG: [
    {
      label: 'Flag Value',
      key: 'flag',
      type: 'boolean',
      translationKey: 'METADATA.CONSTRAINTS.FLAG_VALUE',
    },
  ],
  IMAGE_URL: [
    {
      label: 'Image URL',
      key: 'imageUrl',
      type: 'text',
      placeholder: 'https://example.com/image.jpg',
      translationKey: 'METADATA.CONSTRAINTS.IMAGE_URL',
    },
  ],
  OBJECT: [
    {
      label: 'Reference Schema',
      key: 'refSchemaId',
      type: 'select',
      translationKey: 'METADATA.CONSTRAINTS.REF_SCHEMA_ID',
    },
  ],
  GEOPOINT: [
    {
      label: 'Latitude',
      key: 'latitude',
      type: 'number',
      translationKey: 'METADATA.CONSTRAINTS.LATITUDE',
    },
    {
      label: 'Longitude',
      key: 'longitude',
      type: 'number',
      translationKey: 'METADATA.CONSTRAINTS.LONGITUDE',
    },
  ],
};

export function MetadataConstraintsEditor({
  dataType,
  propertyIndex,
  isView,
}: MetadataConstraintsEditorProps) {
  const { control } = useFormContext();
  const { t } = useTranslations();
  const constraints = CONSTRAINT_CONFIGS[dataType as MetadataDataType] || [];

  if (!dataType || constraints.length === 0) {
    return null;
  }

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
            name={`metadata.${propertyIndex}.constraints.${constraint.key}`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">
                  {t(constraint.translationKey)}
                </FormLabel>
                {constraint.type === 'array' ? (
                  <ArrayConstraintField
                    field={field}
                    placeholder={
                      constraint.placeholder
                        ? t('METADATA.CONSTRAINTS.ARRAY_PLACEHOLDER')
                        : undefined
                    }
                    disabled={isView}
                  />
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
                      value={field.value || ''}
                      onChange={(e) => {
                        if (constraint.type === 'number') {
                          const val = e.target.value;
                          field.onChange(val === '' ? '' : Number(val));
                        } else {
                          field.onChange(e.target.value);
                        }
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

interface ArrayConstraintFieldProps {
  field: any;
  placeholder?: string;
  disabled?: boolean;
}

function ArrayConstraintField({
  field,
  placeholder,
  disabled,
}: ArrayConstraintFieldProps) {
  const { t } = useTranslations();
  const values = Array.isArray(field.value) ? field.value : [];
  const [inputValue, setInputValue] = React.useState('');

  const handleAddValue = () => {
    if (inputValue.trim()) {
      const newValues = [...values, inputValue.trim()];
      field.onChange(newValues);
      setInputValue('');
    }
  };

  const handleRemoveValue = (index: number) => {
    const newValues = values.filter((_: any, i: number) => i !== index);
    field.onChange(newValues);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddValue();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder={
            placeholder || t('METADATA.CONSTRAINTS.ARRAY_PLACEHOLDER')
          }
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddValue}
          disabled={disabled || !inputValue.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((value: string, index: number) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full text-sm"
            >
              <span>{value}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveValue(index)}
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

interface BooleanConstraintFieldProps {
  field: any;
  disabled?: boolean;
}

function BooleanConstraintField({
  field,
  disabled,
}: BooleanConstraintFieldProps) {
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

interface SelectConstraintFieldProps {
  field: any;
  disabled?: boolean;
}

function SelectConstraintField({
  field,
  disabled,
}: SelectConstraintFieldProps) {
  const { t } = useTranslations();
  const { data, isLoading } = useMetadataListLevelTwo();

  const schemas = data?.data || [];

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
          {schemas.map((schema) => (
            <SelectItem key={schema.id} value={schema.id}>
              {schema.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormControl>
  );
}
