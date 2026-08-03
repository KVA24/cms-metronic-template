# TENANT Portal Technical Specification

> Status: Phase 2/3 approved — implementation in progress
>
> Scope owner: TENANT Portal
>
> Shared foundation: [ADMIN CMS Technical Specification](admin-cms-technical-spec.md) §§5–7

## 1. Objective

Build the complete TENANT Portal described by `tenant-portal-module-04-template.md` on the shared ADMIN application foundation. This specification includes the deferred Tenant Role & Permission module as confirmed scope.

Success means every seeded Tenant system role can sign in through the TENANT tab, is isolated to its own `tenantId`, sees only permitted menus/actions/data, and can complete all UI-facing authentication, role, account, profile, dashboard, assigned-brand, earn-display and transaction flows using simple typed hardcoded data.

## 2. Confirmed scope and boundaries

### In scope

- TENANT authentication context, account lock states and full forgot-password/OTP/reset flow.
- Tenant-scoped Dashboard, Assigned Brands/Offers, Earn Display, Transactions/export, Roles/Permissions, Accounts and Profile.
- Four system roles plus CRUD/permission assignment for custom roles.
- Vietnamese and English UI; localized earn/display content remains business data independent of UI locale.
- Simple Promise-based mock services over shared typed in-memory arrays.
- Cross-portal reads of ADMIN-managed Tenant status, Tenant Portal accounts, Brand/Offer assignments and Revenue Share in the same SPA runtime.
- Typed audit records for important mutations and security events; no Tenant or ADMIN Audit Log UI.

### Out of scope

- Tenant domain/branding setup, Brand integration credentials, loyalty-point posting, listing fee and CPC billing.
- Tenant editing unassigned Brand/Offer master data or configuring Affiliate-to-Tenant Revenue Share.
- Self-registration, ADMIN impersonation and cross-Tenant switching.
- Real email, OTP delivery, file generation, API endpoint URLs or persisted session/data.
- Landing Page/public marketplace implementation. Preview behavior may use hardcoded metadata only.
- Backend reporting aggregation, commission calculation, transaction state engines or audit search/export.

## 3. Sources and precedence

| Priority | Source                                                                                         | Usage                                                     |
| -------: | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
|        1 | Confirmed decisions in this specification                                                      | Scope and technical constraints                           |
|        2 | [`tenant-portal-module-04-template.md`](../docsaff_v2/srs/tenant-portal-module-04-template.md) | Fields, rules, states and acceptance criteria             |
|        3 | Tenant Portal HTML mockups                                                                     | Layout, hierarchy and interaction only                    |
|        4 | Related ADMIN SRS                                                                              | Read-only master/transaction data semantics               |
|        5 | ADMIN technical specification                                                                  | Shared auth, types, architecture, UI and testing contract |

Mockup styling/CSS is not a production design source. The existing Metronic component system remains authoritative for visual styling.

## 4. Assumptions and proposed conflict resolutions

1. Phase 2 `TP-ROLE-001` is included in the implementation scope and completed after the foundational Tenant modules.
2. There are exactly four Tenant system roles: `TENANT_ADMIN`, `TENANT_MARKETING_OPS`, `TENANT_VIEWER`, and `TENANT_FINANCE`. The sentence saying “three Role” is a typo.
3. `TENANT_VIEWER` is the canonical replacement for the earlier “CSKH Tenant” wording. The detailed default system role matrix inside `TP-ROLE-001` is authoritative.
4. System roles and their permissions are immutable. Custom roles support create/edit/inactivate/delete and permission assignment within the Tenant permission catalog.
5. The Tenant account CRUD and login service share the same in-memory account array. A newly created account is not required to become a login credential; only seeded demo accounts are guaranteed login personas.
6. Direct synchronous checks required by UI are implemented; session revocation/cascade/background behavior described by backend rules is represented by the next permission/session check, not an event engine.
7. UI locale defaults to English after refresh; localized content defaults/falls back to `vi-VN`.

Items 3 and 7 were approved at the Phase 1 review gate.

## 5. Dependency on shared foundation

This portal must reuse the following contracts from the ADMIN specification without forking them:

- `PortalType`, `UiLocale`, `PageQuery`, `PageResult`, `AppError`, `MockFileResult`.
- Shared login page, in-memory auth store, namespace guard, permission evaluator and i18n switcher.
- React Query, React Hook Form/Zod, Metronic UI primitives, feedback patterns and testing commands.
- Shared hardcoded arrays for Tenants, accounts, Brands, Offers, assignments, Revenue Share, Transactions and audit records.
- Common date/money/status formatting and upload/export lifecycle.

TENANT feature services must always resolve `tenantId` from `AuthSession`. A component or caller cannot pass an arbitrary Tenant ID to broaden scope.

## 6. Target source structure

```text
src/features/tenant/
  auth/
  dashboard/
  roles/
  accounts/
  profile/
  assigned-brands/
  earn-display/
  transactions/
```

Each feature uses `api`, `hooks`, `model`, and `ui` folders only where needed. Follow the feature pattern and naming rules defined in the ADMIN specification. Do not add a Tenant-specific generic repository or duplicate shared UI primitives.

## 7. TENANT navigation and routes

| Route                                       | Screen                                            | Source/use case | Permission                  |
| ------------------------------------------- | ------------------------------------------------- | --------------- | --------------------------- |
| `/auth/login?portal=tenant`                 | Shared login, TENANT selected                     | TP-AUTH-001     | Public                      |
| `/auth/tenant/forgot-password`              | Email entry                                       | TP-AUTH-002     | Public TENANT flow          |
| `/auth/tenant/forgot-password/otp`          | OTP entry/resend/expiry                           | TP-AUTH-002     | Valid reset request         |
| `/auth/tenant/forgot-password/reset`        | New password/confirmation                         | TP-AUTH-002     | Verified OTP                |
| `/auth/tenant/forgot-password/success`      | Completion state                                  | TP-AUTH-002     | Completed reset             |
| `/tenant/dashboard`                         | Tenant Dashboard                                  | TP-DASH-001     | `dashboard.view`            |
| `/tenant/assigned-brands`                   | Assigned Brand list/expanded Category/Offer views | TP-BRAND-001    | `brands.view`               |
| `/tenant/earn-display`                      | Earn display list                                 | TP-EARN-001     | `earn_display.view`         |
| `/tenant/earn-display/:brandId`             | Brand/Category/Offer configuration                | TP-EARN-001     | `earn_display.create/edit`  |
| `/tenant/transactions`                      | Transaction list/export                           | TP-TXN-001      | `transactions.view/export`  |
| `/tenant/transactions/:transactionId`       | Tenant-scoped detail/history                      | TP-TXN-001      | `transactions.view`         |
| `/tenant/account/roles`                     | Role list                                         | TP-ROLE-001     | `roles.view`                |
| `/tenant/account/roles/new`                 | Create custom role                                | TP-ROLE-001     | `roles.create`              |
| `/tenant/account/roles/:roleId`             | Role view                                         | TP-ROLE-001     | `roles.view`                |
| `/tenant/account/roles/:roleId/edit`        | Edit custom role                                  | TP-ROLE-001     | `roles.edit`                |
| `/tenant/account/roles/:roleId/permissions` | Permission matrix                                 | TP-ROLE-001     | `roles.permissions`         |
| `/tenant/account/users`                     | Tenant account list                               | TP-USER-001     | `users.view`                |
| `/tenant/account/users/new`                 | Create Tenant account                             | TP-USER-001     | `users.create`              |
| `/tenant/account/users/:userId`             | Account view                                      | TP-USER-001     | `users.view`                |
| `/tenant/account/users/:userId/edit`        | Account edit/status/delete                        | TP-USER-001     | `users.edit/delete_disable` |
| `/tenant/account/profile`                   | Current user profile/password                     | TP-PROFILE-001  | `profile.view/edit`         |

After login, navigate to Dashboard when allowed; otherwise navigate to the first permitted menu in this order: Assigned Brands, Earn Display, Transactions, Accounts, Profile. Unknown or cross-Tenant IDs return not found/forbidden without revealing existence.

## 8. Authentication and recovery

### 8.1 Login

- Seed one demo account for each Tenant system role. Use at least two Tenant IDs in data so isolation can be verified.
- Validate account Active, Role Active, Tenant Active, lock state and portal context.
- Track failed attempts plainly on the hardcoded account object; the fifth consecutive invalid attempt locks the account when required by TP-AUTH-001.
- A successful login resets the mock failure count and creates an in-memory `AuthSession` with `portalType: 'TENANT'` and a single `tenantId`.
- Refresh resets session; direct `/tenant/*` access redirects to the Tenant login tab with a safe `next` path.

### 8.2 Forgot password

Use a small in-memory `PasswordResetRequest` record to represent email lookup, OTP, expiry, attempts and verification. No email is sent. The UI must cover all SRS screens: unknown/invalid email policy, OTP entry, resend, invalid OTP, expired OTP, new-password validation, mismatch and success.

Mock service contract:

```ts
interface TenantAuthService {
  login(input: TenantLoginInput): Promise<AuthSession>;
  requestPasswordReset(input: PasswordResetRequestInput): Promise<void>;
  verifyResetOtp(input: VerifyResetOtpInput): Promise<ResetVerification>;
  resetPassword(input: ResetPasswordInput): Promise<void>;
  logout(): Promise<void>;
}
```

The mock password mutation may update the account object for the current runtime. It is reset by browser refresh.

## 9. Permission model

### 9.1 Catalog

Use the action catalog from TP-ROLE-001:

| Module             | Applicable actions                              |
| ------------------ | ----------------------------------------------- |
| Dashboard          | View                                            |
| Assigned Brands    | View, Edit                                      |
| Earn Display       | View, Create, Edit                              |
| Transactions       | View, Export                                    |
| Roles              | View, Create, Edit, Delete/Disable, Permissions |
| Accounts (`USERS`) | View, Create, Edit, Delete/Disable              |
| Profile            | View, Edit                                      |

Permission codes use `<module>.<action>`, with `brands`, `earn_display`, `transactions`, `roles`, `users`, and `profile` as stable module codes. `Full` is UI-derived and is never stored as a permission.

### 9.2 System roles

- `TENANT_ADMIN`: all applicable actions.
- `TENANT_MARKETING_OPS`: Assigned Brands View/Edit, Earn Display View/Create/Edit, Profile View/Edit.
- `TENANT_VIEWER`: Dashboard View, Assigned Brands View, Earn Display View, Transactions View, Profile View/Edit.
- `TENANT_FINANCE`: Dashboard View, Transactions View/Export, Profile View/Edit.

System roles are always Active and their codes/permissions cannot be edited or deleted. Custom role permissions must be a subset of the catalog and never include Platform ADMIN permissions.

### 9.3 Enforcement

- Menu, route and action use the same permission evaluator.
- Mock service checks session `tenantId`, account/role status and action permission.
- Losing View removes access even if another action is present.
- The final active Tenant Admin protection and role-in-use delete rule are direct synchronous checks, not cascades.
- Financial values on Tenant screens expose Tenant Share only as defined by the SRS; never expose Platform gross commission/Affiliate keep unless the SRS explicitly allows it.

## 10. Feature contracts and traceability

| Feature         | Core types                                                                            | Required service operations                                               | SRS authority                       |
| --------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------- |
| Dashboard       | `TenantDashboardQuery`, `TenantDashboardView`, `MetricCard`, `TrendPoint`, `TopBrand` | `getDashboard()`                                                          | TP-DASH-001; data requirement §V.11 |
| Roles           | `TenantRole`, `TenantRolePermission`, `PermissionDefinition`                          | `list/get/create/update/removeOrDisable/getPermissions/updatePermissions` | TP-ROLE-001; §§V.2–3                |
| Accounts        | `TenantPortalUser`, `TenantUserQuery`                                                 | `list/get/create/update/removeOrDisable/unlock`                           | TP-USER-001; §V.1                   |
| Profile         | `TenantProfile`, `ProfileUpdateInput`, `PasswordChangeInput`                          | `get/update/changePassword`                                               | TP-PROFILE-001                      |
| Assigned Brands | `TenantBrandAssignment`, `TenantBrandCategoryView`, `TenantOfferVisibility`           | `list/get/updateBrandVisibility/updateHotFlag/updateOfferVisibility`      | TP-BRAND-001; §§V.6–8               |
| Earn Display    | `TenantEarnDisplay`, `EarnDisplayTarget`                                              | `list/get/upsert`                                                         | TP-EARN-001; §V.9                   |
| Transactions    | Tenant projections of shared Transaction types                                        | `list/get/export`                                                         | TP-TXN-001; §§V.12–14               |
| Audit           | shared `AuditRecord`                                                                  | `record`                                                                  | §V.15 and business rules; no screen |

Every type must carry `tenantId` internally, but Tenant page/service input types must not expose a freely editable tenant selector.

## 11. Feature behavior requirements

### Dashboard

- Support SRS date-range/default-range behavior, metric cards, Orders/Revenue/Actual Commission trends, Top Brands and chart hover states.
- Values are hardcoded view models; no frontend aggregation engine is required.
- Loading, empty and service-error states preserve the selected range.

### Roles and Accounts

- Implement list filters, create/view/edit/delete-or-disable confirmations and exact role-in-use/system-role restrictions.
- Permission matrix implements applicable `—` cells, row Full checked/unchecked/indeterminate state, coverage count, dirty-navigation confirmation and atomic mock replacement of selected custom-role permissions.
- Account forms source role options from Active roles in the current Tenant and enforce username/password/contact rules from the SRS.
- View is read-only; username and other immutable fields remain disabled in Edit as specified.

### Profile

- Profile operates only on the authenticated account.
- Update profile and change password are separate mutations/forms with their own validation and pending states.
- Avatar/file behavior follows the shared mock upload contract.

### Assigned Brands

- List only ADMIN-assigned Brands for the current Tenant.
- Support search/filter/pagination, expanded Category & Commission and Offer tabs, Brand landing visibility confirmation, Brand Hot confirmation and Offer visibility edits.
- Tenant edits visibility/display configuration only; Brand, Category, Offer and Revenue Share master fields are read-only.
- Changes use the shared assignment arrays so ADMIN and TENANT views remain consistent during the same runtime.

### Earn Display

- Support Brand, Category and Offer targets with the XOR constraint from the SRS.
- Show configuration list and Brand configuration screen, localized values, effective dates, display status and preview metadata.
- Resolution priority is displayed/documented as Offer > Category > Brand, but no Landing Page runtime or calculation engine is implemented.

### Transactions

- Scope list/detail/history strictly by session `tenantId`.
- Render Pending/Confirmed/Cancelled orders and Pending/Confirmed/Refunded items, estimated/actual Tenant Share and confirmed date exactly as seeded.
- Export sends current filters to the mock service and handles loading/success/error plus filename metadata; it does not create a file.

## 12. Mock data requirements

- Use plain typed arrays shared with ADMIN where entities overlap. Tenant-specific roles, permissions, earn display and reset requests may live in Tenant mock files.
- Seed two Tenants, but each demo login is bound to exactly one Tenant.
- Seed the four system-role accounts plus custom role/account records, active/inactive/locked states and a role currently in use.
- Seed assigned/unassigned Brands, mixed Brand/Offer visibility, category mappings, localized earn display at all three priority levels, empty states and transaction status combinations.
- CRUD operations are simple array `find`, `filter`, `push` and replacement operations wrapped in typed Promise methods.
- Do not add a repository framework, mock HTTP server, fake event bus, commission calculator or cascade engine.
- Direct UI dependencies remain enforced: uniqueness, Tenant scope, active role selection, last-admin protection, role-in-use protection, assignment scope and earn-target XOR.

## 13. State, validation and accessibility

Every Tenant route follows the shared loading/empty/error/mutation contract in the ADMIN specification and the exact messages/rules in its SRS.

- Forms show required markers dynamically and focus the first invalid field.
- Dialogs/sheets restore focus, are keyboard accessible and warn on unsaved changes.
- Tables remain usable on tablet via horizontal scrolling or existing responsive DataGrid behavior; desktop/laptop is primary.
- Charts expose values without hover as accessible text/table summaries where practical.
- Status is never communicated by color alone.
- EN/VI switching updates current UI immediately without mutating localized business fields.

## 14. Testing strategy

In addition to shared tests:

- Unit: Tenant permission matrix/Full state, last-admin and role-in-use rules, earn-target XOR, localized fallback and Tenant transaction projection.
- Contract: every service denies a cross-Tenant entity ID and unauthorized action.
- Auth: each seeded role login, wrong portal, Tenant inactive, account inactive/locked, failed-attempt lock and recovery states.
- Route/menu: first-permitted landing route and direct URL denial for each system role.
- Feature flow: role permission CRUD, account CRUD, profile/password, visibility changes, earn display upsert and transaction export request.
- Manual responsive/i18n verification until an approved DOM/E2E tool exists.
- Each TP acceptance criterion receives an automated test ID or manual verification ID before its module is complete.

Module gate commands:

```bash
npm run lint
npm test
npm run build
```

## 15. Delivery boundaries

### Always

- Resolve Tenant context from authenticated session and deny cross-Tenant lookup before returning data.
- Preserve SRS use-case/BR/AC traceability in tasks and tests.
- Use shared Metronic components, shared types and the shared permission evaluator.
- Keep mock data small, typed and straightforward.
- Include all Role/Permission screens despite their Deferred label.

### Ask first

- Change shared auth/service contracts or the approved Tenant system-role matrix.
- Add dependencies, new locales, new permissions or screens not described here.
- Add any persistence or backend simulation layer.

### Never

- Allow a Tenant-controlled `tenantId` to define data scope.
- Let Tenant users edit Platform master Brand/Category/Offer or Revenue Share.
- Expose another Tenant's IDs/data in errors, options or exports.
- Copy Tenant mockup CSS/styles.
- Treat hidden UI as sufficient authorization.

## 16. Approved Phase 1 decisions

1. `TENANT_VIEWER` and the detailed TP-ROLE system-role matrix are canonical over earlier “CSKH Tenant” wording/table.
2. English is the default UI locale after refresh; localized business content defaults/falls back to `vi-VN`.
3. Existing Metronic desktop/tablet responsive behavior is the target; mobile forms/tables remain functionally usable without custom mobile designs.
4. Account deletion is status-based disable when dependencies exist and array removal only for unused mock accounts.

## 17. Phase 1 success criteria

- All nine TP use cases, including deferred TP-ROLE-001, map to routes, permissions and typed service operations.
- Tenant isolation, shared-data dependencies and mock simplicity are explicit and testable.
- Login/recovery, system/custom roles, UI i18n and all non-happy UI states are covered.
- Public marketplace/backend processing remain clearly excluded.
- Source conflicts have explicit human decisions.
- No TENANT implementation begins until the Phase 2/3 plan below is reviewed.

## 18. Implementation plan

### 18.1 Dependency graph

```text
ADMIN Checkpoint F (shared contracts/auth/RBAC/routes)
  ├─ Tenant auth recovery
  ├─ Tenant permission seeds + menus
  ├─ Dashboard
  ├─ Roles → Permissions → Accounts → Profile
  ├─ ADMIN assignment arrays → Assigned Brands → Earn Display
  └─ Shared transaction arrays → Tenant Transactions
       └─ Tenant traceability/regression → ADMIN legacy cleanup
```

The ADMIN Foundation checkpoint is mandatory. Role/Account tasks and Assigned Brand/Earn Display tasks are sequential inside their own chains; the chains may proceed independently after shared types are frozen.

### 18.2 Master execution checklist

- [x] T1–T4: TENANT login, recovery, permission seeds, routes and menus
- [ ] T5–T11: Dashboard, Roles, Permissions, Accounts and Profile
- [ ] T12–T15: Assigned Brands, visibility and Earn Display
- [ ] T16–T18: Transactions, traceability and final regression

### 18.3 Phase T1 — TENANT access foundation

| Task | Description and acceptance criteria                                                                                                                                                          | Dependencies    | Likely files                              | Verify                         | Size |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------- | ------------------------------ | ---- |
| T1 ✅ | Add TENANT seed personas/account states and portal login checks for Tenant/account/role Active plus lock attempts. Each system role resolves the approved permission set and one `tenantId`. | ADMIN F         | Tenant auth model/service/mock/test files | TP-AUTH-001 unit/manual matrix | M    |
| T2 ✅ | Implement forgot-password email → OTP → reset → success routes and typed in-memory reset record. Cover invalid/expired/resend/mismatch states without email delivery.                      | T1              | Tenant auth schema/service/pages/tests    | TP-AUTH-002 flow               | M    |
| T3 ✅ | Add Tenant system/custom role seeds and catalog evaluators including applicable actions, last-admin and role-in-use helpers.                                                               | ADMIN A2, T1    | Tenant role model/mock/permission tests   | Matrix/unit tests              | M    |
| T4 ✅ | Compose TENANT menu/routes, first-permitted landing and Account Settings navigation. Cross-portal/direct unauthorized routes make no feature request.                                      | T1–T3, ADMIN A5 | routing/menu/permission-guard files       | Four-role route/menu checks    | M    |

#### Checkpoint TA — Tenant access

- [x] All four personas and all recovery states work with EN/VI UI.
- [x] Tenant namespace, first-permitted route and menu/action guards match the approved matrix.
- [x] `npm run lint && npm test && npm run build` passes.

### 18.4 Phase T2 — Dashboard, roles, accounts and profile

| Task | Description and acceptance criteria                                                                                                              | Dependencies | Likely files                                     | Verify                         | Size |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ | ------------------------------------------------ | ------------------------------ | ---- |
| T5 ✅ | Implement Tenant Dashboard query/page with date range, cards, trends, Top Brands, hover and loading/empty/error states using seeded view models. | TA           | `features/tenant/dashboard/{model,api,hooks,ui}` | TP-DASH-001 role/manual checks | M    |
| T6 ✅ | Implement Role list/view with filters, system/custom badges, read-only system details and permitted actions.                                     | TA           | `features/tenant/roles/{model,api,hooks,ui}`     | TP-ROLE-001 list/view          | M    |
| T7 ✅ | Implement custom Role create/edit/inactivate/delete with uniqueness, system-role immutability, role-in-use and final-admin checks.               | T6           | Role schema/form/service/page files              | Role lifecycle tests/manual    | M    |
| T8 ✅ | Implement custom Role permission matrix with `—`, Full/indeterminate/coverage, dirty confirmation and atomic mock replacement.                   | T7           | Role permission model/service/page/tests         | Permission matrix unit/manual  | M    |
| T9 ✅ | Implement Account list/view with filters, pagination and current-Tenant scoping. Cross-Tenant IDs reveal no data.                                | T3           | `features/tenant/accounts/{model,api,hooks,ui}`  | TP-USER-001 list/view/scope    | M    |
| T10 ✅ | Implement Account create/edit/status/delete-or-disable/unlock using Active role options and all SRS form rules.                                  | T8–T9        | Account schema/form/service/pages                | Account CRUD/persona checks    | M    |
| T11 ✅ | Implement current-user Profile edit, avatar mock upload and separate change-password form. No arbitrary user ID is accepted.                     | T1           | `features/tenant/profile/{model,api,hooks,ui}`   | TP-PROFILE-001 flow            | M    |

#### Checkpoint TB — Tenant account settings

- [x] Dashboard, Role/Permission, Account and Profile flows pass their AC mapping.
- [x] System roles remain immutable and every service enforces Tenant scope/action permission.
- [x] Lint, tests and build pass.

### 18.5 Phase T3 — Assigned Brands and Earn Display

| Task | Description and acceptance criteria                                                                                                                                                              | Dependencies  | Likely files                                           | Verify                        | Size |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | ------------------------------------------------------ | ----------------------------- | ---- |
| T12  | Implement Assigned Brand list/filter/pagination and expanded Category/Commission and Offer tabs from ADMIN-managed shared arrays. Unassigned master records never appear.                        | TA, ADMIN A18 | `features/tenant/assigned-brands/{model,api,hooks,ui}` | TP-BRAND-001 scope/list       | M    |
| T13  | Implement Brand landing, Hot and Offer visibility confirmations/mutations. Tenant master and Revenue Share fields remain read-only; ADMIN view reflects saved array values.                      | T12           | Visibility service/hooks/dialog/page files             | Cross-portal visibility check | M    |
| T14  | Implement Earn Display list with Brand/Category/Offer target projection, filters, locale/status/effective information and empty/error states.                                                    | T12           | `features/tenant/earn-display/{model,api,hooks,ui}`    | TP-EARN-001 list              | M    |
| T15  | Implement Brand/Category/Offer earn-display create/edit form with target XOR, localized values, effective dates and preview metadata. Display priority is shown but not calculated by an engine. | T13–T14       | Earn schema/form/service/page/tests                    | Earn validation/CRUD flow     | M    |

#### Checkpoint TC — Tenant merchandising

- [ ] Assigned scope and visibility remain consistent between ADMIN and TENANT in one runtime.
- [ ] Earn Display supports all three levels and locale/fallback rules.
- [ ] Lint, tests and build pass.

### 18.6 Phase T4 — Transactions and completion

| Task | Description and acceptance criteria                                                                                                                               | Dependencies   | Likely files                                            | Verify                         | Size |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------- | ------------------------------ | ---- |
| T16  | Implement Tenant Transaction list/filter/sort/pagination and mock export lifecycle scoped by session Tenant. Only Tenant-approved financial fields are projected. | TA, ADMIN A21  | `features/tenant/transactions/{model,api,hooks,ui}`     | TP-TXN-001 list/export/scope   | M    |
| T17  | Implement Transaction detail/items/history for seeded Pending/Confirmed/Cancelled and item statuses; cross-Tenant IDs are denied.                                 | T16, ADMIN A22 | Transaction detail/service/model/test files             | Status and isolation matrix    | M    |
| T18  | Complete TP AC-to-test/manual traceability, full four-role/locale/responsive regression and focused spec fixes.                                                   | T2–T17         | `docs/specs/*`, `tests/tenant-*.test.ts`, focused fixes | Traceability script; full gate | M    |

#### Checkpoint Done — TENANT Portal

- [ ] All nine TP use cases, including TP-ROLE-001, are implemented and traceable.
- [ ] Tenant isolation is verified for lists, details, mutations and export requests.
- [ ] `npm run lint && npm test && npm run build` passes.
- [ ] ADMIN A26 legacy cleanup may now begin.

## 19. Risks and mitigations

| Risk                                                     | Impact | Mitigation                                                                |
| -------------------------------------------------------- | ------ | ------------------------------------------------------------------------- |
| Tenant scope is accidentally caller-controlled           | High   | Resolve from session only; cross-Tenant contract tests for every service  |
| Custom role changes conflict with immutable system roles | High   | Separate role type and guard mutations in service plus UI                 |
| Shared ADMIN arrays/types change midstream               | High   | Freeze at ADMIN Checkpoint F; coordinated spec update for changes         |
| Earn Display becomes a landing-page engine               | Medium | Store/render configuration only; no runtime calculation implementation    |
| Account/role cascades overcomplicate mock data           | Medium | Direct synchronous checks only; no event/session engine                   |
| No DOM/E2E tool is installed                             | Medium | Unit/contract tests and explicit manual ledger; ask before adding tooling |
