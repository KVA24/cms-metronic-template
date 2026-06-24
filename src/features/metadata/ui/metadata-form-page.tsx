import { useEffect, useMemo, useState } from 'react';
import {
  MetadataCreateDto,
  MetadataUpdateDto,
} from '@/features/metadata/api/metadataApi';
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
  LoaderCircleIcon,
  Plus,
  Trash2,
} from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import * as z from 'zod';
import {
  useCreateMetadata,
  useMetadataDetail,
  useUpdateMetadata,
} from '../hooks/use-metadata-queries';
import { MetadataConstraintsEditor } from './metadata-constraints-editor';

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

const metadataPropertySchema = z.object({
  name: z
    .string()
    .min(1, 'VALIDATION.PROPERTY_NAME_REQUIRED')
    .regex(
      /^[a-zA-Z0-9\u00C0-\u024F_]+$/,
      'VALIDATION.PROPERTY_NAME_INVALID_FORMAT',
    ),
  dataType: z.string().min(1, 'VALIDATION.DATA_TYPE_REQUIRED'),
  isRequired: z.boolean(),
  isMultipleValue: z.boolean(),
  constraints: z.record(z.any()).optional(),
});

const metadataSchema = z.object({
  name: z
    .string()
    .min(1, 'VALIDATION.NAME_REQUIRED')
    .max(100, 'VALIDATION.NAME_TOO_LONG'),
  description: z
    .string()
    .max(500, 'VALIDATION.DESCRIPTION_TOO_LONG')
    .optional(),
  level: z.number().min(1).max(2),
  metadata: z.array(metadataPropertySchema),
  otpCode: z.string().optional(),
});

type MetadataFormValues = z.infer<typeof metadataSchema>;

interface MetadataFormPageProps {
  mode: 'create' | 'edit' | 'view';
}

export function MetadataFormPage({ mode }: MetadataFormPageProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const searchParams = new URLSearchParams(window.location.search);
  const levelParam = searchParams.get('level');
  const isNestedSchemaParam = levelParam === '2';
  const { setCustomBreadcrumb } = useBreadcrumb();
  const { t, language } = useTranslations();

  const [isFormReady, setIsFormReady] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  // React Query hooks
  const metadataId = useMemo(() => id, [id]);
  const {
    data: metadataDetail,
    isLoading: isLoadingDetail,
    error: detailError,
    refetch: refetchDetail,
  } = useMetadataDetail(metadataId, {
    enabled: (isEdit || isView) && !!metadataId,
  });

  const createMetadataMutation = useCreateMetadata();
  const updateMetadataMutation = useUpdateMetadata();

  const form = useForm<MetadataFormValues>({
    resolver: createTranslatedZodResolver(metadataSchema, t),
    defaultValues: {
      name: '',
      description: '',
      level: isNestedSchemaParam ? 2 : 1,
      metadata: [],
      otpCode: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'metadata',
  });

  const watchedMetadata = form.watch('metadata');

  // Sync form validation with language changes
  useFormLanguageSync(form, language);

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
        storage.setItem('metadata_form_draft', serialized);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, isCreate]);

  // Load form data from localStorage on mount for create mode
  useEffect(() => {
    if (isCreate && !isLoadingDetail) {
      const saved = storage.getItem('metadata_form_draft');
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

  // Watch dataType changes and reset constraints — chỉ reset khi user thực sự đổi dataType
  // (không reset khi load data từ API)

  // Set custom breadcrumb
  useEffect(() => {
    const breadcrumbTitle = isCreate
      ? t('METADATA.FORM.CREATE_TITLE')
      : isEdit
        ? metadataDetail?.name || t('METADATA.FORM.EDIT_TITLE')
        : metadataDetail?.name || t('METADATA.FORM.VIEW_TITLE');

    setCustomBreadcrumb([
      {
        title: t('COMMON.METADATA'),
        path: '/metadata',
      },
      {
        title: breadcrumbTitle,
      },
    ]);

    // Cleanup breadcrumb when component unmounts
    return () => {
      setCustomBreadcrumb(null);
    };
  }, [isCreate, isEdit, metadataDetail, setCustomBreadcrumb, t]);

  // Populate form when metadata is loaded
  useEffect(() => {
    if (metadataDetail && (isEdit || isView)) {
      // Populate constraints with refSchemaId if it exists at property level
      const metadataWithConstraints =
        metadataDetail.metadata?.map((prop) => {
          const result = { ...prop };
          if (prop.refSchemaId && prop.dataType === 'OBJECT') {
            result.constraints = {
              ...result.constraints,
              refSchemaId: prop.refSchemaId,
            };
          }
          return result;
        }) || [];

      form.reset({
        name: metadataDetail.name,
        description: metadataDetail.description || '',
        level: metadataDetail.level,
        metadata: metadataWithConstraints,
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
  }, [metadataDetail, isLoadingDetail, isEdit, isView, isCreate, form]);

  const handleSubmit = async (_data: MetadataFormValues) => {
    setConfirm(true);
  };

  const handleConfirm = async () => {
    try {
      const data = form.getValues();

      // Helper function to clean up constraints - only keep fields with actual values
      const cleanConstraints = (prop: any) => {
        const constraints = prop.constraints || {};
        const cleaned: Record<string, any> = {};

        Object.entries(constraints).forEach(([key, value]) => {
          if (
            value !== undefined &&
            value !== null &&
            value !== '' &&
            (Array.isArray(value) ? value.length > 0 : true)
          ) {
            cleaned[key] = value;
          }
        });

        return cleaned;
      };

      const metadataWithRefSchemaId = data.metadata.map((prop: any) => {
        const result = { ...prop };
        const cleanedConstraints = cleanConstraints(prop);

        if (cleanedConstraints.refSchemaId) {
          result.refSchemaId = cleanedConstraints.refSchemaId;
        }

        result.constraints = cleanedConstraints;
        return result;
      });

      const payload: MetadataCreateDto | MetadataUpdateDto = {
        name: data.name,
        description: data.description,
        level: data.level,
        metadata: metadataWithRefSchemaId,
        otpCode: '',
      };

      if (isCreate) {
        await createMetadataMutation.mutateAsync({
          data: payload as MetadataCreateDto,
        });
        storage.removeItem('metadata_form_draft');
        navigate('/metadata');
      } else if (isEdit && id) {
        await updateMetadataMutation.mutateAsync({
          id,
          data: payload as MetadataUpdateDto,
        });
        navigate('/metadata');
      }

      setConfirm(false);
    } catch (error) {
      console.error('Failed to submit metadata:', error);
    }
  };

  const handleAddProperty = () => {
    append({
      name: '',
      dataType: '',
      isRequired: false,
      isMultipleValue: false,
      constraints: {},
    });
  };

  const handleBack = () => {
    navigate('/metadata');
  };

  const handleEdit = () => {
    if (id) {
      navigate(`/metadata/edit/${id}`);
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
                : 'Failed to load metadata details'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => refetchDetail()}>{t('COMMON.RETRY')}</Button>
        </div>
      </Container>
    );
  }

  if (
    isLoadingDetail ||
    ((isEdit || isView) && !metadataDetail) ||
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
    createMetadataMutation.isPending || updateMetadataMutation.isPending;
  const error = createMetadataMutation.error || updateMetadataMutation.error;

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
                {t('METADATA.FORM.EDIT_BUTTON')}
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
                    ? t('METADATA.FORM.BASIC_INFO_DESC_VIEW')
                    : t('METADATA.FORM.BASIC_INFO_DESC_EDIT')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {isNestedSchemaParam
                            ? t('METADATA.FORM.OBJECT_NAME')
                            : t('METADATA.FORM.CATEGORY_NAME')}{' '}
                          *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={
                              isNestedSchemaParam
                                ? t('METADATA.FORM.OBJECT_NAME_PLACEHOLDER')
                                : t('METADATA.FORM.CATEGORY_NAME_PLACEHOLDER')
                            }
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

                  {/*<FormField*/}
                  {/*  control={form.control}*/}
                  {/*  name="level"*/}
                  {/*  render={({ field }) => (*/}
                  {/*    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">*/}
                  {/*      <div className="space-y-0.5">*/}
                  {/*        <FormLabel className="text-sm font-medium">*/}
                  {/*          {t('METADATA.FORM.NESTED_SCHEMA')}*/}
                  {/*        </FormLabel>*/}
                  {/*      </div>*/}
                  {/*      <FormControl>*/}
                  {/*        <Switch*/}
                  {/*          checked={field.value === 2}*/}
                  {/*          onCheckedChange={(checked) =>*/}
                  {/*            field.onChange(checked ? 2 : 1)*/}
                  {/*          }*/}
                  {/*          disabled={true}*/}
                  {/*        />*/}
                  {/*      </FormControl>*/}
                  {/*    </FormItem>*/}
                  {/*  )}*/}
                  {/*/>*/}
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>{t('COMMON.DESCRIPTION')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t(
                            'METADATA.FORM.DESCRIPTION_PLACEHOLDER',
                          )}
                          {...field}
                          disabled={isView}
                          readOnly={isView}
                          maxLength={500}
                          rows={3}
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
                <div className="flex items-center justify-between w-full">
                  <div>
                    <CardTitle>
                      {isNestedSchemaParam
                        ? t('METADATA.FORM.OBJECT_PROPERTIES')
                        : t('METADATA.FORM.PROPERTIES')}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {fields.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('METADATA.FORM.NO_PROPERTIES')}
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
                            {t('METADATA.FORM.PROPERTY_LABEL')} {index + 1}
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

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <FormField
                            control={form.control}
                            name={`metadata.${index}.name`}
                            render={({ field }) => {
                              const isExistingProperty =
                                'id' in (watchedMetadata[index] || {});
                              return (
                                <FormItem>
                                  <FormLabel className="text-xs">
                                    {t('COMMON.NAME')} *
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder={t(
                                        'METADATA.FORM.PROPERTY_NAME_PLACEHOLDER',
                                      )}
                                      {...field}
                                      onChange={(e) => {
                                        // Chỉ cho phép chữ, số, dấu có dấu và "_", không khoảng trắng
                                        const val = e.target.value.replace(
                                          /[^a-zA-Z0-9\u00C0-\u024F_]/g,
                                          '',
                                        );
                                        field.onChange(val);
                                      }}
                                      disabled={
                                        isView || (isEdit && isExistingProperty)
                                      }
                                      readOnly={isView}
                                      maxLength={100}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />

                          <FormField
                            control={form.control}
                            name={`metadata.${index}.dataType`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  {t('METADATA.FORM.PROPERTY_DATA_TYPE')} *
                                </FormLabel>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    // Reset constraints when dataType changes
                                    form.setValue(
                                      `metadata.${index}.constraints`,
                                      value === 'FLAG' ? {} : {},
                                    );
                                    // FLAG không hỗ trợ multiple value
                                    if (value === 'FLAG') {
                                      form.setValue(
                                        `metadata.${index}.isMultipleValue`,
                                        false,
                                      );
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
                                          'METADATA.FORM.PROPERTY_DATA_TYPE_PLACEHOLDER',
                                        )}
                                      />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {DATA_TYPES.filter((type) => {
                                      // Don't allow OBJECT type for level 2 (nested schemas)
                                      if (
                                        type.value === 'OBJECT' &&
                                        form.watch('level') === 2
                                      ) {
                                        return false;
                                      }
                                      return true;
                                    }).map((type) => (
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
                            name={`metadata.${index}.isRequired`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-xs font-medium">
                                    {t('METADATA.FORM.PROPERTY_REQUIRED')}
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

                          <FormField
                            control={form.control}
                            name={`metadata.${index}.isMultipleValue`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-xs font-medium">
                                    {t('METADATA.FORM.PROPERTY_MULTIPLE')}
                                  </FormLabel>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={
                                      isView ||
                                      form.watch(
                                        `metadata.${index}.dataType`,
                                      ) === 'FLAG'
                                    }
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {![
                          'FLAG',
                          'DATE',
                          'DATE_TIME',
                          'IMAGE_URL',
                          'GEOPOINT',
                        ].includes(
                          form.watch(`metadata.${index}.dataType`),
                        ) && (
                          <MetadataConstraintsEditor
                            dataType={
                              form.watch(`metadata.${index}.dataType`) as any
                            }
                            propertyIndex={index}
                            isView={isView}
                          />
                        )}
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
                    {t('METADATA.FORM.ADD_PROPERTY')}
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

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {isCreate
                ? t('METADATA.FORM.CONFIRM_CREATE_TITLE')
                : t('METADATA.FORM.CONFIRM_UPDATE_TITLE')}
            </DialogTitle>
            <DialogDescription>
              {isCreate
                ? t('METADATA.FORM.CONFIRM_CREATE_DESC')
                : t('METADATA.FORM.CONFIRM_UPDATE_DESC')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-1">
            <Button
              variant="outline"
              onClick={() => setConfirm(false)}
              disabled={
                createMetadataMutation.isPending ||
                updateMetadataMutation.isPending
              }
            >
              {t('COMMON.CANCEL')}
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={
                createMetadataMutation.isPending ||
                updateMetadataMutation.isPending
              }
            >
              {createMetadataMutation.isPending ||
              updateMetadataMutation.isPending ? (
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
