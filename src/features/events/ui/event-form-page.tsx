import { useEffect, useMemo, useState } from 'react';
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
import { Switch } from '@/shared/ui/atoms/switch.tsx';
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
  LoaderCircleIcon,
  Plus,
  Trash2,
} from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import * as z from 'zod';
import {
  useCreateEvent,
  useEventDetail,
  useUpdateEvent,
} from '../hooks/use-event-queries';

const DATA_TYPES = [
  { value: 'TEXT', label: 'Text (String)' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'FLAG', label: 'Boolean (Flag)' },
  { value: 'DATE', label: 'Date' },
  { value: 'DATE_TIME', label: 'Date Time' },
  { value: 'IMAGE_URL', label: 'Image URL' },
  { value: 'OBJECT', label: 'Object' },
  { value: 'GEOPOINT', label: 'Geopoint' },
] as const;

const eventPropertySchema = z.object({
  name: z.string().min(1, 'VALIDATION.PROPERTY_NAME_REQUIRED'),
  dataType: z.string().min(1, 'VALIDATION.DATA_TYPE_REQUIRED'),
  isRequired: z.boolean(),
});

const eventSchema = z.object({
  name: z
    .string()
    .min(1, 'VALIDATION.NAME_REQUIRED')
    .max(100, 'VALIDATION.NAME_TOO_LONG'),
  properties: z.array(eventPropertySchema).superRefine((properties, ctx) => {
    const seen = new Map<string, number>();
    properties.forEach((prop, index) => {
      const key = prop.name.trim().toLowerCase();
      if (key && seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `VALIDATION.PROPERTY_NAME_DUPLICATE`,
          path: [index, 'name'],
        });
      } else if (key) {
        seen.set(key, index);
      }
    });
  }),
  otpCode: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventFormPageProps {
  mode: 'create' | 'edit' | 'view';
}

export function EventFormPage({ mode }: EventFormPageProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { setCustomBreadcrumb } = useBreadcrumb();
  const { t, language } = useTranslations();

  const [confirm, setConfirm] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isFormReady, setIsFormReady] = useState(false);

  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  // React Query hooks
  const eventId = useMemo(() => id, [id]);
  const {
    data: eventDetail,
    isLoading: isLoadingDetail,
    error: detailError,
    refetch: refetchDetail,
  } = useEventDetail(eventId, {
    enabled: (isEdit || isView) && !!eventId,
  });

  const createEventMutation = useCreateEvent();
  const updateEventMutation = useUpdateEvent();

  const form = useForm<EventFormValues>({
    resolver: createTranslatedZodResolver(eventSchema, t),
    defaultValues: {
      name: '',
      properties: [],
      otpCode: '',
    },
  });

  // Sync form validation with language changes
  useFormLanguageSync(form, language);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'properties',
  });

  const watchedProperties = form.watch('properties');

  // Reset form ready state when mode or id changes
  useEffect(() => {
    setIsFormReady(false);
  }, [mode, id]);

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
        storage.setItem('event_form_draft', serialized);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, isCreate]);

  // Load form data from localStorage on mount for create mode
  useEffect(() => {
    if (isCreate && !isLoadingDetail) {
      const saved = storage.getItem('event_form_draft');
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

  // Set custom breadcrumb
  useEffect(() => {
    const breadcrumbTitle = isCreate
      ? t('EVENTS.FORM.CREATE_TITLE')
      : isEdit
        ? eventDetail?.name || t('EVENTS.FORM.EDIT_TITLE')
        : eventDetail?.name || t('EVENTS.FORM.VIEW_TITLE');

    setCustomBreadcrumb([
      {
        title: t('EVENTS.PAGE.TITLE'),
        path: '/event-schemas',
      },
      {
        title: breadcrumbTitle,
      },
    ]);

    // Cleanup breadcrumb when component unmounts
    return () => {
      setCustomBreadcrumb(null);
    };
  }, [isCreate, isEdit, eventDetail, setCustomBreadcrumb, t]);

  // Populate form when event is loaded
  useEffect(() => {
    if (eventDetail && (isEdit || isView)) {
      form.reset({
        name: eventDetail.name,
        properties: eventDetail.properties || [],
        otpCode: '',
      });

      // Mark form as ready after reset
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
  }, [eventDetail, isLoadingDetail, isEdit, isView, isCreate, form]);

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

      const payload = {
        ...data,
        otpCode: otpCode,
      };

      if (isCreate) {
        await createEventMutation.mutateAsync({ data: payload });
        // Clear localStorage after successful create
        storage.removeItem('event_form_draft');
        navigate('/event-schemas');
      } else if (isEdit && id) {
        await updateEventMutation.mutateAsync({
          id,
          data: payload,
        });
        navigate('/event-schemas');
      }

      setConfirm(false);
      setOtpCode('');
    } catch (error) {
      console.error('Failed to submit event:', error);
      // Error handled by mutation, keep dialog open
    }
  };

  const handleAddProperty = () => {
    append({
      name: '',
      dataType: 'TEXT',
      isRequired: false,
    });
  };

  const handleBack = () => {
    navigate('/event-schemas');
  };

  const handleEdit = () => {
    if (id) {
      navigate(`/event-schemas/edit/${id}`);
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

        <div className="mx-auto max-w-2xl">
          <Alert variant="destructive" appearance="light" className="mb-6">
            <AlertIcon>
              <AlertCircle />
            </AlertIcon>
            <AlertTitle>{t('COMMON.ERROR')}</AlertTitle>
            <AlertDescription className="break-all">
              {detailError instanceof Error
                ? detailError.message
                : 'Failed to load event details'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => refetchDetail()}>{t('COMMON.RETRY')}</Button>
        </div>
      </Container>
    );
  }

  if (isLoadingDetail || ((isEdit || isView) && !eventDetail) || !isFormReady) {
    return (
      <Container>
        <div className="flex items-center justify-center h-64">
          <LoaderCircleIcon className="h-8 w-8 animate-spin" />
        </div>
      </Container>
    );
  }

  const isLoading =
    createEventMutation.isPending || updateEventMutation.isPending;
  const error = createEventMutation.error || updateEventMutation.error;

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
                {t('EVENTS.FORM.EDIT_BUTTON')}
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
                    ? t('EVENTS.FORM.BASIC_INFO_DESC_VIEW')
                    : t('EVENTS.FORM.BASIC_INFO_DESC_EDIT')}
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
                            placeholder={t('EVENTS.FORM.NAME_PLACEHOLDER')}
                            {...field}
                            disabled={isView}
                            readOnly={isView}
                            maxLength={30}
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
                <div className="flex items-center justify-between w-full">
                  <div>
                    <CardTitle>{t('EVENTS.FORM.PROPERTIES')}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {fields.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('EVENTS.FORM.NO_PROPERTIES')}
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
                            {t('EVENTS.FORM.PROPERTY_LABEL')} {index + 1}
                          </h4>
                          {!isView && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <FormField
                            control={form.control}
                            name={`properties.${index}.name`}
                            render={({ field }) => {
                              const isExistingProperty =
                                'id' in (watchedProperties[index] || {});
                              return (
                                <FormItem>
                                  <FormLabel className="text-xs">
                                    {t('COMMON.NAME')} *
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder={t(
                                        'EVENTS.FORM.PROPERTY_NAME_PLACEHOLDER',
                                      )}
                                      {...field}
                                      disabled={
                                        isView || (isEdit && isExistingProperty)
                                      }
                                      readOnly={isView}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />

                          <FormField
                            control={form.control}
                            name={`properties.${index}.dataType`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  {t('EVENTS.FORM.PROPERTY_DATA_TYPE')} *
                                </FormLabel>
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
                                          'EVENTS.FORM.PROPERTY_DATA_TYPE_PLACEHOLDER',
                                        )}
                                      />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {DATA_TYPES.map((type) => (
                                      <SelectItem
                                        key={type.value}
                                        value={type.value}
                                      >
                                        {type.label}
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
                            name={`properties.${index}.isRequired`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border px-3">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-xs font-medium">
                                    {t('EVENTS.FORM.PROPERTY_REQUIRED')}
                                  </FormLabel>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isView}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
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
                    onClick={handleAddProperty}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('EVENTS.FORM.ADD_PROPERTY')}
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
                ? t('EVENTS.FORM.OTP_TITLE_CREATE')
                : t('EVENTS.FORM.OTP_TITLE_UPDATE')}
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
    </Container>
  );
}
