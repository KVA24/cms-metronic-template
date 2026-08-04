import { useMemo, useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Alert, AlertDescription, AlertIcon } from '@/shared/ui/atoms/alert';
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
import { Input } from '@/shared/ui/atoms/input';
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
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useTenantAssignedBrandMutations,
  useTenantAssignedBrands,
} from '../hooks/use-tenant-assigned-brands';
import {
  TENANT_ASSIGNED_BRAND_DEFAULT_QUERY,
  type TenantAssignedBrandQuery,
} from '../model/tenant-assigned-brand';
import { TenantAssignedBrandScope } from './tenant-assigned-brand-scope';

interface PendingAction {
  type: 'visibility' | 'hot';
  brandId: string;
  brandName: string;
  value: boolean;
  expectedVersion: number;
}

export function TenantAssignedBrandPage() {
  const session = useAuthSession();
  const { t, language } = useTranslations();
  const [query, setQuery] = useState(TENANT_ASSIGNED_BRAND_DEFAULT_QUERY);
  const [draft, setDraft] = useState(query);
  const [expanded, setExpanded] = useState<{
    brandId: string;
    tab: 'categories' | 'offers';
  } | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const result = useTenantAssignedBrands(session, query);
  const mutations = useTenantAssignedBrandMutations(session);
  const selectClassName =
    'h-9 w-full rounded-md border border-input bg-background px-3 text-sm';
  const apply = () => setQuery({ ...draft, page: 1 });
  const expand = (brandId: string, tab: 'categories' | 'offers') =>
    setExpanded((current) =>
      current?.brandId === brandId && current.tab === tab
        ? null
        : { brandId, tab },
    );
  const dateTime = useMemo(
    () =>
      new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-GB', {
        dateStyle: 'short',
        timeStyle: 'medium',
      }),
    [language],
  );
  const confirmAction = async () => {
    if (!pendingAction) return;
    const mutation =
      pendingAction.type === 'visibility'
        ? mutations.visibility
        : mutations.hot;
    try {
      await mutation.mutateAsync({
        brandId: pendingAction.brandId,
        value: pendingAction.value,
        expectedVersion: pendingAction.expectedVersion,
      });
      toast.success(t('TENANT_ASSIGNED_BRANDS.ACTIONS.SUCCESS'));
      setPendingAction(null);
    } catch {
      toast.error(t('TENANT_ASSIGNED_BRANDS.ACTIONS.ERROR'));
    }
  };

  return (
    <Container width="fluid" className="space-y-5 pb-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {t('TENANT_ASSIGNED_BRANDS.TITLE')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('TENANT_ASSIGNED_BRANDS.DESCRIPTION')}
          </p>
        </div>
        <Button variant="outline" onClick={() => result.refetch()}>
          <RefreshCw /> {t('COMMON.REFRESH')}
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['ASSIGNED', result.data?.metrics.assignedBrands ?? 0],
          ['VISIBLE', result.data?.metrics.visibleOnLanding ?? 0],
          ['COVERAGE', `${result.data?.metrics.landingCoverage ?? 0}%`],
        ].map(([key, value]) => (
          <Card key={key}>
            <CardContent className="pt-5">
              <p className="text-muted-foreground text-sm">
                {t(`TENANT_ASSIGNED_BRANDS.METRICS.${key}`)}
              </p>
              <p className="mt-2 text-3xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-5 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end">
          <label className="space-y-1 text-sm">
            <span>{t('TENANT_ASSIGNED_BRANDS.KEYWORD')}</span>
            <Input
              maxLength={100}
              value={draft.search ?? ''}
              placeholder={t('TENANT_ASSIGNED_BRANDS.KEYWORD_PLACEHOLDER')}
              onChange={(event) =>
                setDraft({ ...draft, search: event.target.value || undefined })
              }
              onKeyDown={(event) => event.key === 'Enter' && apply()}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>{t('TENANT_ASSIGNED_BRANDS.CATEGORY')}</span>
            <select
              className={selectClassName}
              value={draft.categoryId ?? ''}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  categoryId: event.target.value || undefined,
                })
              }
            >
              <option value="">
                {t('TENANT_ASSIGNED_BRANDS.ALL_CATEGORIES')}
              </option>
              {result.data?.categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>{t('TENANT_ASSIGNED_BRANDS.BRAND_STATUS')}</span>
            <select
              className={selectClassName}
              value={draft.brandStatus ?? ''}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  brandStatus:
                    (event.target
                      .value as TenantAssignedBrandQuery['brandStatus']) ||
                    undefined,
                })
              }
            >
              <option value="">
                {t('TENANT_ASSIGNED_BRANDS.ALL_STATUSES')}
              </option>
              <option value="ACTIVE">{t('COMMON.STATUS.ACTIVE')}</option>
              <option value="INACTIVE">{t('COMMON.STATUS.INACTIVE')}</option>
            </select>
          </label>
          <Button onClick={apply}>{t('COMMON.APPLY')}</Button>
        </CardContent>
      </Card>

      {result.isLoading ? (
        <Skeleton className="h-72 w-full" />
      ) : result.isError || !result.data ? (
        <Alert variant="destructive">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertDescription>
            {t('TENANT_ASSIGNED_BRANDS.ERROR')}
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardContent className="space-y-3 pt-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('TENANT_ASSIGNED_BRANDS.CODE')}</TableHead>
                  <TableHead>{t('TENANT_ASSIGNED_BRANDS.NAME')}</TableHead>
                  <TableHead>
                    {t('TENANT_ASSIGNED_BRANDS.CATEGORIES')}
                  </TableHead>
                  <TableHead>{t('TENANT_ASSIGNED_BRANDS.OFFERS')}</TableHead>
                  <TableHead>
                    {t('TENANT_ASSIGNED_BRANDS.SHOW_LANDING')}
                  </TableHead>
                  <TableHead>
                    {t('TENANT_ASSIGNED_BRANDS.EARN_DISPLAY')}
                  </TableHead>
                  <TableHead>{t('TENANT_ASSIGNED_BRANDS.BRAND_HOT')}</TableHead>
                  <TableHead>
                    {t('TENANT_ASSIGNED_BRANDS.LAST_UPDATED')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center">
                      {t('TENANT_ASSIGNED_BRANDS.EMPTY')}
                    </TableCell>
                  </TableRow>
                ) : (
                  result.data.items.map((brand) => (
                    <TableRow key={brand.id}>
                      <TableCell className="font-medium">
                        {brand.code}
                      </TableCell>
                      <TableCell>
                        <p>{brand.name}</p>
                        <Badge
                          variant={
                            brand.status === 'ACTIVE' ? 'success' : 'secondary'
                          }
                          appearance="light"
                        >
                          {t(`COMMON.STATUS.${brand.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => expand(brand.id, 'categories')}
                        >
                          {brand.categoryCount}{' '}
                          {t('TENANT_ASSIGNED_BRANDS.CATEGORIES')}
                          {expanded?.brandId === brand.id &&
                          expanded.tab === 'categories' ? (
                            <ChevronUp />
                          ) : (
                            <ChevronDown />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => expand(brand.id, 'offers')}
                        >
                          {brand.customizedOfferCount}/{brand.offerCount}{' '}
                          {t('TENANT_ASSIGNED_BRANDS.CUSTOMIZED')}
                          {expanded?.brandId === brand.id &&
                          expanded.tab === 'offers' ? (
                            <ChevronUp />
                          ) : (
                            <ChevronDown />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={brand.showOnLanding ? 'primary' : 'outline'}
                          disabled={!brand.canEdit}
                          aria-label={t(
                            'TENANT_ASSIGNED_BRANDS.ACTIONS.LANDING_LABEL',
                            { name: brand.name },
                          )}
                          onClick={() =>
                            setPendingAction({
                              type: 'visibility',
                              brandId: brand.id,
                              brandName: brand.name,
                              value: !brand.showOnLanding,
                              expectedVersion: brand.version,
                            })
                          }
                        >
                          {t(
                            `TENANT_ASSIGNED_BRANDS.${brand.showOnLanding ? 'ON' : 'OFF'}`,
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        {t(
                          `TENANT_ASSIGNED_BRANDS.${brand.earnConfigured ? 'CONFIGURED' : 'NOT_CONFIGURED'}`,
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={brand.isHot ? 'primary' : 'outline'}
                          disabled={!brand.canEdit || !brand.effectivelyVisible}
                          aria-label={t(
                            'TENANT_ASSIGNED_BRANDS.ACTIONS.HOT_LABEL',
                            { name: brand.name },
                          )}
                          onClick={() =>
                            setPendingAction({
                              type: 'hot',
                              brandId: brand.id,
                              brandName: brand.name,
                              value: !brand.isHot,
                              expectedVersion: brand.version,
                            })
                          }
                        >
                          {brand.isHot ? '🔥 ' : ''}
                          {t(
                            `TENANT_ASSIGNED_BRANDS.${brand.isHot ? 'ON' : 'OFF'}`,
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <p>{dateTime.format(new Date(brand.updatedAt))}</p>
                        <p className="text-muted-foreground text-xs">
                          {brand.updatedBy}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {expanded && (
              <TenantAssignedBrandScope
                session={session}
                brandId={expanded.brandId}
                tab={expanded.tab}
                onTabChange={(tab) => setExpanded({ ...expanded, tab })}
              />
            )}
            <div className="text-muted-foreground flex items-center justify-between text-sm">
              <span>
                {t('TENANT_ASSIGNED_BRANDS.PAGE', {
                  page: result.data.page,
                  total: result.data.totalPages,
                  count: result.data.totalItems,
                })}
              </span>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  aria-label={t('COMMON.PREVIOUS')}
                  disabled={result.data.page <= 1}
                  onClick={() => setQuery({ ...query, page: query.page - 1 })}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label={t('COMMON.NEXT')}
                  disabled={result.data.page >= result.data.totalPages}
                  onClick={() => setQuery({ ...query, page: query.page + 1 })}
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <Dialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('TENANT_ASSIGNED_BRANDS.ACTIONS.CONFIRM_TITLE')}
            </DialogTitle>
            <DialogDescription>
              {t('TENANT_ASSIGNED_BRANDS.ACTIONS.CONFIRM_DESCRIPTION', {
                action: t(
                  `TENANT_ASSIGNED_BRANDS.ACTIONS.${pendingAction?.type === 'hot' ? 'HOT' : 'LANDING'}`,
                ),
                state: t(
                  `TENANT_ASSIGNED_BRANDS.${pendingAction?.value ? 'ON' : 'OFF'}`,
                ),
                name: pendingAction?.brandName,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingAction(null)}>
              {t('COMMON.CANCEL')}
            </Button>
            <Button
              disabled={
                mutations.visibility.isPending || mutations.hot.isPending
              }
              onClick={confirmAction}
            >
              {t('COMMON.CONFIRM')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
