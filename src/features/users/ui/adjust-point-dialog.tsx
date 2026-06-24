import { useEffect, useMemo, useState } from 'react';
import {
  AccountBalance,
  AdjustPointPayload,
  Customer,
} from '@/features/users/api/userApi';
import {
  useUserAllActivePartners,
  useUserPartnerDetail,
} from '@/features/users/hooks/use-user-partner-queries';
import { useTranslations } from '@/shared/hooks/use-translations';
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
import { Textarea } from '@/shared/ui/atoms/textarea';
import { LoaderCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  useAdjustUserPoint,
  useUserBalanceDetail,
} from '../hooks/use-user-queries';

const adjustPointSchema = z.object({
  accountId: z
    .string()
    .min(1, 'USERS.ADJUST_POINT.VALIDATION_ACCOUNT_REQUIRED'),
  entryDirection: z.enum(['CREDIT', 'DEBIT']),
  note: z.string().min(1, 'USERS.ADJUST_POINT.VALIDATION_NOTE_REQUIRED'),
  idempotencyKey: z.string(),
  points: z
    .string()
    .min(1, 'USERS.ADJUST_POINT.VALIDATION_POINTS_REQUIRED')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'USERS.ADJUST_POINT.VALIDATION_POINTS_POSITIVE',
    }),
  partnerId: z
    .string()
    .min(1, 'USERS.ADJUST_POINT.VALIDATION_PARTNER_REQUIRED'),
  serviceId: z
    .string()
    .min(1, 'USERS.ADJUST_POINT.VALIDATION_SERVICE_REQUIRED'),
});

type AdjustPointFormValues = z.infer<typeof adjustPointSchema>;

interface AdjustPointDialogProps {
  customer: Customer | null;
  onClose: () => void;
}

export function AdjustPointDialog({
  customer,
  onClose,
}: AdjustPointDialogProps) {
  const { t, language } = useTranslations();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');

  const form = useForm<AdjustPointFormValues>({
    resolver: createTranslatedZodResolver(adjustPointSchema, t),
    defaultValues: {
      accountId: '',
      entryDirection: 'CREDIT',
      note: '',
      idempotencyKey: '',
      points: '',
      partnerId: '',
      serviceId: '',
    },
  });

  useFormLanguageSync(form, language);

  const partnerId = form.watch('partnerId');

  const adjustPointMutation = useAdjustUserPoint();
  const { data: balanceAccounts = [], isLoading: isLoadingBalanceAccounts } =
    useUserBalanceDetail(customer?.customerId);
  const { data: partners = [], isLoading: isLoadingPartners } =
    useUserAllActivePartners();
  const { data: selectedPartner, isLoading: isLoadingPartnerDetail } =
    useUserPartnerDetail(partnerId, { enabled: !!partnerId });

  const internalAccounts = useMemo(
    () =>
      balanceAccounts.filter(
        (item) => item.currencyDetail?.sourceType !== 'EXTERNAL',
      ),
    [balanceAccounts],
  );

  const partnersWithServices = useMemo(
    () => partners.filter((partner) => partner.services?.length > 0),
    [partners],
  );

  const activeServices = useMemo(
    () => selectedPartner?.services.filter((s) => s.status === 'ACTIVE') || [],
    [selectedPartner],
  );

  // Reset form when dialog opens for a new customer
  useEffect(() => {
    if (!customer) return;
    form.reset({
      accountId: '',
      entryDirection: 'CREDIT',
      note: '',
      idempotencyKey: crypto.randomUUID(),
      points: '',
      partnerId: '',
      serviceId: '',
    });
    setOtpCode('');
    setOtpError('');
    setConfirmOpen(false);
  }, [customer, form]);

  // Auto-select first internal account when accounts load
  useEffect(() => {
    if (!customer || !internalAccounts.length) return;
    const currentAccountId = form.getValues('accountId');
    const current = internalAccounts.find(
      (item) => String(item.accountId) === currentAccountId,
    );
    const target = current ?? internalAccounts[0];
    if (!currentAccountId || !current) {
      form.setValue('accountId', String(target.accountId));
    }
  }, [customer, internalAccounts, form]);

  // Reset serviceId when partner changes
  useEffect(() => {
    form.setValue('serviceId', '');
  }, [partnerId, form]);

  const handleSubmit = async () => {
    if (!customer) return;
    // Open OTP confirmation dialog
    setConfirmOpen(true);
  };

  const handleConfirmWithOtp = async () => {
    if (!customer) return;

    // Validate OTP
    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpError('OTP must be 6 digits');
      return;
    }

    setOtpError('');

    const data = form.getValues();

    const payload: AdjustPointPayload = {
      customerId: customer.customerId,
      accountId: data.accountId,
      entryDirection: data.entryDirection,
      note: data.note.trim(),
      idempotencyKey: data.idempotencyKey || crypto.randomUUID(),
      points: Number(data.points),
      partnerId: data.partnerId,
      serviceId: data.serviceId,
      otpCode: otpCode,
    };

    await adjustPointMutation.mutateAsync({
      customerId: customer.customerId,
      payload,
    });

    setConfirmOpen(false);
    setOtpCode('');
    onClose();
  };

  const isPending = adjustPointMutation.isPending;

  return (
    <Dialog
      open={!!customer}
      onOpenChange={(open) => {
        if (!open && !isPending) onClose();
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('USERS.ADJUST_POINT.TITLE')}</DialogTitle>
          <DialogDescription>
            {customer
              ? t('USERS.ADJUST_POINT.DESCRIPTION', {
                  name: customer.fullName,
                  id: customer.customerId,
                })
              : ''}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid grid-cols-1 gap-4 py-2"
          >
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('USERS.ADJUST_POINT.LABEL_ACCOUNT')} *
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoadingBalanceAccounts || isPending}
                  >
                    <FormControl>
                      <SelectTrigger clearable={false}>
                        <SelectValue
                          placeholder={t(
                            'USERS.ADJUST_POINT.PLACEHOLDER_ACCOUNT',
                          )}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {internalAccounts.map((item: AccountBalance) => (
                        <SelectItem
                          key={item.accountId}
                          value={String(item.accountId)}
                        >
                          {item.currencyDetail?.name ||
                            item.currencyDetail?.code ||
                            item.currencyId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="partnerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('USERS.ADJUST_POINT.LABEL_PARTNER')} *
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoadingPartners || isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'USERS.ADJUST_POINT.PLACEHOLDER_PARTNER',
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {partnersWithServices.map((partner) => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.name}
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
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('USERS.ADJUST_POINT.LABEL_SERVICE')} *
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={
                        !partnerId || isLoadingPartnerDetail || isPending
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'USERS.ADJUST_POINT.PLACEHOLDER_SERVICE',
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeServices.map((service) => (
                          <SelectItem
                            key={service.code}
                            value={service.id ?? ''}
                          >
                            {service.name || service.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="entryDirection"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('USERS.ADJUST_POINT.LABEL_ENTRY_DIRECTION')} *
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger clearable={false}>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CREDIT">ADD</SelectItem>
                        <SelectItem value="DEBIT">SUBTRACT</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('COMMON.POINTS')} *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('USERS.ADJUST_POINT.LABEL_NOTE')} *</FormLabel>
                  <FormControl>
                    <Textarea {...field} disabled={isPending} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/*<FormField*/}
            {/*  control={form.control}*/}
            {/*  name="idempotencyKey"*/}
            {/*  render={({ field }) => (*/}
            {/*    <FormItem>*/}
            {/*      <FormLabel>{t('USERS.ADJUST_POINT.LABEL_IDEMPOTENCY_KEY')}</FormLabel>*/}
            {/*      <FormControl>*/}
            {/*        <Input {...field} readOnly />*/}
            {/*      </FormControl>*/}
            {/*    </FormItem>*/}
            {/*  )}*/}
            {/*/>*/}
          </form>
        </Form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {t('COMMON.CANCEL')}
          </Button>
          <Button
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isPending}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                {t('USERS.ADJUST_POINT.SUBMITTING')}
              </span>
            ) : (
              t('USERS.ADJUST_POINT.CONFIRM')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* OTP Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open && !isPending) {
            setOtpCode('');
            setOtpError('');
          }
          setConfirmOpen(open);
        }}
      >
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {t('USERS.ADJUST_POINT.OTP_TITLE')}
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
                disabled={isPending}
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
                setConfirmOpen(false);
                setOtpCode('');
                setOtpError('');
              }}
              disabled={isPending}
            >
              {t('COMMON.CANCEL')}
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmWithOtp}
              disabled={isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  {t('COMMON.PROCESSING')}
                </span>
              ) : (
                t('COMMON.YES')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
