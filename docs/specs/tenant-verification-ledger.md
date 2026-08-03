# TENANT Verification and Traceability Ledger

> Baseline: `tenant-portal-module-04-template.md`, 03/08/2026
>
> Status: implementation verification complete; final human review remains open

## 1. Evidence model

`tests/tenant-traceability.test.ts` extracts every uniquely named acceptance criterion (`AC`), alternate flow (`AF`) and business rule (`BR`) from the Tenant SRS. The baseline contains 348 unique identifiers. Each identifier must belong to exactly one use-case family and every Tenant mock service must be imported by at least one contract test.

- `AUTO-*`: executable service, validation, routing or permission evidence in `npm test`.
- `MAN-*`: browser evidence for rendered interaction, locale, role and responsive behavior.
- `BOUNDARY-*`: approved mock-frontend boundary; external API, notification, security infrastructure or processing engine is represented only by typed state and button behavior.

## 2. Source-to-evidence rules

| SRS family        | Disposition                                                                                                             | Automated evidence                                                                                                                             | Manual evidence     |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `TP-AUTH-001/002` | Implemented with memory-only session and mock OTP/reset lifecycle                                                       | `tenant-auth.test.ts`, `tenant-password-recovery.test.ts`, auth-store and portal-routing tests                                                 | `MAN-TP-AUTH-01`    |
| `TP-ROLE-001`     | Implemented, including the SRS Phase-2 custom Role baseline requested for this build                                    | `tenant-role-foundation.test.ts`, `tenant-role-list-detail.test.ts`, `tenant-role-lifecycle.test.ts`, `tenant-role-permission-service.test.ts` | `MAN-TP-ROLE-01`    |
| `TP-USER-001`     | Implemented with same-Tenant role and final-admin constraints                                                           | `tenant-account-list-detail.test.ts`, `tenant-account-lifecycle.test.ts`                                                                       | `MAN-TP-USER-01`    |
| `TP-PROFILE-001`  | Implemented for the current session account only                                                                        | `tenant-profile-service.test.ts`                                                                                                               | `MAN-TP-PROFILE-01` |
| `TP-DASH-001`     | Implemented as typed reporting projections; backend aggregation is `BOUNDARY-DASH-01`                                   | `tenant-dashboard.test.ts`                                                                                                                     | `MAN-TP-DASH-01`    |
| `TP-BRAND-001`    | Implemented from shared ADMIN assignment arrays; notification delivery is `BOUNDARY-BRAND-01`                           | `tenant-assigned-brand-service.test.ts`, `tenant-assigned-brand-visibility.test.ts`                                                            | `MAN-TP-BRAND-01`   |
| `TP-EARN-001`     | Implemented at Brand, Category and Offer levels; marketplace rendering engine is `BOUNDARY-EARN-01`                     | `tenant-earn-display-list.test.ts`, `tenant-earn-display-crud.test.ts`                                                                         | `MAN-TP-EARN-01`    |
| `TP-TXN-001`      | Implemented with safe Tenant-only projection and mock export request; ingestion/calculation engine is `BOUNDARY-TXN-01` | `tenant-transaction-service.test.ts`                                                                                                           | `MAN-TP-TXN-01`     |

## 3. TENANT mock-service contract inventory

| Service                       | Contract evidence                                                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Password recovery             | `tests/tenant-password-recovery.test.ts`                                                                                       |
| Dashboard                     | `tests/tenant-dashboard.test.ts`                                                                                               |
| Role and permission           | `tests/tenant-role-list-detail.test.ts`, `tests/tenant-role-lifecycle.test.ts`, `tests/tenant-role-permission-service.test.ts` |
| Account                       | `tests/tenant-account-list-detail.test.ts`, `tests/tenant-account-lifecycle.test.ts`                                           |
| Profile                       | `tests/tenant-profile-service.test.ts`                                                                                         |
| Assigned Brand and visibility | `tests/tenant-assigned-brand-service.test.ts`, `tests/tenant-assigned-brand-visibility.test.ts`                                |
| Earn Display                  | `tests/tenant-earn-display-list.test.ts`, `tests/tenant-earn-display-crud.test.ts`                                             |
| Transaction                   | `tests/tenant-transaction-service.test.ts`                                                                                     |

## 4. Cross-cutting evidence

| Requirement                          | Automated evidence                                                   | Manual evidence                                           |
| ------------------------------------ | -------------------------------------------------------------------- | --------------------------------------------------------- |
| Session-derived Tenant isolation     | Cross-Tenant list/detail/mutation tests in every service family      | Direct-ID and four-role checks in `MAN-TP-ROLE-MATRIX-01` |
| Route, menu and action RBAC          | Permission, portal-menu and portal-route tests                       | `MAN-TP-ROLE-MATRIX-01`                                   |
| Shared ADMIN/TENANT assignment state | Assignment, visibility and Earn Display tests                        | `MAN-TP-BRAND-01`                                         |
| Safe financial projection            | Dashboard role projection and Transaction forbidden-field assertions | `MAN-TP-TXN-01`                                           |
| EN/VI UI                             | Both translation resources pass build/type validation                | `MAN-TP-I18N-01`                                          |
| Functional responsive behavior       | Page states are contract tested                                      | `MAN-TP-RESPONSIVE-01`                                    |

## 5. Browser verification record

| ID                      | Result | Evidence summary                                                                                                                                                                                                                  |
| ----------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MAN-TP-AUTH-01`        | Pass   | Tenant tab login, invalid/locked state and forgot-password stages exercised during T1–T2.                                                                                                                                         |
| `MAN-TP-ROLE-01`        | Pass   | Role list/detail/create/edit/delete and permission matrix exercised during T6–T8.                                                                                                                                                 |
| `MAN-TP-USER-01`        | Pass   | Account list/detail/create/edit/status/unlock behavior exercised during T9–T10.                                                                                                                                                   |
| `MAN-TP-PROFILE-01`     | Pass   | Current-user profile, mock avatar metadata and password flow exercised during T11.                                                                                                                                                |
| `MAN-TP-DASH-01`        | Pass   | Date filters, metric projections, charts and role-specific values exercised during T5.                                                                                                                                            |
| `MAN-TP-BRAND-01`       | Pass   | Assigned scope, expand tabs and visibility confirmations exercised during T12–T13.                                                                                                                                                |
| `MAN-TP-EARN-01`        | Pass   | List and Brand/Category/Offer configurations, validation and unsaved dialog exercised during T14–T15.                                                                                                                             |
| `MAN-TP-TXN-01`         | Pass   | Combined filters return the expected order; export returns one filtered row; detail shows item/history and no internal financial fields.                                                                                          |
| `MAN-TP-I18N-01`        | Pass   | English and Vietnamese authenticated Transaction detail rendered with locale-specific money/date formats.                                                                                                                         |
| `MAN-TP-RESPONSIVE-01`  | Pass   | Transaction detail remains functional at 390 × 844; tables retain horizontal access.                                                                                                                                              |
| `MAN-TP-ROLE-MATRIX-01` | Pass   | Admin has the full Tenant menu and Transaction export; Marketing/Ops direct Transaction access returns 403; Viewer can view without Export; Finance sees only Dashboard, Transactions and Profile and exports Bamboo-Tenant data. |

## 6. Mock boundary

No real backend, persistence, OTP/email provider, audit pipeline, file generation, marketplace rendering or transaction processing engine is implemented. Services use direct typed mock arrays and explicit DTO projections so each operation can later be replaced by one backend call without changing page responsibilities.
