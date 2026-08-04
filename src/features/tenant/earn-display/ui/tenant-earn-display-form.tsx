import { useTranslations } from '@/shared/hooks/use-translations';
import { formatDateOnly, parseDateOnly } from '@/shared/lib/date-utils';
import { Button } from '@/shared/ui/atoms/button';
import { DatePicker } from '@/shared/ui/atoms/date-picker';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/atoms/sheet';
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
    <Sheet open onOpenChange={(open) => !open && onCancel()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{t('TENANT_EARN_DISPLAY.CONFIGURE')}</SheetTitle>
          <SheetDescription>
            {t('TENANT_EARN_DISPLAY.TARGET')}: {targetLabel}
          </SheetDescription>
        </SheetHeader>
        <SheetBody className="grid gap-5">
          <label className="space-y-1 text-sm">
            <span>{t('TENANT_EARN_DISPLAY.FORM.TEXT_EN')} *</span>
            <Textarea
              name="earnTextEn"
              placeholder={t('TENANT_EARN_DISPLAY.FORM.TEXT_EN')}
              maxLength={161}
              value={draft.textEn}
              aria-invalid={Boolean(fieldError('TEXT_EN'))}
              onChange={(event) =>
                onChange({ ...draft, textEn: event.target.value })
              }
            />
            <span className="text-muted-foreground text-xs">
              {t('TENANT_EARN_DISPLAY.FORM.MAX_LENGTH')}
            </span>
            {fieldError('TEXT_EN') && (
              <p className="text-destructive text-xs">
                {fieldError('TEXT_EN')}
              </p>
            )}
          </label>
          <label className="space-y-1 text-sm">
            <span>{t('TENANT_EARN_DISPLAY.FORM.TEXT_VI')} *</span>
            <Textarea
              name="earnTextVi"
              placeholder={t('TENANT_EARN_DISPLAY.FORM.TEXT_VI')}
              maxLength={161}
              value={draft.textVi}
              aria-invalid={Boolean(fieldError('TEXT_VI'))}
              onChange={(event) =>
                onChange({ ...draft, textVi: event.target.value })
              }
            />
            <span className="text-muted-foreground text-xs">
              {t('TENANT_EARN_DISPLAY.FORM.MAX_LENGTH')}
            </span>
            {fieldError('TEXT_VI') && (
              <p className="text-destructive text-xs">
                {fieldError('TEXT_VI')}
              </p>
            )}
          </label>
          <label className="space-y-1 text-sm">
            <span>{t('TENANT_EARN_DISPLAY.FORM.STATUS')} *</span>
            <select
              id="earn-display-status"
              name="displayStatus"
              className="border-input bg-background h-9 w-full rounded-md border px-3"
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
          <label className="space-y-1 text-sm">
            <span>{t('TENANT_EARN_DISPLAY.FORM.FROM')}</span>
            <DatePicker
              value={parseDateOnly(draft.effectiveFrom)}
              placeholder={t('TENANT_EARN_DISPLAY.FORM.FROM')}
              ariaLabel={t('TENANT_EARN_DISPLAY.FORM.FROM')}
              onChange={(date) =>
                onChange({
                  ...draft,
                  effectiveFrom: formatDateOnly(date) || null,
                })
              }
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>{t('TENANT_EARN_DISPLAY.FORM.TO')}</span>
            <DatePicker
              value={parseDateOnly(draft.effectiveTo)}
              placeholder={t('TENANT_EARN_DISPLAY.FORM.TO')}
              ariaLabel={t('TENANT_EARN_DISPLAY.FORM.TO')}
              error={Boolean(fieldError('EFFECTIVE'))}
              onChange={(date) =>
                onChange({
                  ...draft,
                  effectiveTo: formatDateOnly(date) || null,
                })
              }
            />
            {fieldError('EFFECTIVE') && (
              <p className="text-destructive text-xs">
                {fieldError('EFFECTIVE')}
              </p>
            )}
          </label>
          {errorCode &&
            !fieldError('TEXT_EN') &&
            !fieldError('TEXT_VI') &&
            !fieldError('EFFECTIVE') && (
              <p className="text-destructive text-sm" role="alert">
                {t(`TENANT_EARN_DISPLAY.ERRORS.${errorCode}`)}
              </p>
            )}
        </SheetBody>
        <SheetFooter className="mt-auto gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onCancel}
          >
            {t('COMMON.CANCEL')}
          </Button>
          <Button type="button" disabled={pending} onClick={onSave}>
            {pending ? t('COMMON.LOADING') : t('TENANT_EARN_DISPLAY.FORM.SAVE')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
