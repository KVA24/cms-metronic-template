import { z } from 'zod';

export interface AdminConfigurationQuery {
  keyword: string;
  createdFrom: string;
  createdTo: string;
  page: number;
  pageSize: number;
}

export const ADMIN_CONFIGURATION_DEFAULT_QUERY: AdminConfigurationQuery = {
  keyword: '',
  createdFrom: '',
  createdTo: '',
  page: 1,
  pageSize: 10,
};

export const adminConfigurationCreateSchema = z
  .object({
    key: z.string().trim().min(1, 'KEY_REQUIRED').max(150, 'KEY_TOO_LONG'),
    value: z.string().trim().min(1, 'VALUE_REQUIRED'),
    status: z.enum(['ACTIVE', 'INACTIVE']),
  })
  .strict();

export const adminConfigurationUpdateSchema = z
  .object({
    key: z
      .string()
      .trim()
      .min(1, 'KEY_REQUIRED')
      .max(150, 'KEY_TOO_LONG')
      .optional(),
    value: z.string().trim().min(1, 'VALUE_REQUIRED'),
    status: z.enum(['ACTIVE', 'INACTIVE']),
  })
  .strict();

export type AdminConfigurationCreateInput = z.input<
  typeof adminConfigurationCreateSchema
>;
export type AdminConfigurationUpdateInput = z.input<
  typeof adminConfigurationUpdateSchema
>;

export function validateConfigurationDateRange(query: AdminConfigurationQuery) {
  if (
    query.createdFrom &&
    query.createdTo &&
    query.createdFrom > query.createdTo
  )
    return { createdTo: 'DATE_RANGE_INVALID' };
  return {};
}
