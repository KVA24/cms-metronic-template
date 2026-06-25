import { useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import { uploadApi } from '@/shared/lib/upload';
import {
  createTranslatedZodResolver,
  useFormLanguageSync,
} from '@/shared/lib/validation-utils';
import { Button } from '@/shared/ui/atoms/button';
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
import { Eye, EyeOff, LoaderCircleIcon, Upload, X } from 'lucide-react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { Account } from '../api/accountApi';
import { useAccountRoles } from '../hooks/use-account-queries';

const accountSchema = z.object({
  username: z.string().min(3, 'VALIDATION.USERNAME_MIN_LENGTH'),
  password: z
    .string()
    .min(6, 'VALIDATION.PASSWORD_MIN_LENGTH')
    .optional()
    .or(z.literal('')),
  role: z.string().min(1, 'VALIDATION.REQUIRED'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  avatarUrl: z
    .string()
    .url('VALIDATION.URL_INVALID')
    .optional()
    .or(z.literal('')),
  otpCode: z.string().optional(),
});

type AccountFormData = z.infer<typeof accountSchema>;
type Translate = ReturnType<typeof useTranslations>['t'];

interface AccountDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  account?: Account | null;
  isLoading?: boolean;
}

interface AccountDrawerHeaderProps {
  isEdit: boolean;
  t: Translate;
}

function AccountDrawerHeader({ isEdit, t }: AccountDrawerHeaderProps) {
  return (
    <SheetHeader>
      <SheetTitle>
        {isEdit
          ? t('ACCOUNT.DRAWER.EDIT_TITLE')
          : t('ACCOUNT.DRAWER.ADD_TITLE')}
      </SheetTitle>
      <SheetDescription>
        {isEdit
          ? t('ACCOUNT.DRAWER.EDIT_DESCRIPTION')
          : t('ACCOUNT.DRAWER.ADD_DESCRIPTION')}
      </SheetDescription>
    </SheetHeader>
  );
}

interface AccountCredentialsFieldsProps {
  form: UseFormReturn<AccountFormData>;
  isEdit: boolean;
  isLoading: boolean;
  showPassword: boolean;
  onTogglePassword: () => void;
  t: Translate;
}

function AccountCredentialsFields({
  form,
  isEdit,
  isLoading,
  showPassword,
  onTogglePassword,
  t,
}: AccountCredentialsFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="username"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('COMMON.USERNAME')} *</FormLabel>
            <FormControl>
              <Input
                placeholder={t('ACCOUNT.DRAWER.USERNAME_PLACEHOLDER')}
                {...field}
                disabled={isLoading || isEdit}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {!isEdit && (
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('ACCOUNT.DRAWER.PASSWORD')} *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('ACCOUNT.DRAWER.PASSWORD_PLACEHOLDER')}
                    {...field}
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={onTogglePassword}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
}

interface AccountAccessFieldsProps {
  form: UseFormReturn<AccountFormData>;
  isEdit: boolean;
  isLoading: boolean;
  isLoadingRoles: boolean;
  rolesData?: Array<{ code: string; name: string }>;
  t: Translate;
}

function AccountAccessFields({
  form,
  isEdit,
  isLoading,
  isLoadingRoles,
  rolesData,
  t,
}: AccountAccessFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="role"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('COMMON.ROLE')} *</FormLabel>
            <Select
              value={field.value || ''}
              onValueChange={field.onChange}
              disabled={isLoading || isLoadingRoles || isEdit}
            >
              <FormControl>
                <SelectTrigger clearable={false}>
                  <SelectValue
                    placeholder={t('ACCOUNT.DRAWER.ROLE_PLACEHOLDER')}
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {isLoadingRoles ? (
                  <div className="flex items-center justify-center py-2">
                    <LoaderCircleIcon className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  rolesData?.map((role) => (
                    <SelectItem key={role.code} value={role.code}>
                      {role.name}
                    </SelectItem>
                  ))
                )}
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
          <FormItem>
            <FormLabel>{t('COMMON.STATUS_1')} *</FormLabel>
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={isLoading}
            >
              <FormControl>
                <SelectTrigger clearable={false}>
                  <SelectValue
                    placeholder={t('ACCOUNT.DRAWER.STATE_PLACEHOLDER')}
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="ACTIVE">{t('COMMON.ACTIVE')}</SelectItem>
                <SelectItem value="INACTIVE">{t('COMMON.INACTIVE')}</SelectItem>
                <SelectItem value="SUSPENDED">
                  {t('ACCOUNT.DRAWER.STATE_SUSPENDED')}
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

interface AccountAvatarFieldProps {
  form: UseFormReturn<AccountFormData>;
  avatarPreview: string;
  isLoading: boolean;
  isUploading: boolean;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAvatar: () => void;
  t: Translate;
}

function AccountAvatarField({
  form,
  avatarPreview,
  isLoading,
  isUploading,
  onAvatarChange,
  onRemoveAvatar,
  t,
}: AccountAvatarFieldProps) {
  return (
    <FormField
      control={form.control}
      name="avatarUrl"
      render={() => (
        <FormItem>
          <FormLabel>{t('ACCOUNT.DRAWER.AVATAR')}</FormLabel>
          <FormControl>
            <div className="space-y-4">
              {avatarPreview && (
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border">
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-0 right-0 h-6 w-6 rounded-full p-0"
                    onClick={onRemoveAvatar}
                    disabled={isLoading || isUploading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={onAvatarChange}
                  disabled={isLoading || isUploading}
                  className="hidden"
                  id="avatar-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    document.getElementById('avatar-upload')?.click()
                  }
                  disabled={isLoading || isUploading}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {avatarPreview
                    ? t('ACCOUNT.DRAWER.AVATAR_CHANGE')
                    : t('ACCOUNT.DRAWER.AVATAR_UPLOAD')}
                </Button>
              </div>
            </div>
          </FormControl>
          <FormDescription>
            {t('ACCOUNT.DRAWER.AVATAR_DESCRIPTION')}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface AccountOtpFieldProps {
  form: UseFormReturn<AccountFormData>;
  isLoading: boolean;
  t: Translate;
}

function AccountOtpField({ form, isLoading, t }: AccountOtpFieldProps) {
  return (
    <FormField
      control={form.control}
      name="otpCode"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('COMMON.OTP_CODE')} *</FormLabel>
          <FormControl>
            <Input
              placeholder={t('ACCOUNT.DRAWER.OTP_PLACEHOLDER')}
              maxLength={6}
              {...field}
              disabled={isLoading}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface AccountDrawerActionsProps {
  isEdit: boolean;
  isLoading: boolean;
  isUploading: boolean;
  onClose: () => void;
  t: Translate;
}

function AccountDrawerActions({
  isEdit,
  isLoading,
  isUploading,
  onClose,
  t,
}: AccountDrawerActionsProps) {
  return (
    <div className="flex gap-3 pt-4 mt-auto">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        disabled={isLoading || isUploading}
        className="flex-1"
      >
        {t('COMMON.CANCEL')}
      </Button>
      <Button
        type="submit"
        disabled={isLoading || isUploading}
        className="flex-1"
      >
        {isLoading || isUploading ? (
          <span className="flex items-center gap-2">
            <LoaderCircleIcon className="h-4 w-4 animate-spin" />
            {isUploading
              ? t('ACCOUNT.DRAWER.UPLOADING')
              : isEdit
                ? t('ACCOUNT.DRAWER.UPDATING')
                : t('ACCOUNT.DRAWER.CREATING')}
          </span>
        ) : (
          <>
            {isEdit
              ? t('ACCOUNT.DRAWER.SUBMIT_UPDATE')
              : t('ACCOUNT.DRAWER.SUBMIT_CREATE')}
          </>
        )}
      </Button>
    </div>
  );
}

export function AccountDrawer({
  open,
  onClose,
  onSubmit,
  account,
  isLoading = false,
}: AccountDrawerProps) {
  const { t, language } = useTranslations();
  const isEdit = !!account;
  const [showPassword, setShowPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>(
    account?.avatarUrl || '',
  );
  const [isUploading, setIsUploading] = useState(false);

  const { data: rolesData, isLoading: isLoadingRoles } = useAccountRoles();

  const form = useForm<AccountFormData>({
    resolver: createTranslatedZodResolver(accountSchema, t),
    defaultValues: {
      username: account?.username || '',
      password: '',
      role: account?.role || account?.roles[0]?.roleCode || '',
      status: account?.status || 'ACTIVE',
      avatarUrl: account?.avatarUrl || '',
      otpCode: '',
    },
  });

  useFormLanguageSync(form, language);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('ACCOUNT.TOAST.UPLOAD_TYPE_ERROR'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('ACCOUNT.TOAST.UPLOAD_SIZE_ERROR'));
      return;
    }

    // Create preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file immediately
    setIsUploading(true);
    try {
      const uploadedUrl = await uploadApi.uploadFile(file);

      // Set the uploaded URL to form
      form.setValue('avatarUrl', uploadedUrl);

      toast.success(t('ACCOUNT.TOAST.UPLOAD_SUCCESS'));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('ACCOUNT.TOAST.UPLOAD_ERROR');
      toast.error(errorMessage);

      // Clear preview on error
      setAvatarPreview('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview('');
    form.setValue('avatarUrl', '');
  };

  const handleSubmit = async (data: AccountFormData) => {
    const matchedRole = rolesData?.find((r) => r.code === data.role);
    const roleIds = matchedRole ? [String(matchedRole.id)] : undefined;

    // Remove password if editing (password only for create)
    const submitData = isEdit
      ? {
          username: data.username,
          role: data.role,
          status: data.status,
          avatarUrl: data.avatarUrl || undefined,
          otpCode: data.otpCode || undefined,
          roleIds,
        }
      : {
          username: data.username,
          password: data.password,
          role: data.role,
          status: data.status,
          avatarUrl: data.avatarUrl || undefined,
          otpCode: data.otpCode || undefined,
          roleIds,
        };

    await onSubmit(submitData);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <AccountDrawerHeader isEdit={isEdit} t={t} />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex h-full flex-col space-y-6 mt-6"
          >
            <AccountCredentialsFields
              form={form}
              isEdit={isEdit}
              isLoading={isLoading}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              t={t}
            />

            <AccountAccessFields
              form={form}
              isEdit={isEdit}
              isLoading={isLoading}
              isLoadingRoles={isLoadingRoles}
              rolesData={rolesData}
              t={t}
            />

            <AccountAvatarField
              form={form}
              avatarPreview={avatarPreview}
              isLoading={isLoading}
              isUploading={isUploading}
              onAvatarChange={handleAvatarChange}
              onRemoveAvatar={handleRemoveAvatar}
              t={t}
            />

            <AccountOtpField form={form} isLoading={isLoading} t={t} />

            <AccountDrawerActions
              isEdit={isEdit}
              isLoading={isLoading}
              isUploading={isUploading}
              onClose={handleClose}
              t={t}
            />
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
