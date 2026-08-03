import { useEffect, useState } from 'react';
import type {
  EarnDisplayTargetType,
  TenantEarnDisplay,
} from '@/shared/contracts';
import { useTranslations } from '@/shared/hooks/use-translations';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/atoms/dialog';
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
import { ArrowLeft, Settings2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useTenantEarnDisplayBrand,
  useTenantEarnDisplaySave,
} from '../hooks/use-tenant-earn-display';
import type {
  TenantEarnDisplayDraft,
  TenantEarnTargetView,
} from '../model/tenant-earn-display';
import { TenantEarnDisplayForm } from './tenant-earn-display-form';

type Level = 'BRAND' | 'CATEGORY' | 'OFFER';
type Navigation =
  | { level: Level; target: TenantEarnTargetView | null }
  | { level: 'BACK'; target: null };

function makeDraft(
  brandId: string,
  targetType: EarnDisplayTargetType,
  targetId: string | null,
  configuration: TenantEarnDisplay | null,
): TenantEarnDisplayDraft {
  return {
    brandId,
    targetType,
    targetId,
    textEn: configuration?.textEn ?? '',
    textVi: configuration?.textVi ?? '',
    displayStatus: configuration?.displayStatus ?? 'ACTIVE',
    effectiveFrom: configuration?.effectiveFrom ?? null,
    effectiveTo: configuration?.effectiveTo ?? null,
    expectedVersion: configuration?.version ?? null,
  };
}

export function TenantEarnDisplayBrandPage() {
  const { brandId = '' } = useParams();
  const session = useAuthSession();
  const navigate = useNavigate();
  const { t } = useTranslations();
  const context = useTenantEarnDisplayBrand(session, brandId);
  const saveMutation = useTenantEarnDisplaySave(session);
  const [level, setLevel] = useState<Level>('BRAND');
  const [target, setTarget] = useState<TenantEarnTargetView | null>(null);
  const [draft, setDraft] = useState<TenantEarnDisplayDraft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<Navigation | null>(
    null,
  );
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    if (context.data && !draft)
      setDraft(
        makeDraft(brandId, 'BRAND', null, context.data.brandConfiguration),
      );
  }, [brandId, context.data, draft]);

  const applyNavigation = (navigation: Navigation) => {
    setPendingNavigation(null);
    setDirty(false);
    setErrorCode(null);
    if (navigation.level === 'BACK') {
      navigate('/tenant/earn-display');
      return;
    }
    setLevel(navigation.level);
    setTarget(navigation.target);
    if (navigation.level === 'BRAND')
      setDraft(
        makeDraft(
          brandId,
          'BRAND',
          null,
          context.data?.brandConfiguration ?? null,
        ),
      );
    else if (navigation.target)
      setDraft(
        makeDraft(
          brandId,
          navigation.level,
          navigation.target.targetId,
          navigation.target.configuration,
        ),
      );
    else setDraft(null);
  };

  const requestNavigation = (navigation: Navigation) => {
    if (dirty) setPendingNavigation(navigation);
    else applyNavigation(navigation);
  };

  const save = async (continueAfter = false) => {
    if (!draft) return;
    setErrorCode(null);
    try {
      const saved = await saveMutation.mutateAsync(draft);
      setDraft({
        ...draft,
        textEn: saved.textEn,
        textVi: saved.textVi,
        expectedVersion: saved.version,
      });
      setDirty(false);
      toast.success(t(`TENANT_EARN_DISPLAY.SUCCESS.${draft.targetType}`));
      if (continueAfter && pendingNavigation)
        applyNavigation(pendingNavigation);
    } catch (error) {
      setErrorCode(error instanceof Error ? error.message : 'SAVE_ERROR');
    }
  };

  if (context.isLoading)
    return (
      <Container width="fluid">
        <Skeleton className="h-96 w-full" />
      </Container>
    );
  if (!context.data)
    return (
      <Container width="fluid">
        <p className="text-destructive">{t('TENANT_EARN_DISPLAY.ERROR')}</p>
      </Container>
    );

  const targets =
    level === 'CATEGORY' ? context.data.categories : context.data.offers;
  const targetLabel =
    level === 'BRAND'
      ? `${context.data.brand.code} · ${context.data.brand.name}`
      : target
        ? `${target.code} · ${target.name}`
        : '';

  return (
    <Container width="fluid" className="space-y-5 pb-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            className="mb-2 px-0"
            onClick={() => requestNavigation({ level: 'BACK', target: null })}
          >
            <ArrowLeft />
            {t('TENANT_EARN_DISPLAY.BACK')}
          </Button>
          <h1 className="text-2xl font-semibold">{context.data.brand.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {context.data.brand.code} ·{' '}
            {t(`COMMON.STATUS.${context.data.brand.brandStatus}`)}
          </p>
        </div>
        <div className="rounded-lg border p-3 text-sm">
          <span className="text-muted-foreground">
            {t('TENANT_EARN_DISPLAY.PRIORITY')}:{' '}
          </span>
          <strong>{context.data.resolutionPriority.join(' > ')}</strong>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('TENANT_EARN_DISPLAY.LOCALE_NOTE')}
          </p>
        </div>
      </header>
      <div className="grid gap-3 md:grid-cols-3">
        {(
          [
            ['BRAND', 1],
            ['CATEGORY', context.data.categoryCount],
            ['OFFER', context.data.offerCount],
          ] as const
        ).map(([itemLevel, count]) => (
          <Button
            key={itemLevel}
            className="h-auto justify-between p-4"
            variant={level === itemLevel ? 'primary' : 'outline'}
            disabled={itemLevel !== 'BRAND' && count === 0}
            onClick={() =>
              requestNavigation({ level: itemLevel, target: null })
            }
          >
            {t(`TENANT_EARN_DISPLAY.LEVELS.${itemLevel}`)}
            <Badge variant="secondary">{count}</Badge>
          </Button>
        ))}
      </div>
      {level !== 'BRAND' && (
        <Card>
          <CardContent className="pt-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {t(`TENANT_EARN_DISPLAY.${level}_CODE`)}
                  </TableHead>
                  <TableHead>
                    {t(`TENANT_EARN_DISPLAY.${level}_NAME`)}
                  </TableHead>
                  <TableHead>{t('TENANT_EARN_DISPLAY.TEXT_EN')}</TableHead>
                  <TableHead>{t('TENANT_EARN_DISPLAY.TEXT_VI')}</TableHead>
                  <TableHead>{t('TENANT_EARN_DISPLAY.FORM.STATUS')}</TableHead>
                  <TableHead>{t('TENANT_EARN_DISPLAY.PREVIEW')}</TableHead>
                  <TableHead>{t('COMMON.ACTIONS')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {targets.map((item) => (
                  <TableRow key={item.targetId}>
                    <TableCell className="font-medium">{item.code}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.configuration?.textEn ?? '—'}</TableCell>
                    <TableCell>{item.configuration?.textVi ?? '—'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.configuration?.displayStatus === 'ACTIVE'
                            ? 'success'
                            : 'secondary'
                        }
                        appearance="light"
                      >
                        {t(
                          `COMMON.STATUS.${item.configuration?.displayStatus ?? 'INACTIVE'}`,
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {t(
                        `TENANT_EARN_DISPLAY.${item.isEffectivelyDisplayed ? 'DISPLAYED' : 'NOT_DISPLAYED'}`,
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        title={
                          item.unavailableReason
                            ? t(
                                `TENANT_EARN_DISPLAY.UNAVAILABLE.${item.unavailableReason}`,
                              )
                            : undefined
                        }
                        disabled={
                          !item.canConfigure || !context.data.brand.canConfigure
                        }
                        onClick={() =>
                          requestNavigation({ level, target: item })
                        }
                      >
                        <Settings2 />
                        {t('TENANT_EARN_DISPLAY.CONFIGURE')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {draft && (level === 'BRAND' || target) && (
        <TenantEarnDisplayForm
          draft={draft}
          errorCode={errorCode}
          pending={saveMutation.isPending}
          targetLabel={targetLabel}
          onChange={(next) => {
            setDraft(next);
            setDirty(true);
            setErrorCode(null);
          }}
          onSave={() => save()}
          onCancel={() =>
            requestNavigation(
              level === 'BRAND'
                ? { level: 'BACK', target: null }
                : { level, target: null },
            )
          }
        />
      )}
      <Dialog
        open={Boolean(pendingNavigation)}
        onOpenChange={(open) => !open && setPendingNavigation(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('TENANT_EARN_DISPLAY.UNSAVED.TITLE')}</DialogTitle>
            <DialogDescription>
              {t('TENANT_EARN_DISPLAY.UNSAVED.DESCRIPTION')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-wrap">
            <Button
              variant="outline"
              onClick={() => setPendingNavigation(null)}
            >
              {t('TENANT_EARN_DISPLAY.UNSAVED.STAY')}
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                pendingNavigation && applyNavigation(pendingNavigation)
              }
            >
              {t('TENANT_EARN_DISPLAY.UNSAVED.DISCARD')}
            </Button>
            <Button
              disabled={saveMutation.isPending}
              onClick={() => save(true)}
            >
              {t('TENANT_EARN_DISPLAY.UNSAVED.SAVE_CONTINUE')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
