import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import type { PermissionCode } from '@/shared/permissions';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Alert, AlertDescription, AlertIcon } from '@/shared/ui/atoms/alert';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/atoms/table';
import { Container } from '@/shared/ui/molecules/container';
import { AlertCircle, ArrowLeft, Save } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useTenantRoleDetail,
  useTenantRoleMutations,
} from '../hooks/use-tenant-roles';
import {
  getModuleSelection,
  getPermissionCoverage,
  TENANT_PERMISSION_MODULES,
} from '../model/tenant-role-permissions';

const ACTIONS = [
  ['VIEW', '.view'],
  ['CREATE', '.create'],
  ['EDIT', '.edit'],
  ['DELETE_DISABLE', '.delete_disable'],
  ['EXPORT', '.export'],
  ['PERMISSIONS', '.permissions'],
] as const;

function PermissionCheckbox({
  checked,
  disabled,
  indeterminate = false,
  label,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  indeterminate?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      className="accent-primary size-4"
      checked={checked}
      disabled={disabled}
      aria-label={label}
      onChange={(event) => onChange(event.target.checked)}
    />
  );
}

export function TenantRolePermissionsPage() {
  const { roleId = '' } = useParams();
  const session = useAuthSession();
  const { t } = useTranslations();
  const navigate = useNavigate();
  const detail = useTenantRoleDetail(session, roleId);
  const mutations = useTenantRoleMutations(session);
  const [selected, setSelected] = useState<PermissionCode[]>([]);
  const [initial, setInitial] = useState<PermissionCode[]>([]);

  useEffect(() => {
    if (detail.data) {
      setSelected(detail.data.permissions);
      setInitial(detail.data.permissions);
    }
  }, [detail.data]);

  const dirty = useMemo(
    () =>
      JSON.stringify([...selected].sort()) !==
      JSON.stringify([...initial].sort()),
    [initial, selected],
  );
  const readOnly = detail.data?.type === 'SYSTEM';
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const updateModule = (
    actions: readonly PermissionCode[],
    checked: boolean,
  ) => {
    setSelected((current) => {
      const next = new Set(current);
      for (const action of actions) {
        if (checked) next.add(action);
        else next.delete(action);
      }
      return [...next];
    });
  };
  const updateAction = (
    actions: readonly PermissionCode[],
    action: PermissionCode,
    checked: boolean,
  ) => {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(action);
        const view = actions.find((item) => item.endsWith('.view'));
        if (view) next.add(view);
      } else {
        next.delete(action);
        if (action.endsWith('.view')) {
          for (const item of actions) next.delete(item);
        }
      }
      return [...next];
    });
  };
  const cancel = () => {
    if (!dirty || window.confirm(t('TENANT_ROLES.PERMISSIONS_PAGE.DISCARD'))) {
      navigate(`/tenant/account/roles/${roleId}`);
    }
  };
  const save = async () => {
    try {
      await mutations.savePermissions.mutateAsync({
        roleId,
        input: { permissions: selected, version: detail.data!.version },
      });
      toast.success(t('TENANT_ROLES.PERMISSIONS_PAGE.SUCCESS'));
      navigate(`/tenant/account/roles/${roleId}`);
    } catch (error) {
      const code = error instanceof Error ? error.message : 'UNKNOWN';
      toast.error(
        t(`TENANT_ROLES.ERRORS.${code}`, {
          defaultValue: t('TENANT_ROLES.ERROR'),
        }),
      );
    }
  };

  if (detail.isLoading)
    return (
      <Container className="py-8">
        <Skeleton className="h-96 w-full" />
      </Container>
    );
  if (detail.isError || !detail.data)
    return (
      <Container className="py-8">
        <Alert variant="destructive">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertDescription>{t('TENANT_ROLES.NOT_FOUND')}</AlertDescription>
        </Alert>
      </Container>
    );

  return (
    <Container width="fluid" className="space-y-5 pb-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" className="mb-2 -ml-3">
            <Link to={`/tenant/account/roles/${roleId}`}>
              <ArrowLeft /> {t('COMMON.BACK')}
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">
            {t('TENANT_ROLES.PERMISSIONS_PAGE.TITLE')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {detail.data.code} · {detail.data.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={cancel}>
            {t('COMMON.CANCEL')}
          </Button>
          {!readOnly && (
            <Button
              onClick={save}
              disabled={!dirty || mutations.savePermissions.isPending}
            >
              <Save />{' '}
              {mutations.savePermissions.isPending
                ? t('COMMON.LOADING')
                : t('TENANT_ROLES.PERMISSIONS_PAGE.SAVE')}
            </Button>
          )}
        </div>
      </header>

      <Alert>
        <AlertIcon>
          <AlertCircle />
        </AlertIcon>
        <AlertDescription>
          {readOnly
            ? t('TENANT_ROLES.PERMISSIONS_PAGE.SYSTEM_NOTE')
            : t('TENANT_ROLES.PERMISSIONS_PAGE.NOTE')}
        </AlertDescription>
      </Alert>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-muted-foreground text-sm">
              {t('TENANT_ROLES.PERMISSION_SUMMARY')}
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {getPermissionCoverage(selected)}/7
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-muted-foreground text-sm">
              {t('COMMON.STATUS_1')}
            </p>
            <Badge
              className="mt-2"
              variant={
                detail.data.status === 'ACTIVE' ? 'success' : 'secondary'
              }
              appearance="light"
            >
              {t(`COMMON.STATUS.${detail.data.status}`)}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-muted-foreground text-sm">
              {t('TENANT_ROLES.TYPE')}
            </p>
            <Badge
              className="mt-2"
              variant={readOnly ? 'info' : 'secondary'}
              appearance="light"
            >
              {t(`TENANT_ROLES.TYPES.${detail.data.type}`)}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t('TENANT_ROLES.PERMISSIONS_PAGE.MODULE')}
                </TableHead>
                {ACTIONS.map(([key]) => (
                  <TableHead key={key} className="text-center">
                    {t(`TENANT_ROLES.PERMISSIONS_PAGE.ACTIONS.${key}`)}
                  </TableHead>
                ))}
                <TableHead className="text-center">
                  {t('TENANT_ROLES.PERMISSIONS_PAGE.FULL')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TENANT_PERMISSION_MODULES.map((module) => {
                const selection = getModuleSelection(module.actions, selected);
                return (
                  <TableRow key={module.code}>
                    <TableCell className="font-medium">
                      {t(
                        `TENANT_ROLES.PERMISSIONS_PAGE.MODULES.${module.code}`,
                      )}
                    </TableCell>
                    {ACTIONS.map(([key, suffix]) => {
                      const permission = module.actions.find((action) =>
                        action.endsWith(suffix),
                      );
                      return (
                        <TableCell key={key} className="text-center">
                          {permission ? (
                            <PermissionCheckbox
                              checked={selectedSet.has(permission)}
                              disabled={readOnly}
                              label={`${module.label} ${key}`}
                              onChange={(checked) =>
                                updateAction(
                                  module.actions,
                                  permission,
                                  checked,
                                )
                              }
                            />
                          ) : (
                            <span
                              aria-label={t(
                                'TENANT_ROLES.PERMISSIONS_PAGE.NOT_APPLICABLE',
                              )}
                            >
                              —
                            </span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center">
                      <PermissionCheckbox
                        checked={selection.full}
                        indeterminate={selection.indeterminate}
                        disabled={readOnly}
                        label={`${module.label} Full`}
                        onChange={(checked) =>
                          updateModule(module.actions, checked)
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Container>
  );
}
