import { useEffect, useState } from 'react';
import { Currency } from '@/features/currency/api/currencyApi';
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
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const currencySchema = z.object({
  code: z
    .string()
    .min(1, 'VALIDATION.CODE_REQUIRED')
    .max(50, 'VALIDATION.CODE_TOO_LONG'),
  name: z
    .string()
    .min(1, 'VALIDATION.NAME_REQUIRED')
    .max(100, 'VALIDATION.NAME_TOO_LONG'),
  sourceType: z.enum(['INTERNAL', 'EXTERNAL'], {
    required_error: 'VALIDATION.SOURCE_TYPE_REQUIRED',
  }),
  isPoint: z.boolean(),
  otpCode: z.string().optional(),
});

type CurrencyFormValues = z.infer<typeof currencySchema>;

interface CurrencyDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CurrencyFormValues) => Promise<void>;
  currency?: Currency | null;
  isLoading?: boolean;
  mode?: 'view' | 'edit' | 'create';
  onEdit?: () => void;
}

export function CurrencyDrawer({
  open,
  onClose,
  onSubmit,
  currency,
  isLoading = false,
  mode = 'create',
  onEdit,
}: CurrencyDrawerProps) {
  const { t, language } = useTranslations();
  const isView = mode === 'view';
  const isEdit = mode === 'edit';

  const [confirm, setConfirm] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');

  const form = useForm<CurrencyFormValues>({
    resolver: createTranslatedZodResolver(currencySchema, t),
    defaultValues: {
      code: '',
      name: '',
      sourceType: 'INTERNAL',
      isPoint: true,
      otpCode: '',
    },
  });

  useFormLanguageSync(form, language);

  // Reset form when currency changes or drawer opens
  useEffect(() => {
    if (open) {
      if (currency) {
        form.reset({
          code: currency.code,
          name: currency.name,
          sourceType: currency.sourceType,
          isPoint: currency.isPoint,
          otpCode: '',
        });
      } else {
        form.reset({
          code: '',
          name: '',
          sourceType: 'INTERNAL',
          isPoint: true,
          otpCode: '',
        });
      }
    }
  }, [currency, open, form]);

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
      const data = form.getValues();
      await onSubmit({
        ...data,
        otpCode: otpCode,
      });

      setConfirm(false);
      setOtpCode('');
    } catch (error) {
      console.error('Failed to submit currency:', error);
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
              ? t('CURRENCY.DRAWER.VIEW_TITLE')
              : isEdit
                ? t('CURRENCY.DRAWER.EDIT_TITLE')
                : t('CURRENCY.DRAWER.ADD_TITLE')}
          </SheetTitle>
          <SheetDescription>
            {isView
              ? t('CURRENCY.DRAWER.VIEW_DESCRIPTION')
              : isEdit
                ? t('CURRENCY.DRAWER.EDIT_DESCRIPTION')
                : t('CURRENCY.DRAWER.ADD_DESCRIPTION')}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex h-full flex-col space-y-6 mt-6"
          >
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
                      maxLength={50}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
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
                      maxLength={25}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('CURRENCY.DRAWER.CODE_DESCRIPTION')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sourceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('COMMON.SOURCE_TYPE')} *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    disabled={true}
                  >
                    <FormControl>
                      <SelectTrigger clearable={false}>
                        <SelectValue
                          placeholder={t(
                            'CURRENCY.DRAWER.SOURCE_TYPE_PLACEHOLDER',
                          )}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="INTERNAL">
                        {t('CURRENCY.DRAWER.SOURCE_TYPE_INTERNAL')}
                      </SelectItem>
                      <SelectItem value="EXTERNAL">
                        {t('CURRENCY.DRAWER.SOURCE_TYPE_EXTERNAL')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPoint"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>{t('CURRENCY.DRAWER.IS_POINT')}</FormLabel>
                    <FormDescription>
                      {t('CURRENCY.DRAWER.IS_POINT_DESCRIPTION')}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={true}
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
                ? t('CURRENCY.DRAWER.UPDATE_TITLE')
                : t('CURRENCY.DRAWER.CREATE_TITLE')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('COMMON.ENTER_OTP_CODE_TO_PROCEED')}
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
                t('COMMON.YES')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
