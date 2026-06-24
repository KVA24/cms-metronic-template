import { useEffect, useMemo, useState } from 'react';
import {
  useSharedCurrencies,
  useSharedExpiryPoliciesByCurrency,
} from '@/features/shared';
import { useBreadcrumb } from '@/shared/contexts/breadcrumb-context';
import { useTranslations } from '@/shared/hooks/use-translations';
import { UserRole } from '@/shared/lib/rbac/roles';
import { storage } from '@/shared/lib/storage';
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
import { Switch } from '@/shared/ui/atoms/switch';
import { Textarea } from '@/shared/ui/atoms/textarea';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
} from '@/shared/ui/molecules/common/toolbar';
import { Container } from '@/shared/ui/molecules/container';
import { PermissionGuard } from '@/shared/ui/molecules/permission-guard';
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircleIcon,
  Plus,
  Trash2,
} from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import * as z from 'zod';
import {
  useCreatePartner,
  usePartnerDetail,
  useUpdatePartner,
} from '../hooks/use-partner-queries';

const serviceSchema = z
  .object({
    name: z.string().trim().min(1, 'VALIDATION.NAME_REQUIRED'),
    code: z.string().trim().min(1, 'VALIDATION.SERVICE_CODE_REQUIRED'),
    currencyId: z.string().min(1, 'VALIDATION.CURRENCY_REQUIRED'),
    policyId: z.string().optional(),
    earnRate: z
      .number()
      .min(0, 'VALIDATION.VALUE_NON_NEGATIVE')
      .max(999_999_999_999_999, 'VALIDATION.VALUE_TOO_LARGE'),
    burnRate: z
      .number()
      .min(0, 'VALIDATION.VALUE_NON_NEGATIVE')
      .max(999_999_999_999_999, 'VALIDATION.VALUE_TOO_LARGE'),
    roundingRule: z.enum(['FLOOR', 'CEILING', 'HALF_UP'], {
      required_error: 'VALIDATION.ROUNDING_RULE_REQUIRED',
    }),
    maxEarnPointsPerDay: z
      .number()
      // .min(0, 'VALIDATION.VALUE_NON_NEGATIVE')
      // .max(999_999_999_999_999, 'VALIDATION.VALUE_TOO_LARGE')
      .optional()
      .nullable(),
    maxBurnPointsPerDay: z
      .number()
      // .min(0, 'VALIDATION.VALUE_NON_NEGATIVE')
      // .max(999_999_999_999_999, 'VALIDATION.VALUE_TOO_LARGE')
      .optional()
      .nullable(),
    description: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE'], {
      required_error: 'VALIDATION.STATUS_REQUIRED',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.currencyId && (!data.policyId || data.policyId.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['policyId'],
        message: 'VALIDATION.POLICY_REQUIRED',
      });
    }
  });

const partnerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'VALIDATION.NAME_REQUIRED')
    .max(50, 'VALIDATION.NAME_TOO_LONG'),
  code: z
    .string()
    .trim()
    .min(1, 'VALIDATION.CODE_REQUIRED')
    .max(25, 'VALIDATION.CODE_TOO_LONG'),
  icon: z
    .string()
    .url('VALIDATION.ICON_URL_REQUIRED')
    .optional()
    .or(z.literal('')),
  cover: z
    .string()
    .url('VALIDATION.COVER_URL_REQUIRED')
    .optional()
    .or(z.literal('')),
  contactEmail: z
    .string()
    .email('VALIDATION.CONTACT_EMAIL_INVALID')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .min(1, 'VALIDATION.PHONE_REQUIRED')
    .optional()
    .or(z.literal('')),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    required_error: 'VALIDATION.STATUS_REQUIRED',
  }),
  services: z.array(serviceSchema).superRefine((services, ctx) => {
    const codes = services.map((s) => s.code.trim().toLowerCase());
    codes.forEach((code, index) => {
      if (codes.indexOf(code) !== index) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'VALIDATION.SERVICE_CODE_DUPLICATE',
          path: [index, 'code'],
        });
      }
    });
    const names = services.map((s) => s.name.trim().toLowerCase());
    names.forEach((name, index) => {
      if (names.indexOf(name) !== index) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'VALIDATION.PROPERTY_NAME_DUPLICATE',
          path: [index, 'name'],
        });
      }
    });
  }),
});

type PartnerFormValues = z.infer<typeof partnerSchema>;

interface PartnerFormPageProps {
  mode: 'create' | 'edit' | 'view';
}

export function PartnerFormPage({ mode }: PartnerFormPageProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { setCustomBreadcrumb } = useBreadcrumb();
  const { t, language } = useTranslations();

  const [confirm, setConfirm] = useState(false);
  const [deleteServiceIndex, setDeleteServiceIndex] = useState<number | null>(null);
  const [isFormReady, setIsFormReady] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);

  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  const partnerId = useMemo(() => id, [id]);
  const {
    data: partnerDetail,
    isLoading: isLoadingDetail,
    error: detailError,
    refetch: refetchDetail,
  } = usePartnerDetail(partnerId, {
    enabled: (isEdit || isView) && !!partnerId,
  });

  const { data: currenciesData } = useSharedCurrencies({});
  const currencies = currenciesData?.data || [];

  const createPartnerMutation = useCreatePartner();
  const updatePartnerMutation = useUpdatePartner();

  const form = useForm<PartnerFormValues>({
    resolver: createTranslatedZodResolver(partnerSchema, t),
    defaultValues: {
      name: '',
      code: '',
      icon: '',
      cover: '',
      contactEmail: '',
      phone: '',
      description: '',
      status: 'INACTIVE',
      services: [],
    },
  });

  useFormLanguageSync(form, language);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'services',
  });

  const watchedServices = form.watch('services');

  // Reset policyId when currencyId changes
  useEffect(() => {
    const subscription = form.watch((_value, { name }) => {
      if (name?.startsWith('services.') && name?.endsWith('.currencyId')) {
        const match = name.match(/services\.(\d+)\.currencyId/);
        if (match) {
          const index = parseInt(match[1]);
          const currentPolicyId = form.getValues(`services.${index}.policyId`);
          if (currentPolicyId) {
            form.setValue(`services.${index}.policyId`, '');
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    setIsFormReady(false);
  }, [mode, id]);

  // Save draft for create mode
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (isCreate) {
        storage.setItem('partner_form_draft', JSON.stringify(data));
      }
    });
    return () => subscription.unsubscribe();
  }, [form, isCreate]);

  // Load draft for create mode
  useEffect(() => {
    if (isCreate && !isLoadingDetail) {
      const saved = storage.getItem('partner_form_draft');
      if (saved) {
        try {
          form.reset(JSON.parse(saved));
        } catch {
          // ignore
        }
      }
      setIsFormReady(true);
    }
  }, [isCreate, isLoadingDetail, form]);

  // Breadcrumb
  useEffect(() => {
    const breadcrumbTitle = isCreate
      ? t('PARTNERS.FORM.CREATE_TITLE')
      : isEdit
        ? partnerDetail?.name || t('PARTNERS.FORM.EDIT_TITLE')
        : partnerDetail?.name || t('PARTNERS.FORM.VIEW_TITLE');

    setCustomBreadcrumb([
      { title: t('PARTNERS.PAGE.TITLE'), path: '/partners' },
      { title: breadcrumbTitle },
    ]);
    return () => setCustomBreadcrumb(null);
  }, [isCreate, isEdit, partnerDetail, setCustomBreadcrumb, t]);

  // Populate form from detail
  useEffect(() => {
    if (partnerDetail && (isEdit || isView)) {
      form.reset({
        name: partnerDetail.name,
        code: partnerDetail.code,
        icon: partnerDetail.icon || '',
        cover: partnerDetail.cover || '',
        contactEmail: partnerDetail.contactEmail,
        phone: partnerDetail.phone,
        description: partnerDetail.description || '',
        status: partnerDetail.status,
        services: partnerDetail.services || [],
      });
      const readyTimer = setTimeout(() => setIsFormReady(true), 0);
      return () => clearTimeout(readyTimer);
    } else if (isCreate && !isLoadingDetail && !isFormReady) {
      setIsFormReady(true);
    }
  }, [partnerDetail, isLoadingDetail, isEdit, isView, isCreate, form]);

  const handleSubmit = async () => {
    setConfirm(true);
  };

  const handleConfirm = async () => {
    try {
      const data = form.getValues();

      const payload = {
        ...data,
        icon: data.icon || '',
        cover: data.cover || '',
        description: data.description || '',
        contactEmail: data.contactEmail || '',
        phone: data.phone || '',
      };

      if (isCreate) {
        await createPartnerMutation.mutateAsync({ data: payload });
        storage.removeItem('partner_form_draft');
        navigate('/partners');
      } else if (isEdit && id) {
        await updatePartnerMutation.mutateAsync({
          id,
          data: payload,
        });
        navigate('/partners');
      }

      setConfirm(false);
    } catch {
      // handled by mutation
    }
  };

  const handleBack = () => navigate('/partners');
  const handleEdit = () => id && navigate(`/partners/edit/${id}`);
  
  const handleDeleteService = (index: number) => {
    setDeleteServiceIndex(index);
  };
  
  const confirmDeleteService = () => {
    if (deleteServiceIndex !== null) {
      remove(deleteServiceIndex);
      setDeleteServiceIndex(null);
    }
  };
  
  const cancelDeleteService = () => {
    setDeleteServiceIndex(null);
  };

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
        <div className="mx-auto max-w-2xl">
          <Alert variant="destructive" appearance="light" className="mb-6">
            <AlertIcon>
              <AlertCircle />
            </AlertIcon>
            <AlertTitle>{t('COMMON.ERROR')}</AlertTitle>
            <AlertDescription className="break-all">
              {detailError instanceof Error
                ? detailError.message
                : 'Failed to load partner details'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => refetchDetail()}>{t('COMMON.RETRY')}</Button>
        </div>
      </Container>
    );
  }

  if (
    isLoadingDetail ||
    ((isEdit || isView) && !partnerDetail) ||
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
    createPartnerMutation.isPending || updatePartnerMutation.isPending;
  const error = createPartnerMutation.error || updatePartnerMutation.error;

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
            <PermissionGuard requiredRoles={[UserRole.ADMIN]}>
              <Button onClick={handleEdit}>
                {t('PARTNERS.FORM.EDIT_BUTTON')}
              </Button>
            </PermissionGuard>
          )}
        </ToolbarActions>
      </Toolbar>

      <div className="mx-auto">
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

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <Card>
              <CardHeader className="p-4">
                <CardTitle>{t('COMMON.BASIC_INFORMATION')}</CardTitle>
                <CardDescription>
                  {isView
                    ? t('PARTNERS.FORM.BASIC_INFO_DESC_VIEW')
                    : t('PARTNERS.FORM.BASIC_INFO_DESC_EDIT')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('COMMON.NAME')} *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('PARTNERS.FORM.NAME_PLACEHOLDER')}
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
                            disabled={isView || isEdit}
                            readOnly={isView || isEdit}
                            maxLength={25}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('PARTNERS.FORM.CONTACT_EMAIL')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder={t(
                              'PARTNERS.FORM.CONTACT_EMAIL_PLACEHOLDER',
                            )}
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
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('PARTNERS.FORM.PHONE')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('PARTNERS.FORM.PHONE_PLACEHOLDER')}
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.value.replace(/\D/g, ''));
                            }}
                            disabled={isView}
                            readOnly={isView}
                            maxLength={20}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('PARTNERS.FORM.ICON_URL')}</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder={t(
                              'PARTNERS.FORM.ICON_URL_PLACEHOLDER',
                            )}
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
                    name="cover"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('PARTNERS.FORM.COVER_URL')}</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder={t(
                              'PARTNERS.FORM.COVER_URL_PLACEHOLDER',
                            )}
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

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>{t('COMMON.DESCRIPTION')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t(
                              'PARTNERS.FORM.DESCRIPTION_PLACEHOLDER',
                            )}
                            rows={3}
                            {...field}
                            disabled={isView}
                            readOnly={isView}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {(isView || isEdit) && (
                    <div className="md:col-span-2 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <Label>{t('PARTNERS.FORM.API_KEY')}</Label>
                          <div className="relative">
                            <Input
                              type={showApiKey ? 'text' : 'password'}
                              value={partnerDetail?.apiKey || ''}
                              disabled
                              readOnly
                              className="font-mono pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowApiKey(!showApiKey)}
                            >
                              {showApiKey ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>{t('PARTNERS.FORM.API_SECRET')}</Label>
                          <div className="relative">
                            <Input
                              type={showApiSecret ? 'text' : 'password'}
                              value={partnerDetail?.apiSecret || ''}
                              disabled
                              readOnly
                              className="font-mono pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowApiSecret(!showApiSecret)}
                            >
                              {showApiSecret ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground italic">
                        {t('PARTNERS.FORM.API_KEY_DESCRIPTION')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4">
                <div className="flex items-center justify-between w-full">
                  <CardTitle>{t('PARTNERS.FORM.SERVICES')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {fields.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('PARTNERS.FORM.NO_SERVICES')}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="p-4 border rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium">
                            {t('PARTNERS.FORM.SERVICE_LABEL')} {index + 1}
                          </h4>
                          {!isView && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteService(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`services.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  {t('COMMON.NAME')} *
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={t(
                                      'PARTNERS.FORM.SERVICE_NAME_PLACEHOLDER',
                                    )}
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
                            name={`services.${index}.code`}
                            render={({ field }) => {
                              const isExistingService =
                                'id' in (watchedServices[index] || {});
                              return (
                                <FormItem>
                                  <FormLabel className="text-xs">
                                    {t('COMMON.CODE')} *
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder={t(
                                        'PARTNERS.FORM.SERVICE_CODE_PLACEHOLDER',
                                      )}
                                      {...field}
                                      disabled={
                                        isView || (isEdit && isExistingService)
                                      }
                                      readOnly={isView}
                                      onChange={(e) =>
                                        field.onChange(
                                          e.currentTarget.value.trim(),
                                        )
                                      }
                                      maxLength={25}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />

                          <div className="col-span-2">
                            <FormField
                              control={form.control}
                              name={`services.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">
                                    {t('COMMON.DESCRIPTION')}
                                  </FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder={t(
                                        'PARTNERS.FORM.SERVICE_DESCRIPTION_PLACEHOLDER',
                                      )}
                                      rows={1}
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
                          </div>

                          <FormField
                            control={form.control}
                            name={`services.${index}.currencyId`}
                            render={({ field, fieldState }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  {t('COMMON.CURRENCY')} *
                                </FormLabel>
                                <FormControl>
                                  <Select
                                    value={field.value || ''}
                                    onValueChange={field.onChange}
                                    disabled={isView}
                                  >
                                    <SelectTrigger
                                      className={
                                        fieldState.error
                                          ? 'border-destructive'
                                          : ''
                                      }
                                    >
                                      <SelectValue
                                        placeholder={t(
                                          'PARTNERS.FORM.SERVICE_CURRENCY_PLACEHOLDER',
                                        )}
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {currencies.map((currency) => (
                                        <SelectItem
                                          key={currency.id}
                                          value={currency.id}
                                        >
                                          {`${currency.name} (${currency.code})`}
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
                            name={`services.${index}.policyId`}
                            render={({ field }) => {
                              const currentCurrencyId =
                                watchedServices[index]?.currencyId;
                              const { data: policiesData } =
                                useSharedExpiryPoliciesByCurrency(
                                  currentCurrencyId,
                                  { enabled: !!currentCurrencyId },
                                );
                              const policies = policiesData?.data || [];

                              return (
                                <FormItem>
                                  <FormLabel className="text-xs">
                                    {t('PARTNERS.FORM.SERVICE_POLICY')}
                                    {currentCurrencyId && (
                                      <span className="text-destructive">
                                        {' '}
                                        *
                                      </span>
                                    )}
                                  </FormLabel>
                                  <FormControl>
                                    <Select
                                      value={field.value || ''}
                                      onValueChange={field.onChange}
                                      disabled={isView || !currentCurrencyId}
                                    >
                                      <SelectTrigger>
                                        <SelectValue
                                          placeholder={
                                            !currentCurrencyId
                                              ? t(
                                                  'PARTNERS.FORM.SERVICE_POLICY_SELECT_CURRENCY_FIRST',
                                                )
                                              : t(
                                                  'PARTNERS.FORM.SERVICE_POLICY_PLACEHOLDER',
                                                )
                                          }
                                        />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {policies.length === 0 &&
                                        currentCurrencyId ? (
                                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                            {t(
                                              'PARTNERS.FORM.SERVICE_POLICY_NO_OPTIONS',
                                            )}
                                          </div>
                                        ) : (
                                          policies.map((policy) => (
                                            <SelectItem
                                              key={policy.id}
                                              value={policy.id}
                                            >
                                              {`${policy.name}`}
                                            </SelectItem>
                                          ))
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />

                          <FormField
                            control={form.control}
                            name={`services.${index}.roundingRule`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  {t('PARTNERS.FORM.SERVICE_ROUNDING_RULE')} *
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value || ''}
                                  disabled={isView}
                                >
                                  <FormControl>
                                    <SelectTrigger clearable={false}>
                                      <SelectValue
                                        placeholder={t(
                                          'PARTNERS.FORM.SERVICE_ROUNDING_RULE_PLACEHOLDER',
                                        )}
                                      />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="FLOOR">
                                      {t('PARTNERS.FORM.ROUNDING_FLOOR')}
                                    </SelectItem>
                                    <SelectItem value="CEILING">
                                      {t('PARTNERS.FORM.ROUNDING_CEILING')}
                                    </SelectItem>
                                    <SelectItem value="HALF_UP">
                                      {t('PARTNERS.FORM.ROUNDING_HALF_UP')}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`services.${index}.status`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="">
                                  <FormLabel>{t('COMMON.STATUS_1')}</FormLabel>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value === 'ACTIVE'}
                                    onCheckedChange={(checked) =>
                                      field.onChange(
                                        checked ? 'ACTIVE' : 'INACTIVE',
                                      )
                                    }
                                    disabled={isView}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`services.${index}.earnRate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  {t('PARTNERS.FORM.SERVICE_EARN_RATE')} *
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    {...field}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value);
                                      field.onChange(isNaN(value) ? 0 : value);
                                    }}
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
                            name={`services.${index}.burnRate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  {t('PARTNERS.FORM.SERVICE_BURN_RATE')} *
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    {...field}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value);
                                      field.onChange(isNaN(value) ? 0 : value);
                                    }}
                                    disabled={isView}
                                    readOnly={isView}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/*<FormField*/}
                          {/*  control={form.control}*/}
                          {/*  name={`services.${index}.maxEarnPointsPerDay`}*/}
                          {/*  render={({ field }) => (*/}
                          {/*    <FormItem>*/}
                          {/*      <FormLabel className="text-xs">*/}
                          {/*        {t('PARTNERS.FORM.SERVICE_MAX_EARN_POINTS')} **/}
                          {/*      </FormLabel>*/}
                          {/*      <FormControl>*/}
                          {/*        <Input*/}
                          {/*          type="number"*/}
                          {/*          min="0"*/}
                          {/*          placeholder="0"*/}
                          {/*          {...field}*/}
                          {/*          onChange={(e) => {*/}
                          {/*            const raw = e.target.value.replace(*/}
                          {/*              /\D/g,*/}
                          {/*              '',*/}
                          {/*            );*/}
                          {/*            if (raw.length <= 15) {*/}
                          {/*              field.onChange(parseInt(raw) || 0);*/}
                          {/*            }*/}
                          {/*          }}*/}
                          {/*          onKeyDown={(e) => {*/}
                          {/*            if (*/}
                          {/*              ['-', '+', 'e', 'E', '.'].includes(*/}
                          {/*                e.key,*/}
                          {/*              )*/}
                          {/*            )*/}
                          {/*              e.preventDefault();*/}
                          {/*          }}*/}
                          {/*          disabled={isView}*/}
                          {/*          readOnly={isView}*/}
                          {/*        />*/}
                          {/*      </FormControl>*/}
                          {/*      <FormMessage />*/}
                          {/*    </FormItem>*/}
                          {/*  )}*/}
                          {/*/>*/}
                          
                          {/*<FormField*/}
                          {/*  control={form.control}*/}
                          {/*  name={`services.${index}.maxBurnPointsPerDay`}*/}
                          {/*  render={({ field }) => (*/}
                          {/*    <FormItem>*/}
                          {/*      <FormLabel className="text-xs">*/}
                          {/*        {t('PARTNERS.FORM.SERVICE_MAX_BURN_POINTS')} **/}
                          {/*      </FormLabel>*/}
                          {/*      <FormControl>*/}
                          {/*        <Input*/}
                          {/*          type="number"*/}
                          {/*          min="0"*/}
                          {/*          placeholder="0"*/}
                          {/*          {...field}*/}
                          {/*          onChange={(e) => {*/}
                          {/*            const raw = e.target.value.replace(*/}
                          {/*              /\D/g,*/}
                          {/*              '',*/}
                          {/*            );*/}
                          {/*            if (raw.length <= 15) {*/}
                          {/*              field.onChange(parseInt(raw) || 0);*/}
                          {/*            }*/}
                          {/*          }}*/}
                          {/*          onKeyDown={(e) => {*/}
                          {/*            if (*/}
                          {/*              ['-', '+', 'e', 'E', '.'].includes(*/}
                          {/*                e.key,*/}
                          {/*              )*/}
                          {/*            )*/}
                          {/*              e.preventDefault();*/}
                          {/*          }}*/}
                          {/*          disabled={isView}*/}
                          {/*          readOnly={isView}*/}
                          {/*        />*/}
                          {/*      </FormControl>*/}
                          {/*      <FormMessage />*/}
                          {/*    </FormItem>*/}
                          {/*  )}*/}
                          {/*/>*/}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              {!isView && (
                <div className="flex justify-end p-4 pt-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        code: '',
                        name: '',
                        currencyId: '',
                        policyId: '',
                        earnRate: 1,
                        burnRate: 1,
                        roundingRule: 'HALF_UP',
                        maxEarnPointsPerDay: 0,
                        maxBurnPointsPerDay: 0,
                        description: '',
                        status: 'INACTIVE',
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('PARTNERS.FORM.ADD_SERVICE')}
                  </Button>
                </div>
              )}
            </Card>

            {!isView && (
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  {t('COMMON.CANCEL')}
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isEdit ? t('COMMON.SAVE') : t('COMMON.CREATE')}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </div>

      <Dialog
        open={confirm}
        onOpenChange={(open) => {
          if (!open) setConfirm(false);
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
                ? t('PARTNERS.FORM.CONFIRM_CREATE_TITLE')
                : t('PARTNERS.FORM.CONFIRM_UPDATE_TITLE')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {isCreate
                ? t('PARTNERS.FORM.CONFIRM_CREATE_DESC')
                : t('PARTNERS.FORM.CONFIRM_UPDATE_DESC')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-1">
            <Button
              variant="outline"
              onClick={() => setConfirm(false)}
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
                <LoaderCircleIcon className="h-4 w-4 animate-spin" />
              ) : isCreate ? (
                t('COMMON.CREATE')
              ) : (
                t('COMMON.SAVE')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Service Confirmation Dialog */}
      <Dialog
        open={deleteServiceIndex !== null}
        onOpenChange={(open) => {
          if (!open) cancelDeleteService();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {t('PARTNERS.FORM.CONFIRM_DELETE_SERVICE_TITLE')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('PARTNERS.FORM.CONFIRM_DELETE_SERVICE_DESC')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-1">
            <Button
              variant="outline"
              onClick={cancelDeleteService}
            >
              {t('COMMON.CANCEL')}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteService}
            >
              {t('COMMON.DELETE')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
