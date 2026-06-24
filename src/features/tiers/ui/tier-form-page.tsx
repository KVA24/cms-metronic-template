import { useEffect, useState } from 'react';
import { useTierMetricListQuery } from '@/features/tiers/hooks/use-tier-metric-queries';
import { BenefitsManager } from '@/features/tiers/ui/components/benefits-manager';
import { TreeConditionsBuilder } from '@/features/tiers/ui/components/tree-conditions-builder';
import { useBreadcrumb } from '@/shared/contexts/breadcrumb-context';
import { useTranslations } from '@/shared/hooks/use-translations';
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
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/atoms/card';
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
import { Textarea } from '@/shared/ui/atoms/textarea';
import { Toolbar, ToolbarHeading } from '@/shared/ui/molecules/common/toolbar';
import { Container } from '@/shared/ui/molecules/container';
import { AlertCircle, ArrowLeft, LoaderCircleIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import * as z from 'zod';
import {
  useCreateTier,
  useTierDetail,
  useTierListAll,
  useUpdateTier,
} from '../hooks/use-tier-queries';

const conditionSchema: z.ZodType<any> = z.lazy(() =>
  z
    .object({
      nodeType: z.enum(['OPERATOR', 'CONDITION']),
      logicalOperator: z.enum(['AND', 'OR', 'NOT']).optional(),
      children: z.array(conditionSchema).optional(),
      metricCode: z.string().optional(),
      comparisonOperator: z
        .enum(['GTE', 'LTE', 'GT', 'LT', 'EQ', 'NEQ'])
        .optional(),
      thresholdValue: z.number().optional(),
    })
    .superRefine((data, ctx) => {
      // If it's a CONDITION node, metricCode is required
      if (data.nodeType === 'CONDITION' && !data.metricCode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'TIERS.CONDITIONS.METRIC_REQUIRED',
          path: ['metricCode'],
        });
      }
    }),
);

const benefitSchema = z.object({
  id: z.string().optional(),
  iconUrl: z.string().optional(),
  content: z
    .string()
    .min(1, 'TIERS.BENEFITS.CONTENT_REQUIRED')
    .max(500, 'TIERS.BENEFITS.CONTENT_MAX_LENGTH'),
  sortOrder: z.number().optional(),
});

const tierSchema = z.object({
  name: z
    .string()
    .min(1, 'VALIDATION.NAME_REQUIRED')
    .max(50, 'TIERS.FORM.NAME_MAX_LENGTH')
    .refine((val) => val.trim().length > 0, {
      message: 'VALIDATION.NAME_REQUIRED',
    }),
  code: z
    .string()
    .min(1, 'VALIDATION.CODE_REQUIRED')
    .max(25, 'TIERS.FORM.CODE_MAX_LENGTH')
    .regex(/^[A-Z0-9_]+$/, { message: 'TIERS.FORM.CODE_FORMAT' })
    .refine((val) => val.trim().length > 0, {
      message: 'VALIDATION.CODE_REQUIRED',
    }),
  iconUrl: z
    .string()
    .url('TIERS.FORM.ICON_URL_INVALID')
    .max(500, 'TIERS.FORM.ICON_URL_MAX_LENGTH')
    .optional()
    .or(z.literal('')),
  rank: z.number().int().min(1, 'TIERS.FORM.RANK_MIN'),
  conditions: conditionSchema,
  benefits: z
    .array(benefitSchema)
    .min(1, 'TIERS.FORM.BENEFITS_REQUIRED')
    .max(20, 'TIERS.FORM.BENEFITS_MAX'),
  titleUpgradeLevel: z
    .string()
    .max(200, 'TIERS.FORM.TITLE_UPGRADE_LEVEL_MAX_LENGTH')
    .optional()
    .or(z.literal('')),
  messageUpgradeLevel: z
    .string()
    .max(1000, 'TIERS.FORM.MESSAGE_UPGRADE_LEVEL_MAX_LENGTH')
    .optional()
    .or(z.literal('')),
  titleDowngradeLevel: z
    .string()
    .max(200, 'TIERS.FORM.TITLE_DOWNGRADE_LEVEL_MAX_LENGTH')
    .optional()
    .or(z.literal('')),
  messageDowngradeLevel: z
    .string()
    .max(1000, 'TIERS.FORM.MESSAGE_DOWNGRADE_LEVEL_MAX_LENGTH')
    .optional()
    .or(z.literal('')),
});

type TierFormValues = z.infer<typeof tierSchema>;

interface TierFormPageProps {
  mode: 'create' | 'edit' | 'view';
}

export function TierFormPage({ mode }: TierFormPageProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { setCustomBreadcrumb } = useBreadcrumb();
  const { t, language } = useTranslations();

  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  const [confirm, setConfirm] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');

  // React Query - Fetch all tiers to compute default rank on create
  const { data: allTiersData } = useTierListAll({ enabled: isCreate });

  // React Query - Fetch tier detail
  const {
    data: tierDetail,
    isLoading: isLoadingDetail,
    error: detailError,
  } = useTierDetail(id, {
    enabled: (isEdit || isView) && !!id,
  });

  // React Query - Fetch active metrics (needed before rendering ConditionsBuilder)
  const { data: metricsData, isLoading: isLoadingMetrics } =
    useTierMetricListQuery();
  const activeMetrics = metricsData?.data ?? [];

  // True when all data needed to render the form is ready
  const isDataReady =
    !isLoadingMetrics && (isCreate || (!isLoadingDetail && !!tierDetail));

  // React Query - Mutations
  const createMutation = useCreateTier();
  const updateMutation = useUpdateTier();

  const error =
    detailError?.message ||
    createMutation.error?.message ||
    updateMutation.error?.message ||
    null;

  const form = useForm<TierFormValues>({
    resolver: createTranslatedZodResolver(tierSchema, t),
    defaultValues: {
      name: '',
      code: '',
      iconUrl: '',
      rank: 1,
      conditions: {
        nodeType: 'OPERATOR' as const,
        logicalOperator: 'OR' as const,
        children: [],
      },
      benefits: [{ content: '', iconUrl: '', sortOrder: 1 }],
      titleUpgradeLevel: '',
      messageUpgradeLevel: '',
      titleDowngradeLevel: '',
      messageDowngradeLevel: '',
    },
  });

  useFormLanguageSync(form, language);

  // Set default rank = maxRank + 1 when creating
  useEffect(() => {
    if (isCreate && allTiersData?.data) {
      const maxRank = allTiersData.data.reduce(
        (max, tier) => Math.max(max, tier.rank),
        0,
      );
      form.setValue('rank', maxRank + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTiersData]);

  // Reset form with API data, then mark form as ready to render
  const [isFormReady, setIsFormReady] = useState(isCreate);
  useEffect(() => {
    if (tierDetail && (isEdit || isView) && isDataReady) {
      form.reset({
        name: tierDetail.name,
        code: tierDetail.code,
        iconUrl: tierDetail.iconUrl || '',
        rank: tierDetail.rank,
        conditions: tierDetail.conditions,
        benefits: tierDetail.benefits.map((b, i) => ({
          id: b.id,
          iconUrl: b.iconUrl ?? '',
          content: b.content,
          sortOrder: b.sortOrder ?? i + 1,
        })),
        titleUpgradeLevel: tierDetail.titleUpgradeLevel || '',
        messageUpgradeLevel: tierDetail.messageUpgradeLevel || '',
        titleDowngradeLevel: tierDetail.titleDowngradeLevel || '',
        messageDowngradeLevel: tierDetail.messageDowngradeLevel || '',
      });
      setIsFormReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDataReady, tierDetail]);

  useEffect(() => {
    const breadcrumbTitle = isCreate
      ? t('TIERS.FORM.CREATE_TITLE')
      : isEdit
        ? tierDetail?.name || t('TIERS.FORM.EDIT_TITLE')
        : tierDetail?.name || t('TIERS.FORM.VIEW_TITLE');

    setCustomBreadcrumb([
      {
        title: t('SIDEBAR.MEMBERSHIP_TIERS_TIER_DEFINITIONS'),
        path: '/tiers',
      },
      {
        title: breadcrumbTitle,
      },
    ]);

    return () => {
      setCustomBreadcrumb(null);
    };
  }, [isCreate, isEdit, tierDetail, setCustomBreadcrumb, t]);

  const handleSubmit = async (data: TierFormValues) => {
    // Validate conditions tree
    if (!data.conditions) {
      form.setError('conditions', {
        type: 'manual',
        message: t('TIERS.FORM.CONDITIONS_REQUIRED'),
      });
      return;
    }

    // Validate all condition nodes have metricCode
    const validateConditions = (node: any): boolean => {
      if (node.nodeType === 'CONDITION') {
        if (!node.metricCode) {
          return false;
        }
      }
      if (node.children) {
        for (const child of node.children) {
          if (!validateConditions(child)) {
            return false;
          }
        }
      }
      return true;
    };

    if (!validateConditions(data.conditions)) {
      form.setError('conditions', {
        type: 'manual',
        message: t('TIERS.CONDITIONS.METRIC_REQUIRED'),
      });
      return;
    }

    // Validate benefits
    if (!data.benefits || data.benefits.length === 0) {
      form.setError('benefits', {
        type: 'manual',
        message: t('TIERS.FORM.BENEFITS_REQUIRED'),
      });
      return;
    }

    // Validate each benefit has content
    const hasEmptyBenefit = data.benefits.some(
      (b) => !b.content || b.content.trim().length === 0,
    );
    if (hasEmptyBenefit) {
      form.setError('benefits', {
        type: 'manual',
        message: t('TIERS.FORM.BENEFITS_EMPTY_CONTENT'),
      });
      return;
    }

    setConfirm(true);
  };

  const handleConfirm = async () => {
    // Validate OTP
    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpError(t('COMMON.OTP_MUST_BE_6_DIGITS'));
      return;
    }

    setOtpError('');

    try {
      const data = form.getValues();

      // Trim whitespace from name and code
      const payload = {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        iconUrl: data.iconUrl?.trim() || undefined,
        rank: data.rank,
        conditions: data.conditions,
        benefits: data.benefits.map((b) => ({
          ...b,
          content: b.content.trim(),
          iconUrl: b.iconUrl?.trim() || undefined,
        })),
        titleUpgradeLevel: data.titleUpgradeLevel?.trim() || undefined,
        messageUpgradeLevel: data.messageUpgradeLevel?.trim() || undefined,
        titleDowngradeLevel: data.titleDowngradeLevel?.trim() || undefined,
        messageDowngradeLevel: data.messageDowngradeLevel?.trim() || undefined,
      };

      if (isCreate) {
        await createMutation.mutateAsync({
          ...payload,
          otpCode: otpCode,
        });
        navigate('/tiers');
      } else if (isEdit && id) {
        await updateMutation.mutateAsync({
          id: id,
          data: {
            ...payload,
            otpCode: otpCode,
          },
        });
        navigate('/tiers');
      }

      setConfirm(false);
      setOtpCode('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleBack = () => {
    navigate('/tiers');
  };

  if (isLoadingDetail) {
    return (
      <Container>
        <div className="flex items-center justify-center h-64">
          <LoaderCircleIcon className="h-8 w-8 animate-spin" />
        </div>
      </Container>
    );
  }

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

      <div className="mx-auto">
        {error && (
          <Alert variant="destructive" appearance="light" className="mb-6">
            <AlertIcon>
              <AlertCircle />
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
            <Card>
              <CardHeader className="p-4">
                <CardTitle>
                  {isCreate
                    ? t('TIERS.FORM.CREATE_TITLE')
                    : isEdit
                      ? t('TIERS.FORM.EDIT_TITLE')
                      : t('TIERS.FORM.VIEW_TITLE')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('COMMON.NAME')}{' '}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('COMMON.ENTER_NAME')}
                            maxLength={50}
                            {...field}
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
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('COMMON.CODE')}{' '}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('TIERS.FORM.CODE_PLACEHOLDER')}
                            maxLength={25}
                            {...field}
                            onChange={(e) => {
                              // Auto-uppercase
                              field.onChange(e.target.value.toUpperCase());
                            }}
                            disabled={isView || isEdit}
                            readOnly={isView || isEdit}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="iconUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('TIERS.FORM.ICON_URL')}</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder={t('TIERS.FORM.ICON_URL_PLACEHOLDER')}
                            maxLength={500}
                            {...field}
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
                    name="rank"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('TIERS.FORM.RANK')}{' '}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder={t('TIERS.FORM.RANK_PLACEHOLDER')}
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
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

                {/* Conditions Builder */}
                <div className="mb-4">
                  <FormField
                    control={form.control}
                    name="conditions"
                    render={({ field, fieldState }) => (
                      <div className="flex flex-col gap-2">
                        {!isFormReady ? (
                          <div className="space-y-2">
                            {[1, 2].map((i) => (
                              <div
                                key={i}
                                className="h-14 rounded-md border bg-muted animate-pulse"
                              />
                            ))}
                          </div>
                        ) : (
                          <TreeConditionsBuilder
                            key={tierDetail?.id ?? 'create'}
                            value={field.value}
                            onChange={field.onChange}
                            disabled={isView}
                            activeMetrics={activeMetrics}
                          />
                        )}
                        {fieldState.error?.message && (
                          <p className="text-xs text-destructive">
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                </div>

                {/* Benefits Manager */}
                <div>
                  <FormField
                    control={form.control}
                    name="benefits"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          {!isFormReady ? (
                            <div className="space-y-2">
                              {[1, 2].map((i) => (
                                <div
                                  key={i}
                                  className="h-14 rounded-md border bg-muted animate-pulse"
                                />
                              ))}
                            </div>
                          ) : (
                            <BenefitsManager
                              key={tierDetail?.id ?? 'create'}
                              value={field.value}
                              onChange={field.onChange}
                              disabled={isView}
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4">
                <CardTitle>{t('TIERS.FORM.UPGRADE_NOTIFICATION')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="titleUpgradeLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('TIERS.FORM.TITLE_UPGRADE_LEVEL')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              'TIERS.FORM.TITLE_UPGRADE_LEVEL_PLACEHOLDER',
                            )}
                            maxLength={200}
                            {...field}
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
                    name="messageUpgradeLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('TIERS.FORM.MESSAGE_UPGRADE_LEVEL')}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t(
                              'TIERS.FORM.MESSAGE_UPGRADE_LEVEL_PLACEHOLDER',
                            )}
                            rows={3}
                            maxLength={1000}
                            {...field}
                            disabled={isView}
                            readOnly={isView}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4">
                <CardTitle>{t('TIERS.FORM.DOWNGRADE_NOTIFICATION')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="titleDowngradeLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('TIERS.FORM.TITLE_DOWNGRADE_LEVEL')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              'TIERS.FORM.TITLE_DOWNGRADE_LEVEL_PLACEHOLDER',
                            )}
                            maxLength={200}
                            {...field}
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
                    name="messageDowngradeLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('TIERS.FORM.MESSAGE_DOWNGRADE_LEVEL')}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t(
                              'TIERS.FORM.MESSAGE_DOWNGRADE_LEVEL_PLACEHOLDER',
                            )}
                            rows={3}
                            maxLength={1000}
                            {...field}
                            disabled={isView}
                            readOnly={isView}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>

              {!isView && (
                <CardFooter className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                        {t('COMMON.PROCESSING')}
                      </span>
                    ) : (
                      t('COMMON.CONFIRM')
                    )}
                  </Button>
                </CardFooter>
              )}
            </Card>
          </form>
        </Form>
      </div>

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
              {isCreate
                ? t('TIERS.FORM.OTP_TITLE_CREATE')
                : t('TIERS.FORM.OTP_TITLE_UPDATE')}
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
                disabled={createMutation.isPending || updateMutation.isPending}
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
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {t('COMMON.CANCEL')}
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
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
    </Container>
  );
}
