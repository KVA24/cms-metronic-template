import type {
  AuthSession,
  Brand,
  EarnDisplayTargetType,
} from '../../../../shared/contracts';
import { mockData } from '../../../../shared/mocks/mock-data';
import type {
  TenantEarnBrandContext,
  TenantEarnDisplayDraft,
  TenantEarnDisplayListItem,
  TenantEarnDisplayListResult,
  TenantEarnDisplayQuery,
  TenantEarnTargetView,
} from '../model/tenant-earn-display';

const NOW = '2026-08-03';

function assertView(session: AuthSession) {
  if (
    session.portalType !== 'TENANT' ||
    !session.tenantId ||
    !session.permissions.includes('earn_display.view')
  )
    throw new Error('FORBIDDEN');
  const tenant = mockData.tenants.find(({ id }) => id === session.tenantId);
  if (!tenant || tenant.status !== 'ACTIVE') throw new Error('FORBIDDEN');
}

function assignments(session: AuthSession) {
  return mockData.tenantBrandAssignments.filter(
    ({ tenantId }) => tenantId === session.tenantId,
  );
}

function assignedContext(session: AuthSession, brandId: string) {
  const assignment = assignments(session).find(
    ({ brandId: id }) => id === brandId,
  );
  const brand = mockData.brands.find(({ id }) => id === brandId);
  if (!assignment || !brand) throw new Error('EARN_BRAND_NOT_FOUND');
  return { assignment, brand };
}

function nameFor(session: AuthSession, brand: Brand) {
  const locale = session.locale === 'vi' ? 'vi-VN' : 'en-US';
  return (
    brand.contents.find((content) => content.locale === locale)?.displayName ||
    brand.name
  );
}

function configs(session: AuthSession, brandId: string) {
  return mockData.earnDisplays.filter(
    (config) =>
      config.tenantId === session.tenantId && config.brandId === brandId,
  );
}

function project(
  session: AuthSession,
  brand: Brand,
): TenantEarnDisplayListItem {
  const allConfigs = configs(session, brand.id);
  const brandConfig = allConfigs.find(
    ({ targetType }) => targetType === 'BRAND',
  );
  const canMutate =
    session.permissions.includes('earn_display.create') ||
    session.permissions.includes('earn_display.edit');
  return {
    brandId: brand.id,
    code: brand.code,
    name: nameFor(session, brand),
    logoUrl: brand.logo?.url ?? null,
    brandStatus: brand.status,
    textEn: brandConfig?.textEn ?? null,
    textVi: brandConfig?.textVi ?? null,
    configurationStatus:
      allConfigs.length > 0 ? 'CONFIGURED' : 'NOT_CONFIGURED',
    canConfigure: brand.status === 'ACTIVE' && canMutate,
  };
}

function targetConfiguration(
  session: AuthSession,
  brandId: string,
  targetType: EarnDisplayTargetType,
  targetId: string | null,
) {
  return configs(session, brandId).find(
    (config) =>
      config.targetType === targetType && config.targetId === targetId,
  );
}

function effectivelyDisplayed(
  configuration: ReturnType<typeof targetConfiguration>,
  targetEligible: boolean,
) {
  return Boolean(
    configuration &&
    targetEligible &&
    configuration.displayStatus === 'ACTIVE' &&
    (!configuration.effectiveFrom || configuration.effectiveFrom <= NOW) &&
    (!configuration.effectiveTo || configuration.effectiveTo >= NOW),
  );
}

function contentName(
  session: AuthSession,
  contents: Array<{ locale: string; name?: string; title?: string }>,
  fallback: string,
) {
  const locale = session.locale === 'vi' ? 'vi-VN' : 'en-US';
  const content =
    contents.find((item) => item.locale === locale) ?? contents[0];
  return content?.name ?? content?.title ?? fallback;
}

function categoryTargets(
  session: AuthSession,
  brandId: string,
): TenantEarnTargetView[] {
  return mockData.brandCategoryMappings.reduce<TenantEarnTargetView[]>(
    (result, mapping) => {
      if (mapping.brandId !== brandId) return result;
      const category = mockData.categories.find(
        ({ id }) => id === mapping.categoryId,
      );
      if (!category) return result;
      const active =
        category.status === 'ACTIVE' && mapping.status === 'ACTIVE';
      const configuration = targetConfiguration(
        session,
        brandId,
        'CATEGORY',
        category.id,
      );
      result.push({
        targetType: 'CATEGORY' as const,
        targetId: category.id,
        code: category.code,
        name: contentName(session, category.contents, category.code),
        masterStatus: category.status,
        configuration: configuration ?? null,
        canConfigure: active,
        unavailableReason: active ? null : ('INACTIVE' as const),
        isEffectivelyDisplayed: effectivelyDisplayed(configuration, active),
      });
      return result;
    },
    [],
  );
}

function offerTargets(
  session: AuthSession,
  brandId: string,
  offerIds: string[],
): TenantEarnTargetView[] {
  const assignedIds = new Set(offerIds);
  return mockData.offers.reduce<TenantEarnTargetView[]>((result, offer) => {
    if (offer.brandId !== brandId || !assignedIds.has(offer.id)) return result;
    const expired = Boolean(offer.endAt && offer.endAt < NOW);
    const active =
      offer.status === 'ACTIVE' &&
      !expired &&
      (!offer.startAt || offer.startAt <= NOW);
    const configuration = targetConfiguration(
      session,
      brandId,
      'OFFER',
      offer.id,
    );
    result.push({
      targetType: 'OFFER' as const,
      targetId: offer.id,
      code: offer.code,
      name: contentName(session, offer.contents, offer.title),
      masterStatus: offer.status,
      configuration: configuration ?? null,
      canConfigure: active,
      unavailableReason: expired
        ? ('EXPIRED' as const)
        : active
          ? null
          : ('INACTIVE' as const),
      isEffectivelyDisplayed: effectivelyDisplayed(configuration, active),
    });
    return result;
  }, []);
}

function validateDraft(input: TenantEarnDisplayDraft) {
  if ((input.targetType === 'BRAND') !== (input.targetId === null))
    throw new Error('TARGET_XOR_INVALID');
  if (!['ACTIVE', 'INACTIVE'].includes(input.displayStatus))
    throw new Error('DISPLAY_STATUS_INVALID');
  const textEn = input.textEn.trim();
  const textVi = input.textVi.trim();
  if (!textEn) throw new Error('TEXT_EN_REQUIRED');
  if (!textVi) throw new Error('TEXT_VI_REQUIRED');
  if (textEn.length > 160) throw new Error('TEXT_EN_TOO_LONG');
  if (textVi.length > 160) throw new Error('TEXT_VI_TOO_LONG');
  const validDate = (value: string | null) =>
    value === null ||
    (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(`${value}T00:00:00Z`)));
  if (!validDate(input.effectiveFrom))
    throw new Error('EFFECTIVE_FROM_INVALID');
  if (!validDate(input.effectiveTo)) throw new Error('EFFECTIVE_TO_INVALID');
  if (
    input.effectiveFrom &&
    input.effectiveTo &&
    input.effectiveTo < input.effectiveFrom
  )
    throw new Error('EFFECTIVE_PERIOD_INVALID');
  return { ...input, textEn, textVi };
}

export const tenantEarnDisplayService = {
  async list(
    session: AuthSession,
    query: TenantEarnDisplayQuery,
  ): Promise<TenantEarnDisplayListResult> {
    assertView(session);
    const keyword = query.search?.trim().toLocaleLowerCase() ?? '';
    const rows = assignments(session)
      .flatMap((assignment) => {
        const brand = mockData.brands.find(
          ({ id }) => id === assignment.brandId,
        );
        if (!brand) return [];
        const item = project(session, brand);
        if (
          keyword &&
          ![item.code, item.name].some((value) =>
            value.toLocaleLowerCase().includes(keyword),
          )
        )
          return [];
        if (
          query.configurationStatus &&
          item.configurationStatus !== query.configurationStatus
        )
          return [];
        return [item];
      })
      .sort((left, right) => left.name.localeCompare(right.name));
    const pageSize = Math.max(1, query.pageSize);
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    const page = Math.min(Math.max(1, query.page), totalPages);
    const start = (page - 1) * pageSize;
    return structuredClone({
      items: rows.slice(start, start + pageSize),
      page,
      pageSize,
      totalItems: rows.length,
      totalPages,
    });
  },

  async getBrandContext(
    session: AuthSession,
    brandId: string,
  ): Promise<TenantEarnBrandContext> {
    assertView(session);
    const { assignment, brand } = assignedContext(session, brandId);
    if (brand.status !== 'ACTIVE') throw new Error('BRAND_NOT_ACTIVE');
    const allConfigs = configs(session, brandId);
    const brandConfiguration = allConfigs.find(
      ({ targetType }) => targetType === 'BRAND',
    );
    const categories = categoryTargets(session, brandId);
    const offers = offerTargets(session, brandId, assignment.offerIds);
    return structuredClone({
      brand: project(session, brand),
      brandConfiguration: brandConfiguration ?? null,
      brandEffectivelyDisplayed: effectivelyDisplayed(brandConfiguration, true),
      categoryCount: categories.length,
      offerCount: offers.length,
      categories,
      offers,
      resolutionPriority: ['OFFER', 'CATEGORY', 'BRAND'],
    });
  },

  async save(session: AuthSession, input: TenantEarnDisplayDraft) {
    assertView(session);
    const draft = validateDraft(input);
    const { assignment, brand } = assignedContext(session, draft.brandId);
    if (brand.status !== 'ACTIVE') throw new Error('BRAND_NOT_ACTIVE');
    if (draft.targetType === 'CATEGORY') {
      const target = categoryTargets(session, brand.id).find(
        ({ targetId }) => targetId === draft.targetId,
      );
      if (!target) throw new Error('TARGET_NOT_FOUND');
      if (!target.canConfigure) throw new Error('TARGET_NOT_ACTIVE');
    }
    if (draft.targetType === 'OFFER') {
      const target = offerTargets(session, brand.id, assignment.offerIds).find(
        ({ targetId }) => targetId === draft.targetId,
      );
      if (!target) throw new Error('TARGET_NOT_FOUND');
      if (!target.canConfigure)
        throw new Error(
          target.unavailableReason === 'EXPIRED'
            ? 'TARGET_EXPIRED'
            : 'TARGET_NOT_ACTIVE',
        );
    }
    const existingIndex = mockData.earnDisplays.findIndex(
      (config) =>
        config.tenantId === session.tenantId &&
        config.brandId === draft.brandId &&
        config.targetType === draft.targetType &&
        config.targetId === draft.targetId,
    );
    const existing =
      existingIndex >= 0 ? mockData.earnDisplays[existingIndex] : null;
    const requiredPermission = existing
      ? 'earn_display.edit'
      : 'earn_display.create';
    if (!session.permissions.includes(requiredPermission))
      throw new Error('FORBIDDEN');
    if ((existing?.version ?? null) !== draft.expectedVersion)
      throw new Error('VERSION_CONFLICT');
    const next = {
      id:
        existing?.id ??
        `earn-${session.tenantId}-${draft.brandId}-${draft.targetType.toLowerCase()}-${draft.targetId ?? 'brand'}`,
      tenantId: session.tenantId!,
      brandId: draft.brandId,
      targetType: draft.targetType,
      targetId: draft.targetId,
      textEn: draft.textEn,
      textVi: draft.textVi,
      displayStatus: draft.displayStatus,
      effectiveFrom: draft.effectiveFrom,
      effectiveTo: draft.effectiveTo,
      updatedBy: session.user.id,
      updatedAt: '2026-08-03T22:00:00.000Z',
      version: (existing?.version ?? 0) + 1,
    };
    if (existingIndex >= 0) mockData.earnDisplays[existingIndex] = next;
    else mockData.earnDisplays.push(next);
    mockData.auditRecords.push({
      id: `audit-earn-${mockData.auditRecords.length + 1}`,
      actorId: session.user.id,
      action: existing
        ? 'UPDATE_TENANT_EARN_DISPLAY'
        : 'CREATE_TENANT_EARN_DISPLAY',
      entityType: 'TENANT_EARN_DISPLAY',
      entityId: next.id,
      occurredAt: next.updatedAt,
      before: existing ? { ...structuredClone(existing) } : undefined,
      after: { ...structuredClone(next) },
    });
    return structuredClone(next);
  },
};
