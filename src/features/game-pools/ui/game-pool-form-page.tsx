import { useEffect, useMemo, useState } from 'react';
import {
  GamePoolCreateDto,
  GamePoolUpdateDto,
  RewardMap,
} from '@/features/game-pools/api/gamePoolsApi';
import {
  useCreateGamePool,
  useGamePoolDetail,
  useUpdateGamePool,
} from '@/features/game-pools/hooks/use-game-pools-queries';
import { useBreadcrumb } from '@/shared/contexts/breadcrumb-context';
import { useTranslations } from '@/shared/hooks/use-translations';
import { UserRole } from '@/shared/lib/rbac/roles';
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
import { Switch } from '@/shared/ui/atoms/switch';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
} from '@/shared/ui/molecules/common/toolbar';
import { Container } from '@/shared/ui/molecules/container';
import { PermissionGuard } from '@/shared/ui/molecules/permission-guard';
import { AlertCircle, ArrowLeft, LoaderCircleIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import * as z from 'zod';
import { RewardMapEditor } from './reward-map-editor';

// Validation schemas
const poolRewardScheduleSchema = z.object({
  id: z.number().optional(),
  poolRewardMapId: z.number().optional(),
  periodType: z.enum(['MINUTE', 'HOUR', 'DAY'], {
    required_error: 'VALIDATION.PERIOD_TYPE_REQUIRED',
  }),
  quantity: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? Number(val) : val))
    .pipe(
      z
        .number({
          required_error: 'VALIDATION.QUANTITY_REQUIRED',
          invalid_type_error: 'VALIDATION.QUANTITY_INVALID',
        })
        .min(0, 'VALIDATION.QUANTITY_MIN'),
    ),
  startAt: z.string().optional().default(''),
  endAt: z.string().optional().default(''),
  state: z.enum(['ACTIVE', 'INACTIVE']),
});

const rewardMapSchema = z.object({
  poolId: z.number().optional(),
  rewardId: z
    .number({
      required_error: 'VALIDATION.REWARD_ID_REQUIRED',
      invalid_type_error: 'VALIDATION.REWARD_ID_INVALID',
    })
    .positive('VALIDATION.REWARD_ID_POSITIVE'),
  weight: z
    .number({
      required_error: 'VALIDATION.WEIGHT_REQUIRED',
      invalid_type_error: 'VALIDATION.WEIGHT_INVALID',
    })
    .min(0, 'VALIDATION.WEIGHT_MIN'),
  periodType: z.enum(['ALL_THE_TIME', 'UNLIMITED', 'DAY', 'WEEK', 'MONTH'], {
    required_error: 'VALIDATION.PERIOD_TYPE_REQUIRED',
  }),
  periodNumber: z.union([z.string(), z.number()]),
  periodValue: z.union([z.string(), z.number()]),
  isUnlimited: z.boolean(),
  isActivate: z.boolean(),
  poolRewardSchedules: z.array(poolRewardScheduleSchema),
  rewardName: z.string().optional(),
});

const gamePoolSchema = z.object({
  code: z
    .string()
    .min(1, 'VALIDATION.CODE_REQUIRED')
    .max(50, 'VALIDATION.CODE_TOO_LONG'),
  state: z.enum(['ACTIVE', 'INACTIVE']),
  rewardMaps: z
    .array(rewardMapSchema)
    .min(1, 'VALIDATION.REWARD_MAPS_REQUIRED'),
});

type GamePoolFormValues = z.infer<typeof gamePoolSchema>;

interface GamePoolFormPageProps {
  mode: 'create' | 'edit' | 'view';
}

export function GamePoolFormPage({ mode }: GamePoolFormPageProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { setCustomBreadcrumb } = useBreadcrumb();
  const { t, language } = useTranslations();

  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isFormReady, setIsFormReady] = useState(false);

  const poolId = useMemo(() => id, [id]);

  const {
    data: poolDetail,
    isLoading: isLoadingDetail,
    error: detailError,
    refetch: refetchDetail,
  } = useGamePoolDetail(poolId, {
    enabled: (isEdit || isView) && !!poolId,
  });

  const createMutation = useCreateGamePool();
  const updateMutation = useUpdateGamePool();

  const form = useForm<GamePoolFormValues>({
    resolver: createTranslatedZodResolver(gamePoolSchema, t),
    defaultValues: {
      code: '',
      state: 'INACTIVE',
      rewardMaps: [],
    },
  });

  useFormLanguageSync(form, language);

  // Reset form ready state when mode/id changes
  useEffect(() => {
    setIsFormReady(false);
  }, [mode, id]);

  // Populate form when detail is loaded
  useEffect(() => {
    if (poolDetail && (isEdit || isView)) {
      form.reset({
        code: poolDetail.code,
        state: poolDetail.state,
        rewardMaps: poolDetail.rewardMaps || [],
      });
      const readyTimer = setTimeout(() => setIsFormReady(true), 0);
      return () => clearTimeout(readyTimer);
    } else if (isCreate) {
      setIsFormReady(true);
    }
  }, [poolDetail, isLoadingDetail, isEdit, isView, isCreate, form]);

  // Breadcrumb
  useEffect(() => {
    const title = isCreate
      ? t('GAME_POOLS.FORM.CREATE_TITLE')
      : isEdit
        ? poolDetail?.code || t('GAME_POOLS.FORM.EDIT_TITLE')
        : poolDetail?.code || t('GAME_POOLS.FORM.VIEW_TITLE');

    setCustomBreadcrumb([
      { title: t('GAME_POOLS.PAGE.TITLE'), path: '/game-pools' },
      { title },
    ]);
    return () => setCustomBreadcrumb(null);
  }, [isCreate, isEdit, poolDetail, setCustomBreadcrumb, t]);

  const handleSubmit = async () => {
    const valid = await form.trigger();
    if (valid) setShowOtpDialog(true);
  };

  const handleConfirmWithOtp = async () => {
    // Validate OTP
    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpError(t('COMMON.OTP_MUST_BE_6_DIGITS') || 'OTP must be 6 digits');
      return;
    }

    setOtpError('');

    try {
      const data = form.getValues();
      const payload: GamePoolCreateDto = {
        code: data.code,
        state: data.state,
        rewardMaps: data.rewardMaps as RewardMap[],
        otpCode: otpCode,
      };

      if (isCreate) {
        await createMutation.mutateAsync({ data: payload });
        navigate('/game-pools');
      } else if (isEdit && id) {
        await updateMutation.mutateAsync({
          id,
          data: payload as GamePoolUpdateDto,
        });
        navigate('/game-pools');
      }
      setShowOtpDialog(false);
      setOtpCode('');
    } catch {
      // handled by mutation
    }
  };

  const handleBack = () => navigate('/game-pools');
  const handleEdit = () => id && navigate(`/game-pools/edit/${id}`);

  // Error state
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
            <AlertTitle>{t('GAME_POOLS.FORM.ERROR')}</AlertTitle>
            <AlertDescription className="break-all">
              {detailError instanceof Error
                ? detailError.message
                : 'Failed to load pool details'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => refetchDetail()}>{t('COMMON.RETRY')}</Button>
        </div>
      </Container>
    );
  }

  // Loading state
  if (isLoadingDetail || ((isEdit || isView) && !poolDetail) || !isFormReady) {
    return (
      <Container>
        <div className="flex items-center justify-center h-64">
          <LoaderCircleIcon className="h-8 w-8 animate-spin" />
        </div>
      </Container>
    );
  }

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error || updateMutation.error;

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
              <Button onClick={handleEdit}>{t('COMMON.EDIT')}</Button>
            </PermissionGuard>
          )}
        </ToolbarActions>
      </Toolbar>

      <div className="mx-auto">
        {mutationError && (
          <Alert variant="destructive" appearance="light" className="mb-6">
            <AlertIcon>
              <AlertCircle />
            </AlertIcon>
            <AlertTitle>{t('GAME_POOLS.FORM.ERROR')}</AlertTitle>
            <AlertDescription className="break-all">
              {mutationError instanceof Error
                ? mutationError.message
                : 'An error occurred'}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader className="p-4">
                <CardTitle>{t('COMMON.BASIC_INFORMATION')}</CardTitle>
                <CardDescription>
                  {isView
                    ? t('GAME_POOLS.FORM.BASIC_INFO_DESC_VIEW')
                    : t('GAME_POOLS.FORM.BASIC_INFO_DESC_EDIT')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            maxLength={50}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>{t('COMMON.STATE')} *</FormLabel>
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
                </div>
              </CardContent>
            </Card>

            {/* Reward Maps */}
            <Card>
              <CardHeader className="p-4">
                <CardTitle>{t('GAME_POOLS.FORM.REWARD_MAPS')}</CardTitle>
                <CardDescription>
                  {t('GAME_POOLS.FORM.REWARD_MAPS_DESC')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="rewardMaps"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RewardMapEditor
                          value={field.value as RewardMap[]}
                          onChange={field.onChange}
                          disabled={isView}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
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
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                      {t('GAME_POOLS.FORM.SAVING')}
                    </span>
                  ) : isEdit ? (
                    t('COMMON.SAVE')
                  ) : (
                    t('COMMON.CREATE')
                  )}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </div>

      {/* OTP Input Dialog */}
      <Dialog
        open={showOtpDialog}
        onOpenChange={(open) => {
          if (!open && !isLoading) {
            setOtpCode('');
            setOtpError('');
          }
          setShowOtpDialog(open);
        }}
      >
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {isEdit
                ? t('GAME_POOLS.FORM.OTP_TITLE')
                : t('GAME_POOLS.FORM.OTP_TITLE')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('GAME_POOLS.FORM.OTP_DESCRIPTION')}
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
                type="text"
                inputMode="numeric"
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
                setShowOtpDialog(false);
                setOtpCode('');
                setOtpError('');
              }}
              disabled={isLoading}
            >
              {t('COMMON.CANCEL')}
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmWithOtp}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                  {t('GAME_POOLS.FORM.SAVING')}
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
