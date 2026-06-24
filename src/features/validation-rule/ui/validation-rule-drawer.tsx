import { useEffect } from 'react';
import { ValidationRule } from '@/features/validation-rule/api/validationRuleApi';
import { useTranslations } from '@/shared/hooks/use-translations';
import { UserRole } from '@/shared/lib/rbac';
import {
  createTranslatedZodResolver,
  useFormLanguageSync,
} from '@/shared/lib/validation-utils';
import { Button } from '@/shared/ui/atoms/button';
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

const validationRuleSchema = z.object({
  name: z
    .string()
    .min(1, 'VALIDATION.NAME_REQUIRED')
    .max(100, 'VALIDATION.NAME_TOO_LONG'),
  description: z
    .string()
    .max(500, 'VALIDATION.DESCRIPTION_TOO_LONG')
    .optional(),
  rule: z.string().min(1, 'VALIDATION.RULE_REQUIRED'),
});

type ValidationRuleFormValues = z.infer<typeof validationRuleSchema>;

interface ValidationRuleDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ValidationRuleFormValues) => Promise<void>;
  validationRule?: ValidationRule | null;
  isLoading?: boolean;
  mode?: 'view' | 'edit' | 'create';
  onEdit?: () => void;
}

export function ValidationRuleDrawer({
  open,
  onClose,
  onSubmit,
  validationRule,
  isLoading = false,
  mode = 'create',
  onEdit,
}: ValidationRuleDrawerProps) {
  const { t, language } = useTranslations();
  const isView = mode === 'view';
  const isEdit = mode === 'edit';

  const form = useForm<ValidationRuleFormValues>({
    resolver: createTranslatedZodResolver(validationRuleSchema, t),
    defaultValues: {
      name: '',
      description: '',
      rule: '',
    },
  });

  useFormLanguageSync(form, language);

  // Reset form when validationRule changes or drawer opens
  useEffect(() => {
    if (open) {
      if (validationRule) {
        form.reset({
          name: validationRule.name,
          description: validationRule.description || '',
          rule: validationRule.rule,
        });
      } else {
        form.reset({
          name: '',
          description: '',
          rule: '',
        });
      }
    }
  }, [validationRule, open, form]);

  const handleSubmit = async (data: ValidationRuleFormValues) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to submit validation rule:', error);
      // Error handled in parent, keep dialog open
    }
  };

  const handleClose = () => {
    form.reset();
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
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isView
              ? t('VALIDATION_RULES.DRAWER.VIEW_TITLE')
              : isEdit
                ? t('VALIDATION_RULES.DRAWER.EDIT_TITLE')
                : t('VALIDATION_RULES.DRAWER.ADD_TITLE')}
          </SheetTitle>
          <SheetDescription>
            {isView
              ? t('VALIDATION_RULES.DRAWER.VIEW_DESCRIPTION')
              : isEdit
                ? t('VALIDATION_RULES.DRAWER.EDIT_DESCRIPTION')
                : t('VALIDATION_RULES.DRAWER.ADD_DESCRIPTION')}
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
                      placeholder={t(
                        'VALIDATION_RULES.DRAWER.NAME_PLACEHOLDER',
                      )}
                      {...field}
                      disabled={isView || isEdit}
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
                  <FormLabel>{t('COMMON.DESCRIPTION')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t(
                        'VALIDATION_RULES.DRAWER.DESCRIPTION_PLACEHOLDER',
                      )}
                      rows={3}
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
              name="rule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('VALIDATION_RULES.DRAWER.RULE')} *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t(
                        'VALIDATION_RULES.DRAWER.RULE_PLACEHOLDER',
                      )}
                      rows={5}
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
                  <PermissionGuard
                    requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}
                  >
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
    </Sheet>
  );
}
