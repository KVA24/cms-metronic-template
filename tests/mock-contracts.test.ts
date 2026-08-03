import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { mockData, resetMockData } from '../src/shared/mocks/mock-data';

describe('shared mock data contracts', () => {
  beforeEach(() => {
    resetMockData();
  });

  it('seeds deterministic data for more than one tenant', () => {
    assert.deepEqual(
      mockData.tenants.map((tenant) => tenant.id),
      ['tenant-lotus', 'tenant-bamboo'],
    );
  });

  it('keeps seeded relationships valid', () => {
    const tenantIds = new Set(mockData.tenants.map((tenant) => tenant.id));
    const brandIds = new Set(mockData.brands.map((brand) => brand.id));
    const offerIds = new Set(mockData.offers.map((offer) => offer.id));

    for (const offer of mockData.offers) {
      assert.equal(brandIds.has(offer.brandId), true);
    }

    for (const assignment of mockData.tenantBrandAssignments) {
      assert.equal(tenantIds.has(assignment.tenantId), true);
      assert.equal(brandIds.has(assignment.brandId), true);
      assert.equal(
        assignment.offerIds.every((offerId) => offerIds.has(offerId)),
        true,
      );
    }

    for (const transaction of mockData.transactions) {
      assert.equal(tenantIds.has(transaction.tenantId), true);
      assert.equal(brandIds.has(transaction.brandId), true);
    }
  });

  it('restores the original seed after in-memory mutations', () => {
    mockData.tenants[0].name = 'Changed tenant';
    mockData.brands.pop();
    mockData.auditRecords.push({
      id: 'audit-runtime',
      actorId: 'cms-admin',
      action: 'tenant.update',
      entityType: 'tenant',
      entityId: 'tenant-lotus',
      occurredAt: '2026-08-03T00:00:00.000Z',
    });

    resetMockData();

    assert.equal(mockData.tenants[0].name, 'Lotus Rewards');
    assert.equal(mockData.brands.length, 3);
    assert.equal(mockData.auditRecords.length, 0);
  });
});
