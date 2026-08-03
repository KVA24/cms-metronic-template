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
}

export interface TenantBrandAssignment {
  id: string;
  tenantId: string;
  brandId: string;
  offerIds: string[];
  showOnLanding: boolean;
  isHot: boolean;
}

export type TransactionStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface Transaction {
  id: string;
  tenantId: string;
  brandId: string;
  status: TransactionStatus;
  orderAmount: number;
  estimatedTenantShare: number;
  actualTenantShare: number;
  createdAt: string;
}

export interface AuditRecord {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  occurredAt: string;
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
  tenants: Tenant[];
  brands: Brand[];
  brandCategoryMappings: BrandCategoryMapping[];
  offers: Offer[];
  tenantBrandAssignments: TenantBrandAssignment[];
  transactions: Transaction[];
  categories: Category[];
  categoryDependencies: CategoryDependencySummary[];
  auditRecords: AuditRecord[];
}
