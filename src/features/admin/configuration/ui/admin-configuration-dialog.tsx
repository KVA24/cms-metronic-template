import { FormEvent, useEffect, useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import type { AdminRoleCode } from '@/shared/permissions';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Button } from '@/shared/ui/atoms/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/atoms/dialog';
import { Input } from '@/shared/ui/atoms/input';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminConfigurationDetail,
  useCreateAdminConfiguration,
  useUpdateAdminConfiguration,
} from '../hooks/use-admin-configurations';
import {
  adminConfigurationCreateSchema,
  adminConfigurationUpdateSchema,
} from '../model/admin-configuration';

type ConfigurationForm = {
  key: string;
  value: string;
  status: 'ACTIVE' | 'INACTIVE';
};
const selectClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm';

export function AdminConfigurationDialog({
  configurationId,
  onClose,
}: {
  configurationId: number | null;
  onClose: () => void;
}) {
  const session = useAuthSession();
  const { t } = useTranslations();
  const create = useCreateAdminConfiguration();
  const update = useUpdateAdminConfiguration();
  const editing = configurationId !== null;
  const detail = useAdminConfigurationDetail(
    configurationId,
    session?.roleCode as AdminRoleCode,
  );
  const [form, setForm] = useState<ConfigurationForm>({
    key: '',
    value: '',
    status: 'ACTIVE',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const pending = create.isPending || update.isPending;
  useEffect(() => {
    if (!detail.data) return;
    setForm({
      key: detail.data.key,
      value: detail.data.value,
      status: detail.data.status,
    });
  }, [detail.data]);
  const setField = (field: keyof ConfigurationForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '', root: '' }));
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!session || pending) return;
    const payload = editing ? { value: form.value, status: form.status } : form;
    const parsed = (
      editing ? adminConfigurationUpdateSchema : adminConfigurationCreateSchema
    ).safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        next[String(issue.path[0])] ??= issue.message;
      });
      setErrors(next);
      return;
    }
    try {
      if (detail.data)
        await update.mutateAsync({
          id: detail.data.id,
          input: payload,
          expectedVersion: detail.data.version,
          roleCode: session.roleCode as AdminRoleCode,
          actorId: session.user.id,
        });
      else
        await create.mutateAsync({
          input: form,
          roleCode: session.roleCode as AdminRoleCode,
          actorId: session.user.id,
        });
      toast.success(
        t(
          editing
            ? 'ADMIN_CONFIGURATION.UPDATE_SUCCESS'
            : 'ADMIN_CONFIGURATION.CREATE_SUCCESS',
        ),
      );
      onClose();
    } catch (error) {
      const code = error instanceof Error ? error.message : 'SAVE_ERROR';
      setErrors(code === 'KEY_DUPLICATE' ? { key: code } : { root: code });
    }
  };
  if (editing && detail.isLoading)
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('ADMIN_CONFIGURATION.EDIT_TITLE')}</DialogTitle>
            <DialogDescription>
              {t('ADMIN_CONFIGURATION.EDIT_DESCRIPTION')}
            </DialogDescription>
          </DialogHeader>
          <Skeleton className="h-64 w-full" />
        </DialogContent>
      </Dialog>
    );
  if (editing && (detail.isError || !detail.data))
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('ADMIN_CONFIGURATION.EDIT_TITLE')}</DialogTitle>
            <DialogDescription className="text-destructive">
              {t('ADMIN_CONFIGURATION.ERRORS.LOAD_ERROR')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('COMMON.CLOSE')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t(
              editing
                ? 'ADMIN_CONFIGURATION.EDIT_TITLE'
                : 'ADMIN_CONFIGURATION.ADD_TITLE',
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              editing
                ? 'ADMIN_CONFIGURATION.EDIT_DESCRIPTION'
                : 'ADMIN_CONFIGURATION.ADD_DESCRIPTION',
            )}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit} noValidate>
          <label className="space-y-1">
            <span className="text-sm font-medium">
              {t('ADMIN_CONFIGURATION.KEY')} *
            </span>
            <Input
              id="configuration-key"
              name="key"
              readOnly={editing}
              aria-readonly={editing}
              placeholder={t('ADMIN_CONFIGURATION.KEY')}
              value={form.key}
              onChange={(event) => setField('key', event.target.value)}
            />
            {errors.key && (
              <p className="text-destructive text-xs" role="alert">
                {t(`ADMIN_CONFIGURATION.ERRORS.${errors.key}`)}
              </p>
            )}
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">
              {t('ADMIN_CONFIGURATION.VALUE')} *
            </span>
            <Input
              id="configuration-value"
              name="value"
              placeholder={t('ADMIN_CONFIGURATION.VALUE')}
              value={form.value}
              onChange={(event) => setField('value', event.target.value)}
            />
            {errors.value && (
              <p className="text-destructive text-xs" role="alert">
                {t(`ADMIN_CONFIGURATION.ERRORS.${errors.value}`)}
              </p>
            )}
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">
              {t('COMMON.STATUS_1')} *
            </span>
            <select
              id="configuration-status"
              name="status"
              className={selectClassName}
              value={form.status}
              onChange={(event) => setField('status', event.target.value)}
            >
              <option value="ACTIVE">{t('COMMON.STATUS.ACTIVE')}</option>
              <option value="INACTIVE">{t('COMMON.STATUS.INACTIVE')}</option>
            </select>
          </label>
          {errors.root && (
            <p className="text-destructive text-sm" role="alert">
              {t(`ADMIN_CONFIGURATION.ERRORS.${errors.root}`)}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('COMMON.CANCEL')}
            </Button>
            <Button type="submit" variant="mono" disabled={pending}>
              <Save />
              {pending
                ? t('COMMON.LOADING')
                : t(
                    editing
                      ? 'ADMIN_CONFIGURATION.SAVE'
                      : 'ADMIN_CONFIGURATION.ADD',
                  )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
