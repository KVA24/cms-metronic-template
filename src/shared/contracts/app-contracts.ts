import type { PermissionCode, SystemRoleCode } from '../permissions';

export type PortalType = 'ADMIN' | 'TENANT';
export type UiLocale = 'en' | 'vi';
export type EntityStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';

export interface PageQuery {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface PageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface MockFileResult {
  fileName: string;
  contentType: string;
  downloadUrl?: string;
}

export interface AppError {
  code: string;
  messageKey: string;
  fieldErrors?: Record<string, string>;
}

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  status: AccountStatus;
  tenantId?: string;
  roles: Array<{
    roleCode: SystemRoleCode;
    roleName: string;
  }>;
}

export interface MockAuthAccount extends AuthUser {
  portalType: PortalType;
  password: string;
  roleCode: SystemRoleCode;
  tenantRoleId?: string;
  phone: string;
  avatarFileName?: string;
  failedLoginCount: number;
  lockedAt: string | null;
  sessionRevokedAt: string | null;
  createdSource: 'CMS' | 'TENANT_PORTAL';
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  version: number;
}

export interface TenantRole {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string;
  type: 'SYSTEM' | 'CUSTOM';
  status: 'ACTIVE' | 'INACTIVE';
  permissions: PermissionCode[];
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  version: number;
}

export interface PasswordResetRequest {
  id: string;
  accountId: string;
  tenantId: string;
  email: string;
  otpHash: string;
  issuedAt: string;
  expiresAt: string;
  attempts: number;
  verifiedAt: string | null;
  completedAt: string | null;
}

export interface AuthSession {
  portalType: PortalType;
  user: AuthUser;
  roleCode: SystemRoleCode;
  permissions: PermissionCode[];
  tenantId?: string;
  locale: UiLocale;
}

export interface AuthLoginInput {
  portalType: PortalType;
  username: string;
  password: string;
}

export interface Tenant {
  id: string;
  code: string;
  name: string;
  status: EntityStatus;
  accountOwner: string;
  notes: string;
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  contactPhone: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  version: number;
}

export interface Brand {
  id: string;
  code: string;
  name: string;
  legalName: string;
  websiteUrl: string;
  logo: AssetMetadata | null;
  status: EntityStatus;
  defaultLocale: ContentLocale;
  pendingDays: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  notes: string;
  contents: BrandLocaleContent[];
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  version: number;
}

export interface BrandLocaleContent {
  locale: ContentLocale;
  displayName: string;
  tagline: string;
  shortDescription: string;
  terms: string;
}

export interface BrandCategoryMapping {
  id: string;
  brandId: string;
  categoryId: string;
  brandCategoryCode: string;
  brandCategoryName: string;
  isDefault: boolean;
  commissionType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  commissionValue: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: EntityStatus;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface Offer {
  id: string;
  brandId: string;
  code: string;
  title: string;
  status: EntityStatus;
  startAt: string | null;
  endAt: string | null;
  destinationUrl: string;
  defaultLocale: ContentLocale;
  contents: OfferLocaleContent[];
  mappingId: string | null;
  brandOfferCode: string | null;
  brandOfferTitle: string;
  commissionType: 'PERCENTAGE' | 'FIXED_AMOUNT' | null;
  commissionValue: number | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  version: number;
}

export interface OfferLocaleContent {
  locale: ContentLocale;
  title: string;
  badge: string;
  description: string;
  terms: string;
}

export interface TenantBrandAssignment {
  id: string;
  tenantId: string;
  brandId: string;
  offerIds: string[];
  showOnLanding: boolean;
  isHot: boolean;
  offerVisibility?: Record<string, boolean>;
  updatedBy?: string;
  updatedAt?: string;
  version?: number;
}

export type EarnDisplayTargetType = 'BRAND' | 'CATEGORY' | 'OFFER';

export interface TenantEarnDisplay {
  id: string;
  tenantId: string;
  brandId: string;
  targetType: EarnDisplayTargetType;
  targetId: string | null;
  textEn: string;
  textVi: string;
  displayStatus: 'ACTIVE' | 'INACTIVE';
  effectiveFrom: string | null;
  effectiveTo: string | null;
  updatedBy: string;
  updatedAt: string;
  version: number;
}

export interface TenantRevenueShareOverride {
  id: string;
  type: 'CATEGORY' | 'OFFER';
  targetId: string;
  rate: number;
  status: EntityStatus;
}

export interface TenantRevenueShare {
  id: string;
  tenantId: string;
  brandId: string;
  brandRate: number | null;
  effectiveFrom: string | null;
  status: EntityStatus;
  overrides: TenantRevenueShareOverride[];
  updatedBy: string;
  updatedAt: string;
  version: number;
}

export interface Configuration {
  id: number;
  key: string;
  value: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  version: number;
}

export type TransactionStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface Transaction {
  id: string;
  requestId: string;
  tenantId: string;
  brandId: string;
  clickId: string;
  brandOrderId: string;
  userId: string | null;
  memberRef: string | null;
  customerRef: string | null;
  status: TransactionStatus;
  finalAmount: number;
  currency: 'VND';
  estimatedGrossCommission: number;
  estimatedTenantShare: number;
  actualGrossCommission: number;
  actualTenantShare: number;
  commissionConfirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TransactionItemStatus = 'PENDING' | 'CONFIRMED' | 'REFUNDED';

export interface TransactionItem {
  id: string;
  transactionId: string;
  code: string;
  name: string;
  sku: string | null;
  quantity: number;
  originalAmount: number;
  finalAmount: number;
  offerCode: string | null;
  categoryCode: string | null;
  brandCommissionSource: 'OFFER' | 'CATEGORY' | 'CATEGORY_DEFAULT';
  brandCommissionValue: number;
  brandMappingReference: string;
  brandCommissionRuleVersion: string;
  grossCommission: number;
  tenantShareSource:
    | 'OFFER'
    | 'CATEGORY'
    | 'TENANT_BRAND_DEFAULT'
    | 'ALL_TENANT_DEFAULT';
  tenantShareValue: number;
  tenantShareReference: string;
  tenantShareRuleVersion: string;
  tenantShare: number;
  affiliateKeep: number;
  status: TransactionItemStatus;
  confirmedAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionHistory {
  id: string;
  transactionId: string;
  transactionItemId: string | null;
  requestId: string | null;
  eventType:
    | 'ORDER_RECORDED'
    | 'ITEM_CONFIRMED'
    | 'ITEM_REFUNDED'
    | 'RETRY_APPLIED';
  eventAt: string;
  processingResult: 'APPLIED' | 'REJECTED' | 'FAILED';
  createdBy: string;
}

export interface MockExportRequest {
  id: string;
  type: 'TRANSACTION' | 'EXCEPTION';
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  fileName: string;
  rowCount: number;
  requestedBy: string;
  requestedAt: string;
}

export type ExceptionGroup =
  | 'REQUEST_AUTHENTICATION'
  | 'CLICK_ELIGIBILITY'
  | 'BRAND_COMMISSION'
  | 'TENANT_SHARE'
  | 'CANCEL_REFUND'
  | 'TRANSACTION_PERSISTENCE';

export interface ExceptionCheck {
  name: string;
  result: 'PASS' | 'FAILED' | 'NOT_EXECUTED';
  message: string;
}

export interface ExceptionResolutionItem {
  code: string;
  name: string;
  quantity: number;
  originalAmount: number;
  finalAmount: number;
  brandCommissionSource: TransactionItem['brandCommissionSource'] | null;
  brandCommissionValue: number | null;
  brandMappingReference: string | null;
  grossCommission: number | null;
  tenantShareSource: TransactionItem['tenantShareSource'] | null;
  tenantShareValue: number | null;
  tenantShareReference: string | null;
  tenantShare: number | null;
  validationResult: 'PASS' | 'FAILED';
  issue: string;
}

interface PlatformExceptionBase {
  id: string;
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'RESOLVED';
  requestId: string | null;
  orderId: string | null;
  brandOrderId: string | null;
  clickId: string | null;
  tenantId: string | null;
  brandId: string | null;
  retryCount: number;
  message: string;
  createdAt: string;
  resolvedAt: string | null;
}

export type PlatformException =
  | (PlatformExceptionBase & {
      group: 'REQUEST_AUTHENTICATION';
      details: {
        endpoint: string;
        authenticationMethod: string;
        failureMessage: string;
        checks: ExceptionCheck[];
      };
    })
  | (PlatformExceptionBase & {
      group: 'CLICK_ELIGIBILITY';
      details: { clickAt: string | null; checks: ExceptionCheck[] };
    })
  | (PlatformExceptionBase & {
      group: 'BRAND_COMMISSION' | 'TENANT_SHARE';
      details: { orderSuccessAt: string; items: ExceptionResolutionItem[] };
    })
  | (PlatformExceptionBase & {
      group: 'CANCEL_REFUND';
      details: {
        eventType: 'ORDER_CANCELLED' | 'ITEM_CANCELLED' | 'ITEM_REFUNDED';
        eventAt: string;
        reason: string;
        itemCodes: string[];
        checks: ExceptionCheck[];
        transactionStatus: TransactionStatus | null;
        finalAmount: number | null;
        grossCommission: number | null;
        tenantShare: number | null;
      };
    })
  | (PlatformExceptionBase & {
      group: 'TRANSACTION_PERSISTENCE';
      details: {
        itemCount: number;
        failureCode: string;
        failedOperation: string;
        rollbackResult: string;
        checks: ExceptionCheck[];
      };
    });

export interface AuditRecord {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  occurredAt: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export type ContentLocale = 'vi-VN' | 'en-US';

export interface AssetMetadata {
  id: string;
  fileName: string;
  mimeType: 'image/png' | 'image/jpeg' | 'image/svg+xml';
  sizeBytes: number;
  url: string;
}

export interface CategoryLocaleContent {
  locale: ContentLocale;
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Category {
  id: string;
  code: string;
  icon: AssetMetadata | null;
  displayOrder: number;
  status: EntityStatus;
  contents: CategoryLocaleContent[];
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface CategoryDependencySummary {
  categoryId: string;
  brandMappingCount: number;
  tenantConfigCount: number;
  transactionCount: number;
  canHardDelete: boolean;
  canInactive: boolean;
}

export interface MockData {
  authAccounts: MockAuthAccount[];
  tenantRoles: TenantRole[];
  passwordResetRequests: PasswordResetRequest[];
  tenants: Tenant[];
  brands: Brand[];
  brandCategoryMappings: BrandCategoryMapping[];
  offers: Offer[];
  tenantBrandAssignments: TenantBrandAssignment[];
  earnDisplays: TenantEarnDisplay[];
  tenantRevenueShares: TenantRevenueShare[];
  configurations: Configuration[];
  transactions: Transaction[];
  transactionItems: TransactionItem[];
  transactionHistories: TransactionHistory[];
  exportRequests: MockExportRequest[];
  exceptions: PlatformException[];
  categories: Category[];
  categoryDependencies: CategoryDependencySummary[];
  auditRecords: AuditRecord[];
}
