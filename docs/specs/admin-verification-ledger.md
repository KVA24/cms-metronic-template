# ADMIN Verification and Traceability Ledger

> Baseline: `docsaff_v2` ADMIN SRS set, 03/08/2026
>
> Status: implementation verification complete; final human review remains open

## 1. Evidence model

Every acceptance-criteria identifier found in the six ADMIN source SRS files is assigned by the rules below. A rule is scoped to one source file, so reused identifiers cannot collide. `tests/admin-traceability.test.ts` extracts the source IDs and fails unless every ID matches exactly one rule. The current baseline contains 362 distinct source-scoped identifiers.

- `AUTO-*`: executable contract/unit/routing evidence in `npm test`.
- `MAN-*`: browser verification of rendered behavior, accessibility and interaction.
- `BOUNDARY-*`: accepted frontend boundary from the technical specification; no backend engine is implemented.

## 2. Source-to-evidence rules

| Source SRS | Acceptance IDs assigned | Disposition | Automated evidence | Manual evidence |
| --- | --- | --- | --- | --- |
| CMS role/permission | `AC-CMS-RBAC-*`, legacy summary `AC-001`–`AC-018` | Implemented | `AUTO-RBAC`: `admin-rbac`, `permissions`, `portal-menu`, `portal-route-permissions`, `rbac` tests | `MAN-ADM-RBAC-01`: ADMIN matrix; denied role route |
| Category management | `AC-CAT-*`, including `AC-CAT-GEN-*` | Implemented | `AUTO-CAT`: `admin-categories` tests | `MAN-ADM-CAT-01`: list/create/detail/edit/inactivate, EN/VI, validation |
| Brand/Offer management | `AC-BRAND-*`, `AC-CATEGORY-*`, `AC-OFFER-*`, `AC-AUDIT-*`, `AC-UX-*` | Implemented | `AUTO-BRAND`: `admin-brands` and mock-contract tests | `MAN-ADM-BRAND-01`: Brand → mapping → Offer vertical flow |
| Tenant management | `AC-TENANT-*`, including USER/VIS/RS families | Implemented | `AUTO-TENANT`: `admin-tenants`, permissions and mock-contract tests | `MAN-ADM-TENANT-01`: Tenant/account/assignment/revenue-share flows |
| Configuration management | `AC-CONFIG-*` | Implemented | `AUTO-CONFIG`: `admin-configuration` tests | `MAN-ADM-CONFIG-01`: CRUD confirmations, immutable key and masking |
| Order/Transaction management | `AC-TXN-*` | Implemented | `AUTO-TXN`: `admin-transactions` tests | `MAN-ADM-TXN-01`: list/filter/export/detail/status projection |
| Order/Transaction management | `AC-EXC-*` | Implemented as mock UI lifecycle | `AUTO-EXC`: `admin-exceptions` tests | `MAN-ADM-EXC-01`: list/export, six detail variants and retry confirmation |
| Order/Transaction management | `AC-ORD-*`, `AC-COM-*`, `AC-OT-GEN-*` | `BOUNDARY-ORDER-01`: backend processing excluded; observable outputs represented by typed Transaction/Item/History/Exception seeds | `AUTO-OUTPUT`: transaction, exception and mock-contract tests verify statuses, amounts, snapshots, non-duplication and unchanged-data boundaries | Covered indirectly by `MAN-ADM-TXN-01` and `MAN-ADM-EXC-01`; no engine UI exists |

## 3. ADMIN mock-service contract inventory

| Service | Contract evidence |
| --- | --- |
| Dashboard | `tests/admin-dashboard.test.ts` |
| RBAC | `tests/admin-rbac.test.ts` |
| Category | `tests/admin-categories.test.ts` |
| Brand, Brand Mapping, Offer | `tests/admin-brands.test.ts` |
| Tenant, Tenant Account, Assignment, Revenue Share | `tests/admin-tenants.test.ts` |
| Configuration | `tests/admin-configuration.test.ts` |
| Transaction | `tests/admin-transactions.test.ts` |
| Exception | `tests/admin-exceptions.test.ts` |

The traceability test also inventories every `src/features/admin/**/api/*-service.ts` file and fails if no test file references that service.

## 4. Shared cross-cutting evidence

| Requirement | Automated evidence | Manual evidence |
| --- | --- | --- |
| ADMIN/TENANT login separation, safe redirect, memory-only session | `auth-session`, `auth-store`, `portal-routing`, `safe-redirect` tests | `MAN-SHARED-AUTH-01` |
| Menu, route and action authorization | `permissions`, `portal-menu`, `portal-route-permissions`, feature service tests | `MAN-SHARED-RBAC-01` |
| Financial-field projection | `permissions`, dashboard, transaction tests | `MAN-SHARED-FIN-01` |
| EN/VI visible copy | translation resources plus build/type gate | `MAN-SHARED-I18N-01` |
| Responsive and accessible states | feature contract tests for state inputs | `MAN-SHARED-A11Y-01`: desktop/mobile snapshots; Lighthouse Accessibility |
| No secrets/raw payload in list/detail/export | configuration, transaction and exception tests | `MAN-SHARED-SAFE-01` |

## 5. Browser verification record

| ID | Result | Evidence summary |
| --- | --- | --- |
| `MAN-ADM-RBAC-01` | Pass | Read-only four-role matrix; role/route denial verified. |
| `MAN-ADM-CAT-01` | Pass | Category CRUD/status/localized content flow exercised during A8–A9. |
| `MAN-ADM-BRAND-01` | Pass | Brand, mapping and Offer screens exercised during A10–A14. |
| `MAN-ADM-TENANT-01` | Pass | Tenant, account, assignment and Revenue Share screens exercised during A15–A19. |
| `MAN-ADM-CONFIG-01` | Pass | Configuration add/edit/delete and masking exercised during A20. |
| `MAN-ADM-TXN-01` | Pass | Transaction filters/export/detail and status projections exercised during A21–A22. |
| `MAN-ADM-EXC-01` | Pass | Six groups listed; Cancel/Refund and Persistence layouts inspected; retry changed Open → Resolved and incremented count. |
| `MAN-SHARED-AUTH-01` | Pass | ADMIN tab login and portal redirect exercised. |
| `MAN-SHARED-RBAC-01` | Pass | ADMIN and restricted-role navigation exercised. |
| `MAN-SHARED-FIN-01` | Pass | Role projections verified with service tests and role browser checks. |
| `MAN-SHARED-I18N-01` | Pass | EN/VI login and authenticated-shell switching exercised. |
| `MAN-SHARED-A11Y-01` | Pass | Latest ADMIN Exception snapshot: Lighthouse Accessibility 100, Best Practices 100; console clean. |
| `MAN-SHARED-SAFE-01` | Pass | No raw payload/credential/secret shown in Exception and export views. |

## 6. Remaining final-review gate

The implementation evidence is complete. A27 will rerun the full ADMIN role/locale/responsive/non-happy-path matrix after TENANT completion and legacy removal. Human sign-off remains intentionally unchecked in the parent technical specification.
