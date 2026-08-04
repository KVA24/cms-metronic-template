import { useState } from 'react';
import type { AuthSession } from '@/shared/contracts';
import { useTranslations } from '@/shared/hooks/use-translations';
import { useAuthActions } from '@/shared/stores/auth-store';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent, CardHeader } from '@/shared/ui/atoms/card';
import { Input } from '@/shared/ui/atoms/input';
import { ImageUp, Save, UserRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useTenantProfileMutations } from '../hooks/use-tenant-profile';
import {
  tenantProfileUpdateSchema,
  type TenantAvatarInput,
  type TenantProfileUpdateInput,
  type TenantProfileView,
} from '../model/tenant-profile';

interface InformationFormValue {
  fullName: string;
  email: string;
  phone: string;
}

export function TenantProfileInformationForm({
  session,
  profile,
}: {
  session: AuthSession;
  profile: TenantProfileView;
}) {
  const { t } = useTranslations();
  const { syncUserProfile } = useAuthActions();
  const mutations = useTenantProfileMutations(session);
  const [avatar, setAvatar] = useState<TenantAvatarInput | null>(null);
  const form = useForm<InformationFormValue>({
    defaultValues: {
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone,
    },
  });

  const errorText = (name: keyof InformationFormValue) => {
    const message = form.formState.errors[name]?.message;
    return message ? t(`TENANT_PROFILE.ERRORS.${message}`) : null;
  };
  const submit = async (value: InformationFormValue) => {
    const input: TenantProfileUpdateInput = {
      ...value,
      avatar,
      version: profile.version,
    };
    const parsed = tenantProfileUpdateSchema.safeParse(input);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field !== 'avatar' && field !== 'version')
          form.setError(field as keyof InformationFormValue, {
            message: issue.message,
          });
      }
      return;
    }
    try {
      const updated = await mutations.update.mutateAsync(parsed.data);
      syncUserProfile({
        displayName: updated.fullName,
        email: updated.email,
      });
      toast.success(t('TENANT_PROFILE.UPDATE_SUCCESS'));
    } catch (error) {
      const code = error instanceof Error ? error.message : 'UNKNOWN';
      toast.error(
        t(`TENANT_PROFILE.ERRORS.${code}`, {
          defaultValue: t('TENANT_PROFILE.ERROR'),
        }),
      );
    }
  };
  const cancel = () => {
    form.reset({
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone,
    });
    setAvatar(null);
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">{t('TENANT_PROFILE.INFORMATION')}</h2>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center gap-4 rounded-lg border p-4">
          <div className="bg-muted flex size-16 items-center justify-center rounded-full">
            <UserRound className="text-muted-foreground size-8" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              {avatar?.name ??
                profile.avatarFileName ??
                t('TENANT_PROFILE.NO_AVATAR')}
            </p>
            <p className="text-muted-foreground text-xs">
              {t('TENANT_PROFILE.AVATAR_HELP')}
            </p>
          </div>
          <label className="hover:bg-accent inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium">
            <ImageUp className="size-4" /> {t('TENANT_PROFILE.UPLOAD_AVATAR')}
            <input
              className="sr-only"
              type="file"
              name="avatar"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setAvatar(
                  file
                    ? { name: file.name, type: file.type, size: file.size }
                    : null,
                );
              }}
            />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span>{t('TENANT_PROFILE.USERNAME')}</span>
            <Input
              name="username"
              value={profile.username}
              placeholder={t('TENANT_PROFILE.USERNAME')}
              disabled
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>{t('TENANT_PROFILE.ROLE')}</span>
            <Input
              name="role"
              value={profile.roleName}
              placeholder={t('TENANT_PROFILE.ROLE')}
              disabled
            />
          </label>
        </div>
        <label className="block space-y-1 text-sm">
          <span>{t('TENANT_PROFILE.FULL_NAME')} *</span>
          <Input
            maxLength={150}
            autoComplete="name"
            placeholder={t('TENANT_PROFILE.FULL_NAME')}
            aria-invalid={Boolean(errorText('fullName'))}
            {...form.register('fullName')}
          />
          {errorText('fullName') && (
            <span className="text-destructive text-xs">
              {errorText('fullName')}
            </span>
          )}
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span>{t('TENANT_PROFILE.EMAIL')}</span>
            <Input
              type="email"
              autoComplete="email"
              placeholder={t('TENANT_PROFILE.EMAIL')}
              aria-invalid={Boolean(errorText('email'))}
              {...form.register('email')}
            />
            {errorText('email') && (
              <span className="text-destructive text-xs">
                {errorText('email')}
              </span>
            )}
          </label>
          <label className="block space-y-1 text-sm">
            <span>{t('TENANT_PROFILE.PHONE')}</span>
            <Input
              autoComplete="tel"
              placeholder={t('TENANT_PROFILE.PHONE')}
              aria-invalid={Boolean(errorText('phone'))}
              {...form.register('phone')}
            />
            {errorText('phone') && (
              <span className="text-destructive text-xs">
                {errorText('phone')}
              </span>
            )}
          </label>
        </div>
        <label className="block space-y-1 text-sm">
          <span>{t('COMMON.STATUS_1')}</span>
          <Input
            name="status"
            value={t(`COMMON.STATUS.${profile.status}`)}
            placeholder={t('COMMON.STATUS_1')}
            disabled
          />
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={cancel}>
            {t('COMMON.CANCEL')}
          </Button>
          <Button
            type="button"
            disabled={mutations.update.isPending}
            onClick={form.handleSubmit(submit)}
          >
            <Save /> {t('COMMON.SAVE')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
