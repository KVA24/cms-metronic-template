import {useEffect, useState} from 'react';
import {
  useTierDowngradeRuleConfig,
  useUpdateTierDowngradeRuleConfig,
} from '@/features/tier-downgrade-rules/hooks/use-tier-downgrade-rule-queries';
import {useBreadcrumb} from '@/shared/contexts/breadcrumb-context';
import {useTranslations} from '@/shared/hooks/use-translations';
import {formatDate} from '@/shared/lib/date-utils.ts';
import {UserRole} from '@/shared/lib/rbac';
import {createTranslatedZodResolver, useFormLanguageSync,} from '@/shared/lib/validation-utils';
import {Alert, AlertDescription, AlertIcon, AlertTitle,} from '@/shared/ui/atoms/alert';
import {Button} from '@/shared/ui/atoms/button';
import {Card, CardContent, CardHeader, CardTitle,} from '@/shared/ui/atoms/card';
import {DatePicker} from '@/shared/ui/atoms/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/atoms/dialog';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from '@/shared/ui/atoms/form';
import {Input} from '@/shared/ui/atoms/input';
import {Label} from '@/shared/ui/atoms/label';
import {RadioGroup, RadioGroupItem} from '@/shared/ui/atoms/radio-group';
import {Switch} from '@/shared/ui/atoms/switch';
import {Toolbar} from '@/shared/ui/molecules/common/toolbar';
import {Container} from '@/shared/ui/molecules/container';
import {PermissionGuard} from '@/shared/ui/molecules/permission-guard.tsx';
import {ToolbarActions, ToolbarHeading,} from '@/widgets/layouts/demo1/components/toolbar';
import {AlertCircle, LoaderCircleIcon} from 'lucide-react';
import {useForm} from 'react-hook-form';
import {toast} from 'sonner';
import * as z from 'zod';

const tierDowngradeRuleSchema = z
  .object({
    activeStartAt: z.date({required_error: 'VALIDATION.START_DATE_INVALID'}),
    activeEndAt: z.date().nullable().optional(),
    noEndDate: z.boolean().default(false),
    enableUpgrade: z.boolean().default(false),
    enableDowngrade: z.boolean().default(false),
    windowTimeMonths: z
      .number({required_error: 'VALIDATION.WINDOW_TIME_REQUIRED'})
      .int()
      .min(1, 'VALIDATION.WINDOW_TIME_RANGE')
      .max(36, 'VALIDATION.WINDOW_TIME_RANGE')
      .default(6),
    reviewMonths: z
      .array(z.number())
      .min(1, 'VALIDATION.REVIEW_MONTHS_REQUIRED')
      .default([]),
    reviewDay: z.enum(['FIRST_DAY', 'LAST_DAY']).default('LAST_DAY'),
    tierExpirationMode: z.enum(['IMMEDIATELY', 'CUSTOM']).default('CUSTOM'),
    gracePeriodMonths: z
      .number()
      .int()
      .min(0, 'VALIDATION.GRACE_PERIOD_NON_NEGATIVE')
      .max(12, 'VALIDATION.GRACE_PERIOD_MAX')
      .default(3),
    roundUpExpirationMode: z
      .enum(['IMMEDIATELY', 'EACH_MONTH'])
      .default('IMMEDIATELY'),
    preReviewNotificationDays: z
      .number()
      .int()
      .min(0, 'VALIDATION.PRE_REVIEW_DAYS_NON_NEGATIVE')
      .max(30, 'VALIDATION.PRE_REVIEW_DAYS_NON_NEGATIVE')
      .default(3),
  })
  .superRefine((data, ctx) => {
    if (!data.noEndDate) {
      if (!data.activeEndAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'VALIDATION.END_DATE_REQUIRED',
          path: ['activeEndAt'],
        });
      } else if (data.activeStartAt && data.activeEndAt < data.activeStartAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'VALIDATION.END_DATE_GTE_START',
          path: ['activeEndAt'],
        });
      }
    }
    if (
      data.tierExpirationMode === 'CUSTOM' &&
      data.gracePeriodMonths === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'VALIDATION.GRACE_PERIOD_REQUIRED',
        path: ['gracePeriodMonths'],
      });
    }
  });

type TierDowngradeRuleFormValues = z.infer<typeof tierDowngradeRuleSchema>;

const MONTHS = [
  {label: 'JAN', value: 1},
  {label: 'FEB', value: 2},
  {label: 'MAR', value: 3},
  {label: 'APR', value: 4},
  {label: 'MAY', value: 5},
  {label: 'JUN', value: 6},
  {label: 'JUL', value: 7},
  {label: 'AUG', value: 8},
  {label: 'SEP', value: 9},
  {label: 'OCT', value: 10},
  {label: 'NOV', value: 11},
  {label: 'DEC', value: 12},
];

export function TierDowngradeRulePage() {
  const {t, language} = useTranslations();
  const {setCustomBreadcrumb} = useBreadcrumb();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  
  const {data: config, isLoading} = useTierDowngradeRuleConfig();
  const updateMutation = useUpdateTierDowngradeRuleConfig();
  
  const error = updateMutation.error?.message || null;
  
  const form = useForm<TierDowngradeRuleFormValues>({
    resolver: createTranslatedZodResolver(tierDowngradeRuleSchema, t),
    defaultValues: {
      activeStartAt: new Date(),
      activeEndAt: undefined,
      noEndDate: false,
      enableUpgrade: false,
      enableDowngrade: false,
      windowTimeMonths: 6,
      reviewMonths: [],
      reviewDay: 'LAST_DAY',
      tierExpirationMode: 'CUSTOM',
      gracePeriodMonths: 3,
      roundUpExpirationMode: 'IMMEDIATELY',
      preReviewNotificationDays: 3,
    },
  });
  
  // Sync form validation when language changes
  useFormLanguageSync(form, language);
  
  useEffect(() => {
    if (config) {
      form.reset({
        activeStartAt: config.activeStartAt
          ? new Date(config.activeStartAt)
          : undefined,
        activeEndAt: config.activeEndAt
          ? new Date(config.activeEndAt)
          : undefined,
        noEndDate: config.noEndDate || false,
        enableUpgrade: config.enableUpgrade || false,
        enableDowngrade: config.enableDowngrade || false,
        windowTimeMonths: config.windowTimeMonths || 6,
        reviewMonths: config.reviewMonths || [],
        reviewDay: config.reviewDay || 'LAST_DAY',
        tierExpirationMode: config.tierExpirationMode || 'CUSTOM',
        gracePeriodMonths: config.gracePeriodMonths ?? 3,
        roundUpExpirationMode: config.roundUpExpirationMode || 'IMMEDIATELY',
        preReviewNotificationDays: config.preReviewNotificationDays ?? 3,
      });
    }
  }, [config, form]);
  
  useEffect(() => {
    setCustomBreadcrumb([
      {
        title: t('SIDEBAR.MEMBERSHIP_TIERS'),
        path: '/tiers',
      },
      {
        title: t('TIER_DOWNGRADE_RULES.PAGE_TITLE'),
      },
    ]);
    
    return () => {
      setCustomBreadcrumb(null);
    };
  }, [setCustomBreadcrumb, t]);
  
  const handleEdit = () => {
    setIsEditMode(true);
  };
  
  const handleCancel = () => {
    setIsEditMode(false);
    if (config) {
      form.reset({
        activeStartAt: config.activeStartAt
          ? new Date(config.activeStartAt)
          : undefined,
        activeEndAt: config.activeEndAt
          ? new Date(config.activeEndAt)
          : undefined,
        noEndDate: config.noEndDate || false,
        enableUpgrade: config.enableUpgrade || false,
        enableDowngrade: config.enableDowngrade || false,
        windowTimeMonths: config.windowTimeMonths || 6,
        reviewMonths: config.reviewMonths || [],
        reviewDay: config.reviewDay || 'LAST_DAY',
        tierExpirationMode: config.tierExpirationMode || 'CUSTOM',
        gracePeriodMonths: config.gracePeriodMonths ?? 3,
        roundUpExpirationMode: config.roundUpExpirationMode || 'IMMEDIATELY',
        preReviewNotificationDays: config.preReviewNotificationDays ?? 3,
      });
    }
  };
  
  const handleSubmit = async () => {
    setConfirm(true);
  };
  
  const handleConfirm = async () => {
    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpError(t('COMMON.OTP_MUST_BE_6_DIGITS'));
      return;
    }
    
    setOtpError('');
    
    const data = form.getValues();
    
    const payload = {
      activeStartAt: data.activeStartAt
        ? formatDate(data.activeStartAt, 'yyyy-MM-dd HH:mm:ss')
        : undefined,
      activeEndAt: data.noEndDate
        ? undefined
        : data.activeEndAt
          ? formatDate(data.activeEndAt, 'yyyy-MM-dd HH:mm:ss')
          : undefined,
      noEndDate: data.noEndDate,
      enableUpgrade: data.enableUpgrade,
      enableDowngrade: data.enableDowngrade,
      windowTimeMonths: data.windowTimeMonths,
      reviewMonths: data.reviewMonths,
      reviewDay: data.reviewDay,
      tierExpirationMode: data.tierExpirationMode,
      gracePeriodMonths: data.gracePeriodMonths,
      roundUpExpirationMode: data.roundUpExpirationMode,
      preReviewNotificationDays: data.preReviewNotificationDays,
    };
    
    try {
      await updateMutation.mutateAsync({data: payload, otpCode});
      toast.success(t('TIER_DOWNGRADE_RULES.UPDATE_SUCCESS'));
      setOtpCode('');
      setOtpError('');
      setConfirm(false);
      setIsEditMode(false);
    } catch {
      toast.error(t('TIER_DOWNGRADE_RULES.UPDATE_ERROR'));
    }
  };
  
  if (isLoading) {
    return (
      <Container>
        <div className="flex items-center justify-center h-64">
          <LoaderCircleIcon className="h-8 w-8 animate-spin"/>
        </div>
      </Container>
    );
  }
  
  return (
    <Container>
      <Toolbar>
        <ToolbarHeading></ToolbarHeading>
        <ToolbarActions>
          <PermissionGuard requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}>
            {!isEditMode && (
              <Button
                type="button"
                onClick={handleEdit}
                disabled={updateMutation.isPending}
                size="sm"
              >
                {t('COMMON.EDIT')}
              </Button>
            )}
          </PermissionGuard>
        </ToolbarActions>
      </Toolbar>
      
      <div className="mx-auto">
        {error && (
          <Alert variant="destructive" appearance="light" className="mb-6">
            <AlertIcon>
              <AlertCircle/>
            </AlertIcon>
            <AlertTitle>{t('COMMON.ERROR')}</AlertTitle>
            <AlertDescription className="break-all">{error}</AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Active Period for Review Cycles */}
            <Card className="border-2 border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  {t('TIER_DOWNGRADE_RULES.ACTIVE_PERIOD')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="activeStartAt"
                    render={({field, fieldState}) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-xs font-medium">
                          {t('TIER_DOWNGRADE_RULES.START_DATE')}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value}
                            onChange={(date) => {
                              field.onChange(date === undefined ? null : date);
                            }}
                            placeholder="dd/mm/yyyy hh:mm:ss"
                            disabled={!isEditMode}
                            showTime={true}
                            dateFormat="dd/MM/yyyy"
                            error={!!fieldState.error}
                          />
                        </FormControl>
                        <FormMessage className="text-xs"/>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-4">
                    <div className='min-w-[80px]'>
                    <FormField
                        control={form.control}
                        name="noEndDate"
                        render={({field}) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium cursor-pointer mb-0">
                              {t('TIER_DOWNGRADE_RULES.NO_END_DATE')}
                            </FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={!isEditMode}
                              />
                            
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    {!form.watch('noEndDate') &&
                      <div className={'w-full'}>
                        <FormField
                          control={form.control}
                          name="activeEndAt"
                          render={({field, fieldState}) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="text-xs font-medium">
                                {t('TIER_DOWNGRADE_RULES.END_DATE')}
                              </FormLabel>
                              <FormControl>
                                <DatePicker
                                  value={field.value || undefined}
                                  onChange={(date) => {
                                    field.onChange(date === undefined ? null : date);
                                  }}
                                  placeholder="dd/mm/yyyy hh:mm:ss"
                                  disabled={!isEditMode || form.watch('noEndDate')}
                                  showTime={true}
                                  dateFormat="dd/MM/yyyy"
                                  error={!!fieldState.error}
                                />
                              </FormControl>
                              <FormMessage className="text-xs"/>
                            </FormItem>
                          )}
                        />
                      </div>
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Tier Settings */}
            <Card className="border-2 border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  {t('TIER_DOWNGRADE_RULES.TIER_SETTINGS')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="enableUpgrade"
                    render={({field}) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="flex-1">
                          <FormLabel className="text-xs font-medium cursor-pointer">
                            {t('TIER_DOWNGRADE_RULES.ENABLE_UPGRADE')}
                          </FormLabel>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('TIER_DOWNGRADE_RULES.ENABLE_UPGRADE_DESCRIPTION')}
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              // Tắt enableDowngrade khi enableUpgrade tắt
                              if (!checked) {
                                form.setValue('enableDowngrade', false);
                              }
                            }}
                            disabled={!isEditMode}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="enableDowngrade"
                    render={({field}) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <FormLabel className="text-xs font-medium cursor-pointer mb-0">
                          {t('TIER_DOWNGRADE_RULES.ENABLE_DOWNGRADE')}
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!isEditMode || !form.watch('enableUpgrade')}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Tier Evaluation Period - chỉ hiển thị khi enableDowngrade bật */}
                {form.watch('enableUpgrade') && (
                  <div className='px-4 flex flex-col gap-4'>
                    <div className="flex flex-col gap-4">
                      <Label className="text-xs font-semibold block">
                        {t('TIER_DOWNGRADE_RULES.TIER_EVALUATION_PERIOD')}
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="windowTimeMonths"
                          render={({field}) => (
                            <FormItem>
                              <div className="flex items-center gap-2">
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(parseInt(e.target.value))
                                    }
                                    disabled={!isEditMode}
                                    readOnly={!isEditMode}
                                    className="text-xs h-8"
                                  />
                                </FormControl>
                                <Label className="text-xs text-muted-foreground">
                                  {t('TIER_DOWNGRADE_RULES.MONTH')}
                                </Label>
                              </div>
                              <FormMessage className="text-xs"/>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className='flex flex-col gap-2'>
                        <Label className="text-xs font-medium mb-2 block">
                          {t('TIER_DOWNGRADE_RULES.TIER_EVALUATION_SCHEDULE')}
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {MONTHS.map((month) => (
                            <FormField
                              key={month.value}
                              control={form.control}
                              name="reviewMonths"
                              render={({field}) => {
                                const isSelected = field.value?.includes(
                                  month.value,
                                );
                                return (
                                  <FormItem>
                                    <FormControl>
                                      <Button
                                        type="button"
                                        variant={isSelected ? 'primary' : 'outline'}
                                        size="sm"
                                        className="text-xs h-8 px-3"
                                        disabled={!isEditMode}
                                        onClick={() => {
                                          const current = field.value || [];
                                          if (isSelected) {
                                            field.onChange(
                                              current.filter(
                                                (m) => m !== month.value,
                                              ),
                                            );
                                          } else {
                                            field.onChange([
                                              ...current,
                                              month.value,
                                            ]);
                                          }
                                        }}
                                      >
                                        {month.label}
                                      </Button>
                                    </FormControl>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormField
                          control={form.control}
                          name="reviewMonths"
                          render={() => (
                            <FormItem>
                              <FormMessage className="text-xs"/>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex flex-col gap-4 px-4">
                        <Label className="text-xs font-medium">
                          {t('TIER_DOWNGRADE_RULES.REVIEW_DAY')}
                        </Label>
                        <FormField
                          control={form.control}
                          name="reviewDay"
                          render={({field}) => (
                            <FormItem>
                              <FormControl>
                                <RadioGroup
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  disabled={!isEditMode}
                                  className="flex gap-6"
                                  size="sm"
                                >
                                  <div className="flex items-center gap-2">
                                    <RadioGroupItem
                                      value="FIRST_DAY"
                                      id="reviewDay-first"
                                    />
                                    <Label
                                      htmlFor="reviewDay-first"
                                      className="mb-0 text-xs cursor-pointer"
                                    >
                                      {t('TIER_DOWNGRADE_RULES.FIRST_DAY')}
                                    </Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <RadioGroupItem
                                      value="LAST_DAY"
                                      id="reviewDay-last"
                                    />
                                    <Label
                                      htmlFor="reviewDay-last"
                                      className="mb-0 text-xs cursor-pointer"
                                    >
                                      {t('TIER_DOWNGRADE_RULES.LAST_DAY')}
                                    </Label>
                                  </div>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage className="text-xs"/>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    {/* Tier Expiration */}
                    <div className="flex flex-col gap-4">
                      <Label className="text-xs font-semibold block">
                        {t('TIER_DOWNGRADE_RULES.TIER_EXPIRATION')}
                      </Label>
                      <FormField
                        control={form.control}
                        name="tierExpirationMode"
                        render={({field}) => (
                          <FormItem>
                            <FormControl>
                              <RadioGroup
                                value={field.value}
                                onValueChange={(val) => {
                                  field.onChange(val);
                                }}
                                disabled={!isEditMode}
                                className="flex flex-col gap-2"
                                size="sm"
                              >
                                <div className="flex items-center gap-2">
                                  <RadioGroupItem
                                    value="IMMEDIATELY"
                                    id="expiration-immediate"
                                  />
                                  <Label
                                    htmlFor="expiration-immediate"
                                    className="mb-0 text-xs cursor-pointer"
                                  >
                                    {t('TIER_DOWNGRADE_RULES.IMMEDIATELY')}
                                  </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <RadioGroupItem
                                    value="CUSTOM"
                                    id="expiration-custom"
                                    disabled={true}
                                  />
                                  <Label
                                    htmlFor="expiration-custom"
                                    className="mb-0 text-xs cursor-pointer"
                                  >
                                    {t('TIER_DOWNGRADE_RULES.CUSTOM')}
                                  </Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage className="text-xs"/>
                          </FormItem>
                        )}
                      />
                      
                      {form.watch('tierExpirationMode') === 'CUSTOM' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 pt-2 border-l-2 border-gray-200">
                          <FormField
                            control={form.control}
                            name="gracePeriodMonths"
                            render={({field}) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium">
                                  {t('TIER_DOWNGRADE_RULES.GRACE_PERIOD_DURATION')}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(parseInt(e.target.value))
                                    }
                                    disabled={!isEditMode}
                                    readOnly={!isEditMode}
                                    className="text-xs h-8"
                                  />
                                </FormControl>
                                <FormMessage className="text-xs"/>
                              </FormItem>
                            )}
                          />
                          <div className="flex items-end pb-1">
                            <Label className="text-xs text-muted-foreground">
                              {t('TIER_DOWNGRADE_RULES.MONTH')}
                            </Label>
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="roundUpExpirationMode"
                            render={({field}) => (
                              <FormItem className="col-span-2">
                                <FormLabel className="text-xs font-medium">
                                  {t('TIER_DOWNGRADE_RULES.ROUND_UP_EXPIRATION')}
                                </FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={!isEditMode}
                                    className="flex gap-6"
                                    size="sm"
                                  >
                                    <div className="flex items-center gap-2">
                                      <RadioGroupItem
                                        value="IMMEDIATELY"
                                        id="roundUp-immediately"
                                      />
                                      <Label
                                        htmlFor="roundUp-immediately"
                                        className="mb-0 text-xs cursor-pointer"
                                      >
                                        {t(
                                          'TIER_DOWNGRADE_RULES.ROUND_UP_IMMEDIATELY',
                                        )}
                                      </Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <RadioGroupItem
                                        value="EACH_MONTH"
                                        id="roundUp-each-month"
                                      />
                                      <Label
                                        htmlFor="roundUp-each-month"
                                        className="mb-0 text-xs cursor-pointer"
                                      >
                                        {t(
                                          'TIER_DOWNGRADE_RULES.ROUND_UP_EACH_MONTH',
                                        )}
                                      </Label>
                                    </div>
                                  </RadioGroup>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Pre-Review Notification */}
                    {/*<div className="space-y-4">*/}
                    {/*  <Label className="text-xs font-semibold block">*/}
                    {/*    {t('TIER_DOWNGRADE_RULES.SEND_PRE_REVIEW_NOTIFICATION')}*/}
                    {/*  </Label>*/}
                    {/*  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">*/}
                    {/*    <FormField*/}
                    {/*      control={form.control}*/}
                    {/*      name="preReviewNotificationDays"*/}
                    {/*      render={({field}) => (*/}
                    {/*        <FormItem>*/}
                    {/*          <FormLabel className="text-xs font-medium">*/}
                    {/*            {t('TIER_DOWNGRADE_RULES.DAY_BEFORE')}*/}
                    {/*          </FormLabel>*/}
                    {/*          <FormControl>*/}
                    {/*            <Input*/}
                    {/*              type="number"*/}
                    {/*              min="0"*/}
                    {/*              {...field}*/}
                    {/*              onChange={(e) =>*/}
                    {/*                field.onChange(parseInt(e.target.value))*/}
                    {/*              }*/}
                    {/*              disabled={!isEditMode}*/}
                    {/*              readOnly={!isEditMode}*/}
                    {/*              className="text-xs h-8"*/}
                    {/*            />*/}
                    {/*          </FormControl>*/}
                    {/*          <FormMessage className="text-xs"/>*/}
                    {/*        </FormItem>*/}
                    {/*      )}*/}
                    {/*    />*/}
                    {/*    <div className="flex items-end pb-1">*/}
                    {/*      <Label className="text-xs text-muted-foreground">*/}
                    {/*        {t('TIER_DOWNGRADE_RULES.DAYS')}*/}
                    {/*      </Label>*/}
                    {/*    </div>*/}
                    {/*  </div>*/}
                    {/*</div>*/}
                  </div>
                )}
              </CardContent>
            </Card>
          </form>
          <div className="flex items-center justify-end gap-2 mt-4">
            {isEditMode && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                  size="sm"
                >
                  {t('COMMON.CANCEL')}
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  size="sm"
                  onClick={form.handleSubmit(handleSubmit)}
                >
                  {updateMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <LoaderCircleIcon className="h-4 w-4 animate-spin"/>
                      {t('COMMON.PROCESSING')}
                    </span>
                  ) : (
                    t('COMMON.SAVE')
                  )}
                </Button>
              </>
            )}
          </div>
        </Form>
      </div>
      
      <Dialog
        open={confirm}
        onOpenChange={(open) => {
          if (!open && !updateMutation.isPending) {
            setOtpCode('');
            setOtpError('');
            setConfirm(false);
          }
        }}
      >
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {t('TIER_DOWNGRADE_RULES.OTP_CONFIRMATION')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('TIER_DOWNGRADE_RULES.CONFIRM_DESCRIPTION')}
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
                disabled={updateMutation.isPending}
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
              disabled={updateMutation.isPending}
            >
              {t('COMMON.CANCEL')}
            </Button>
            <PermissionGuard
              requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}
            >
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <LoaderCircleIcon className="h-4 w-4 animate-spin"/>
                    {t('COMMON.PROCESSING')}
                  </span>
                ) : (
                  t('COMMON.CONFIRM')
                )}
              </Button>
            </PermissionGuard>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
