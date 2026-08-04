import type { Brand, EntityStatus, Offer } from '../../../../shared/contracts';

export type AssignmentFilter = 'ALL' | 'ASSIGNED' | 'UNASSIGNED' | 'CUSTOM';
export interface AdminTenantAssignmentQuery {
  keyword: string;
  brandStatus: EntityStatus | 'ALL';
  categoryId: string;
  assignment: AssignmentFilter;
}

export interface AdminTenantAssignmentRow {
  brand: Brand;
  categories: Array<{ id: string; name: string }>;
  activeOffers: Offer[];
  assigned: boolean;
  assignedOfferIds: string[];
  scope: 'NOT_ASSIGNED' | 'ALL_ACTIVE' | 'CUSTOM';
}

export interface AdminTenantAssignmentDraft {
  brandId: string;
  assigned: boolean;
  offerIds: string[];
}

export const ADMIN_TENANT_ASSIGNMENT_DEFAULT_QUERY: AdminTenantAssignmentQuery =
  {
    keyword: '',
    brandStatus: 'ALL',
    categoryId: '',
    assignment: 'ALL',
  };
