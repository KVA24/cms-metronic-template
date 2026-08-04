import { z } from 'zod';
import type {
  EntityStatus,
  TenantRevenueShare,
} from '../../../../shared/contracts';

export type RevenueConfigFilter = 'ALL' | 'CONFIGURED' | 'UNCONFIGURED';
export interface AdminTenantRevenueQuery {
  keyword: string;
  brandId: string;
  config: RevenueConfigFilter;
  status: EntityStatus | 'ALL';
}

export interface AdminTenantRevenueOverrideInput {
  clientId: string;
  type: 'CATEGORY' | 'OFFER';
  targetId: string;
  rate: number | null;
  status: EntityStatus;
}

export interface AdminTenantRevenueInput {
  brandRate: number | null;
  effectiveFrom: string;
  status: EntityStatus;
  overrides: AdminTenantRevenueOverrideInput[];
}

const optionalRate = z
  .number()
  .positive('RATE_INVALID')
  .max(100, 'RATE_INVALID')
  .nullable();

export const adminTenantRevenueSchema = z
  .object({
    brandRate: optionalRate,
    effectiveFrom: z.string(),
    status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']),
    overrides: z.array(
      z.object({
        clientId: z.string().min(1),
        type: z.enum(['CATEGORY', 'OFFER']),
        targetId: z.string().min(1, 'TARGET_REQUIRED'),
        rate: z.number().positive('RATE_INVALID').max(100, 'RATE_INVALID'),
        status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']),
      }),
    ),
  })
  .superRefine((value, context) => {
    const seen = new Set<string>();
    value.overrides.forEach((override, index) => {
      if (override.status !== 'ACTIVE') return;
      const key = `${override.type}:${override.targetId}`;
      if (seen.has(key))
        context.addIssue({
          code: 'custom',
          path: ['overrides', index, 'targetId'],
          message: 'DUPLICATE_ACTIVE_OVERRIDE',
        });
      seen.add(key);
    });
  });

export const ADMIN_TENANT_REVENUE_DEFAULT_QUERY: AdminTenantRevenueQuery = {
  keyword: '',
  brandId: '',
  config: 'ALL',
  status: 'ALL',
};

export function revenueToInput(
  config: TenantRevenueShare | null,
): AdminTenantRevenueInput {
  return config
    ? {
        brandRate: config.brandRate,
        effectiveFrom: config.effectiveFrom ?? '',
        status: config.status,
        overrides: config.overrides.map((override) => ({
          clientId: override.id,
          type: override.type,
          targetId: override.targetId,
          rate: override.rate,
          status: override.status,
        })),
      }
    : { brandRate: null, effectiveFrom: '', status: 'DRAFT', overrides: [] };
}
