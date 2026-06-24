import { useEffect, useState } from 'react';
import { useSharedEvents } from '@/features/shared';
import {
  useCreateTierMetric,
  useTierMetricDetailQuery,
  useUpdateTierMetric,
} from '@/features/tier-metrics/hooks/use-tier-metric-queries';
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
  // CardDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/atoms/select';
import { Switch } from '@/shared/ui/atoms/switch.tsx';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/atoms/tooltip';
import { Toolbar, ToolbarHeading } from '@/shared/ui/molecules/common/toolbar';
import { Container } from '@/shared/ui/molecules/container';
import { AlertCircle, ArrowLeft, Info, LoaderCircleIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import * as z from 'zod';

const tierMetricSchema = z
  .object({
    metricName: z
      .string()
      .trim()
      .min(1, 'TIER_METRICS.METRIC_NAME_REQUIRED')
      .max(100, 'TIER_METRICS.METRIC_NAME_MAX_LENGTH')
      .refine(
        (val) => !/[<>\"']/i.test(val),
        'TIER_METRICS.METRIC_NAME_INVALID_CHARS',
      ),
    metricCode: z
      .string()
      .min(1, 'TIER_METRICS.METRIC_CODE_REQUIRED')
      .refine(
        (val) => /^[A-Z0-9_]*$/.test(val),
        'TIER_METRICS.METRIC_CODE_INVALID_FORMAT',
      ),
    eventTypeCode: z.string().min(1, 'TIER_METRICS.EVENT_TYPE_REQUIRED'),
    status: z.enum(['ACTIVE', 'INACTIVE']),
    aggregation: z
      .enum(['COUNT', 'SUM'], {
        required_error: 'TIER_METRICS.AGGREGATION_REQUIRED',
      })
      .default('COUNT'),
    filterJson: z.string().optional(),
    formula: z.string().optional(),
    otpCode: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.aggregation === 'SUM' && !data.formula) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'TIER_METRICS.FORMULA_REQUIRED',
        path: ['formula'],
      });
    }
  });

type TierMetricFormValues = z.infer<typeof tierMetricSchema>;

interface TierMetricFormPageProps {
  mode: 'create' | 'edit' | 'view';
}

export function TierMetricFormPage({ mode }: TierMetricFormPageProps) {
  const { t, language } = useTranslations();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { setCustomBreadcrumb } = useBreadcrumb();

  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  const [confirm, setConfirm] = useState(false);

  // Fetch metric detail
  const {
    data: metricDetail,
    isLoading: isLoadingDetail,
    error: detailError,
  } = useTierMetricDetailQuery(id, {
    enabled: (isEdit || isView) && !!id,
  });

  const { data: eventListData } = useSharedEvents();
  const events = eventListData?.data || [];

  // Mutations
  const createMutation = useCreateTierMetric();
  const updateMutation = useUpdateTierMetric();

  const error: string | null =
    detailError?.message ||
    createMutation.error?.message ||
    updateMutation.error?.message ||
    null;

  const form = useForm<TierMetricFormValues>({
    resolver: createTranslatedZodResolver(tierMetricSchema, t),
    defaultValues: {
      metricName: '',
      metricCode: '',
      eventTypeCode: '',
      status: 'INACTIVE',
      aggregation: 'COUNT',
      filterJson: '',
      formula: '',
    },
  });

  // Sync form validation with language changes
  useFormLanguageSync(form, language);

  // Load metric detail into form — wait for both metricDetail and eventListData to be ready
  useEffect(() => {
    if (metricDetail && (isEdit || isView) && eventListData?.data?.length) {
      form.reset({
        metricName: metricDetail.metricName,
        metricCode: metricDetail.metricCode,
        eventTypeCode: metricDetail.eventTypeCode,
        status: metricDetail.status,
        aggregation: metricDetail.aggregation,
        filterJson: metricDetail.filterJson || '',
        formula: metricDetail.formula || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metricDetail, isEdit, isView, eventListData]);

  // Set breadcrumb
  useEffect(() => {
    const title = isCreate
      ? t('TIER_METRICS.CREATE_TITLE')
      : isEdit
        ? t('TIER_METRICS.EDIT_TITLE')
        : t('TIER_METRICS.VIEW_TITLE');

    setCustomBreadcrumb([
      {
        title: t('SIDEBAR.MEMBERSHIP_TIERS'),
        path: '/tiers',
      },
      {
        title: t('SIDEBAR.MEMBERSHIP_TIERS_METRIC_DEFINITIONS'),
        path: '/tier-metrics',
      },
      {
        title,
      },
    ]);

    return () => {
      setCustomBreadcrumb(null);
    };
  }, [setCustomBreadcrumb, t, isCreate, isEdit]);

  const handleBack = () => {
    navigate('/tier-metrics');
  };

  const handleSubmit = async () => {
    setConfirm(true);
  };

  const handleConfirm = async () => {
    try {
      const data = form.getValues();

      const payload = {
        metricName: data.metricName,
        metricCode: data.metricCode.toUpperCase(),
        eventTypeCode: data.eventTypeCode,
        status: data.status,
        aggregation: data.aggregation,
        filterJson: data.filterJson,
        formula: data.formula,
      };

      if (isCreate) {
        await createMutation.mutateAsync({
          data: payload,
        });
      } else if (isEdit && id) {
        await updateMutation.mutateAsync({
          id,
          data: payload,
        });
      }

      setConfirm(false);
      navigate('/tier-metrics');
    } catch {
      // Error handled by mutation
    }
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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mr-2"
          >
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
            {/* Common Section */}
            <Card>
              <CardHeader className="p-4">
                <CardTitle>{t('TIER_METRICS.COMMON')}</CardTitle>
                {/*<CardDescription>*/}
                {/*  {isCreate*/}
                {/*    ? t('TIER_METRICS.CREATE_DESCRIPTION')*/}
                {/*    : isEdit*/}
                {/*      ? t('TIER_METRICS.EDIT_DESCRIPTION')*/}
                {/*      : t('TIER_METRICS.VIEW_DESCRIPTION')}*/}
                {/*</CardDescription>*/}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="metricName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('TIER_METRICS.METRIC_NAME')} *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              'TIER_METRICS.METRIC_NAME_PLACEHOLDER',
                            )}
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
                    name="metricCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('TIER_METRICS.METRIC_CODE')} *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              'TIER_METRICS.METRIC_CODE_PLACEHOLDER',
                            )}
                            {...field}
                            onChange={(e) => {
                              const sanitized = e.target.value
                                .toUpperCase()
                                .replace(/[^A-Z0-9_]/g, '');
                              field.onChange(sanitized);
                            }}
                            disabled={isView || isEdit}
                            readOnly={isView || isEdit}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="eventTypeCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('COMMON.EVENT_TYPE')} *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isView}
                        >
                          <FormControl>
                            <SelectTrigger clearable={false}>
                              <SelectValue
                                placeholder={t(
                                  'TIER_METRICS.EVENT_TYPE_PLACEHOLDER',
                                )}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {events.map((event) => (
                              <SelectItem key={event.id} value={event.name}>
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
                    name="status"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <FormLabel className="text-xs font-medium cursor-pointer mb-0">
                          {t('COMMON.STATUS_1')}
                        </FormLabel>
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
              </CardContent>
            </Card>

            {/* Aggregation Section */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>{t('TIER_METRICS.AGGREGATION')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="aggregation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('TIER_METRICS.AGGREGATION')} *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          if (value === 'COUNT') {
                            form.setValue('formula', '');
                          }
                          field.onChange(value);
                        }}
                        value={field.value}
                        disabled={isView}
                      >
                        <FormControl>
                          <SelectTrigger clearable={false}>
                            <SelectValue
                              placeholder={t(
                                'TIER_METRICS.AGGREGATION_PLACEHOLDER',
                              )}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="COUNT">COUNT</SelectItem>
                          <SelectItem value="SUM">SUM</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="filterJson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        {t('TIER_METRICS.FILTER_JSON')}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-pointer" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                            <p className="mb-1">
                              {t('TIER_METRICS.FILTER_JSON_TOOLTIP')}
                            </p>
                            <p className="font-semibold mb-1">
                              {t(
                                'TIER_METRICS.FILTER_JSON_TOOLTIP_EXAMPLES_LABEL',
                              )}
                            </p>
                            <ul className="list-disc pl-4 space-y-1">
                              <li>
                                <code>{`{"category": "food"}`}</code> →{' '}
                                {t(
                                  'TIER_METRICS.FILTER_JSON_TOOLTIP_EXAMPLE_1',
                                )}
                              </li>
                              <li>
                                <code>{`{"amount": {"$gt": 500000}}`}</code> →{' '}
                                {t(
                                  'TIER_METRICS.FILTER_JSON_TOOLTIP_EXAMPLE_2',
                                )}
                              </li>
                              <li>
                                <code>{`{"status": "completed", "category": "food"}`}</code>{' '}
                                →{' '}
                                {t(
                                  'TIER_METRICS.FILTER_JSON_TOOLTIP_EXAMPLE_3',
                                )}
                              </li>
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            'TIER_METRICS.FILTER_JSON_PLACEHOLDER',
                          )}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                          }}
                          disabled={isView}
                          readOnly={isView}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Formula Section */}
            {form.watch('aggregation') === 'SUM' && (
              <Card>
                <CardHeader className="p-4">
                  <CardTitle>{t('COMMON.FORMULA')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="formula"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          {t('COMMON.FORMULA')} *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('TIER_METRICS.FORMULA_PLACEHOLDER')}
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                            }}
                            disabled={isView}
                            readOnly={isView}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {!isView && (
              <CardFooter className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {t('COMMON.CANCEL')}
                </Button>
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
                    t('COMMON.SAVE')
                  )}
                </Button>
              </CardFooter>
            )}
          </form>
        </Form>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={confirm} onOpenChange={(open) => setConfirm(open)}>
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {isCreate
                ? t('TIER_METRICS.CREATE_TITLE')
                : t('TIER_METRICS.UPDATE_TITLE')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {isCreate
                ? t('TIER_METRICS.CONFIRM_CREATE_DESCRIPTION')
                : t('TIER_METRICS.CONFIRM_UPDATE_DESCRIPTION')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-1">
            <Button
              variant="outline"
              onClick={() => setConfirm(false)}
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
                t('COMMON.CONFIRM')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}

export default TierMetricFormPage;
