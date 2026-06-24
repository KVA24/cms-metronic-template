import { useEffect, useState } from 'react';
import { Category } from '@/features/category/api/categoryApi';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/atoms/sheet';
import { Switch } from '@/shared/ui/atoms/switch';
import { Textarea } from '@/shared/ui/atoms/textarea';
import { PermissionGuard } from '@/shared/ui/molecules/permission-guard';
import { Edit, LoaderCircleIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, 'VALIDATION.NAME_REQUIRED'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    required_error: 'VALIDATION.STATUS_REQUIRED',
  }),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormValues) => Promise<void>;
  category?: Category | null;
  isLoading?: boolean;
  mode?: 'view' | 'edit' | 'create';
  onEdit?: () => void;
}

export function CategoryDrawer({
  open,
  onClose,
  onSubmit,
  category,
  isLoading = false,
  mode = 'create',
  onEdit,
}: CategoryDrawerProps) {
  const { t, language } = useTranslations();
  const isView = mode === 'view';
  const isEdit = mode === 'edit';

  const [confirm, setConfirm] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: createTranslatedZodResolver(categorySchema, t),
    defaultValues: {
      name: '',
      description: '',
      status: 'INACTIVE',
    },
  });

  useFormLanguageSync(form, language);

  // Reset form when category changes or drawer opens
  useEffect(() => {
    if (open) {
      if (category) {
        form.reset({
          name: category.name,
          description: category.description,
          status: category.status,
        });
      } else {
        form.reset({
          name: '',
          description: '',
          status: 'INACTIVE',
        });
      }
    }
  }, [category, open, form]);

  // Reset confirmation dialog when mode changes
  useEffect(() => {
    setConfirm(false);
  }, [mode]);

  const handleSubmit = async () => {
    setConfirm(true);
  };

  const handleConfirm = async () => {
    try {
      const data = form.getValues();
      await onSubmit(data);
      setConfirm(false);
    } catch (error) {
      console.error('Failed to submit category:', error);
    }
  };

  const handleClose = () => {
    form.reset();
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
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isView
              ? t('CATEGORY.DRAWER.VIEW_TITLE')
              : isEdit
                ? t('CATEGORY.DRAWER.EDIT_TITLE')
                : t('CATEGORY.DRAWER.ADD_TITLE')}
          </SheetTitle>
          <SheetDescription>
            {isView
              ? t('CATEGORY.DRAWER.VIEW_DESCRIPTION')
              : isEdit
                ? t('CATEGORY.DRAWER.EDIT_DESCRIPTION')
                : t('CATEGORY.DRAWER.ADD_DESCRIPTION')}
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
                      placeholder={t('CATEGORY.DRAWER.DESCRIPTION_PLACEHOLDER')}
                      {...field}
                      disabled={isView}
                      readOnly={isView}
                      rows={4}
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
                    <FormDescription>
                      {t('CATEGORY.DRAWER.STATUS_DESCRIPTION')}
                    </FormDescription>
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
                  <PermissionGuard requiredRoles={[UserRole.ADMIN]}>
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
                ? t('CATEGORY.DRAWER.UPDATE_TITLE')
                : t('CATEGORY.DRAWER.CREATE_TITLE')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {isEdit
                ? t('CATEGORY.DRAWER.CONFIRM_UPDATE_DESCRIPTION')
                : t('CATEGORY.DRAWER.CONFIRM_CREATE_DESCRIPTION')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-1">
            <Button
              variant="outline"
              onClick={() => {
                setConfirm(false);
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
