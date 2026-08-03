import { useMemo, useState } from 'react';
import type { AuthSession } from '@/shared/contracts';
import { useTranslations } from '@/shared/hooks/use-translations';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
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
import { toast } from 'sonner';
import {
  useTenantAssignedBrandMutations,
  useTenantAssignedBrandScope,
} from '../hooks/use-tenant-assigned-brands';

export function TenantAssignedBrandScope({
  session,
  brandId,
  tab,
  onTabChange,
}: {
  session: AuthSession | null;
  brandId: string;
  tab: 'categories' | 'offers';
  onTabChange: (tab: 'categories' | 'offers') => void;
}) {
  const { t, language } = useTranslations();
  const scope = useTenantAssignedBrandScope(session, brandId);
  const mutations = useTenantAssignedBrandMutations(session);
  const [offerTarget, setOfferTarget] = useState<{
    id: string;
    name: string;
    value: boolean;
  } | null>(null);
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale),
    [locale],
  );
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }),
    [locale],
  );
  const date = (value: string | null) =>
    value ? dateFormatter.format(new Date(value)) : '—';
  const commission = (type: string | null, value: number | null) => {
    if (!type || value === null) return '—';
    return type === 'PERCENTAGE'
      ? `${value}%`
      : currencyFormatter.format(value);
  };

  if (scope.isLoading) return <Skeleton className="h-48 w-full" />;
  if (!scope.data)
    return (
      <p className="p-6 text-sm text-destructive">
        {t('TENANT_ASSIGNED_BRANDS.ERROR')}
      </p>
    );

  const confirmOffer = async () => {
    if (!offerTarget) return;
    try {
      await mutations.offerVisibility.mutateAsync({
        brandId,
        offerId: offerTarget.id,
        value: offerTarget.value,
        expectedVersion: scope.data.brand.version,
      });
      toast.success(t('TENANT_ASSIGNED_BRANDS.ACTIONS.SUCCESS'));
      setOfferTarget(null);
    } catch {
      toast.error(t('TENANT_ASSIGNED_BRANDS.ACTIONS.ERROR'));
    }
  };

  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="mb-4 flex gap-2">
        <Button
          size="sm"
          variant={tab === 'categories' ? 'primary' : 'outline'}
          onClick={() => onTabChange('categories')}
        >
          {t('TENANT_ASSIGNED_BRANDS.CATEGORIES_COMMISSION')}
        </Button>
        <Button
          size="sm"
          variant={tab === 'offers' ? 'primary' : 'outline'}
          onClick={() => onTabChange('offers')}
        >
          {t('TENANT_ASSIGNED_BRANDS.OFFERS')}
        </Button>
      </div>
      {tab === 'categories' ? (
        scope.data.categories.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('TENANT_ASSIGNED_BRANDS.NO_CATEGORIES')}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t('TENANT_ASSIGNED_BRANDS.BRAND_CATEGORY')}
                </TableHead>
                <TableHead>
                  {t('TENANT_ASSIGNED_BRANDS.AFFILIATE_CATEGORY')}
                </TableHead>
                <TableHead>{t('TENANT_ASSIGNED_BRANDS.COMMISSION')}</TableHead>
                <TableHead>
                  {t('TENANT_ASSIGNED_BRANDS.EFFECTIVE_FROM')}
                </TableHead>
                <TableHead>
                  {t('TENANT_ASSIGNED_BRANDS.EFFECTIVE_TO')}
                </TableHead>
                <TableHead>{t('COMMON.STATUS_1')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scope.data.categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.brandCategory}</TableCell>
                  <TableCell>{category.affiliateCategory}</TableCell>
                  <TableCell>
                    {commission(
                      category.commissionType,
                      category.commissionValue,
                    )}
                  </TableCell>
                  <TableCell>{date(category.effectiveFrom)}</TableCell>
                  <TableCell>{date(category.effectiveTo)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        category.status === 'ACTIVE' ? 'success' : 'secondary'
                      }
                      appearance="light"
                    >
                      {t(`COMMON.STATUS.${category.status}`)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      ) : scope.data.offers.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t('TENANT_ASSIGNED_BRANDS.NO_OFFERS')}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('TENANT_ASSIGNED_BRANDS.OFFER')}</TableHead>
              <TableHead>
                {t('TENANT_ASSIGNED_BRANDS.OFFER_COMMISSION')}
              </TableHead>
              <TableHead>
                {t('TENANT_ASSIGNED_BRANDS.OFFER_VISIBILITY')}
              </TableHead>
              <TableHead>
                {t('TENANT_ASSIGNED_BRANDS.EFFECTIVE_FROM')}
              </TableHead>
              <TableHead>{t('TENANT_ASSIGNED_BRANDS.EFFECTIVE_TO')}</TableHead>
              <TableHead>{t('COMMON.STATUS_1')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scope.data.offers.map((offer) => (
              <TableRow key={offer.id}>
                <TableCell>
                  <p className="font-medium">{offer.name}</p>
                  <p className="text-xs text-muted-foreground">{offer.code}</p>
                </TableCell>
                <TableCell>
                  {commission(offer.commissionType, offer.commissionValue)}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant={offer.configuredVisibility ? 'primary' : 'outline'}
                    disabled={!offer.canToggle}
                    aria-label={t(
                      'TENANT_ASSIGNED_BRANDS.ACTIONS.OFFER_LABEL',
                      { name: offer.name },
                    )}
                    onClick={() =>
                      setOfferTarget({
                        id: offer.id,
                        name: offer.name,
                        value: !offer.configuredVisibility,
                      })
                    }
                  >
                    {t(
                      `TENANT_ASSIGNED_BRANDS.${offer.configuredVisibility ? 'ON' : 'OFF'}`,
                    )}
                  </Button>
                </TableCell>
                <TableCell>{date(offer.effectiveFrom)}</TableCell>
                <TableCell>{date(offer.effectiveTo)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      offer.status === 'ACTIVE' ? 'success' : 'secondary'
                    }
                    appearance="light"
                  >
                    {t(`COMMON.STATUS.${offer.status}`)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Dialog
        open={Boolean(offerTarget)}
        onOpenChange={(open) => !open && setOfferTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('TENANT_ASSIGNED_BRANDS.ACTIONS.CONFIRM_TITLE')}
            </DialogTitle>
            <DialogDescription>
              {t('TENANT_ASSIGNED_BRANDS.ACTIONS.CONFIRM_DESCRIPTION', {
                action: t('TENANT_ASSIGNED_BRANDS.ACTIONS.OFFER'),
                state: t(
                  `TENANT_ASSIGNED_BRANDS.${offerTarget?.value ? 'ON' : 'OFF'}`,
                ),
                name: offerTarget?.name,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOfferTarget(null)}>
              {t('COMMON.CANCEL')}
            </Button>
            <Button
              disabled={mutations.offerVisibility.isPending}
              onClick={confirmOffer}
            >
              {t('COMMON.CONFIRM')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
