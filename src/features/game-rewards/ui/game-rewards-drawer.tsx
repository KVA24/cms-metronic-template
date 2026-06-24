import { useEffect, useState } from 'react';
import {
  GameReward,
  RewardType,
} from '@/features/game-rewards/api/gameRewardsApi';
import { useGameItems } from '@/features/game-rewards/hooks/use-game-rewards-queries';
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
import { Switch } from '@/shared/ui/atoms/switch';
import { PermissionGuard } from '@/shared/ui/molecules/permission-guard';
import { Edit, LoaderCircleIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const REWARD_TYPES = Object.values(RewardType);

const gameRewardSchema = z.object({
  rewardName: z
    .string()
    .min(1, 'VALIDATION.NAME_REQUIRED')
    .max(100, 'VALIDATION.NAME_TOO_LONG'),
  value: z.number().min(0, 'VALIDATION.VALUE_NON_NEGATIVE'),
  type: z.union([z.nativeEnum(RewardType), z.literal('')], {
    message: 'VALIDATION.REQUIRED',
  }),
  imageId: z.string().optional(),
  externalId: z.string().optional(),
  isDefault: z.boolean(),
  itemId: z.string(),
});

type GameRewardFormValues = z.infer<typeof gameRewardSchema>;

interface GameRewardDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: GameRewardFormValues) => Promise<void>;
  gameReward?: GameReward | null;
  isLoading?: boolean;
  mode?: 'view' | 'edit' | 'create';
  onEdit?: () => void;
}

export function GameRewardDrawer({
  open,
  onClose,
  onSubmit,
  gameReward,
  isLoading = false,
  mode = 'create',
  onEdit,
}: GameRewardDrawerProps) {
  const { t, language } = useTranslations();
  const { data: gameItems = [] } = useGameItems();
  const isView = mode === 'view';
  const isEdit = mode === 'edit';

  const [confirm, setConfirm] = useState(false);

  const form = useForm<GameRewardFormValues>({
    resolver: createTranslatedZodResolver(gameRewardSchema, t),
    defaultValues: {
      rewardName: '',
      value: 0,
      type: '',
      imageId: '',
      externalId: '',
      isDefault: false,
      itemId: '',
    },
  });

  useFormLanguageSync(form, language);

  // Reset form when game reward changes or drawer opens
  useEffect(() => {
    if (open) {
      if (gameReward) {
        form.reset({
          rewardName: gameReward.rewardName,
          value: gameReward.value,
          type: gameReward.type as RewardType,
          imageId: gameReward.imageId,
          externalId: gameReward.externalId,
          isDefault: gameReward.isDefault,
          itemId: gameReward.itemId,
        });
      } else {
        form.reset({
          rewardName: '',
          value: 0,
          type: '',
          imageId: '',
          externalId: '',
          isDefault: false,
          itemId: '',
        });
      }
    }
  }, [gameReward, open, form]);

  // Reset OTP dialog when mode changes
  useEffect(() => {
    setConfirm(false);
  }, [mode]);

  const handleSubmit = async () => {
    // Just open confirm dialog, don't submit yet
    setConfirm(true);
  };

  const handleConfirm = async () => {
    try {
      const data = form.getValues();
      await onSubmit(data);
      setConfirm(false);
    } catch (error) {
      console.error('Failed to submit game reward:', error);
      // Error handled in parent, keep dialog open
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
              ? t('GAME_REWARDS.DRAWER.VIEW_TITLE')
              : isEdit
                ? t('GAME_REWARDS.DRAWER.EDIT_TITLE')
                : t('GAME_REWARDS.DRAWER.ADD_TITLE')}
          </SheetTitle>
          <SheetDescription>
            {isView
              ? t('GAME_REWARDS.DRAWER.VIEW_DESCRIPTION')
              : isEdit
                ? t('GAME_REWARDS.DRAWER.EDIT_DESCRIPTION')
                : t('GAME_REWARDS.DRAWER.ADD_DESCRIPTION')}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex h-full flex-col space-y-6 mt-6"
          >
            <FormField
              control={form.control}
              name="rewardName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('GAME_REWARDS.DRAWER.REWARD_NAME')} *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        'GAME_REWARDS.DRAWER.REWARD_NAME_PLACEHOLDER',
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
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('COMMON.VALUE')} *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('COMMON.ENTER_VALUE')}
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
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
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('COMMON.TYPE')} *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                    disabled={isView}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            'GAME_REWARDS.DRAWER.TYPE_PLACEHOLDER',
                          )}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {REWARD_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t('GAME_REWARDS.DRAWER.TYPE_DESCRIPTION')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('GAME_REWARDS.DRAWER.IMAGE_ID')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        'GAME_REWARDS.DRAWER.IMAGE_ID_PLACEHOLDER',
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

            {/*<FormField*/}
            {/*  control={form.control}*/}
            {/*  name="externalId"*/}
            {/*  render={({ field }) => (*/}
            {/*    <FormItem>*/}
            {/*      <FormLabel>{t('GAME_REWARDS.DRAWER.EXTERNAL_ID')}</FormLabel>*/}
            {/*      <FormControl>*/}
            {/*        <Input*/}
            {/*          placeholder={t(*/}
            {/*            'GAME_REWARDS.DRAWER.EXTERNAL_ID_PLACEHOLDER',*/}
            {/*          )}*/}
            {/*          {...field}*/}
            {/*          disabled={isView}*/}
            {/*          readOnly={isView}*/}
            {/*        />*/}
            {/*      </FormControl>*/}
            {/*      <FormMessage />*/}
            {/*    </FormItem>*/}
            {/*  )}*/}
            {/*/>*/}

            <FormField
              control={form.control}
              name="itemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('GAME_REWARDS.DRAWER.ITEM')} *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                    disabled={isView}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            'GAME_REWARDS.DRAWER.ITEM_ID_PLACEHOLDER',
                          )}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {gameItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
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
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>{t('GAME_REWARDS.DRAWER.IS_DEFAULT')}</FormLabel>
                    <FormDescription>
                      {t('GAME_REWARDS.DRAWER.IS_DEFAULT_DESCRIPTION')}
                    </FormDescription>
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

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {isEdit
                ? t('GAME_REWARDS.DRAWER.UPDATE_TITLE')
                : t('GAME_REWARDS.DRAWER.CREATE_TITLE')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {isEdit
                ? t('GAME_REWARDS.DRAWER.EDIT_DESCRIPTION')
                : t('GAME_REWARDS.DRAWER.ADD_DESCRIPTION')}
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
