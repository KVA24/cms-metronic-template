import { z } from 'zod';
import type {
  BrandCategoryMapping,
  EntityStatus,
} from '../../../../shared/contracts';

export type MappingCommissionType = BrandCategoryMapping['commissionType'];
export type MappingEffectiveState = 'CURRENT' | 'UPCOMING' | 'EXPIRED';

export interface AdminBrandMappingQuery {
  keyword: string;
  categoryId: string;
  commissionType: MappingCommissionType | 'ALL';
  status: EntityStatus | 'ALL';
}

export interface AdminBrandMappingListItem extends BrandCategoryMapping {
  categoryName: string;
  categoryStatus: EntityStatus;
  effectiveState: MappingEffectiveState;
  canEdit: boolean;
}

export interface AdminBrandMappingListResult {
  brandId: string;
  brandName: string;
  brandStatus: EntityStatus;
  items: AdminBrandMappingListItem[];
  categories: Array<{ id: string; name: string; status: EntityStatus }>;
  canEdit: boolean;
}

const dateSchema = z.string().trim().min(1, 'EFFECTIVE_FROM_REQUIRED');

export const adminBrandMappingRowSchema = z
  .object({
    id: z.string().optional(),
    categoryId: z.string().trim().min(1, 'CATEGORY_REQUIRED'),
    brandCategoryCode: z
      .string()
      .trim()
      .min(1, 'BRAND_CATEGORY_CODE_REQUIRED')
      .max(100, 'BRAND_CATEGORY_CODE_INVALID')
      .regex(/^[A-Za-z0-9_.-]+$/, 'BRAND_CATEGORY_CODE_INVALID')
      .transform((value) => value.toUpperCase()),
    brandCategoryName: z.string().trim().max(255, 'BRAND_CATEGORY_NAME_LENGTH'),
    isDefault: z.boolean(),
    commissionType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    commissionValue: z.number().positive('COMMISSION_INVALID'),
    effectiveFrom: dateSchema,
    effectiveTo: z.string().trim(),
    status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']),
  })
  .superRefine((value, context) => {
    if (
      value.commissionType === 'PERCENTAGE' &&
      (value.commissionValue > 100 ||
        Math.abs(
          Math.round(value.commissionValue * 100) - value.commissionValue * 100,
        ) > 1e-8)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['commissionValue'],
        message: 'COMMISSION_INVALID',
      });
    }
    if (value.effectiveTo && value.effectiveTo < value.effectiveFrom) {
      context.addIssue({
        code: 'custom',
        path: ['effectiveTo'],
        message: 'EFFECTIVE_TO_INVALID',
      });
    }
  });

export const adminBrandMappingBatchSchema = z
  .array(adminBrandMappingRowSchema)
  .min(1, 'MAPPING_ROW_REQUIRED');

export type AdminBrandMappingRowInput = z.input<
  typeof adminBrandMappingRowSchema
>;
export type ParsedAdminBrandMappingRow = z.output<
  typeof adminBrandMappingRowSchema
>;

export const ADMIN_BRAND_MAPPING_EMPTY_ROW: AdminBrandMappingRowInput = {
  categoryId: '',
  brandCategoryCode: '',
  brandCategoryName: '',
  isDefault: false,
  commissionType: 'PERCENTAGE',
  commissionValue: 1,
  effectiveFrom: '2026-08-03',
  effectiveTo: '',
  status: 'DRAFT',
};

export const ADMIN_BRAND_MAPPING_DEFAULT_QUERY: AdminBrandMappingQuery = {
  keyword: '',
  categoryId: '',
  commissionType: 'ALL',
  status: 'ALL',
};

export function getMappingEffectiveState(
  mapping: Pick<BrandCategoryMapping, 'effectiveFrom' | 'effectiveTo'>,
  today = '2026-08-03',
): MappingEffectiveState {
  const from = mapping.effectiveFrom.slice(0, 10);
  const to = mapping.effectiveTo?.slice(0, 10);
  if (today < from) return 'UPCOMING';
  if (to && today > to) return 'EXPIRED';
  return 'CURRENT';
}

export function mappingToInput(
  mapping: BrandCategoryMapping,
): AdminBrandMappingRowInput {
  return {
    id: mapping.id,
    categoryId: mapping.categoryId,
    brandCategoryCode: mapping.brandCategoryCode,
    brandCategoryName: mapping.brandCategoryName,
    isDefault: mapping.isDefault,
    commissionType: mapping.commissionType,
    commissionValue: mapping.commissionValue,
    effectiveFrom: mapping.effectiveFrom.slice(0, 10),
    effectiveTo: mapping.effectiveTo?.slice(0, 10) ?? '',
    status: mapping.status,
  };
}
