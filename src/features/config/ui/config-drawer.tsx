import { Config } from '@/features/config/api/configApi';
import { useTranslations } from '@/shared/hooks/use-translations';
import {
  createTranslatedZodResolver,
  useFormLanguageSync,
} from '@/shared/lib/validation-utils';
import { Button } from '@/shared/ui/atoms/button';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/atoms/sheet';
import { Textarea } from '@/shared/ui/atoms/textarea';
import { LoaderCircleIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const configSchema = z.object({
  keyConfig: z
    .string()
    .min(1, 'VALIDATION.KEY_REQUIRED')
    .max(100, 'VALIDATION.KEY_TOO_LONG'),
  valueConfig: z.string().min(1, 'VALIDATION.VALUE_REQUIRED'),
  otpCode: z
    .string()
    .min(1, 'VALIDATION.OTP_REQUIRED')
    .regex(/^\d{6}$/, 'VALIDATION.OTP_LENGTH'),
  isActive: z.boolean(),
});

type ConfigFormValues = z.infer<typeof configSchema>;

interface ConfigDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ConfigFormValues) => Promise<void>;
  config?: Config | null;
  isLoading?: boolean;
}

export function ConfigDrawer({
  open,
  onClose,
  onSubmit,
  config,
  isLoading = false,
}: ConfigDrawerProps) {
  const { t, language } = useTranslations();
  const isEdit = !!config;

  const form = useForm<ConfigFormValues>({
    resolver: createTranslatedZodResolver(configSchema, t),
    defaultValues: {
      keyConfig: config?.keyConfig ?? '',
      valueConfig: config?.valueConfig ?? '',
      otpCode: '',
      isActive: config?.isActive ?? true,
    },
  });

  useFormLanguageSync(form, language);

  const handleSubmit = async (data: ConfigFormValues) => {
    await onSubmit(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEdit
              ? t('CONFIG.DRAWER.EDIT_TITLE')
              : t('CONFIG.DRAWER.ADD_TITLE')}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? t('CONFIG.DRAWER.EDIT_DESCRIPTION')
              : t('CONFIG.DRAWER.ADD_DESCRIPTION')}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex h-full flex-col space-y-6 mt-6"
          >
            <FormField
              control={form.control}
              name="keyConfig"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('CONFIG.DRAWER.KEY')} *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('COMMON.ENTER_VALUE')}
                      {...field}
                      disabled={isEdit}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('CONFIG.DRAWER.KEY_DESCRIPTION')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valueConfig"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('COMMON.VALUE')} *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('CONFIG.DRAWER.VALUE_PLACEHOLDER')}
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="otpCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('COMMON.INPUT.OTP')} *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('COMMON.INPUT.OTP_PLACEHOLDER')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/*<FormField*/}
            {/*  control={form.control}*/}
            {/*  name="isActive"*/}
            {/*  render={({field}) => (*/}
            {/*    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">*/}
            {/*      <div className="space-y-0.5">*/}
            {/*        <FormLabel className="text-base">{t('COMMON.STATUS_1')}</FormLabel>*/}
            {/*        <FormDescription>*/}
            {/*          {t('CONFIG.DRAWER.STATUS_DESCRIPTION')}*/}
            {/*        </FormDescription>*/}
            {/*      </div>*/}
            {/*      <FormControl>*/}
            {/*        <Switch*/}
            {/*          checked={field.value}*/}
            {/*          onCheckedChange={field.onChange}*/}
            {/*        />*/}
            {/*      </FormControl>*/}
            {/*    </FormItem>*/}
            {/*  )}*/}
            {/*/>*/}

            <div className="flex gap-3 pt-4 mt-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1"
              >
                {t('COMMON.CANCEL')}
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                    {t('COMMON.LOADING')}
                  </span>
                ) : (
                  t('COMMON.SAVE')
                )}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
