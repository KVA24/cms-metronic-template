import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const srsRoot = join(process.cwd(), 'docs/docsaff_v2/srs');
const sourceRules = [
  {
    file: 'cms-role-permission-management-module-04-template.md',
    ledgerLabel: 'CMS role/permission',
    rules: [/^AC-CMS-RBAC-/, /^AC-\d{3}$/],
  },
  {
    file: 'category-management-module-04-template.md',
    ledgerLabel: 'Category management',
    rules: [/^AC-CAT-/],
  },
  {
    file: 'brand-offer-management-module-04-template.md',
    ledgerLabel: 'Brand/Offer management',
    rules: [/^AC-(?:AUDIT|BRAND|CATEGORY|OFFER|UX)-/],
  },
  {
    file: 'tenant-management-module-04-template.md',
    ledgerLabel: 'Tenant management',
    rules: [/^AC-TENANT-/],
  },
  {
    file: 'configuration-management-module-04-template.md',
    ledgerLabel: 'Configuration management',
    rules: [/^AC-CONFIG-/],
  },
  {
    file: 'order-transaction-management-module-04-template.md',
    ledgerLabel: 'Order/Transaction management',
    rules: [/^AC-TXN-/, /^AC-EXC-/, /^AC-(?:ORD|COM|OT-GEN)-/],
  },
];

const serviceEvidence: Record<string, string> = {
  'admin-dashboard-service.ts': 'admin-dashboard.test.ts',
  'admin-rbac-service.ts': 'admin-rbac.test.ts',
  'admin-category-service.ts': 'admin-categories.test.ts',
  'admin-brand-service.ts': 'admin-brands.test.ts',
  'admin-brand-mapping-service.ts': 'admin-brands.test.ts',
  'admin-offer-service.ts': 'admin-brands.test.ts',
  'admin-tenant-service.ts': 'admin-tenants.test.ts',
  'admin-tenant-account-service.ts': 'admin-tenants.test.ts',
  'admin-tenant-assignment-service.ts': 'admin-tenants.test.ts',
  'admin-tenant-revenue-service.ts': 'admin-tenants.test.ts',
  'admin-configuration-service.ts': 'admin-configuration.test.ts',
  'admin-transaction-service.ts': 'admin-transactions.test.ts',
  'admin-exception-service.ts': 'admin-exceptions.test.ts',
};

function acceptanceIds(file: string) {
  return [
    ...new Set(
      readFileSync(join(srsRoot, file), 'utf8').match(/AC-[A-Z0-9-]+/g) ?? [],
    ),
  ];
}

function adminServiceFiles(
  directory = join(process.cwd(), 'src/features/admin'),
): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return adminServiceFiles(path);
    return entry.name.endsWith('-service.ts') ? [entry.name] : [];
  });
}

describe('ADMIN SRS traceability ledger', () => {
  it('assigns every source-scoped acceptance ID to exactly one evidence rule', () => {
    let total = 0;
    for (const source of sourceRules) {
      const ids = acceptanceIds(source.file);
      total += ids.length;
      for (const id of ids)
        assert.equal(
          source.rules.filter((rule) => rule.test(id)).length,
          1,
          `${source.file}: ${id}`,
        );
    }
    assert.equal(total, 362);
  });

  it('keeps every ADMIN mock service referenced by an automated contract test', () => {
    const services = adminServiceFiles().sort();
    assert.deepEqual(services, Object.keys(serviceEvidence).sort());
    for (const [service, testFile] of Object.entries(serviceEvidence)) {
      const testSource = readFileSync(
        join(process.cwd(), 'tests', testFile),
        'utf8',
      );
      assert.ok(
        testSource.includes(service.replace('.ts', '')),
        `${service} is not referenced by ${testFile}`,
      );
    }
  });

  it('keeps the executable rule families documented in the verification ledger', () => {
    const ledger = readFileSync(
      join(process.cwd(), 'docs/specs/admin-verification-ledger.md'),
      'utf8',
    );
    for (const source of sourceRules)
      assert.ok(ledger.includes(source.ledgerLabel));
    for (const evidence of new Set(Object.values(serviceEvidence)))
      assert.ok(ledger.includes(evidence));
  });
});
