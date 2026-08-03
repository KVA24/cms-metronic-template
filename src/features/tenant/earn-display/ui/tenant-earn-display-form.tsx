import { useTranslations } from '@/shared/hooks/use-translations';
import { Button } from '@/shared/ui/atoms/button';
import { Input } from '@/shared/ui/atoms/input';
import { Textarea } from '@/shared/ui/atoms/textarea';
import type { TenantEarnDisplayDraft } from '../model/tenant-earn-display';

export function TenantEarnDisplayForm({
  draft,
  errorCode,
  pending,
  targetLabel,
  onChange,
  onSave,
  onCancel,
}: {
  draft: TenantEarnDisplayDraft;
  errorCode: string | null;
  pending: boolean;
  targetLabel: string;
  onChange: (draft: TenantEarnDisplayDraft) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslations();
  const fieldError = (field: 'TEXT_EN' | 'TEXT_VI' | 'EFFECTIVE') =>
    errorCode?.startsWith(field)
      ? t(`TENANT_EARN_DISPLAY.ERRORS.${errorCode}`)
      : null;
  return (
    <div className="mt-5 space-y-5 rounded-lg border bg-muted/20 p-5">
      <div>
        <p className="text-sm text-muted-foreground">
          {t('TENANT_EARN_DISPLAY.TARGET')}
        </p>
        <p className="font-semibold">{targetLabel}</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>{t('TENANT_EARN_DISPLAY.FORM.TEXT_EN')} *</span>
          <Textarea
            name="earnTextEn"
            maxLength={161}
            value={draft.textEn}
            aria-invalid={Boolean(fieldError('TEXT_EN'))}
            onChange={(event) =>
              onChange({ ...draft, textEn: event.target.value })
            }
          />
          <span className="text-xs text-muted-foreground">
            {t('TENANT_EARN_DISPLAY.FORM.MAX_LENGTH')}
          </span>
          {fieldError('TEXT_EN') && (
            <p className="text-xs text-destructive">{fieldError('TEXT_EN')}</p>
          )}
        </label>
        <label className="space-y-1 text-sm">
          <span>{t('TENANT_EARN_DISPLAY.FORM.TEXT_VI')} *</span>
          <Textarea
            name="earnTextVi"
            maxLength={161}
            value={draft.textVi}
            aria-invalid={Boolean(fieldError('TEXT_VI'))}
            onChange={(event) =>
              onChange({ ...draft, textVi: event.target.value })
            }
          />
          <span className="text-xs text-muted-foreground">
            {t('TENANT_EARN_DISPLAY.FORM.MAX_LENGTH')}
          </span>
          {fieldError('TEXT_VI') && (
            <p className="text-xs text-destructive">{fieldError('TEXT_VI')}</p>
          )}
        </label>
        <label className="space-y-1 text-sm">
          <span>{t('TENANT_EARN_DISPLAY.FORM.STATUS')} *</span>
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-3"
            value={draft.displayStatus}
            onChange={(event) =>
              onChange({
                ...draft,
                displayStatus: event.target
                  .value as TenantEarnDisplayDraft['displayStatus'],
              })
            }
          >
            <option value="ACTIVE">{t('COMMON.STATUS.ACTIVE')}</option>
            <option value="INACTIVE">{t('COMMON.STATUS.INACTIVE')}</option>
          </select>
        </label>
        <div />
        <label className="space-y-1 text-sm">
          <span>{t('TENANT_EARN_DISPLAY.FORM.FROM')}</span>
          <Input
            type="date"
            name="effectiveFrom"
            value={draft.effectiveFrom ?? ''}
            onChange={(event) =>
              onChange({ ...draft, effectiveFrom: event.target.value || null })
            }
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>{t('TENANT_EARN_DISPLAY.FORM.TO')}</span>
          <Input
            type="date"
            name="effectiveTo"
            aria-invalid={Boolean(fieldError('EFFECTIVE'))}
            value={draft.effectiveTo ?? ''}
            onChange={(event) =>
              onChange({ ...draft, effectiveTo: event.target.value || null })
            }
          />
          {fieldError('EFFECTIVE') && (
            <p className="text-xs text-destructive">
              {fieldError('EFFECTIVE')}
            </p>
          )}
        </label>
      </div>
      {errorCode &&
        !fieldError('TEXT_EN') &&
        !fieldError('TEXT_VI') &&
        !fieldError('EFFECTIVE') && (
          <p className="text-sm text-destructive">
            {t(`TENANT_EARN_DISPLAY.ERRORS.${errorCode}`)}
          </p>
        )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={pending} onClick={onCancel}>
          {t('COMMON.CANCEL')}
        </Button>
        <Button disabled={pending} onClick={onSave}>
          {pending ? t('COMMON.LOADING') : t('TENANT_EARN_DISPLAY.FORM.SAVE')}
        </Button>
      </div>
    </div>
  );
}
