import { useEffect, useMemo, useRef, useState } from 'react';
import { RedemptionPackage } from '@/features/redemption-package/api/redemptionPackageApi';
import { useUserAllActivePartners, useUserPartnerDetail } from '@/features/users/hooks/use-user-partner-queries';
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
import { Textarea } from '@/shared/ui/atoms/textarea';
import { PermissionGuard } from '@/shared/ui/molecules/permission-guard';
import { Edit, LoaderCircleIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {Switch} from "@/shared/ui/atoms/switch.tsx";

const redemptionPackageSchema = z.object({
  code: z
    .string()
    .min(1, 'VALIDATION.CODE_REQUIRED')
    .max(50, 'VALIDATION.CODE_TOO_LONG'),
  name: z
    .string()
    .min(1, 'VALIDATION.NAME_REQUIRED')
    .max(100, 'VALIDATION.NAME_TOO_LONG'),
  externalId: z.string().optional(),
  description: z.string().optional(),
  rewardType: z.string().trim().min(1, 'VALIDATION.REWARD_TYPE_REQUIRED'),
  partnerId: z.string().min(1, 'VALIDATION.PARTNER_ID_REQUIRED'),
  serviceCode: z.string().min(1, 'VALIDATION.SERVICE_CODE_REQUIRED'),
  pointCost: z.number().min(0, 'VALIDATION.POINT_COST_MIN'),
  icon: z.string().optional(),
  sortOrder: z.number().min(0, 'VALIDATION.SORT_ORDER_MIN'),
  status: z.string().min(1, 'VALIDATION.STATUS_REQUIRED'),
  otpCode: z.string().optional(),
});

type RedemptionPackageFormValues = z.infer<typeof redemptionPackageSchema>;

interface RedemptionPackageDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RedemptionPackageFormValues) => Promise<void>;
  redemptionPackage?: RedemptionPackage | null;
  isLoading?: boolean;
  mode?: 'view' | 'edit' | 'create';
  onEdit?: () => void;
}

export function RedemptionPackageDrawer({
  open,
  onClose,
  onSubmit,
  redemptionPackage,
  isLoading = false,
  mode = 'create',
  onEdit,
}: RedemptionPackageDrawerProps) {
  const { t, language } = useTranslations();
  const isView = mode === 'view';
  const isEdit = mode === 'edit';

  const [confirm, setConfirm] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');

  const form = useForm<RedemptionPackageFormValues>({
    resolver: createTranslatedZodResolver(redemptionPackageSchema, t),
    defaultValues: {
      code: '',
      name: '',
      externalId: '',
      description: '',
      rewardType: '',
      partnerId: '',
      serviceCode: '',
      pointCost: 0,
      icon: '',
      sortOrder: 0,
      status: 'ACTIVE',
      otpCode: '',
    },
  });

  useFormLanguageSync(form, language);

  const partnerId = form.watch('partnerId');

  // Fetch partners
  const { data: partners = [], isLoading: isLoadingPartners } =
    useUserAllActivePartners();

  // Fetch selected partner detail to get services
  const { data: selectedPartner, isLoading: isLoadingPartnerDetail } =
    useUserPartnerDetail(partnerId, { enabled: !!partnerId });

  // Get active services for selected partner
  const activeServices = useMemo(
    () => selectedPartner?.services.filter((s) => s.status === 'ACTIVE') || [],
    [selectedPartner],
  );

  // Filter partners that have services
  const partnersWithServices = useMemo(
    () => partners.filter((partner) => partner.services?.length > 0),
    [partners],
  );

  // Track previous partnerId to detect user-driven partner changes
  const prevPartnerIdRef = useRef<string>('');

  // Auto-select VTV partner when partners load (only if partnerId is not already set)
  useEffect(() => {
    if (!partners.length || !open) return;
    const currentPartnerId = form.getValues('partnerId');
    if (currentPartnerId) return; // already set, don't override
    const vtvPartner = partners.find((p) => p.code.includes('VTV'));
    if (vtvPartner) {
      prevPartnerIdRef.current = vtvPartner.id;
      form.setValue('partnerId', vtvPartner.id);
    }
  }, [partners, open, form]);

  // Reset form when redemptionPackage changes or drawer opens
  useEffect(() => {
    if (!open) return;

    const vtvPartner = partners.find((p) => p.code.includes('VTV'));
    const defaultPartnerId = vtvPartner?.id ?? '';

    if (redemptionPackage) {
      prevPartnerIdRef.current = defaultPartnerId;
      form.reset({
        code: redemptionPackage.code,
        name: redemptionPackage.name,
        externalId: redemptionPackage.externalId || '',
        description: '',
        rewardType: redemptionPackage.rewardType,
        partnerId: defaultPartnerId,
        serviceCode: redemptionPackage.serviceCode,
        pointCost: redemptionPackage.pointCost,
        icon: redemptionPackage.icon,
        sortOrder: redemptionPackage.sortOrder,
        status: redemptionPackage.status,
        otpCode: '',
      });
    } else {
      prevPartnerIdRef.current = defaultPartnerId;
      form.reset({
        code: '',
        name: '',
        externalId: '',
        description: '',
        rewardType: '',
        partnerId: defaultPartnerId,
        serviceCode: '',
        pointCost: 0,
        icon: '',
        sortOrder: 0,
        status: 'ACTIVE',
        otpCode: '',
      });
    }
  }, [redemptionPackage, open, form, partners]);

  // Reset serviceCode only when user explicitly changes partner (not on form.reset)
  useEffect(() => {
    if (partnerId !== prevPartnerIdRef.current) {
      prevPartnerIdRef.current = partnerId;
      form.setValue('serviceCode', '');
    }
  }, [partnerId, form]);

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
      console.error('Failed to submit redemption package:', error);
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
      <SheetContent className="sm:max-w-[640px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isView
              ? t('REDEMPTION_PACKAGE.DRAWER.VIEW_TITLE')
              : isEdit
                ? t('REDEMPTION_PACKAGE.DRAWER.EDIT_TITLE')
                : t('REDEMPTION_PACKAGE.DRAWER.ADD_TITLE')}
          </SheetTitle>
          <SheetDescription>
            {isView
              ? t('REDEMPTION_PACKAGE.DRAWER.VIEW_DESCRIPTION')
              : isEdit
                ? t('REDEMPTION_PACKAGE.DRAWER.EDIT_DESCRIPTION')
                : t('REDEMPTION_PACKAGE.DRAWER.ADD_DESCRIPTION')}
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
                      maxLength={100}
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
                      maxLength={50}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('REDEMPTION_PACKAGE.DRAWER.CODE_DESCRIPTION')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="externalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('REDEMPTION_PACKAGE.DRAWER.EXTERNAL_ID')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('REDEMPTION_PACKAGE.DRAWER.EXTERNAL_ID_PLACEHOLDER')}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('REDEMPTION_PACKAGE.DRAWER.DESCRIPTION')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('REDEMPTION_PACKAGE.DRAWER.DESCRIPTION_PLACEHOLDER')}
                      {...field}
                      disabled={isView}
                      readOnly={isView}
                      rows={1}
                      maxLength={255}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rewardType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('REDEMPTION_PACKAGE.DRAWER.REWARD_TYPE')} *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('REDEMPTION_PACKAGE.DRAWER.REWARD_TYPE_PLACEHOLDER')}
                      {...field}
                      disabled={isView}
                      readOnly={isView}
                      maxLength={30}
                      onChange={(e) => {
                        field.onChange(e.currentTarget.value.trim())
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="partnerId"
                render={({ field }) => (
                  <FormItem className='hidden'>
                    <FormLabel>{t('REDEMPTION_PACKAGE.DRAWER.PARTNER')} *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isView || isLoadingPartners}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('REDEMPTION_PACKAGE.DRAWER.PARTNER_PLACEHOLDER')}
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
                name="serviceCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('REDEMPTION_PACKAGE.DRAWER.SERVICE_CODE')} *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isView || !partnerId || isLoadingPartnerDetail}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              !partnerId
                                ? t('REDEMPTION_PACKAGE.DRAWER.SELECT_PARTNER_FIRST')
                                : t('REDEMPTION_PACKAGE.DRAWER.SERVICE_CODE_PLACEHOLDER')
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeServices.map((service) => (
                          <SelectItem key={service.code} value={service.code}>
                            {service.name || service.code}
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
                name="pointCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('REDEMPTION_PACKAGE.DRAWER.POINT_COST')} *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={isView}
                        readOnly={isView}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('REDEMPTION_PACKAGE.DRAWER.SORT_ORDER')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
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
                name="status"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>{t('COMMON.STATUS_1')}</FormLabel>
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
            </div>

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('REDEMPTION_PACKAGE.DRAWER.ICON')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('REDEMPTION_PACKAGE.DRAWER.ICON_PLACEHOLDER')}
                      {...field}
                      disabled={isView}
                      readOnly={isView}
                    />
                  </FormControl>
                  <FormMessage />
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
                  <PermissionGuard requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}>
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
                ? t('REDEMPTION_PACKAGE.DRAWER.UPDATE_TITLE')
                : t('REDEMPTION_PACKAGE.DRAWER.CREATE_TITLE')}
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
