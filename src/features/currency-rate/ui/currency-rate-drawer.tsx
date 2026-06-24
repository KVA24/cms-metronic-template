import { useEffect, useState } from 'react';
import { CurrencyRate } from '@/features/currency-rate/api/currencyRateApi';
import { useSharedCurrencies } from '@/features/shared';
import { useTranslations } from '@/shared/hooks/use-translations';
import { UserRole } from '@/shared/lib/rbac';
import {
  createTranslatedZodResolver,
  useFormLanguageSync,
} from '@/shared/lib/validation-utils';
import { Button } from '@/shared/ui/atoms/button';
import { DatePicker } from '@/shared/ui/atoms/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/atoms/dialog';
import {
  Form,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/atoms/sheet';
import { PermissionGuard } from '@/shared/ui/molecules/permission-guard';
import { format } from 'date-fns';
import { Edit, LoaderCircleIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const decimalValidator = (fieldName: string) => {
  const key = fieldName.toUpperCase().replace(/ /g, '_');
  return z
    .string()
    .min(1, `VALIDATION.${key}_REQUIRED`)
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, `VALIDATION.${key}_POSITIVE`)
    .refine(
      (val) => /^\d{1,13}(\.\d{1,6})?$/.test(val),
      (val) => ({
        message: /^\d+(\.\d+)?$/.test(val)
          ? `VALIDATION.${key}_MAX_DIGITS`
          : `VALIDATION.${key}_INVALID`,
      }),
    );
};

/**
 * Handles keydown to block input when total digits would exceed 19.
 * Rules:
 *  - Integer part: max 13 digits
 *  - Decimal part: max 6 digits
 *  - Total digits (excluding dot): max 19
 */
const handleRateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const allowedKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Escape',
    'Enter',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ];
  if (allowedKeys.includes(e.key)) return;
  // Allow single dot if not already present
  if (e.key === '.') {
    if (e.currentTarget.value.includes('.')) e.preventDefault();
    return;
  }
  // Block non-digit keys
  if (!/^\d$/.test(e.key)) {
    e.preventDefault();
    return;
  }
  const current = e.currentTarget.value;
  const selStart = e.currentTarget.selectionStart ?? current.length;
  const selEnd = e.currentTarget.selectionEnd ?? current.length;
  const next = current.slice(0, selStart) + e.key + current.slice(selEnd);
  const dotIndex = next.indexOf('.');
  if (dotIndex === -1) {
    // Integer only: max 13 digits
    if (next.length > 13) e.preventDefault();
  } else {
    const intPart = next.slice(0, dotIndex);
    const decPart = next.slice(dotIndex + 1);
    if (intPart.length > 13 || decPart.length > 6) e.preventDefault();
  }
};

const currencyRateSchema = z
  .object({
    baseCurrencyId: z.coerce
      .string()
      .min(1, 'VALIDATION.BASE_CURRENCY_REQUIRED'),
    targetCurrencyId: z.coerce
      .string()
      .min(1, 'VALIDATION.TARGET_CURRENCY_REQUIRED'),
    buyRate: decimalValidator('Buy Rate'),
    sellRate: decimalValidator('Sell Rate'),
    roundingRule: z.enum(['FLOOR', 'CEILING', 'HALF_UP'], {
      required_error: 'VALIDATION.ROUNDING_RULE_REQUIRED',
    }),
    startAt: z.date({ required_error: 'VALIDATION.START_DATE_INVALID' }),
    endAt: z.date().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.endAt) {
        return data.endAt >= data.startAt;
      }
      return true;
    },
    {
      message: 'VALIDATION.END_DATE_AFTER_START',
      path: ['endAt'],
    },
  );

type CurrencyRateFormValues = z.infer<typeof currencyRateSchema>;

interface CurrencyRateDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CurrencyRateFormValues) => Promise<void>;
  currencyRate?: CurrencyRate | null;
  isLoading?: boolean;
  mode?: 'view' | 'edit' | 'create';
  onEdit?: () => void;
}

export function CurrencyRateDrawer({
  open,
  onClose,
  onSubmit,
  currencyRate,
  isLoading = false,
  mode = 'create',
  onEdit,
}: CurrencyRateDrawerProps) {
  const { t, language } = useTranslations();
  const isView = mode === 'view';
  const isEdit = mode === 'edit';

  const [confirm, setConfirm] = useState(false);

  // Fetch all currencies for select options
  const { data: currenciesData } = useSharedCurrencies({});
  const currencies = currenciesData?.data || [];

  const form = useForm<CurrencyRateFormValues>({
    resolver: createTranslatedZodResolver(currencyRateSchema, t),
    defaultValues: {
      baseCurrencyId: '',
      targetCurrencyId: '',
      buyRate: '',
      sellRate: '',
      roundingRule: 'HALF_UP',
      startAt: undefined,
      endAt: undefined,
    },
  });

  // Sync form validation when language changes
  useFormLanguageSync(form, language);

  // Reset form when currency rate changes or drawer opens
  useEffect(() => {
    if (open) {
      if (currencyRate) {
        form.reset({
          baseCurrencyId: currencyRate.baseCurrencyId,
          targetCurrencyId: currencyRate.targetCurrencyId,
          buyRate: currencyRate.buyRate.toString(),
          sellRate: currencyRate.sellRate.toString(),
          roundingRule: currencyRate.roundingRule,
          startAt: new Date(currencyRate.startAt),
          endAt: new Date(currencyRate.endAt),
        });
      } else {
        form.reset({
          baseCurrencyId: '',
          targetCurrencyId: '',
          buyRate: '',
          sellRate: '',
          roundingRule: 'HALF_UP',
          startAt: undefined,
          endAt: undefined,
        });
      }
    }
  }, [currencyRate, open, form]);

  // Reset confirmation dialog when mode changes
  useEffect(() => {
    setConfirm(false);
  }, [mode]);

  const handleSubmit = async () => {
    // Just open confirm dialog, don't submit yet
    setConfirm(true);
  };

  const handleConfirm = async () => {
    try {
      const data = form.getValues();

      // Format dates to yyyy-MM-dd HH:mm:ss
      const formatDateTime = (date: Date) => {
        return format(date, 'yyyy-MM-dd HH:mm:ss');
      };

      await onSubmit({
        ...data,
        startAt: data.startAt ? formatDateTime(data.startAt) : undefined,
        endAt: data.endAt ? formatDateTime(data.endAt) : null,
      } as any);

      setConfirm(false);
    } catch (error) {
      console.error('Failed to submit currency rate:', error);
      // Error handled in parent, keep dialog open
    }
  };

  const handleClose = () => {
    form.reset();
    setConfirm(false);
    onClose();
  };

  const handleEditClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onEdit) {
      onEdit();
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isView
              ? t('CURRENCY_RATE.DRAWER.VIEW_TITLE')
              : isEdit
                ? t('CURRENCY_RATE.DRAWER.EDIT_TITLE')
                : t('CURRENCY_RATE.DRAWER.ADD_TITLE')}
          </SheetTitle>
          <SheetDescription>
            {isView
              ? t('CURRENCY_RATE.DRAWER.VIEW_DESCRIPTION')
              : isEdit
                ? t('CURRENCY_RATE.DRAWER.EDIT_DESCRIPTION')
                : t('CURRENCY_RATE.DRAWER.ADD_DESCRIPTION')}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex h-full flex-col space-y-6 mt-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="baseCurrencyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('CURRENCY_RATE.DRAWER.BASE_CURRENCY')} *
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isView}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'CURRENCY_RATE.DRAWER.BASE_CURRENCY_PLACEHOLDER',
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.id} value={currency.id}>
                              {currency.name} ({currency.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetCurrencyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('CURRENCY_RATE.DRAWER.TARGET_CURRENCY')} *
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isView}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'CURRENCY_RATE.DRAWER.TARGET_CURRENCY_PLACEHOLDER',
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.id} value={currency.id}>
                              {currency.name} ({currency.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="buyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('CURRENCY_RATE.DRAWER.BUY_RATE')} *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder={t(
                          'CURRENCY_RATE.DRAWER.BUY_RATE_PLACEHOLDER',
                        )}
                        {...field}
                        onKeyDown={handleRateKeyDown}
                        disabled={isView}
                        readOnly={isView}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sellRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('CURRENCY_RATE.DRAWER.SELL_RATE')} *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder={t(
                          'CURRENCY_RATE.DRAWER.SELL_RATE_PLACEHOLDER',
                        )}
                        {...field}
                        onKeyDown={handleRateKeyDown}
                        disabled={isView}
                        readOnly={isView}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="roundingRule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('CURRENCY_RATE.DRAWER.ROUNDING_RULE')}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value || 'HALF_UP'}
                    disabled={isView}
                  >
                    <FormControl>
                      <SelectTrigger clearable={false}>
                        <SelectValue
                          placeholder={t(
                            'CURRENCY_RATE.DRAWER.ROUNDING_RULE_PLACEHOLDER',
                          )}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FLOOR">
                        {t('CURRENCY_RATE.DRAWER.ROUNDING_FLOOR')}
                      </SelectItem>
                      <SelectItem value="CEILING">
                        {t('CURRENCY_RATE.DRAWER.ROUNDING_CEILING')}
                      </SelectItem>
                      <SelectItem value="HALF_UP">
                        {t('CURRENCY_RATE.DRAWER.ROUNDING_HALF_UP')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startAt"
                render={({ field, fieldState }) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return (
                    <FormItem>
                      <FormLabel>
                        {t('CURRENCY_RATE.DRAWER.START_AT')} *
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value || undefined}
                          onChange={(date) => {
                            field.onChange(date === undefined ? null : date);
                          }}
                          placeholder={t(
                            'CURRENCY_RATE.DRAWER.START_AT_PLACEHOLDER',
                          )}
                          dateFormat="dd/MM/yyyy"
                          showClearButton={true}
                          error={!!fieldState.error}
                          disabled={
                            isView ||
                            (isEdit && field.value && field.value < today)
                          }
                          min={today}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="endAt"
                render={({ field, fieldState }) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const startDate = form.watch('startAt');
                  return (
                    <FormItem>
                      <FormLabel>{t('CURRENCY_RATE.DRAWER.END_AT')}</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value || undefined}
                          onChange={(date) => {
                            field.onChange(date === undefined ? null : date);
                          }}
                          placeholder={t(
                            'CURRENCY_RATE.DRAWER.END_AT_PLACEHOLDER',
                          )}
                          dateFormat="dd/MM/yyyy"
                          showClearButton={true}
                          error={!!fieldState.error}
                          disabled={
                            isView ||
                            (isEdit && !!(field.value && field.value < today))
                          }
                          min={startDate}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <div className="flex gap-3 pt-4 mt-auto">
              {isView ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    {t('COMMON.CLOSE')}
                  </Button>
                  <PermissionGuard requiredRoles={[UserRole.ADMIN]}>
                    <Button
                      type="button"
                      onClick={(e) => handleEditClick(e as any)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {t('COMMON.EDIT')}
                    </Button>
                  </PermissionGuard>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {t('COMMON.CANCEL')}
                  </Button>
                  <PermissionGuard
                    requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}
                  >
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                          {t('COMMON.LOADING')}
                        </span>
                      ) : isEdit ? (
                        t('COMMON.SAVE')
                      ) : (
                        t('COMMON.CREATE')
                      )}
                    </Button>
                  </PermissionGuard>
                </>
              )}
            </div>
          </form>
        </Form>
      </SheetContent>

      <Dialog
        open={confirm}
        onOpenChange={(open) => {
          setConfirm(open);
        }}
      >
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {isEdit
                ? t('CURRENCY_RATE.DRAWER.UPDATE_TITLE')
                : t('CURRENCY_RATE.DRAWER.CREATE_TITLE')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {isEdit
                ? t('CURRENCY_RATE.DRAWER.CONFIRM_UPDATE_DESCRIPTION')
                : t('CURRENCY_RATE.DRAWER.CONFIRM_CREATE_DESCRIPTION')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-1">
            <Button
              variant="outline"
              onClick={() => {
                setConfirm(false);
              }}
              disabled={isLoading}
            >
              {t('COMMON.CANCEL')}
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                  {t('COMMON.PROCESSING')}
                </span>
              ) : (
                t('COMMON.YES')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
