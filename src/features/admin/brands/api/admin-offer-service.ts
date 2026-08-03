import type { Brand, ContentLocale, Offer } from '../../../../shared/contracts';
import { mockData } from '../../../../shared/mocks/mock-data';
import {
  hasPermission,
  type AdminRoleCode,
} from '../../../../shared/permissions';
import type {
  AdminOfferBrandContext,
  AdminOfferDetailView,
  AdminOfferListItem,
  AdminOfferListResult,
  AdminOfferQuery,
} from '../model/admin-offer';

function assertView(roleCode: AdminRoleCode) {
  if (!hasPermission(roleCode, 'brands.view')) throw new Error('FORBIDDEN');
}

function getBrandOrThrow(brandId: string): Brand {
  const brand = mockData.brands.find(({ id }) => id === brandId);
  if (!brand) throw new Error('BRAND_NOT_FOUND');
  return brand;
}

function getOfferOrThrow(brandId: string, offerId: string): Offer {
  const offer = mockData.offers.find(
    ({ id, brandId: ownerId }) => id === offerId && ownerId === brandId,
  );
  if (!offer) throw new Error('OFFER_NOT_FOUND');
  return offer;
}

function toBrandContext(brand: Brand): AdminOfferBrandContext {
  return {
    id: brand.id,
    name: brand.name,
    logo: brand.logo,
    domain: new URL(brand.websiteUrl).hostname,
    status: brand.status,
  };
}

function isCommissionConfigured(offer: Offer) {
  return Boolean(
    offer.commissionType &&
    offer.commissionValue &&
    offer.commissionValue > 0 &&
    (offer.commissionType !== 'PERCENTAGE' || offer.commissionValue <= 100),
  );
}

function resolveTitle(offer: Offer, locale: ContentLocale) {
  const content =
    offer.contents.find((item) => item.locale === locale && item.title) ??
    offer.contents.find(
      (item) => item.locale === offer.defaultLocale && item.title,
    ) ??
    offer.contents[0];
  return {
    title: content?.title ?? offer.title,
    locale: content?.locale ?? offer.defaultLocale,
  };
}

export const adminOfferService = {
  async listOffers(
    brandId: string,
    query: AdminOfferQuery,
    roleCode: AdminRoleCode,
    locale: ContentLocale,
  ): Promise<AdminOfferListResult> {
    assertView(roleCode);
    const brand = getBrandOrThrow(brandId);
    const keyword = query.keyword.trim().toLocaleLowerCase(locale);
    const canEdit = hasPermission(roleCode, 'brands.edit');
    const items = mockData.offers.reduce<AdminOfferListItem[]>(
      (result, offer) => {
        if (offer.brandId !== brandId) return result;
        const resolved = resolveTitle(offer, locale);
        const commissionConfigured = isCommissionConfigured(offer);
        const searchable = [
          offer.mappingId ?? '',
          resolved.title,
          offer.brandOfferCode ?? '',
          offer.brandOfferTitle,
        ].some((value) => value.toLocaleLowerCase(locale).includes(keyword));
        if (keyword && !searchable) return result;
        if (query.status !== 'ALL' && offer.status !== query.status)
          return result;
        if (
          query.commissionStatus !== 'ALL' &&
          commissionConfigured !== (query.commissionStatus === 'CONFIGURED')
        )
          return result;
        result.push({
          id: offer.id,
          mappingId: offer.mappingId,
          title: resolved.title,
          resolvedLocale: resolved.locale,
          brandOfferCode: offer.brandOfferCode,
          brandOfferTitle: offer.brandOfferTitle,
          commissionType: offer.commissionType,
          commissionValue: offer.commissionValue,
          commissionConfigured,
          status: offer.status,
          canView: true,
          canEdit,
        });
        return result;
      },
      [],
    );
    items.sort((left, right) => left.title.localeCompare(right.title, locale));
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
    const page = Math.min(query.page, totalPages);
    const start = (page - 1) * query.pageSize;
    return structuredClone({
      brand: toBrandContext(brand),
      canCreate: hasPermission(roleCode, 'brands.create'),
      items: items.slice(start, start + query.pageSize),
      page,
      pageSize: query.pageSize,
      totalItems,
      totalPages,
    });
  },

  async getOffer(
    brandId: string,
    offerId: string,
    roleCode: AdminRoleCode,
  ): Promise<AdminOfferDetailView> {
    assertView(roleCode);
    const brand = getBrandOrThrow(brandId);
    const offer = getOfferOrThrow(brandId, offerId);
    const mappingInUse = mockData.transactions.some(
      (transaction) => transaction.brandId === brandId,
    );
    return structuredClone({
      brand: toBrandContext(brand),
      offer,
      mappingInUse,
      commissionConfigured: isCommissionConfigured(offer),
      canEdit: hasPermission(roleCode, 'brands.edit'),
    });
  },
};
