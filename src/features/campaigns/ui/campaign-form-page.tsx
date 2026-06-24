import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  CampaignCreateDto,
  CampaignUpdateDto,
  ValidationRule,
} from '@/features/campaigns/api/campaignApi';
import {
  useCampaignDetail,
  useCreateCampaign,
  useUpdateCampaign,
} from '@/features/campaigns/hooks/use-campaign-queries';
import { CampaignDashboardTab } from '@/features/campaigns/ui/campaign-dashboard-tab';
import { CampaignHistoryTab } from '@/features/campaigns/ui/campaign-history-tab';
import { ValidationRuleSelector } from '@/features/campaigns/ui/validation-rule-selector';
import {
  useSharedCategories,
  useSharedEvents,
} from '@/features/shared';
import {
  useUserAllActivePartners,
  useUserPartnerDetail,
} from '@/features/users/hooks/use-user-partner-queries';
import { useBreadcrumb } from '@/shared/contexts/breadcrumb-context';
import { useTranslations } from '@/shared/hooks/use-translations';
import { UserRole } from '@/shared/lib/rbac/roles';
import { storage } from '@/shared/lib/storage';
import { useUrlParams } from '@/shared/lib/url-params';
import { cn } from '@/shared/lib/utils';
import {
  createTranslatedZodResolver,
  useFormLanguageSync,
} from '@/shared/lib/validation-utils';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from '@/shared/ui/atoms/alert';
import { Button } from '@/shared/ui/atoms/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/atoms/card';
import { DatePicker } from '@/shared/ui/atoms/date-picker';
import { DateInput, TimeField } from '@/shared/ui/atoms/datefield';
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
import { Input, InputAddon, InputGroup } from '@/shared/ui/atoms/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/atoms/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/ui/atoms/tabs';
import { Textarea } from '@/shared/ui/atoms/textarea';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
} from '@/shared/ui/molecules/common/toolbar';
import { Container } from '@/shared/ui/molecules/container';
import { PermissionGuard } from '@/shared/ui/molecules/permission-guard';
import { format } from 'date-fns';
import { AlertCircle, ArrowLeft, Clock3, LoaderCircleIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import * as z from 'zod';

const timeLimitationSchema = z.object({
  startTime: z.any(),
  endTime: z.any(),
  dayOfWeeks: z.array(
    z.enum([
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
      'SUNDAY',
    ]),
  ),
});

const validationRuleSchema = z.object({
  validationRuleId: z.string().min(1, 'VALIDATION.VALIDATION_RULE_ID_REQUIRED'),
  operator: z.enum(['AND', 'OR'], {
    errorMap: () => ({ message: 'VALIDATION.OPERATOR_INVALID' }),
  }),
  ruleForm: z.string().min(1, 'VALIDATION.RULE_FORM_REQUIRED'),
  ruleName: z.string().optional(),
});

const ruleSchema = z
  .object({
    name: z.string().min(1, 'VALIDATION.RULE_NAME_REQUIRED'),
    eventId: z.string().min(1, 'VALIDATION.EVENT_ID_REQUIRED'),
    pointEarnMethod: z.enum(['FIX_AMOUNT', 'FORMULAR'], {
      errorMap: () => ({
        message: 'VALIDATION.POINT_EARN_METHOD_INVALID',
      }),
    }),
    fixAmount: z.number().min(0, 'VALIDATION.VALUE_NON_NEGATIVE'),
    formular: z.string().optional(),
    budgetOrigin: z.number().min(0, 'VALIDATION.VALUE_NON_NEGATIVE'),
    isPendingPoint: z.boolean(),
    pendingDay: z.number().min(0, 'VALIDATION.VALUE_NON_NEGATIVE'),
    validationRuleId: z.array(validationRuleSchema).optional(),
  })
  .superRefine((data, ctx) => {
    // If pointEarnMethod is FORMULAR, formular must be provided
    if (
      data.pointEarnMethod === 'FORMULAR' &&
      (!data.formular || data.formular.trim() === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['formular'],
        message: 'VALIDATION.REQUIRED',
      });
    }

    // If isPendingPoint is true, pendingDay must be greater than 0
    if (data.isPendingPoint && data.pendingDay <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pendingDay'],
        message: 'VALIDATION.VALUE_POSITIVE',
      });
    }
  });

const campaignSchema = z
  .object({
    name: z.string().min(1, 'VALIDATION.CAMPAIGN_NAME_REQUIRED'),
    categoryId: z.string().optional(),
    description: z.string().optional(),
    mobileApp: z.string().optional(),
    metadata: z.string().optional(),
    startAt: z.date({ required_error: 'VALIDATION.START_DATE_REQUIRED' }),
    endAt: z.date({ required_error: 'VALIDATION.END_DATE_REQUIRED' }),
    partnerId: z.string().min(1, 'VALIDATION.PARTNER_REQUIRED'),
    partnerServiceId: z.string().min(1, 'VALIDATION.SERVICE_REQUIRED'),
    limitationType: z.enum(['', 'DAYS', 'DAYS_AND_HOURS']),
    timeLimitations: z.array(timeLimitationSchema),
    expireType: z
      .string()
      // .enum(['NO_EXPIRE', 'EXPIRE_BY_PERIOD'])
      .optional(),
    expirePeriodOption: z
      .string()
      // .union([
      //   z.literal(''),
      //   z.enum([
      //     'EVERY_MONTH',
      //     'EVERY_QUARTER',
      //     'EVERY_HALF_YEAR',
      //     'EVERY_YEAR',
      //     'FIX_MONTH',
      //   ]),
      // ])
      .optional(),
    expirePeriodOptionExtra: z
      .number()
      // .min(1)
      .optional(),
    periodUnit: z.enum(['UNSET', 'DAY', 'WEEK', 'MONTH', 'FOREVER']).optional(),
    periodValue: z
      .number({ invalid_type_error: 'VALIDATION.VALUE_REQUIRED' })
      .min(1)
      .optional(),
    rule: ruleSchema,
  })
  .superRefine((data, ctx) => {
    // Validate date range
    if (data.startAt && data.endAt && data.endAt < data.startAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endAt'],
        message: 'End date must be after start date',
      });
    }

    // Validate periodValue when periodUnit is set (FOREVER is always 1)
    if (data.periodUnit && data.periodUnit !== 'UNSET') {
      if (data.periodUnit === 'FOREVER') {
        if (data.periodValue !== 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['periodValue'],
            message: 'VALIDATION.VALUE_POSITIVE',
          });
        }
      } else if (
        data.periodValue === undefined ||
        data.periodValue === null ||
        data.periodValue < 1
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['periodValue'],
          message: 'VALIDATION.VALUE_POSITIVE',
        });
      }
    }

    // Validate limitationType and related fields
    if (
      data.limitationType === 'DAYS' ||
      data.limitationType === 'DAYS_AND_HOURS'
    ) {
      if (!data.timeLimitations || data.timeLimitations.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['timeLimitations'],
          message: 'At least one time limitation must be added',
        });
      } else {
        // Validate each time limitation
        data.timeLimitations.forEach((limitation, index) => {
          if (!limitation.dayOfWeeks || limitation.dayOfWeeks.length === 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [`timeLimitations.${index}.dayOfWeeks`],
              message: 'At least one day of week must be selected',
            });
          }
        });
      }
    }

    if (data.limitationType === 'DAYS_AND_HOURS') {
      if (!data.timeLimitations || data.timeLimitations.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['timeLimitations'],
          message: 'At least one time limitation with hours must be added',
        });
      } else {
        // Validate each time limitation has start and end times
        data.timeLimitations.forEach((limitation, index) => {
          if (!limitation.startTime) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [`timeLimitations.${index}.startTime`],
              message: 'Start time is required',
            });
          }
          if (!limitation.endTime) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [`timeLimitations.${index}.endTime`],
              message: 'End time is required',
            });
          }
        });
      }
    }
  });

type CampaignFormValues = z.infer<typeof campaignSchema>;

interface CampaignFormPageProps {
  mode: 'create' | 'edit' | 'view';
}

export function CampaignFormPage({ mode }: CampaignFormPageProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { setCustomBreadcrumb } = useBreadcrumb();
  const { t, language } = useTranslations();

  // URL params management for step - don't set default to avoid auto-removal
  const { getParam, updateParams } = useUrlParams({
    defaults: {}, // Empty defaults so step param is never removed
  });

  const [currentStep, setCurrentStep] = useState(() => {
    const stepParam = getParam('step');
    const step = stepParam ? parseInt(stepParam, 10) : 1;
    return step >= 1 && step <= 3 ? step : 1;
  });

  // Tab state management with URL sync
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = getParam('tab');
    return tabParam && ['info', 'dashboard', 'history'].includes(tabParam)
      ? tabParam
      : 'info';
  });

  const [confirm, setConfirm] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isFormReady, setIsFormReady] = useState(false);

  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  // Update URL when step changes
  useEffect(() => {
    const stepParam = getParam('step');
    const urlStep = stepParam ? parseInt(stepParam, 10) : 1;

    // Only update URL if step actually changed
    if (urlStep !== currentStep) {
      updateParams({ step: currentStep.toString() });
    }
  }, [currentStep, getParam, updateParams]);

  // Update URL when tab changes
  useEffect(() => {
    const tabParam = getParam('tab');
    if (tabParam !== activeTab) {
      updateParams({ tab: activeTab });
    }
  }, [activeTab, getParam, updateParams]);

  // Only reset form ready state when mode/id changes, but keep step from URL
  useEffect(() => {
    setIsFormReady(false);
    // Don't reset currentStep here - it should come from URL
  }, [mode, id]);

  const campaignId = useMemo(() => id ?? undefined, [id]);
  const {
    data: campaignDetail,
    isLoading: isLoadingDetail,
    error: detailError,
    refetch: refetchDetail,
  } = useCampaignDetail(campaignId, {
    enabled: (isEdit || isView) && !!campaignId,
  });

  // Fetch event, currency, and category lists for dropdowns
  const { data: eventListData } = useSharedEvents({});
  const eventList = eventListData?.data || [];
  const { data: categoryListData } = useSharedCategories();
  const categoryList = categoryListData?.data || [];

  const createCampaignMutation = useCreateCampaign();
  const updateCampaignMutation = useUpdateCampaign();

  const form = useForm<CampaignFormValues>({
    resolver: createTranslatedZodResolver(campaignSchema, t),
    defaultValues: {
      name: '',
      categoryId: '',
      description: '',
      mobileApp: '',
      metadata: '',
      startAt: (() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
      })(),
      endAt: (() => {
        const d = new Date();
        d.setHours(23, 59, 59, 0);
        return d;
      })(),
      partnerId: '-1',
      partnerServiceId: '',
      limitationType: '',
      timeLimitations: [],
      expireType: 'EXPIRE_BY_PERIOD',
      expirePeriodOption: '',
      expirePeriodOptionExtra: 1,
      periodUnit: 'UNSET',
      periodValue: 1,
      rule: {
        name: '',
        eventId: '',
        pointEarnMethod: 'FIX_AMOUNT',
        fixAmount: 0,
        formular: '',
        budgetOrigin: 0,
        isPendingPoint: false,
        pendingDay: 0,
        validationRuleId: [],
      },
    },
  });

  useFormLanguageSync(form, language);

  const partnerId = form.watch('partnerId');

  // const expireType = form.watch('expireType');
  const limitationType = form.watch('limitationType');

  // Fetch partner data
  const { data: partners = [] } =
    useUserAllActivePartners();
  const { data: selectedPartner, isLoading: isLoadingPartnerDetail } =
    useUserPartnerDetail(partnerId, { enabled: !!partnerId });

  const partnersWithServices = useMemo(
    () => partners.filter((partner) => partner.services?.length > 0),
    [partners],
  );

  const activeServices = useMemo(
    () => selectedPartner?.services.filter((s) => s.status === 'ACTIVE') || [],
    [selectedPartner],
  );

  // Reset partnerServiceId when partner changes
  useEffect(() => {
    form.setValue('partnerServiceId', '');
  }, [partnerId, form]);

  // Initialize timeLimitations when limitationType changes
  useEffect(() => {
    if (limitationType && isFormReady) {
      const currentTimeLimitations = form.getValues('timeLimitations');
      if (currentTimeLimitations.length === 0) {
        form.setValue('timeLimitations', [
          {
            startTime: { hour: 0, minute: 0, second: 0, nano: 0 },
            endTime: { hour: 23, minute: 59, second: 0, nano: 0 },
            dayOfWeeks: [],
          },
        ]);
      }
    }
  }, [limitationType, isFormReady, form]);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (isCreate) {
        // Only save for create mode, not edit/view
        const serialized = JSON.stringify(data, (_key, value) => {
          if (value instanceof Date) {
            return value.toISOString();
          }
          return value;
        });
        storage.setItem('campaign_form_draft', serialized);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, isCreate]);

  // Load form data from localStorage on mount for create mode
  useEffect(() => {
    if (isCreate && !isLoadingDetail) {
      const saved = storage.getItem('campaign_form_draft');
      if (saved) {
        try {
          const data = JSON.parse(saved, (_key, value) => {
            // Convert ISO strings back to Date objects
            if (
              typeof value === 'string' &&
              /^\d{4}-\d{2}-\d{2}T/.test(value)
            ) {
              return new Date(value);
            }
            return value;
          });
          // Ensure partnerId is always -1 for create mode
          data.partnerId = '-1';
          form.reset(data);
          setIsFormReady(true);
        } catch (error) {
          console.error('Failed to load form draft:', error);
          setIsFormReady(true);
        }
      } else {
        setIsFormReady(true);
      }
    }
  }, [isCreate, isLoadingDetail, form]);

  useEffect(() => {
    if (campaignDetail && (isEdit || isView) && !isLoadingDetail) {
      // Helper function to convert time string "HH:mm:ss" to TimeRange object
      const parseTimeString = (timeStr: string | any) => {
        if (typeof timeStr === 'string') {
          const [hour, minute, second] = timeStr.split(':').map(Number);
          return {
            hour: hour || 0,
            minute: minute || 0,
            second: second || 0,
            nano: 0,
          };
        }
        // If already a TimeRange object
        return {
          hour: timeStr?.hour || 0,
          minute: timeStr?.minute || 0,
          second: timeStr?.second || 0,
          nano: timeStr?.nano || 0,
        };
      };

      const formData: CampaignFormValues = {
        name: campaignDetail.name,
        categoryId: campaignDetail.categoryId,
        description: campaignDetail.description,
        mobileApp: campaignDetail.mobileApp,
        metadata: campaignDetail.metadata || '',
        startAt: new Date(campaignDetail.startAt),
        endAt: campaignDetail.endAt
          ? new Date(campaignDetail.endAt)
          : new Date(),
        partnerId: campaignDetail.partnerId || '-1',
        partnerServiceId: campaignDetail.partnerServiceId || '',
        limitationType: campaignDetail.limitationType || '',
        timeLimitations: (campaignDetail.timeLimitations || []).map(
          (limitation: any) => ({
            startTime: parseTimeString(limitation.startTime),
            endTime: parseTimeString(limitation.endTime),
            dayOfWeeks: limitation.dayOfWeeks || [],
          }),
        ),
        expireType: campaignDetail.expireType,
        expirePeriodOption: campaignDetail.expirePeriodOption,
        expirePeriodOptionExtra: campaignDetail.expirePeriodOptionExtra,
        periodUnit: campaignDetail.periodUnit,
        periodValue:
          campaignDetail.periodUnit === 'FOREVER'
            ? 1
            : campaignDetail.periodValue,
        rule: campaignDetail.rules[0] || campaignDetail.rule || {},
      };

      form.reset(formData);
      const readyTimer = setTimeout(() => {
        setIsFormReady(true);
      }, 0);
      return () => clearTimeout(readyTimer);
    } else if (isCreate && !isLoadingDetail) {
      // For create mode, form is already loaded from localStorage above
      if (!isFormReady) {
        setIsFormReady(true);
      }
    }
  }, [campaignDetail, isLoadingDetail, isEdit, isView, isCreate, form]);

  useEffect(() => {
    const breadcrumbTitle = isCreate
      ? t('CAMPAIGNS.FORM.CREATE_TITLE')
      : isEdit
        ? campaignDetail?.name || t('CAMPAIGNS.FORM.EDIT_TITLE')
        : campaignDetail?.name || t('CAMPAIGNS.FORM.VIEW_TITLE');

    setCustomBreadcrumb([
      {
        title: t('COMMON.CAMPAIGNS'),
        path: '/campaigns',
      },
      {
        title: breadcrumbTitle,
      },
    ]);

    return () => {
      setCustomBreadcrumb(null);
    };
  }, [isCreate, isEdit, campaignDetail, setCustomBreadcrumb, t]);

  const validateStep = async (step: number): Promise<boolean> => {
    console.log(form.getValues());
    switch (step) {
      case 1:
        const fieldsStep1 = [
          'name',
          'categoryId',
          'description',
          'metadata',
          'startAt',
          'endAt',
          'limitationType',
          'periodUnit',
          'periodValue',
        ];

        // Add limitationType-related fields based on selection
        const currentLimitationType = form.getValues('limitationType');
        if (
          currentLimitationType === 'DAYS' ||
          currentLimitationType === 'DAYS_AND_HOURS'
        ) {
          fieldsStep1.push('timeLimitations');
        }

        return await form.trigger(fieldsStep1 as any);
      case 2:
        const fieldsToValidate = ['expireType', 'partnerId', 'partnerServiceId'];
        const currentExpireType = form.getValues('expireType');
        if (currentExpireType !== 'NO_EXPIRE') {
          fieldsToValidate.push(
            'expirePeriodOption',
            'expirePeriodOptionExtra',
          );
        }
        return await form.trigger(fieldsToValidate as any);
      case 3:
        return await form.trigger([
          'rule.name',
          'rule.eventId',
          'rule.pointEarnMethod',
          'rule.fixAmount',
          'rule.formular',
          'rule.budgetOrigin',
          'rule.isPendingPoint',
          'rule.pendingDay',
        ]);
      default:
        return false;
    }
  };

  const handleNextStep = async () => {
    if (isView || (await validateStep(currentStep))) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (await validateStep(3)) {
      setConfirm(true);
    }
  };

  const handleConfirm = async () => {
    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpError('OTP must be 6 digits');
      return;
    }

    setOtpError('');

    try {
      const data = form.getValues();

      const payload = {
        name: data.name,
        categoryId: data.categoryId,
        description: data.description,
        mobileApp: data.mobileApp,
        metadata: data.metadata,
        startAt: format(data.startAt || new Date(), 'yyyy-MM-dd HH:mm:ss'),
        endAt: data.endAt
          ? format(data.endAt, 'yyyy-MM-dd HH:mm:ss')
          : undefined,
        partnerId: data.partnerId,
        partnerServiceId: data.partnerServiceId,
        limitationType: data.limitationType || undefined,
        timeLimitations:
          data.limitationType && data.timeLimitations.length > 0
            ? data.timeLimitations.map((limitation) => ({
                startTime: `${String(limitation.startTime?.hour || 0).padStart(2, '0')}:${String(limitation.startTime?.minute || 0).padStart(2, '0')}:${String(limitation.startTime?.second || 0).padStart(2, '0')}`,
                endTime: `${String(limitation.endTime?.hour || 0).padStart(2, '0')}:${String(limitation.endTime?.minute || 0).padStart(2, '0')}:${String(limitation.endTime?.second || 0).padStart(2, '0')}`,
                dayOfWeeks: limitation.dayOfWeeks,
              }))
            : undefined,
        expireType: data.expireType,
        expirePeriodOption:
          data.expireType !== 'NO_EXPIRE' ? data.expirePeriodOption : undefined,
        expirePeriodOptionExtra:
          data.expireType !== 'NO_EXPIRE' &&
          data.expirePeriodOption === 'FIX_MONTH'
            ? data.expirePeriodOptionExtra
            : undefined,
        periodUnit: data.periodUnit,
        periodValue:
          data.periodUnit === 'UNSET'
            ? null
            : data.periodUnit === 'FOREVER'
              ? 1
              : data.periodValue,
        rule: data.rule || {},
      };

      if (isCreate) {
        await createCampaignMutation.mutateAsync({
          data: payload as unknown as CampaignCreateDto,
        });
        // Clear localStorage after successful create
        storage.removeItem('campaign_form_draft');
        navigate('/campaigns');
      } else if (isEdit && id) {
        await updateCampaignMutation.mutateAsync({
          id,
          data: payload as unknown as CampaignUpdateDto,
        });
        navigate('/campaigns');
      }

      setConfirm(false);
      setOtpCode('');
    } catch (error) {
      console.error('Failed to submit campaign:', error);
    }
  };

  const handleBack = () => {
    navigate('/campaigns');
  };

  const handleEdit = () => {
    if (id) {
      navigate(`/campaigns/edit/${id}`);
    }
  };

  // Show error state if detail fetch failed (check this FIRST before loading state)
  if (detailError && (isEdit || isView)) {
    return (
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('COMMON.BACK')}
            </Button>
          </ToolbarHeading>
        </Toolbar>

        <div className="mx-auto max-w-7xl">
          <Alert variant="destructive" appearance="light" className="mb-6">
            <AlertIcon>
              <AlertCircle />
            </AlertIcon>
            <AlertTitle>{t('COMMON.ERROR')}</AlertTitle>
            <AlertDescription className="break-all">
              {detailError instanceof Error
                ? detailError.message
                : 'Failed to load campaign details'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => refetchDetail()}>{t('COMMON.RETRY')}</Button>
        </div>
      </Container>
    );
  }

  if (
    isLoadingDetail ||
    ((isEdit || isView) && !campaignDetail) ||
    !isFormReady
  ) {
    return (
      <Container>
        <div className="flex items-center justify-center h-64">
          <LoaderCircleIcon className="h-8 w-8 animate-spin" />
        </div>
      </Container>
    );
  }

  const isLoading =
    createCampaignMutation.isPending || updateCampaignMutation.isPending;
  const error = createCampaignMutation.error || updateCampaignMutation.error;

  // Render form content based on current step
  const renderFormContent = () => {
    return (
      <Fragment>
        {currentStep === 1 && (
          <Fragment>
            <Card>
              <CardHeader className="p-4">
                <CardTitle>{t('CAMPAIGNS.FORM.GENERAL_INFO')}</CardTitle>
                <CardDescription>
                  {isView
                    ? t('CAMPAIGNS.FORM.GENERAL_INFO_DESC_VIEW')
                    : t('CAMPAIGNS.FORM.GENERAL_INFO_DESC_EDIT')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('CAMPAIGNS.FORM.NAME')} *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('CAMPAIGNS.FORM.NAME_PLACEHOLDER')}
                          {...field}
                          disabled={isView}
                          readOnly={isView}
                          maxLength={1000}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('COMMON.CATEGORY')} *</FormLabel>
                      <Select
                        value={field.value || ''}
                        onValueChange={field.onChange}
                        disabled={isView}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t(
                                'CAMPAIGNS.FORM.CATEGORY_PLACEHOLDER',
                              )}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categoryList.map((categories: any) => (
                            <SelectItem
                              key={categories.id}
                              value={categories.id.toString()}
                            >
                              {categories.name}
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('COMMON.DESCRIPTION')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t(
                            'CAMPAIGNS.FORM.DESCRIPTION_PLACEHOLDER',
                          )}
                          rows={4}
                          {...field}
                          disabled={isView}
                          readOnly={isView}
                          maxLength={4000}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mobileApp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('CAMPAIGNS.FORM.MOBILE_APP')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            'CAMPAIGNS.FORM.MOBILE_APP_PLACEHOLDER',
                          )}
                          {...field}
                          disabled={isView}
                          readOnly={isView}
                          maxLength={500}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="metadata"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('CAMPAIGNS.FORM.DEEPLINK')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('CAMPAIGNS.FORM.DEEPLINK_PLACEHOLDER')}
                          rows={4}
                          {...field}
                          disabled={isView}
                          readOnly={isView}
                          maxLength={4000}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-4">
                <CardTitle>{t('CAMPAIGNS.FORM.CAMPAIGN_PERIOD')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startAt"
                      render={({ field, fieldState }) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return (
                          <FormItem className="flex flex-col">
                            <FormLabel>
                              {t('CAMPAIGNS.FORM.START_AT')} *
                            </FormLabel>
                            <FormControl>
                              <DatePicker
                                value={field.value}
                                onChange={(date) => {
                                  field.onChange(
                                    date === undefined ? null : date,
                                  );
                                }}
                                placeholder={t(
                                  'CAMPAIGNS.FORM.START_AT_PLACEHOLDER',
                                )}
                                disabled={
                                  isView ||
                                  (isEdit && field.value && field.value < today)
                                }
                                min={today}
                                showClearButton={!isView}
                                dateFormat="dd/MM/yyyy"
                                showTime={true}
                                error={!!fieldState.error}
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
                          <FormItem className="flex flex-col">
                            <FormLabel>
                              {t('CAMPAIGNS.FORM.END_AT')} *
                            </FormLabel>
                            <FormControl>
                              <DatePicker
                                value={field.value || undefined}
                                onChange={(date) => {
                                  field.onChange(
                                    date === undefined ? null : date,
                                  );
                                }}
                                placeholder={t(
                                  'CAMPAIGNS.FORM.END_AT_PLACEHOLDER',
                                )}
                                disabled={
                                  isView ||
                                  (isEdit && field.value && field.value < today)
                                }
                                min={startDate}
                                showClearButton={!isView}
                                dateFormat="dd/MM/yyyy"
                                showTime={true}
                                error={!!fieldState.error}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="periodUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('CAMPAIGNS.FORM.PERIOD_UNIT')}
                          </FormLabel>
                          <Select
                            onValueChange={(val) => {
                              field.onChange(val);
                              if (val === 'UNSET') {
                                form.setValue('periodValue', 0);
                              } else if (val === 'FOREVER') {
                                form.setValue('periodValue', 1);
                              }
                            }}
                            defaultValue={field.value}
                            value={field.value}
                            disabled={isView}
                          >
                            <FormControl>
                              <SelectTrigger clearable={false}>
                                <SelectValue
                                  placeholder={t(
                                    'CAMPAIGNS.FORM.PERIOD_UNIT_PLACEHOLDER',
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="UNSET">
                                {t('CAMPAIGNS.FORM.PERIOD_UNIT_UNSET')}
                              </SelectItem>
                              <SelectItem value="DAY">
                                {t('CAMPAIGNS.FORM.PERIOD_UNIT_DAY')}
                              </SelectItem>
                              <SelectItem value="WEEK">
                                {t('CAMPAIGNS.FORM.PERIOD_UNIT_WEEK')}
                              </SelectItem>
                              <SelectItem value="MONTH">
                                {t('CAMPAIGNS.FORM.PERIOD_UNIT_MONTH')}
                              </SelectItem>
                              <SelectItem value="FOREVER">
                                {t('CAMPAIGNS.FORM.PERIOD_UNIT_FOREVER')}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {form.watch('periodUnit') &&
                      form.watch('periodUnit') !== 'UNSET' && (
                        <FormField
                          control={form.control}
                          name="periodValue"
                          render={({ field }) => {
                            const periodUnit = form.watch('periodUnit');
                            const isForeverLocked = periodUnit === 'FOREVER';
                            return (
                              <FormItem>
                                <FormLabel>
                                  {t('CAMPAIGNS.FORM.PERIOD_VALUE')}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    min={1}
                                    type="number"
                                    placeholder={t(
                                      'CAMPAIGNS.FORM.PERIOD_VALUE_PLACEHOLDER',
                                    )}
                                    {...field}
                                    value={isForeverLocked ? 1 : field.value}
                                    onChange={(e) =>
                                      field.onChange(
                                        parseInt(e.target.value, 10),
                                      )
                                    }
                                    disabled={isView || isForeverLocked}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-4">
                <CardTitle>{t('CAMPAIGNS.FORM.CAMPAIGN_PERIOD')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="limitationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('CAMPAIGNS.FORM.LIMITATION_TYPE')}
                        </FormLabel>
                        <Select
                          value={field.value || ''}
                          onValueChange={(value) => field.onChange(value || '')}
                          disabled={isView}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t(
                                  'CAMPAIGNS.FORM.LIMITATION_TYPE_PLACEHOLDER',
                                )}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DAYS">
                              {t('CAMPAIGNS.FORM.LIMITATION_TYPE_DAYS')}
                            </SelectItem>
                            <SelectItem value="DAYS_AND_HOURS">
                              {t(
                                'CAMPAIGNS.FORM.LIMITATION_TYPE_DAYS_AND_HOURS',
                              )}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {limitationType && (
                    <div className="py-2 px-4 space-y-4">
                      <FormLabel className="mb-4 block">
                        {t('CAMPAIGNS.FORM.TIME_LIMITATIONS')}
                      </FormLabel>

                      {limitationType === 'DAYS' && (
                        <FormField
                          control={form.control}
                          name="timeLimitations.0.dayOfWeeks"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t('CAMPAIGNS.FORM.DAY_OF_WEEK')} *
                              </FormLabel>
                              <FormControl>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    {
                                      label: t(
                                        'CAMPAIGNS.FORM.DAY_OF_WEEK_MONDAY',
                                      ),
                                      value: 'MONDAY' as const,
                                    },
                                    {
                                      label: t(
                                        'CAMPAIGNS.FORM.DAY_OF_WEEK_TUESDAY',
                                      ),
                                      value: 'TUESDAY' as const,
                                    },
                                    {
                                      label: t(
                                        'CAMPAIGNS.FORM.DAY_OF_WEEK_WEDNESDAY',
                                      ),
                                      value: 'WEDNESDAY' as const,
                                    },
                                    {
                                      label: t(
                                        'CAMPAIGNS.FORM.DAY_OF_WEEK_THURSDAY',
                                      ),
                                      value: 'THURSDAY' as const,
                                    },
                                    {
                                      label: t(
                                        'CAMPAIGNS.FORM.DAY_OF_WEEK_FRIDAY',
                                      ),
                                      value: 'FRIDAY' as const,
                                    },
                                    {
                                      label: t(
                                        'CAMPAIGNS.FORM.DAY_OF_WEEK_SATURDAY',
                                      ),
                                      value: 'SATURDAY' as const,
                                    },
                                    {
                                      label: t(
                                        'CAMPAIGNS.FORM.DAY_OF_WEEK_SUNDAY',
                                      ),
                                      value: 'SUNDAY' as const,
                                    },
                                  ].map((day) => (
                                    <Button
                                      key={day.value}
                                      type="button"
                                      variant={
                                        field.value?.includes(day.value)
                                          ? 'primary'
                                          : 'outline'
                                      }
                                      onClick={() => {
                                        const current = field.value || [];
                                        if (current.includes(day.value)) {
                                          field.onChange(
                                            current.filter(
                                              (d) => d !== day.value,
                                            ),
                                          );
                                        } else {
                                          field.onChange([
                                            ...current,
                                            day.value,
                                          ]);
                                        }
                                      }}
                                      disabled={isView}
                                      className="w-auto"
                                    >
                                      {day.label}
                                    </Button>
                                  ))}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {limitationType === 'DAYS_AND_HOURS' && (
                        <div className="space-y-4">
                          {form.watch('timeLimitations').map((_, index) => (
                            <div
                              key={index}
                              className="p-4 border rounded-lg bg-gray-50 space-y-4"
                            >
                              <div className="flex justify-between items-center mb-4">
                                <FormLabel>
                                  {t('CAMPAIGNS.FORM.TIME_LIMITATION')}{' '}
                                  {index + 1}
                                </FormLabel>
                                {!isView && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const current =
                                        form.getValues('timeLimitations');
                                      form.setValue(
                                        'timeLimitations',
                                        current.filter((_, i) => i !== index),
                                      );
                                    }}
                                  >
                                    {t('COMMON.DELETE')}
                                  </Button>
                                )}
                              </div>

                              <FormField
                                control={form.control}
                                name={`timeLimitations.${index}.dayOfWeeks`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>
                                      {t('CAMPAIGNS.FORM.DAY_OF_WEEK')} *
                                    </FormLabel>
                                    <FormControl>
                                      <div className="flex flex-wrap gap-2">
                                        {[
                                          {
                                            label: t(
                                              'CAMPAIGNS.FORM.DAY_OF_WEEK_MONDAY',
                                            ),
                                            value: 'MONDAY' as const,
                                          },
                                          {
                                            label: t(
                                              'CAMPAIGNS.FORM.DAY_OF_WEEK_TUESDAY',
                                            ),
                                            value: 'TUESDAY' as const,
                                          },
                                          {
                                            label: t(
                                              'CAMPAIGNS.FORM.DAY_OF_WEEK_WEDNESDAY',
                                            ),
                                            value: 'WEDNESDAY' as const,
                                          },
                                          {
                                            label: t(
                                              'CAMPAIGNS.FORM.DAY_OF_WEEK_THURSDAY',
                                            ),
                                            value: 'THURSDAY' as const,
                                          },
                                          {
                                            label: t(
                                              'CAMPAIGNS.FORM.DAY_OF_WEEK_FRIDAY',
                                            ),
                                            value: 'FRIDAY' as const,
                                          },
                                          {
                                            label: t(
                                              'CAMPAIGNS.FORM.DAY_OF_WEEK_SATURDAY',
                                            ),
                                            value: 'SATURDAY' as const,
                                          },
                                          {
                                            label: t(
                                              'CAMPAIGNS.FORM.DAY_OF_WEEK_SUNDAY',
                                            ),
                                            value: 'SUNDAY' as const,
                                          },
                                        ].map((day) => (
                                          <Button
                                            key={day.value}
                                            type="button"
                                            variant={
                                              field.value?.includes(day.value)
                                                ? 'primary'
                                                : 'outline'
                                            }
                                            onClick={() => {
                                              const current = field.value || [];
                                              if (current.includes(day.value)) {
                                                field.onChange(
                                                  current.filter(
                                                    (d) => d !== day.value,
                                                  ),
                                                );
                                              } else {
                                                field.onChange([
                                                  ...current,
                                                  day.value,
                                                ]);
                                              }
                                            }}
                                            disabled={isView}
                                            className="w-auto"
                                          >
                                            {day.label}
                                          </Button>
                                        ))}
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name={`timeLimitations.${index}.startTime`}
                                  render={({ field, fieldState }) => (
                                    <FormItem>
                                      <FormLabel>
                                        {t('CAMPAIGNS.FORM.START_TIME')} *
                                      </FormLabel>
                                      <FormControl>
                                        <InputGroup
                                          className={cn(
                                            'w-full',
                                            fieldState.error &&
                                              'border border-destructive rounded-md',
                                          )}
                                        >
                                          <InputAddon mode="icon">
                                            <Clock3 className="h-4 w-4" />
                                          </InputAddon>
                                          <TimeField
                                            value={field.value}
                                            onChange={field.onChange}
                                            isDisabled={isView}
                                          >
                                            <DateInput />
                                          </TimeField>
                                        </InputGroup>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`timeLimitations.${index}.endTime`}
                                  render={({ field, fieldState }) => (
                                    <FormItem>
                                      <FormLabel>
                                        {t('CAMPAIGNS.FORM.END_TIME')} *
                                      </FormLabel>
                                      <FormControl>
                                        <InputGroup
                                          className={cn(
                                            'w-full',
                                            fieldState.error &&
                                              'border border-destructive rounded-md',
                                          )}
                                        >
                                          <InputAddon mode="icon">
                                            <Clock3 className="h-4 w-4" />
                                          </InputAddon>
                                          <TimeField
                                            value={field.value}
                                            onChange={field.onChange}
                                            isDisabled={isView}
                                          >
                                            <DateInput />
                                          </TimeField>
                                        </InputGroup>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          ))}

                          {!isView && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const current =
                                  form.getValues('timeLimitations');
                                form.setValue('timeLimitations', [
                                  ...current,
                                  {
                                    startTime: {
                                      hour: 0,
                                      minute: 0,
                                      second: 0,
                                      nano: 0,
                                    },
                                    endTime: {
                                      hour: 23,
                                      minute: 59,
                                      second: 0,
                                      nano: 0,
                                    },
                                    dayOfWeeks: [],
                                  },
                                ]);
                              }}
                            >
                              {t('CAMPAIGNS.FORM.ADD_TIME_LIMITATION')}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Fragment>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader className="p-4">
              <CardTitle>{t('CAMPAIGNS.FORM.POINT_EXPIRATION')}</CardTitle>
              <CardDescription>
                {t('CAMPAIGNS.FORM.POINT_EXPIRATION_DESC')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="partnerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('COMMON.PARTNER')} *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={true}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t('COMMON.SELECT_PARTNER')}
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
                  name="partnerServiceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('COMMON.SERVICE')} *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={
                          !partnerId || isLoadingPartnerDetail || isView
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t('COMMON.SELECT_SERVICE')}
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
              {form.watch('partnerServiceId') &&
                <div className="grid lg:grid-cols-2 gap-4">
                  <FormItem>
                    <FormLabel>{t('COMMON.CURRENCY')}</FormLabel>
                    <FormControl>
                      <Input
                        value={
                          activeServices.find((s) => s.id === form.watch('partnerServiceId'))
                            ?.currencyName || ''
                        }
                        disabled
                        readOnly
                        placeholder={t('COMMON.SELECT_SERVICE')}
                      />
                    </FormControl>
                  </FormItem>
                  
                  <FormItem>
                    <FormLabel>{t('CAMPAIGNS.FORM.POLICY')}</FormLabel>
                    <FormControl>
                      <Input
                        value={
                          activeServices.find((s) => s.id === form.watch('partnerServiceId'))
                            ?.policyName || ''
                        }
                        disabled
                        readOnly
                        placeholder={t('COMMON.SELECT_SERVICE')}
                      />
                    </FormControl>
                  </FormItem>
                </div>
              }
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader className="p-4">
              <CardTitle>{t('CAMPAIGNS.FORM.EARNING_RULES')}</CardTitle>
              <CardDescription>
                {t('CAMPAIGNS.FORM.EARNING_RULES_DESC')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="rule.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('CAMPAIGNS.FORM.RULE_NAME')} *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t(
                                'CAMPAIGNS.FORM.RULE_NAME_PLACEHOLDER',
                              )}
                              disabled={isView}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="rule.eventId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('CAMPAIGNS.FORM.EVENT_ID')} *</FormLabel>
                        <Select
                          value={field.value || ''}
                          onValueChange={field.onChange}
                          disabled={isView}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t(
                                  'CAMPAIGNS.FORM.EVENT_ID_PLACEHOLDER',
                                )}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {eventList.map((event: any) => (
                              <SelectItem
                                key={event.id}
                                value={event.id.toString()}
                              >
                                {event.name}
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
                    name="rule.pointEarnMethod"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>
                          {t('CAMPAIGNS.FORM.POINT_EARN_METHOD')} *
                        </FormLabel>
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            className={cn(
                              'flex-1 h-auto py-4 px-4 rounded-lg font-semibold',
                              field.value === 'FIX_AMOUNT'
                                ? 'bg-red-100 text-gray-700 border border-red-200 hover:bg-red-100'
                                : 'bg-gray-50 text-gray-700 border border-gray-100 hover:bg-gray-50',
                            )}
                            onClick={() => field.onChange('FIX_AMOUNT')}
                            disabled={isView}
                          >
                            <div className="text-center">
                              <div>
                                {t('CAMPAIGNS.FORM.POINT_EARN_METHOD_FIX')}
                              </div>
                              <div className="text-sm font-normal">
                                {t('CAMPAIGNS.FORM.POINT_EARN_METHOD_FIX_DESC')}
                              </div>
                            </div>
                          </Button>
                          <Button
                            type="button"
                            className={cn(
                              'flex-1 h-auto py-4 px-4 rounded-lg font-semibold',
                              field.value === 'FORMULAR'
                                ? 'bg-red-100 text-gray-700 border border-red-200 hover:bg-red-100'
                                : 'bg-gray-50 text-gray-700 border border-gray-100 hover:bg-gray-50',
                            )}
                            onClick={() => field.onChange('FORMULAR')}
                            disabled={isView}
                          >
                            <div className="text-center">
                              <div>
                                {t('CAMPAIGNS.FORM.POINT_EARN_METHOD_FORMULA')}
                              </div>
                              <div className="text-sm font-normal">
                                {t(
                                  'CAMPAIGNS.FORM.POINT_EARN_METHOD_FORMULA_DESC',
                                )}
                              </div>
                            </div>
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('rule.pointEarnMethod') === 'FIX_AMOUNT' && (
                    <div className="col-span-2 px-4">
                      <FormField
                        control={form.control}
                        name="rule.fixAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('CAMPAIGNS.FORM.FIX_AMOUNT')} *
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder={t(
                                  'CAMPAIGNS.FORM.FIX_AMOUNT_PLACEHOLDER',
                                )}
                                disabled={isView}
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 0)
                                }
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {form.watch('rule.pointEarnMethod') === 'FORMULAR' && (
                    <div className="col-span-2 px-4">
                      <FormField
                        control={form.control}
                        name="rule.formular"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('COMMON.FORMULA')} *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={t(
                                  'CAMPAIGNS.FORM.FORMULA_PLACEHOLDER',
                                )}
                                rows={4}
                                disabled={isView}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="rule.budgetOrigin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('CAMPAIGNS.FORM.BUDGET')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder={t(
                                'CAMPAIGNS.FORM.BUDGET_PLACEHOLDER',
                              )}
                              disabled={isView || isEdit}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {/*<FormField*/}
                  {/*  control={form.control}*/}
                  {/*  name="rule.isPendingPoint"*/}
                  {/*  render={({ field }) => (*/}
                  {/*    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">*/}
                  {/*      <div className="space-y-0.5">*/}
                  {/*        <FormLabel className="text-sm font-medium">*/}
                  {/*          {t('CAMPAIGNS.FORM.IS_PENDING_POINT')}*/}
                  {/*        </FormLabel>*/}
                  {/*      </div>*/}
                  {/*      <FormControl>*/}
                  {/*        <Switch*/}
                  {/*          checked={field.value}*/}
                  {/*          onCheckedChange={field.onChange}*/}
                  {/*          disabled={isView}*/}
                  {/*        />*/}
                  {/*      </FormControl>*/}
                  {/*    </FormItem>*/}
                  {/*  )}*/}
                  {/*/>*/}
                  {form.watch('rule.isPendingPoint') && (
                    <FormField
                      control={form.control}
                      name="rule.pendingDay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('CAMPAIGNS.FORM.PENDING_DAY')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder={t(
                                'CAMPAIGNS.FORM.PENDING_DAY_PLACEHOLDER',
                              )}
                              disabled={isView}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="p-4 border rounded-lg bg-gray-50 border-blue-100">
                  <FormField
                    control={form.control}
                    name="rule.validationRuleId"
                    render={({ field }) => (
                      <FormItem>
                        <ValidationRuleSelector
                          value={(field.value || []) as ValidationRule[]}
                          onChange={field.onChange}
                          disabled={isView}
                        />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              currentStep === 1 ? handleBack() : handlePrevStep()
            }
            disabled={isLoading}
          >
            {currentStep === 1 ? t('COMMON.CANCEL') : t('COMMON.PREVIOUS')}
          </Button>

          {currentStep < 3 ? (
            <Button type="button" onClick={handleNextStep} disabled={isLoading}>
              {t('CAMPAIGNS.FORM.NEXT_STEP')}
            </Button>
          ) : (
            !isView && (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isView || isLoading}
                variant="primary"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                    {t('CAMPAIGNS.FORM.SUBMITTING')}
                  </span>
                ) : isEdit ? (
                  t('COMMON.SAVE')
                ) : (
                  t('COMMON.CREATE')
                )}
              </Button>
            )
          )}
        </div>
      </Fragment>
    );
  };

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('COMMON.BACK')}
          </Button>
        </ToolbarHeading>
        <ToolbarActions>
          {isView && (
            <PermissionGuard
              requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}
            >
              <Button onClick={handleEdit}>
                {t('CAMPAIGNS.FORM.EDIT_BUTTON')}
              </Button>
            </PermissionGuard>
          )}
        </ToolbarActions>
      </Toolbar>

      <div className="mx-auto max-w-7xl">
        {error && (
          <Alert variant="destructive" appearance="light" className="mb-6">
            <AlertIcon>
              <AlertCircle />
            </AlertIcon>
            <AlertTitle>{t('COMMON.ERROR')}</AlertTitle>
            <AlertDescription className="break-all">
              {error instanceof Error ? error.message : 'An error occurred'}
            </AlertDescription>
          </Alert>
        )}

        {/* Only show step indicator for create and edit modes */}
        {!isView && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((step, index) => (
                <div key={step} className="flex items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold flex-shrink-0 ${
                      step === currentStep
                        ? 'bg-primary text-primary-foreground'
                        : step < currentStep
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step < currentStep ? '✓' : step}
                  </div>
                  <div className="ml-3 flex-1">
                    <p
                      className={`text-sm font-medium ${step === currentStep ? 'text-primary' : ''}`}
                    >
                      {step === 1 && t('CAMPAIGNS.FORM.STEP_1')}
                      {step === 2 && t('CAMPAIGNS.FORM.STEP_2')}
                      {step === 3 && t('CAMPAIGNS.FORM.STEP_3')}
                    </p>
                  </div>
                  {index < 2 && (
                    <div className="flex-1 h-0.5 bg-muted mx-2 mt-5"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs for view mode only */}
        {isView ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList variant="line" className="mb-6">
              <TabsTrigger value="info">
                {t('CAMPAIGNS.FORM.TAB_INFO')}
              </TabsTrigger>
              <TabsTrigger value="dashboard">
                {t('CAMPAIGNS.FORM.TAB_DASHBOARD')}
              </TabsTrigger>
              <TabsTrigger value="history">
                {t('CAMPAIGNS.FORM.TAB_HISTORY')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-0">
              {isView && (
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    {[1, 2, 3].map((step, index) => (
                      <div key={step} className="flex items-center flex-1">
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold flex-shrink-0 ${
                            step === currentStep
                              ? 'bg-primary text-primary-foreground'
                              : step < currentStep
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {step < currentStep ? '✓' : step}
                        </div>
                        <div className="ml-3 flex-1">
                          <p
                            className={`text-sm font-medium ${step === currentStep ? 'text-primary' : ''}`}
                          >
                            {step === 1 && t('CAMPAIGNS.FORM.STEP_1')}
                            {step === 2 && t('CAMPAIGNS.FORM.STEP_2')}
                            {step === 3 && t('CAMPAIGNS.FORM.STEP_3')}
                          </p>
                        </div>
                        {index < 2 && (
                          <div className="flex-1 h-0.5 bg-muted mx-2 mt-5"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <Form {...form}>
                    <form className="space-y-6">{renderFormContent()}</form>
                  </Form>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              {id && <CampaignHistoryTab campaignId={id} totalTransaction={campaignDetail?.totalTransaction} totalPointAwarded={campaignDetail?.totalPointAwarded}/>}
            </TabsContent>

            <TabsContent value="dashboard" className="mt-0">
              {id && <CampaignDashboardTab campaignId={id} />}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <div>
              <Form {...form}>
                <form className="space-y-6">{renderFormContent()}</form>
              </Form>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={confirm}
        onOpenChange={(open) => {
          if (!open && !updateCampaignMutation.isPending) {
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
              {isCreate
                ? t('CAMPAIGNS.FORM.OTP_TITLE_CREATE')
                : t('CAMPAIGNS.FORM.OTP_TITLE_UPDATE')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('CAMPAIGNS.FORM.OTP_DESCRIPTION')}
            </DialogDescription>
          </DialogHeader>

          <div className="p-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="otp" className="text-sm font-medium">
                {t('COMMON.OTP_CODE')} *
              </label>
              <Input
                id="otp"
                type="text"
                placeholder={t('COMMON.ENTER_6_DIGIT_OTP')}
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value);
                  setOtpError('');
                }}
                disabled={isLoading}
                maxLength={6}
              />
              {otpError && (
                <p className="text-xs text-destructive">{otpError}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirm(false)}
              disabled={isLoading}
            >
              {t('COMMON.CANCEL')}
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading || !otpCode.trim()}
              variant={'primary'}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                  {t('CAMPAIGNS.FORM.OTP_CONFIRMING')}
                </span>
              ) : (
                t('COMMON.CONFIRM')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}

export default CampaignFormPage;
