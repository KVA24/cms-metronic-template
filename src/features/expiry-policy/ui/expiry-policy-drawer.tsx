import { useEffect, useState } from 'react';
import { ExpiryPolicy } from '@/features/expiry-policy/api/expiryPolicyApi';
import { useSharedCurrencies } from '@/features/shared';
import { useTranslations } from '@/shared/hooks/use-translations';
import { UserRole } from '@/shared/lib/rbac';
import {
  createTranslatedZodResolver,
  useFormLanguageSync,
} from '@/shared/lib/validation-utils';
import { Button } from '@/shared/ui/atoms/button';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/atoms/form';
import { Input } from '@/shared/ui/atoms/input';
import { Label } from '@/shared/ui/atoms/label';
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
import { Switch } from '@/shared/ui/atoms/switch';
import { PermissionGuard } from '@/shared/ui/molecules/permission-guard';
import { Edit, LoaderCircleIcon } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';

const FIXED_TYPES = ['FIXED_DAYS', 'FIXED_MONTH', 'FIXED_YEAR'] as const;

const expiryPolicySchema = z
  .object({
    code: z
      .string()
      // .min(1, 'VALIDATION.CODE_REQUIRED')
      // .max(50, 'VALIDATION.CODE_TOO_LONG')
      .optional(),
    name: z
      .string()
      .min(1, 'VALIDATION.NAME_REQUIRED')
      .max(100, 'VALIDATION.NAME_TOO_LONG'),
    type: z.enum(
      ['FIXED_DAYS', 'FIXED_MONTH', 'FIXED_YEAR', 'TIER_BASED', 'NO_EXPIRED'],
      {
        required_error: 'VALIDATION.TYPE_REQUIRED',
      },
    ),
    configValue: z.coerce
      .number({ invalid_type_error: 'VALIDATION.VALUE_INVALID' })
      .int('VALIDATION.VALUE_INVALID')
      .positive('VALIDATION.VALUE_POSITIVE')
      .optional()
      .nullable(),
    currencyId: z.string().min(1, 'VALIDATION.CURRENCY_REQUIRED'),
    status: z.enum(['ACTIVE', 'INACTIVE'], {
      required_error: 'VALIDATION.STATUS_REQUIRED',
    }),
    otpCode: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if ((FIXED_TYPES as readonly string[]).includes(data.type)) {
      if (data.configValue == null || isNaN(data.configValue)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'VALIDATION.VALUE_REQUIRED',
          path: ['configValue'],
        });
      }
    }
  });

type ExpiryPolicyFormValues = z.infer<typeof expiryPolicySchema>;

interface ExpiryPolicyDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    data: ExpiryPolicyFormValues & {
      config?: { value?: number | null; configMap: null } | null;
    },
  ) => Promise<void>;
  expiryPolicy?: ExpiryPolicy | null;
  isLoading?: boolean;
  mode?: 'view' | 'edit' | 'create';
  onEdit?: () => void;
}

export function ExpiryPolicyDrawer({
  open,
  onClose,
  onSubmit,
  expiryPolicy,
  isLoading = false,
  mode = 'create',
  onEdit,
}: ExpiryPolicyDrawerProps) {
  const { t, language } = useTranslations();
  const isView = mode === 'view';
  const isEdit = mode === 'edit';

  const [confirm, setConfirm] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');

  const { data: currencyList } = useSharedCurrencies();
  const currencies = currencyList?.data || [];

  const form = useForm<ExpiryPolicyFormValues>({
    resolver: createTranslatedZodResolver(expiryPolicySchema, t),
    defaultValues: {
      code: '',
      name: '',
      type: 'FIXED_DAYS',
      configValue: null,
      currencyId: '',
      status: 'ACTIVE',
      otpCode: '',
    },
  });

  useFormLanguageSync(form, language);

  const watchedType = useWatch({ control: form.control, name: 'type' });
  const isFixedType = (FIXED_TYPES as readonly string[]).includes(watchedType);

  // Reset form when expiryPolicy changes or drawer opens
  useEffect(() => {
    if (open) {
      if (expiryPolicy) {
        form.reset({
          code: expiryPolicy.code,
          name: expiryPolicy.name,
          type: expiryPolicy.type,
          configValue: expiryPolicy.expiryValue ?? null,
          currencyId: expiryPolicy.currencyId,
          status: expiryPolicy.status,
          otpCode: '',
        });
      } else {
        form.reset({
          code: '',
          name: '',
          type: 'FIXED_DAYS',
          configValue: null,
          currencyId: '',
          status: 'ACTIVE',
          otpCode: '',
        });
      }
    }
  }, [expiryPolicy, open, form]);

  // Reset OTP dialog when mode changes
  useEffect(() => {
    setConfirm(false);
    setOtpCode('');
    setOtpError('');
  }, [mode]);

  const handleSubmit = async () => {
    // Just open confirm dialog, don't submit yet
    setConfirm(true);
  };

  const handleConfirm = async () => {
    // Validate OTP
    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpError('OTP must be 6 digits');
      return;
    }

    setOtpError('');

    try {
      const { configValue, ...rest } = form.getValues();
      const config = isFixedType
        ? { value: configValue ?? null, configMap: null }
        : null;

      await onSubmit({ ...rest, configValue, otpCode, config });

      setConfirm(false);
      setOtpCode('');
    } catch (error) {
      console.error('Failed to submit expiry policy:', error);
      // Error handled in parent, keep dialog open
    }
  };

  const handleClose = () => {
    form.reset();
    setOtpCode('');
    setOtpError('');
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
              ? t('EXPIRY_POLICY.DRAWER.VIEW_TITLE')
              : isEdit
                ? t('EXPIRY_POLICY.DRAWER.EDIT_TITLE')
                : t('EXPIRY_POLICY.DRAWER.ADD_TITLE')}
          </SheetTitle>
          <SheetDescription>
            {isView
              ? t('EXPIRY_POLICY.DRAWER.VIEW_DESCRIPTION')
              : isEdit
                ? t('EXPIRY_POLICY.DRAWER.EDIT_DESCRIPTION')
                : t('EXPIRY_POLICY.DRAWER.ADD_DESCRIPTION')}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex h-full flex-col space-y-6 mt-6"
          >
            {/* <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('COMMON.CODE')} *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('COMMON.ENTER_CODE')}
                      {...field}
                      disabled={isEdit || isView}
                      readOnly={isView}
                      maxLength={50}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('EXPIRY_POLICY.DRAWER.CODE_DESCRIPTION')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('COMMON.NAME')} *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('COMMON.ENTER_NAME')}
                      {...field}
                      disabled={isView}
                      readOnly={isView}
                      maxLength={100}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currencyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('COMMON.CURRENCY')} *</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value)}
                    value={field.value || ''}
                    disabled={isView}
                  >
                    <FormControl>
                      <SelectTrigger clearable={false}>
                        <SelectValue
                          placeholder={t(
                            'EXPIRY_POLICY.DRAWER.CURRENCY_PLACEHOLDER',
                          )}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem
                          key={currency.id}
                          value={currency.id.toString()}
                        >
                          {currency.name} ({currency.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('COMMON.TYPE')} *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    disabled={isView}
                  >
                    <FormControl>
                      <SelectTrigger clearable={false}>
                        <SelectValue
                          placeholder={t(
                            'EXPIRY_POLICY.DRAWER.TYPE_PLACEHOLDER',
                          )}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FIXED_DAYS">
                        {t('EXPIRY_POLICY.DRAWER.TYPE_FIXED_DAYS')}
                      </SelectItem>
                      <SelectItem value="FIXED_MONTH">
                        {t('EXPIRY_POLICY.DRAWER.TYPE_FIXED_MONTHS')}
                      </SelectItem>
                      <SelectItem value="FIXED_YEAR">
                        {t('EXPIRY_POLICY.DRAWER.TYPE_FIXED_YEARS')}
                      </SelectItem>
                      {/*<SelectItem value="TIER_BASED">*/}
                      {/*  {t('EXPIRY_POLICY.DRAWER.TYPE_TIER_BASED')}*/}
                      {/*</SelectItem>*/}
                      <SelectItem value="NO_EXPIRED">
                        {t('EXPIRY_POLICY.DRAWER.TYPE_NO_EXPIRED')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isFixedType && (
              <div className="px-4">
                <FormField
                  control={form.control}
                  name="configValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('EXPIRY_POLICY.DRAWER.CONFIG_VALUE')} *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder={t(
                            'EXPIRY_POLICY.DRAWER.CONFIG_VALUE_PLACEHOLDER',
                          )}
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ''
                                ? null
                                : e.target.valueAsNumber,
                            )
                          }
                          disabled={isView}
                          readOnly={isView}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>{t('COMMON.STATUS_1')}</FormLabel>
                    <FormDescription>
                      {t('EXPIRY_POLICY.DRAWER.STATUS_DESCRIPTION')}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value === 'ACTIVE'}
                      onCheckedChange={(checked) =>
                        field.onChange(checked ? 'ACTIVE' : 'INACTIVE')
                      }
                      disabled={isView}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

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
                  <PermissionGuard
                    requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}
                  >
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
                          {t('COMMON.PROCESSING')}
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
          if (!open) {
            setOtpCode('');
            setOtpError('');
          }
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
                ? t('EXPIRY_POLICY.DRAWER.UPDATE_TITLE')
                : t('EXPIRY_POLICY.DRAWER.CREATE_TITLE')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('EXPIRY_POLICY.DRAWER.OTP_DESCRIPTION')}
            </DialogDescription>
          </DialogHeader>
          <div className="p-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="otp-input">{t('COMMON.OTP_CODE')} *</Label>
              <Input
                id="otp-input"
                placeholder={t('COMMON.ENTER_6_DIGIT_OTP')}
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value);
                  setOtpError('');
                }}
                maxLength={6}
                disabled={isLoading}
              />
              {otpError && (
                <span className="text-xs text-destructive">{otpError}</span>
              )}
            </div>
          </div>
          <DialogFooter className="flex gap-1">
            <Button
              variant="outline"
              onClick={() => {
                setConfirm(false);
                setOtpCode('');
                setOtpError('');
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
                t('COMMON.CONFIRM')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
