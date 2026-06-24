import { useEffect, useState } from 'react';
import { GameItem } from '@/features/game-items/api/gameItemApi';
// import {useGameItemCodes} from '@/features/game-items/hooks/use-game-item-queries';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/atoms/sheet';
// import { Switch } from '@/shared/ui/atoms/switch';
import { PermissionGuard } from '@/shared/ui/molecules/permission-guard';
import { Edit, LoaderCircleIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const gameItemSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'VALIDATION.CODE_REQUIRED')
    .max(50, 'VALIDATION.CODE_TOO_LONG'),
  name: z
    .string()
    .trim()
    .min(1, 'VALIDATION.NAME_REQUIRED')
    .max(100, 'VALIDATION.NAME_TOO_LONG'),
  type: z.string().min(1, 'VALIDATION.TYPE_REQUIRED'),
  sourceType: z.string().min(1, 'VALIDATION.SOURCE_TYPE_REQUIRED'),
  imageId: z.string().optional(),
  externalId: z.string().optional(),
  isDefault: z.boolean(),
});

type GameItemFormValues = z.infer<typeof gameItemSchema>;

interface GameItemDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: GameItemFormValues) => Promise<void>;
  gameItem?: GameItem | null;
  isLoading?: boolean;
  mode?: 'view' | 'edit' | 'create';
  onEdit?: () => void;
}

export function GameItemDrawer({
  open,
  onClose,
  onSubmit,
  gameItem,
  isLoading = false,
  mode = 'create',
  onEdit,
}: GameItemDrawerProps) {
  const { t, language } = useTranslations();
  // const {data: itemCodes = [], isLoading: isLoadingCodes} =
  //   useGameItemCodes();
  const isView = mode === 'view';
  const isEdit = mode === 'edit';

  const [confirm, setConfirm] = useState(false);

  const form = useForm<GameItemFormValues>({
    resolver: createTranslatedZodResolver(gameItemSchema, t),
    defaultValues: {
      code: '',
      name: '',
      type: '',
      sourceType: '',
      imageId: '',
      externalId: '',
      isDefault: false,
    },
  });

  useFormLanguageSync(form, language);

  useEffect(() => {
    if (open) {
      if (gameItem) {
        form.reset({
          code: gameItem.code,
          name: gameItem.name,
          type: gameItem.type,
          sourceType: gameItem.sourceType,
          imageId: gameItem.imageId || '',
          externalId: gameItem.externalId || '',
          isDefault: gameItem.isDefault ?? false,
        });
      } else {
        form.reset({
          code: '',
          name: '',
          type: '',
          sourceType: '',
          imageId: '',
          externalId: '',
          isDefault: false,
        });
      }
    }
  }, [gameItem, open, form]);

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
    } catch {
      // Error handled in parent
    }
  };

  const handleClose = () => {
    form.reset();
    setConfirm(false);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isView
              ? t('GAME_ITEMS.DRAWER.VIEW_TITLE')
              : isEdit
                ? t('GAME_ITEMS.DRAWER.EDIT_TITLE')
                : t('GAME_ITEMS.DRAWER.ADD_TITLE')}
          </SheetTitle>
          <SheetDescription>
            {isView
              ? t('GAME_ITEMS.DRAWER.VIEW_DESCRIPTION')
              : isEdit
                ? t('GAME_ITEMS.DRAWER.EDIT_DESCRIPTION')
                : t('GAME_ITEMS.DRAWER.ADD_DESCRIPTION')}
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
                      placeholder={t('GAME_ITEMS.DRAWER.NAME_PLACEHOLDER')}
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
                  <FormLabel>{t('COMMON.CODE')} *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('COMMON.ENTER_CODE')}
                      {...field}
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
            {/*  name="code"*/}
            {/*  render={({ field }) => (*/}
            {/*    <FormItem>*/}
            {/*      <FormLabel>{t('COMMON.CODE')} *</FormLabel>*/}
            {/*      <Select*/}
            {/*        value={field.value}*/}
            {/*        onValueChange={field.onChange}*/}
            {/*        disabled={isView || isLoadingCodes}*/}
            {/*      >*/}
            {/*        <FormControl>*/}
            {/*          <SelectTrigger>*/}
            {/*            <SelectValue*/}
            {/*              placeholder={t('COMMON.ENTER_CODE')}*/}
            {/*            />*/}
            {/*          </SelectTrigger>*/}
            {/*        </FormControl>*/}
            {/*        <SelectContent>*/}
            {/*          {itemCodes.map((code) => (*/}
            {/*            <SelectItem key={code} value={code}>*/}
            {/*              {code}*/}
            {/*            </SelectItem>*/}
            {/*          ))}*/}
            {/*        </SelectContent>*/}
            {/*      </Select>*/}
            {/*      <FormMessage />*/}
            {/*    </FormItem>*/}
            {/*  )}*/}
            {/*/>*/}

            {/*<FormField*/}
            {/*  control={form.control}*/}
            {/*  name="convertRate"*/}
            {/*  render={({field}) => (*/}
            {/*    <FormItem>*/}
            {/*      <FormLabel>{t('GAME_ITEMS.DRAWER.CONVERT_RATE')} *</FormLabel>*/}
            {/*      <FormControl>*/}
            {/*        <Input*/}
            {/*          type="number"*/}
            {/*          min={0}*/}
            {/*          step="0.01"*/}
            {/*          placeholder={t(*/}
            {/*            'GAME_ITEMS.DRAWER.CONVERT_RATE_PLACEHOLDER',*/}
            {/*          )}*/}
            {/*          {...field}*/}
            {/*          onChange={(e) => field.onChange(Number(e.target.value))}*/}
            {/*          disabled={isView}*/}
            {/*          readOnly={isView}*/}
            {/*        />*/}
            {/*      </FormControl>*/}
            {/*      <FormMessage/>*/}
            {/*    </FormItem>*/}
            {/*  )}*/}
            {/*/>*/}

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('COMMON.TYPE')} *</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isView}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t('GAME_ITEMS.DRAWER.TYPE_PLACEHOLDER')}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="STAR">STAR</SelectItem>
                      <SelectItem value="GOOD_LUCK">GOOD_LUCK</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sourceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('COMMON.SOURCE_TYPE')} *</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isView}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            'GAME_ITEMS.DRAWER.SOURCE_TYPE_PLACEHOLDER',
                          )}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="INTERNAL">INTERNAL</SelectItem>
                      <SelectItem value="EXTERNAL">EXTERNAL</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/*<FormField*/}
            {/*  control={form.control}*/}
            {/*  name="imageId"*/}
            {/*  render={({ field }) => (*/}
            {/*    <FormItem>*/}
            {/*      <FormLabel>{t('GAME_ITEMS.DRAWER.IMAGE_ID')}</FormLabel>*/}
            {/*      <FormControl>*/}
            {/*        <Input*/}
            {/*          placeholder={t('GAME_ITEMS.DRAWER.IMAGE_ID_PLACEHOLDER')}*/}
            {/*          {...field}*/}
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
            {/*  name="externalId"*/}
            {/*  render={({ field }) => (*/}
            {/*    <FormItem>*/}
            {/*      <FormLabel>{t('GAME_ITEMS.DRAWER.EXTERNAL_ID')}</FormLabel>*/}
            {/*      <FormControl>*/}
            {/*        <Input*/}
            {/*          placeholder={t('GAME_ITEMS.DRAWER.EXTERNAL_ID_PLACEHOLDER')}*/}
            {/*          {...field}*/}
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
            {/*  name="isDefault"*/}
            {/*  render={({ field }) => (*/}
            {/*    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">*/}
            {/*      <div className="space-y-0.5">*/}
            {/*        <FormLabel>{t('GAME_ITEMS.DRAWER.IS_DEFAULT')}</FormLabel>*/}
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
                      onClick={() => onEdit?.()}
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

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {isEdit
                ? t('GAME_ITEMS.DRAWER.UPDATE_TITLE')
                : t('GAME_ITEMS.DRAWER.CREATE_TITLE')}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? t('GAME_ITEMS.DRAWER.EDIT_DESCRIPTION')
                : t('GAME_ITEMS.DRAWER.ADD_DESCRIPTION')}
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
