import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const srsFile = join(
  process.cwd(),
  'docs/docsaff_v2/srs/tenant-portal-module-04-template.md',
);
const ruleFamilies = [
  'AUTH',
  'ROLE',
  'USER',
  'PROFILE',
  'DASH',
  'BRAND',
  'EARN',
  'TXN',
] as const;

const serviceEvidence: Record<string, string[]> = {
  'tenant-account-service.ts': [
    'tenant-account-lifecycle.test.ts',
    'tenant-account-list-detail.test.ts',
  ],
  'tenant-assigned-brand-service.ts': [
    'tenant-assigned-brand-service.test.ts',
    'tenant-assigned-brand-visibility.test.ts',
  ],
  'tenant-password-recovery-service.ts': ['tenant-password-recovery.test.ts'],
  'tenant-dashboard-service.ts': ['tenant-dashboard.test.ts'],
  'tenant-earn-display-service.ts': [
    'tenant-earn-display-list.test.ts',
    'tenant-earn-display-crud.test.ts',
  ],
  'tenant-profile-service.ts': ['tenant-profile-service.test.ts'],
  'tenant-role-service.ts': [
    'tenant-role-list-detail.test.ts',
    'tenant-role-lifecycle.test.ts',
    'tenant-role-permission-service.test.ts',
  ],
  'tenant-transaction-service.ts': ['tenant-transaction-service.test.ts'],
};

function sourceRuleIds() {
  return [
    ...new Set(
      readFileSync(srsFile, 'utf8').match(
        /(?:AC|AF|BR)-TP-[A-Z]+-\d{3}-\d{2}/g,
      ) ?? [],
    ),
  ];
}

function tenantServiceFiles(
  directory = join(process.cwd(), 'src/features/tenant'),
): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return tenantServiceFiles(path);
    return entry.name.endsWith('-service.ts') ? [entry.name] : [];
  });
}

describe('TENANT SRS traceability ledger', () => {
  it('assigns every AC, alternate flow and business rule to exactly one family', () => {
    const ids = sourceRuleIds();
    assert.equal(ids.length, 348);
    for (const id of ids) {
      const matches = ruleFamilies.filter((family) =>
        new RegExp(`^(?:AC|AF|BR)-TP-${family}-`).test(id),
      );
      assert.equal(matches.length, 1, id);
    }
  });

  it('keeps every TENANT mock service referenced by contract tests', () => {
    assert.deepEqual(
      tenantServiceFiles().sort(),
      Object.keys(serviceEvidence).sort(),
    );
    for (const [service, testFiles] of Object.entries(serviceEvidence)) {
      const serviceName = service.replace('.ts', '');
      assert.ok(
        testFiles.some((testFile) =>
          readFileSync(join(process.cwd(), 'tests', testFile), 'utf8').includes(
            serviceName,
          ),
        ),
        `${service} has no contract test import`,
      );
    }
  });

  it('documents every rule family and automated evidence file', () => {
    const ledger = readFileSync(
      join(process.cwd(), 'docs/specs/tenant-verification-ledger.md'),
      'utf8',
    );
    for (const family of ruleFamilies)
      assert.ok(ledger.includes(`TP-${family}`));
    for (const testFiles of Object.values(serviceEvidence)) {
      for (const testFile of testFiles) assert.ok(ledger.includes(testFile));
    }
  });
});
