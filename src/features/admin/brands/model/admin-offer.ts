import type {
  AssetMetadata,
  ContentLocale,
  EntityStatus,
  Offer,
  PageResult,
} from '../../../../shared/contracts';

export type OfferCommissionStatus = 'ALL' | 'CONFIGURED' | 'NOT_CONFIGURED';

export interface AdminOfferQuery {
  page: number;
  pageSize: number;
  keyword: string;
  status: EntityStatus | 'ALL';
  commissionStatus: OfferCommissionStatus;
}

export interface AdminOfferListItem {
  id: string;
  mappingId: string | null;
  title: string;
  resolvedLocale: ContentLocale;
  brandOfferCode: string | null;
  brandOfferTitle: string;
  commissionType: Offer['commissionType'];
  commissionValue: number | null;
  commissionConfigured: boolean;
  status: EntityStatus;
  canView: boolean;
  canEdit: boolean;
}

export interface AdminOfferBrandContext {
  id: string;
  name: string;
  logo: AssetMetadata | null;
  domain: string;
  status: EntityStatus;
}

export interface AdminOfferListResult extends PageResult<AdminOfferListItem> {
  brand: AdminOfferBrandContext;
  canCreate: boolean;
}

export interface AdminOfferDetailView {
  brand: AdminOfferBrandContext;
  offer: Offer;
  mappingInUse: boolean;
  commissionConfigured: boolean;
  canEdit: boolean;
}

export const ADMIN_OFFER_DEFAULT_QUERY: AdminOfferQuery = {
  page: 1,
  pageSize: 5,
  keyword: '',
  status: 'ALL',
  commissionStatus: 'ALL',
};

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function readAdminOfferQuery(params: URLSearchParams): AdminOfferQuery {
  const status = params.get('status');
  const commissionStatus = params.get('commissionStatus');
  return {
    page: positiveInteger(params.get('page'), 1),
    pageSize: [5, 10, 20].includes(positiveInteger(params.get('pageSize'), 5))
      ? positiveInteger(params.get('pageSize'), 5)
      : 5,
    keyword: params.get('keyword')?.trim() ?? '',
    status:
      status === 'ACTIVE' || status === 'DRAFT' || status === 'INACTIVE'
        ? status
        : 'ALL',
    commissionStatus:
      commissionStatus === 'CONFIGURED' || commissionStatus === 'NOT_CONFIGURED'
        ? commissionStatus
        : 'ALL',
  };
}

export function writeAdminOfferQuery(query: AdminOfferQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.page !== 1) params.set('page', String(query.page));
  if (query.pageSize !== 5) params.set('pageSize', String(query.pageSize));
  if (query.keyword) params.set('keyword', query.keyword.trim());
  if (query.status !== 'ALL') params.set('status', query.status);
  if (query.commissionStatus !== 'ALL') {
    params.set('commissionStatus', query.commissionStatus);
  }
  return params;
}
