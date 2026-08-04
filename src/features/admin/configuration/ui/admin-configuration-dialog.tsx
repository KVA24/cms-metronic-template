import { FormEvent, useState } from 'react';
import type { Configuration } from '@/shared/contracts';
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
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import {
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
  configuration,
  onClose,
}: {
  configuration: Configuration | null;
  onClose: () => void;
}) {
  const session = useAuthSession();
  const { t } = useTranslations();
  const create = useCreateAdminConfiguration();
  const update = useUpdateAdminConfiguration();
  const editing = Boolean(configuration);
  const [form, setForm] = useState<ConfigurationForm>(
    configuration
      ? {
          key: configuration.key,
          value: configuration.value,
          status: configuration.status,
        }
      : { key: '', value: '', status: 'ACTIVE' },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const pending = create.isPending || update.isPending;
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
      if (configuration)
        await update.mutateAsync({
          id: configuration.id,
          input: payload,
          expectedVersion: configuration.version,
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
