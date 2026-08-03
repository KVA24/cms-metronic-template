import { useState } from 'react';
import { useTranslations } from '@/shared/hooks/use-translations';
import { useAuthSession } from '@/shared/stores/auth-store';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent } from '@/shared/ui/atoms/card';
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
import { ChevronLeft, ChevronRight, RefreshCw, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTenantEarnDisplayList } from '../hooks/use-tenant-earn-display';
import {
  TENANT_EARN_DISPLAY_DEFAULT_QUERY,
  type TenantEarnDisplayQuery,
} from '../model/tenant-earn-display';

export function TenantEarnDisplayListPage() {
  const session = useAuthSession();
  const { t } = useTranslations();
  const navigate = useNavigate();
  const [query, setQuery] = useState(TENANT_EARN_DISPLAY_DEFAULT_QUERY);
  const [draft, setDraft] = useState(query);
  const result = useTenantEarnDisplayList(session, query);
  const apply = () => setQuery({ ...draft, page: 1 });

  return (
    <Container width="fluid" className="space-y-5 pb-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {t('TENANT_EARN_DISPLAY.TITLE')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('TENANT_EARN_DISPLAY.DESCRIPTION')}
          </p>
        </div>
        <Button variant="outline" onClick={() => result.refetch()}>
          <RefreshCw />
          {t('COMMON.REFRESH')}
        </Button>
      </header>
      <Card>
        <CardContent className="grid gap-4 pt-5 md:grid-cols-[2fr_1fr_auto] md:items-end">
          <label className="space-y-1 text-sm">
            <span>{t('TENANT_EARN_DISPLAY.KEYWORD')}</span>
            <Input
              maxLength={100}
              value={draft.search ?? ''}
              placeholder={t('TENANT_EARN_DISPLAY.KEYWORD_PLACEHOLDER')}
              onChange={(event) =>
                setDraft({ ...draft, search: event.target.value || undefined })
              }
              onKeyDown={(event) => event.key === 'Enter' && apply()}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>{t('TENANT_EARN_DISPLAY.CONFIGURATION')}</span>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={draft.configurationStatus ?? ''}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  configurationStatus:
                    (event.target
                      .value as TenantEarnDisplayQuery['configurationStatus']) ||
                    undefined,
                })
              }
            >
              <option value="">{t('TENANT_EARN_DISPLAY.ALL_STATUSES')}</option>
              <option value="CONFIGURED">
                {t('TENANT_EARN_DISPLAY.CONFIGURED')}
              </option>
              <option value="NOT_CONFIGURED">
                {t('TENANT_EARN_DISPLAY.NOT_CONFIGURED')}
              </option>
            </select>
          </label>
          <Button onClick={apply}>{t('COMMON.APPLY')}</Button>
        </CardContent>
      </Card>
      {result.isLoading ? (
        <Skeleton className="h-72 w-full" />
      ) : result.isError || !result.data ? (
        <p className="rounded-lg border border-destructive/30 p-6 text-destructive">
          {t('TENANT_EARN_DISPLAY.ERROR')}
        </p>
      ) : (
        <Card>
          <CardContent className="space-y-3 pt-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('TENANT_EARN_DISPLAY.BRAND_CODE')}</TableHead>
                  <TableHead>{t('TENANT_EARN_DISPLAY.BRAND_NAME')}</TableHead>
                  <TableHead>{t('TENANT_EARN_DISPLAY.BRAND_STATUS')}</TableHead>
                  <TableHead>{t('TENANT_EARN_DISPLAY.TEXT_EN')}</TableHead>
                  <TableHead>{t('TENANT_EARN_DISPLAY.TEXT_VI')}</TableHead>
                  <TableHead>
                    {t('TENANT_EARN_DISPLAY.CONFIGURATION')}
                  </TableHead>
                  <TableHead>{t('COMMON.ACTIONS')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      {t('TENANT_EARN_DISPLAY.EMPTY')}
                    </TableCell>
                  </TableRow>
                ) : (
                  result.data.items.map((item) => (
                    <TableRow key={item.brandId}>
                      <TableCell className="font-medium">{item.code}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2">
                          <span className="flex size-8 items-center justify-center rounded-full bg-muted font-semibold">
                            {item.name.slice(0, 1)}
                          </span>
                          {item.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.brandStatus === 'ACTIVE'
                              ? 'success'
                              : 'secondary'
                          }
                          appearance="light"
                        >
                          {t(`COMMON.STATUS.${item.brandStatus}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-56 truncate">
                        {item.textEn ?? '—'}
                      </TableCell>
                      <TableCell className="max-w-56 truncate">
                        {item.textVi ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.configurationStatus === 'CONFIGURED'
                              ? 'success'
                              : 'secondary'
                          }
                          appearance="light"
                        >
                          {t(`TENANT_EARN_DISPLAY.${item.configurationStatus}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!item.canConfigure}
                          onClick={() =>
                            navigate(`/tenant/earn-display/${item.brandId}`)
                          }
                        >
                          <Settings2 />
                          {t('TENANT_EARN_DISPLAY.CONFIGURE')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {t('TENANT_EARN_DISPLAY.PAGE', {
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
    </Container>
  );
}
