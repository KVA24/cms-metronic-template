import type { Configuration } from '../../../../shared/contracts';
import { mockData } from '../../../../shared/mocks/mock-data';
import {
  hasPermission,
  type AdminRoleCode,
} from '../../../../shared/permissions';
import {
  adminConfigurationCreateSchema,
  adminConfigurationUpdateSchema,
  validateConfigurationDateRange,
  type AdminConfigurationCreateInput,
  type AdminConfigurationQuery,
  type AdminConfigurationUpdateInput,
} from '../model/admin-configuration';

type ConfigurationPermission =
  | 'configuration.view'
  | 'configuration.create'
  | 'configuration.edit'
  | 'configuration.delete';

function assertPermission(
  roleCode: AdminRoleCode,
  permission: ConfigurationPermission,
) {
  if (!hasPermission(roleCode, permission)) throw new Error('FORBIDDEN');
}

function findConfiguration(id: number) {
  const configuration = mockData.configurations.find((item) => item.id === id);
  if (!configuration) throw new Error('NOT_FOUND');
  return configuration;
}

function isSensitive(key: string) {
  return /(?:SECRET|PASSWORD|TOKEN|API_KEY)/i.test(key);
}

function auditSnapshot(configuration: Configuration) {
  return {
    id: configuration.id,
    key: configuration.key,
    value: isSensitive(configuration.key) ? '********' : configuration.value,
    status: configuration.status,
  };
}

function timestamp(sequence: number) {
  return `2026-08-03T21:${String(sequence).padStart(2, '0')}:00.000Z`;
}

export const adminConfigurationService = {
  async list(query: AdminConfigurationQuery, roleCode: AdminRoleCode) {
    assertPermission(roleCode, 'configuration.view');
    const errors = validateConfigurationDateRange(query);
    if (Object.keys(errors).length) throw new Error('DATE_RANGE_INVALID');
    const keyword = query.keyword.trim().toLowerCase();
    const items = mockData.configurations
      .filter((item) => {
        if (
          keyword &&
          !String(item.id).includes(keyword) &&
          !item.key.toLowerCase().includes(keyword)
        )
          return false;
        if (
          query.createdFrom &&
          item.createdAt < `${query.createdFrom}T00:00:00.000Z`
        )
          return false;
        if (
          query.createdTo &&
          item.createdAt > `${query.createdTo}T23:59:59.999Z`
        )
          return false;
        return true;
      })
      .sort((left, right) => left.id - right.id);
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
    const page = Math.min(query.page, totalPages);
    const start = (page - 1) * query.pageSize;
    return structuredClone({
      items: items.slice(start, start + query.pageSize),
      page,
      pageSize: query.pageSize,
      totalItems,
      totalPages,
      canCreate: hasPermission(roleCode, 'configuration.create'),
      canEdit: hasPermission(roleCode, 'configuration.edit'),
      canDelete: hasPermission(roleCode, 'configuration.delete'),
    });
  },

  async create(
    input: AdminConfigurationCreateInput,
    roleCode: AdminRoleCode,
    actorId: string,
  ) {
    assertPermission(roleCode, 'configuration.create');
    const parsed = adminConfigurationCreateSchema.parse(input);
    if (
      mockData.configurations.some(
        ({ key }) => key.toLowerCase() === parsed.key.toLowerCase(),
      )
    )
      throw new Error('KEY_DUPLICATE');
    const id =
      Math.max(0, ...mockData.configurations.map((item) => item.id)) + 1;
    const now = timestamp(id);
    const next: Configuration = {
      id,
      ...parsed,
      createdBy: actorId,
      createdAt: now,
      updatedBy: actorId,
      updatedAt: now,
      version: 1,
    };
    mockData.configurations.push(next);
    mockData.auditRecords.push({
      id: `audit-configuration-${mockData.auditRecords.length + 1}`,
      actorId,
      action: 'CREATE_CONFIGURATION',
      entityType: 'CONFIGURATION',
      entityId: String(id),
      occurredAt: now,
      after: auditSnapshot(next),
    });
    return structuredClone(next);
  },

  async update(
    id: number,
    input: AdminConfigurationUpdateInput,
    expectedVersion: number,
    roleCode: AdminRoleCode,
    actorId: string,
  ) {
    assertPermission(roleCode, 'configuration.edit');
    const current = findConfiguration(id);
    const parsed = adminConfigurationUpdateSchema.parse(input);
    if (parsed.key !== undefined && parsed.key !== current.key)
      throw new Error('KEY_IMMUTABLE');
    if (current.version !== expectedVersion)
      throw new Error('VERSION_CONFLICT');
    const before = auditSnapshot(current);
    const now = timestamp(mockData.auditRecords.length + 1);
    current.value = parsed.value;
    current.status = parsed.status;
    current.updatedBy = actorId;
    current.updatedAt = now;
    current.version += 1;
    mockData.auditRecords.push({
      id: `audit-configuration-${mockData.auditRecords.length + 1}`,
      actorId,
      action: 'UPDATE_CONFIGURATION',
      entityType: 'CONFIGURATION',
      entityId: String(id),
      occurredAt: now,
      before,
      after: auditSnapshot(current),
    });
    return structuredClone(current);
  },

  async remove(id: number, roleCode: AdminRoleCode, actorId: string) {
    assertPermission(roleCode, 'configuration.delete');
    const current = findConfiguration(id);
    const before = auditSnapshot(current);
    const index = mockData.configurations.indexOf(current);
    mockData.configurations.splice(index, 1);
    const now = timestamp(mockData.auditRecords.length + 1);
    mockData.auditRecords.push({
      id: `audit-configuration-${mockData.auditRecords.length + 1}`,
      actorId,
      action: 'DELETE_CONFIGURATION',
      entityType: 'CONFIGURATION',
      entityId: String(id),
      occurredAt: now,
      before,
    });
  },

  getActiveValue(key: string) {
    const normalizedKey = key.trim().toLowerCase();
    return (
      mockData.configurations.find(
        (item) =>
          item.key.toLowerCase() === normalizedKey && item.status === 'ACTIVE',
      )?.value ?? null
    );
  },
};
