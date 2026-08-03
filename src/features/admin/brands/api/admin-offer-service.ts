import type { Brand, ContentLocale, Offer } from '../../../../shared/contracts';
import { mockData } from '../../../../shared/mocks/mock-data';
import {
  hasPermission,
  type AdminRoleCode,
} from '../../../../shared/permissions';
import type {
  AdminOfferBrandContext,
  AdminOfferDetailView,
  AdminOfferInput,
  AdminOfferListItem,
  AdminOfferListResult,
  AdminOfferQuery,
} from '../model/admin-offer';
import { adminOfferSchema } from '../model/admin-offer';

function assertView(roleCode: AdminRoleCode) {
  if (!hasPermission(roleCode, 'brands.view')) throw new Error('FORBIDDEN');
}

function assertMutation(
  roleCode: AdminRoleCode,
  permission: 'brands.create' | 'brands.edit',
) {
  if (!hasPermission(roleCode, permission)) throw new Error('FORBIDDEN');
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

function isMappingInUse(brandId: string, offerId: string) {
  return (
    mockData.transactions.some(
      (transaction) => transaction.brandId === brandId,
    ) &&
    mockData.tenantBrandAssignments.some(
      (assignment) =>
        assignment.brandId === brandId && assignment.offerIds.includes(offerId),
    )
  );
}

function assertUniqueBrandOfferCode(
  brandId: string,
  brandOfferCode: string,
  excludedOfferId?: string,
) {
  if (
    brandOfferCode &&
    mockData.offers.some(
      (offer) =>
        offer.brandId === brandId &&
        offer.id !== excludedOfferId &&
        offer.brandOfferCode?.toLowerCase() === brandOfferCode.toLowerCase(),
    )
  ) {
    throw new Error('BRAND_OFFER_CODE_DUPLICATE');
  }
}

function toContents(
  input: ReturnType<typeof adminOfferSchema.parse>,
): Offer['contents'] {
  const contents: Offer['contents'] = [];
  if (input.viTitle || input.viBadge || input.viDescription || input.viTerms) {
    contents.push({
      locale: 'vi-VN',
      title: input.viTitle,
      badge: input.viBadge,
      description: input.viDescription,
      terms: input.viTerms,
    });
  }
  if (input.enTitle || input.enBadge || input.enDescription || input.enTerms) {
    contents.push({
      locale: 'en-US',
      title: input.enTitle,
      badge: input.enBadge,
      description: input.enDescription,
      terms: input.enTerms,
    });
  }
  return contents;
}

function audit(action: string, offerId: string, actorId: string) {
  const sequence = mockData.auditRecords.length + 1;
  mockData.auditRecords.push({
    id: `audit-offer-${sequence}`,
    actorId,
    action,
    entityType: 'OFFER',
    entityId: offerId,
    occurredAt: `2026-08-03T${String(sequence).padStart(2, '0')}:55:00.000Z`,
  });
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
    const mappingInUse = isMappingInUse(brandId, offerId);
    return structuredClone({
      brand: toBrandContext(brand),
      offer,
      mappingInUse,
      commissionConfigured: isCommissionConfigured(offer),
      canEdit: hasPermission(roleCode, 'brands.edit'),
    });
  },

  async createOffer(
    brandId: string,
    input: AdminOfferInput,
    roleCode: AdminRoleCode,
    actorId: string,
  ): Promise<Offer> {
    assertMutation(roleCode, 'brands.create');
    const brand = getBrandOrThrow(brandId);
    const parsed = adminOfferSchema.parse(input);
    if (parsed.status === 'ACTIVE' && brand.status !== 'ACTIVE') {
      throw new Error('BRAND_NOT_ACTIVE');
    }
    assertUniqueBrandOfferCode(brandId, parsed.brandOfferCode);
    const sequence = mockData.offers.length + 1;
    const offerId = `offer-${brandId.replace(/^brand-/, '')}-${sequence}`;
    const contents = toContents(parsed);
    const title =
      contents.find(({ locale }) => locale === parsed.defaultLocale)?.title ||
      contents[0]?.title ||
      `Offer ${sequence}`;
    const occurredAt = `2026-08-03T${String(sequence).padStart(2, '0')}:00:00.000Z`;
    const offer: Offer = {
      id: offerId,
      brandId,
      code: `OFF-${String(sequence).padStart(4, '0')}`,
      title,
      status: parsed.status,
      startAt: parsed.startAt ? new Date(parsed.startAt).toISOString() : null,
      endAt: parsed.endAt ? new Date(parsed.endAt).toISOString() : null,
      destinationUrl: parsed.destinationUrl,
      defaultLocale: parsed.defaultLocale,
      contents,
      mappingId: parsed.brandOfferCode
        ? `OFM-${String(sequence).padStart(4, '0')}`
        : null,
      brandOfferCode: parsed.brandOfferCode || null,
      brandOfferTitle: parsed.brandOfferTitle,
      commissionType:
        parsed.commissionType === 'NONE' ? null : parsed.commissionType,
      commissionValue:
        parsed.commissionType === 'NONE' ? null : parsed.commissionValue,
      createdBy: actorId,
      createdAt: occurredAt,
      updatedBy: actorId,
      updatedAt: occurredAt,
      version: 1,
    };
    mockData.offers.push(offer);
    audit('CREATE_OFFER', offer.id, actorId);
    return structuredClone(offer);
  },

  async updateOffer(
    brandId: string,
    offerId: string,
    input: AdminOfferInput,
    expectedVersion: number,
    roleCode: AdminRoleCode,
    actorId: string,
  ): Promise<Offer> {
    assertMutation(roleCode, 'brands.edit');
    const brand = getBrandOrThrow(brandId);
    const current = getOfferOrThrow(brandId, offerId);
    if (current.version !== expectedVersion)
      throw new Error('VERSION_CONFLICT');
    const parsed = adminOfferSchema.parse(input);
    if (parsed.status === 'ACTIVE' && brand.status !== 'ACTIVE') {
      throw new Error('BRAND_NOT_ACTIVE');
    }
    const nextCode = parsed.brandOfferCode || null;
    if (
      isMappingInUse(brandId, offerId) &&
      nextCode?.toLowerCase() !== current.brandOfferCode?.toLowerCase()
    ) {
      throw new Error('BRAND_OFFER_CODE_IN_USE');
    }
    assertUniqueBrandOfferCode(brandId, parsed.brandOfferCode, offerId);
    const contents = toContents(parsed);
    current.title =
      contents.find(({ locale }) => locale === parsed.defaultLocale)?.title ||
      contents[0]?.title ||
      current.title;
    current.status = parsed.status;
    current.startAt = parsed.startAt
      ? new Date(parsed.startAt).toISOString()
      : null;
    current.endAt = parsed.endAt ? new Date(parsed.endAt).toISOString() : null;
    current.destinationUrl = parsed.destinationUrl;
    current.defaultLocale = parsed.defaultLocale;
    current.contents = contents;
    if (!nextCode) current.mappingId = null;
    else if (!current.mappingId) {
      current.mappingId = `OFM-${String(mockData.offers.length + 1).padStart(4, '0')}`;
    }
    current.brandOfferCode = nextCode;
    current.brandOfferTitle = parsed.brandOfferTitle;
    current.commissionType =
      parsed.commissionType === 'NONE' ? null : parsed.commissionType;
    current.commissionValue =
      parsed.commissionType === 'NONE' ? null : parsed.commissionValue;
    current.updatedBy = actorId;
    current.updatedAt = `2026-08-03T${String(mockData.auditRecords.length + 1).padStart(2, '0')}:58:00.000Z`;
    current.version += 1;
    audit('UPDATE_OFFER', current.id, actorId);
    return structuredClone(current);
  },
};
