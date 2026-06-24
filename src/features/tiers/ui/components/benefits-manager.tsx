import { useEffect, useRef, useState } from 'react';
import { TierBenefit } from '@/features/tiers/api/tierApi';
import { useTranslations } from '@/shared/hooks/use-translations';
import { Button } from '@/shared/ui/atoms/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/atoms/card';
import { Input } from '@/shared/ui/atoms/input';
import { Label } from '@/shared/ui/atoms/label';
import { Textarea } from '@/shared/ui/atoms/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { FieldErrors, useFormContext } from 'react-hook-form';

interface BenefitsManagerProps {
  value: TierBenefit[];
  onChange: (benefits: TierBenefit[]) => void;
  disabled?: boolean;
}

export function BenefitsManager({
  value,
  onChange,
  disabled = false,
}: BenefitsManagerProps) {
  const form = useFormContext();
  const { t } = useTranslations();
  const initialized = useRef(false);
  const [benefits, setBenefits] = useState<TierBenefit[]>(
    value.length > 0
      ? value.map((b, i) => ({ ...b, sortOrder: b.sortOrder ?? i + 1 }))
      : [{ content: '', iconUrl: '', sortOrder: 0 }],
  );

  // Sync local state once when real data arrives from API (value has id or non-empty content)
  useEffect(() => {
    const hasRealData = value.some((b) => b.id || b.content);
    if (!initialized.current && hasRealData) {
      initialized.current = true;
      setBenefits(
        value.map((b, i) => ({ ...b, sortOrder: b.sortOrder ?? i + 1 })),
      );
    }
  }, [value]);

  // Keep sortOrder in sync with array position
  const syncSortOrder = (list: TierBenefit[]): TierBenefit[] =>
    list.map((b, i) => ({ ...b, sortOrder: i + 1 }));

  const addBenefit = () => {
    if (benefits.length < 20) {
      const next = syncSortOrder([
        ...benefits,
        { content: '', iconUrl: '', sortOrder: benefits.length + 1 },
      ]);
      setBenefits(next);
      onChange(next);
    }
  };

  const removeBenefit = (index: number) => {
    if (benefits.length > 1) {
      const next = syncSortOrder(benefits.filter((_, i) => i !== index));
      setBenefits(next);
      onChange(next);
    }
  };

  const updateBenefit = (index: number, updates: Partial<TierBenefit>) => {
    const next = [...benefits];
    next[index] = { ...next[index], ...updates };
    setBenefits(next);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">
        {t('TIERS.BENEFITS.TITLE')} ({t('TIERS.FORM.BENEFITS_MIN')})
      </Label>

      {benefits.map((benefit, index) => (
        <Card key={index}>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-sm font-medium">
                {t('TIERS.BENEFITS.BENEFIT_LABEL')} {index + 1}
              </CardTitle>
              {!disabled && benefits.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBenefit(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Icon URL */}
            <div className="space-y-2">
              <Label htmlFor={`benefit-icon-${index}`}>
                {t('TIERS.BENEFITS.ICON_URL')}
              </Label>
              <div className="flex gap-2">
                <Input
                  id={`benefit-icon-${index}`}
                  type="url"
                  placeholder={t('TIERS.BENEFITS.ICON_URL_PLACEHOLDER')}
                  value={benefit.iconUrl || ''}
                  onChange={(e) =>
                    updateBenefit(index, { iconUrl: e.target.value })
                  }
                  disabled={disabled}
                  maxLength={500}
                />
                {/*<Button*/}
                {/*  type="button"*/}
                {/*  variant="outline"*/}
                {/*  size="sm"*/}
                {/*  disabled={disabled}*/}
                {/*  title={t('TIERS.BENEFITS.UPLOAD_ICON')}*/}
                {/*>*/}
                {/*  <Upload className="h-4 w-4" />*/}
                {/*</Button>*/}
              </div>
              {/*<p className="text-xs text-muted-foreground">*/}
              {/*  {t('TIERS.BENEFITS.ICON_URL_DESCRIPTION')}*/}
              {/*</p>*/}
              {benefit.iconUrl && (
                <div className="mt-2">
                  <img
                    src={benefit.iconUrl}
                    alt="Benefit icon preview"
                    className="h-12 w-12 object-contain border rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Benefit Content */}
            <div className="space-y-2">
              <Label htmlFor={`benefit-content-${index}`}>
                {t('TIERS.BENEFITS.CONTENT')}{' '}
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id={`benefit-content-${index}`}
                placeholder={t('TIERS.BENEFITS.CONTENT_PLACEHOLDER')}
                value={benefit.content}
                onChange={(e) =>
                  updateBenefit(index, { content: e.target.value })
                }
                disabled={disabled}
                maxLength={500}
                rows={3}
                aria-invalid={
                  !!(
                    form?.formState?.errors?.benefits as unknown as FieldErrors<
                      { content: string }[]
                    >
                  )?.[index]?.content
                }
              />
              {(
                form?.formState?.errors?.benefits as unknown as FieldErrors<
                  { content: string }[]
                >
              )?.[index]?.content && (
                <p className="text-xs text-destructive">
                  {
                    (
                      form.formState.errors.benefits as unknown as FieldErrors<
                        { content: string }[]
                      >
                    )[index]?.content?.message
                  }
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {!disabled && benefits.length < 20 && (
        <Button type="button" variant="outline" size="sm" onClick={addBenefit}>
          <Plus className="h-4 w-4 mr-2" />
          {t('TIERS.BENEFITS.ADD_BENEFIT')}
        </Button>
      )}
    </div>
  );
}
