import { z } from 'zod';
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

const optionalUrl = z
  .string()
  .trim()
  .refine(
    (value) => !value || /^https?:\/\/[^\s]+$/i.test(value),
    'DESTINATION_URL_INVALID',
  );
const safeText = (limit: number, lengthMessage: string) =>
  z
    .string()
    .trim()
    .max(limit, lengthMessage)
    .refine(
      (value) => !/<\/?[a-z][^>]*>/i.test(value),
      'CONTENT_HTML_NOT_ALLOWED',
    );

export const adminOfferSchema = z
  .object({
    status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']),
    startAt: z.string().trim(),
    endAt: z.string().trim(),
    destinationUrl: optionalUrl,
    defaultLocale: z.enum(['vi-VN', 'en-US']),
    viTitle: safeText(160, 'OFFER_TITLE_LENGTH'),
    viBadge: safeText(60, 'OFFER_BADGE_LENGTH'),
    viDescription: safeText(1000, 'OFFER_DESCRIPTION_LENGTH'),
    viTerms: safeText(5000, 'OFFER_TERMS_LENGTH'),
    enTitle: safeText(160, 'OFFER_TITLE_LENGTH'),
    enBadge: safeText(60, 'OFFER_BADGE_LENGTH'),
    enDescription: safeText(1000, 'OFFER_DESCRIPTION_LENGTH'),
    enTerms: safeText(5000, 'OFFER_TERMS_LENGTH'),
    brandOfferCode: z
      .string()
      .trim()
      .max(100, 'BRAND_OFFER_CODE_INVALID')
      .refine(
        (value) => !value || /^[A-Za-z0-9_.-]+$/.test(value),
        'BRAND_OFFER_CODE_INVALID',
      )
      .transform((value) => value.toUpperCase()),
    brandOfferTitle: z.string().trim().max(350, 'BRAND_OFFER_TITLE_LENGTH'),
    commissionType: z.enum(['NONE', 'PERCENTAGE', 'FIXED_AMOUNT']),
    commissionValue: z.number().nullable(),
  })
  .superRefine((value, context) => {
    if (value.startAt && Number.isNaN(Date.parse(value.startAt))) {
      context.addIssue({
        code: 'custom',
        path: ['startAt'],
        message: 'START_AT_INVALID',
      });
    }
    if (value.endAt && Number.isNaN(Date.parse(value.endAt))) {
      context.addIssue({
        code: 'custom',
        path: ['endAt'],
        message: 'END_AT_INVALID',
      });
    } else if (
      value.startAt &&
      value.endAt &&
      Date.parse(value.endAt) < Date.parse(value.startAt)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['endAt'],
        message: 'END_AT_BEFORE_START',
      });
    }
    if (value.status === 'ACTIVE') {
      if (!value.destinationUrl)
        context.addIssue({
          code: 'custom',
          path: ['destinationUrl'],
          message: 'DESTINATION_URL_REQUIRED',
        });
      const titleField =
        value.defaultLocale === 'vi-VN' ? 'viTitle' : 'enTitle';
      if (!value[titleField])
        context.addIssue({
          code: 'custom',
          path: [titleField],
          message: 'DEFAULT_OFFER_TITLE_REQUIRED',
        });
    }
    if (value.commissionType !== 'NONE') {
      if (!value.brandOfferCode)
        context.addIssue({
          code: 'custom',
          path: ['brandOfferCode'],
          message: 'BRAND_OFFER_CODE_REQUIRED',
        });
      const amount = value.commissionValue;
      if (
        !amount ||
        amount <= 0 ||
        (value.commissionType === 'PERCENTAGE' && amount > 100)
      ) {
        context.addIssue({
          code: 'custom',
          path: ['commissionValue'],
          message: 'COMMISSION_INVALID',
        });
      }
    }
  });

export type AdminOfferInput = z.input<typeof adminOfferSchema>;

export const ADMIN_OFFER_EMPTY_INPUT: AdminOfferInput = {
  status: 'DRAFT',
  startAt: '',
  endAt: '',
  destinationUrl: '',
  defaultLocale: 'vi-VN',
  viTitle: '',
  viBadge: '',
  viDescription: '',
  viTerms: '',
  enTitle: '',
  enBadge: '',
  enDescription: '',
  enTerms: '',
  brandOfferCode: '',
  brandOfferTitle: '',
  commissionType: 'NONE',
  commissionValue: null,
};

export function offerToInput(offer: Offer): AdminOfferInput {
  const vi = offer.contents.find(({ locale }) => locale === 'vi-VN');
  const en = offer.contents.find(({ locale }) => locale === 'en-US');
  return {
    status: offer.status,
    startAt: offer.startAt?.slice(0, 16) ?? '',
    endAt: offer.endAt?.slice(0, 16) ?? '',
    destinationUrl: offer.destinationUrl,
    defaultLocale: offer.defaultLocale,
    viTitle: vi?.title ?? '',
    viBadge: vi?.badge ?? '',
    viDescription: vi?.description ?? '',
    viTerms: vi?.terms ?? '',
    enTitle: en?.title ?? '',
    enBadge: en?.badge ?? '',
    enDescription: en?.description ?? '',
    enTerms: en?.terms ?? '',
    brandOfferCode: offer.brandOfferCode ?? '',
    brandOfferTitle: offer.brandOfferTitle,
    commissionType: offer.commissionType ?? 'NONE',
    commissionValue: offer.commissionValue,
  };
}

export function isOfferMarketplaceEligible(
  offer: Offer,
  brandStatus: EntityStatus,
  now = '2026-08-03T12:00:00.000Z',
) {
  return Boolean(
    brandStatus === 'ACTIVE' &&
    offer.status === 'ACTIVE' &&
    (!offer.startAt || offer.startAt <= now) &&
    (!offer.endAt || offer.endAt >= now),
  );
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
