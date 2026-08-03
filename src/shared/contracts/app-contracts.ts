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
  status: EntityStatus;
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

export interface MockData {
  authAccounts: MockAuthAccount[];
  tenants: Tenant[];
  brands: Brand[];
  offers: Offer[];
  tenantBrandAssignments: TenantBrandAssignment[];
  transactions: Transaction[];
  auditRecords: AuditRecord[];
}
