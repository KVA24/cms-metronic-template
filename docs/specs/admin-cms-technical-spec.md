# ADMIN CMS Technical Specification

> Status: Phase 2/3 approved — implementation in progress
>
> Scope owner: ADMIN CMS and shared application foundation
>
> Companion: [TENANT Portal Technical Specification](tenant-portal-technical-spec.md)

## 1. Objective

Build the complete ADMIN CMS described by the `docsaff_v2` SRS set on the current React/Metronic codebase. The application must be usable end-to-end with simple typed in-memory mock data, while keeping service contracts explicit enough to replace the mock implementations with backend adapters later.

Success means an ADMIN user can sign in through the ADMIN tab, see only authorized navigation and financial fields, and complete every UI-facing list/detail/create/edit/status/export/retry flow required by the source SRS. The CMS Reporting Dashboard mockup is included as the ADMIN landing page even though it has no dedicated SRS.

## 2. Confirmed scope and boundaries

### In scope

- Shared login with `ADMIN` and `TENANT` tabs at `/auth/login?portal=admin|tenant`.
- In-memory session containing portal type, user, system role, permissions and tenant context when applicable.
- UI languages `en` and `vi`, switchable on login and in the authenticated shell.
- ADMIN routes under `/admin/*`; TENANT routes under `/tenant/*`.
- ADMIN Dashboard, CMS permission matrix, Categories, Brands, Offers, category commission mappings, Tenants, Tenant Portal accounts, Brand/Offer assignment, Tenant Revenue Share, Configuration, Transactions and Exceptions.
- Simple typed hardcoded data and Promise-based mock services; mutations update arrays in memory until browser refresh.
- Responsive, accessible loading, empty, error, forbidden, validation, confirmation and success states.
- Audit record creation in memory for important mutations; no Audit Log screen.
- Existing `src/features/*` is reference code only. Shared pieces needed by the new CMS must be moved or recreated outside obsolete features before all legacy business/demo features are removed.

### Out of scope

- Real API endpoints, database, client persistence, token refresh and backend authorization.
- Order ingestion, deduplication, Click ID matching, commission calculation, cancellation/refund engines or background workflows.
- Public Affiliate Marketplace pages, end-user registration and self-registration.
- ADMIN account CRUD, ADMIN forgot-password and ADMIN-to-TENANT impersonation.
- A generated XLSX/CSV payload. Export must execute the same UI/request lifecycle against a mock service and receive mock file metadata only.
- Audit Log UI and unspecified backend administration screens.

## 3. Sources and precedence

| Priority | Source                                                              | Usage                                                     |
| -------: | ------------------------------------------------------------------- | --------------------------------------------------------- |
|        1 | Confirmed interview decisions in this specification                 | Scope and implementation constraints                      |
|        2 | Module SRS in [`docs/docsaff_v2/srs`](../docsaff_v2/srs/)           | Fields, validation, rules, states and acceptance criteria |
|        3 | HTML mockups in [`docs/docsaff_v2/mockups`](../docsaff_v2/mockups/) | Layout, information hierarchy and interaction only        |
|        4 | SRS assets                                                          | Additional layout/state reference only                    |
|        5 | Current Metronic application                                        | Visual style, reusable components and code conventions    |

When sources conflict, the specific use-case/table is preferred over prose summary, and the conflict remains documented in §16 until approved. Mockup CSS and visual styling must not be copied.

## 4. Assumptions and proposed conflict resolutions

1. `CMS_ADMIN`, `CMS_FINANCE`, `CMS_CSKH`, and `CMS_OPERATION` are ADMIN system roles. They are read-only provisioning data.
2. The effective ADMIN permission catalog must include `TENANTS` and `CONFIGURATION`, even though the central RBAC SRS says “five modules”; their dedicated SRS documents require these modules.
3. The explicit permission tables and per-use-case actor rules take precedence over contradictory role prose.
4. Backend-only order use cases (`ORD-*`, `COM-*`) are not implemented; their status/amount outputs seed Transaction and Exception screens.
5. UI locale defaults to English to match the existing application; business localized content defaults/falls back to `vi-VN` as stated by the SRS.
6. Language and auth session are memory-only for this mock phase. Refresh resets session/data/language; the `portal` query still restores the selected login tab.
7. Configuration deletion is represented as removal from the mock array because its SRS explicitly defines Delete; Category/Brand/Offer use status/soft-delete rules from their own SRS.

Items 2, 3 and 5 were approved at the Phase 1 review gate.

## 5. Technology and commands

| Concern              | Existing choice                                                        |
| -------------------- | ---------------------------------------------------------------------- |
| Runtime              | React 19, TypeScript 5.9, Vite 7                                       |
| Routing              | React Router 7                                                         |
| Server state pattern | TanStack React Query 5                                                 |
| Forms/validation     | React Hook Form, Zod, `@hookform/resolvers`                            |
| Client state         | Zustand; auth must not use persistence middleware for the mock session |
| Tables               | TanStack Table and existing Metronic DataGrid atoms                    |
| UI                   | Existing `src/shared/ui` atoms/molecules and `Demo1Layout`             |
| i18n                 | i18next and react-i18next                                              |
| Charts               | Existing Recharts/ApexCharts dependencies                              |
| Feedback             | Sonner, existing Alert/Dialog/Sheet components                         |

```bash
npm run dev
npm run lint
npm test
npm run build
```

No new dependency is permitted without approval.

## 6. Target source structure

```text
src/
  app/
    auth/                    # shared login, Tenant recovery, portal guard
    routing/                 # /admin/* and /tenant/* route composition
  features/
    admin/
      dashboard/
      rbac/
      categories/
      brands/
      tenants/
      configuration/
      transactions/
      exceptions/
    tenant/                  # owned by the companion specification
  shared/
    auth/                    # portal session types/store/guards
    contracts/               # generic list/error/export/upload contracts
    mocks/                   # plain typed arrays and seed/reset helpers
    permissions/             # catalogs, role matrices, evaluators
    i18n/
    ui/
```

Each feature follows the current reference pattern:

```text
<feature>/
  api/<feature>-service.ts
  hooks/use-<feature>-queries.ts
  model/<feature>-types.ts
  model/<feature>-schema.ts
  ui/<feature>-list-page.tsx
  ui/<feature>-form.tsx
  index.ts
```

Avoid additional repository/domain layers. The mock service may import and mutate typed arrays directly.

## 7. Shared application contract

### 7.1 Core types

```ts
type PortalType = 'ADMIN' | 'TENANT';
type UiLocale = 'en' | 'vi';
type EntityStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';

interface PageQuery {
  page: number; // UI is one-based
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

interface PageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

interface MockFileResult {
  fileName: string;
  contentType: string;
  downloadUrl?: string;
}

interface AppError {
  code: string;
  messageKey: string;
  fieldErrors?: Record<string, string>;
}
```

Service method signatures return `Promise<T>` and accept typed query/command DTOs. URL paths remain `TBD` until OpenAPI exists. UI components must not import mock arrays directly.

### 7.2 Authentication

`AuthSession` contains `portalType`, `user`, `roleCode`, resolved `permissions`, optional `tenantId`, and `locale`. Mock ADMIN accounts must include one user for each system role. Passwords are clearly labeled demo-only constants.

Login rules:

- Selected tab limits which mock accounts are valid.
- Successful ADMIN login redirects to `/admin/dashboard`; successful TENANT login redirects to `/tenant/dashboard` or the first permitted route.
- An authenticated context cannot open the other portal namespace. It receives 403 or is redirected to its own landing page.
- Logout clears the in-memory session and React Query cache.
- ADMIN tab has no forgot-password or registration link. TENANT recovery is specified in the companion document.
- Safe `next` redirects must remain inside the authenticated portal namespace.

### 7.3 i18n

- Every visible label, validation message, toast, dialog and empty/error state uses a translation key present in both `en.json` and `vi.json`.
- UI language is independent from localized Brand/Category/Offer/Earn Display business data.
- Required-field messages follow the SRS meaning in both languages; English remains `[Field name] is required.`.
- Dates, numbers and money use locale-aware formatting while preserving SRS formats and currency units.

### 7.4 UI behavior

- List state lives in URL search parameters where practical: page, page size, search, filters and sort.
- React Query owns async state; mutations invalidate list/detail keys.
- Forms use Zod as the single client validation schema and focus the first invalid field.
- Confirm destructive/status actions with `AlertDialog`; preserve dirty forms on cancel/navigation.
- View permission gates routes and menus. Action permissions hide actions and are rechecked by mock services.
- Financial fields are removed from view models for unauthorized roles, not merely hidden with CSS.
- Upload supports selection, SRS validation, preview, progress state and mock metadata response. Object URLs are revoked.
- Export supports filter submission, loading, mock success/error and expected filename metadata; no client file generation.

## 8. ADMIN navigation and route specification

| Route                                         | Screen                             | Source/use cases               | Permission                     |
| --------------------------------------------- | ---------------------------------- | ------------------------------ | ------------------------------ |
| `/admin/dashboard`                            | Reporting Dashboard                | `cms-reporting-dashboard.html` | `dashboard.view`               |
| `/admin/access/roles`                         | Read-only CMS role matrix          | CMS-RBAC-001/002               | `rbac.view` (`CMS_ADMIN` only) |
| `/admin/categories`                           | Category list                      | CMS-CAT-001                    | `categories.view`              |
| `/admin/categories/new`                       | Create Category                    | CMS-CAT-002/005                | `categories.create`            |
| `/admin/categories/:categoryId`               | Category detail                    | CMS-CAT-001/003                | `categories.view`              |
| `/admin/categories/:categoryId/edit`          | Edit/inactivate Category           | CMS-CAT-003/004/005            | `categories.edit`              |
| `/admin/brands`                               | Brand list                         | CMS-BRAND-001                  | `brands.view`                  |
| `/admin/brands/new`                           | Create Brand                       | CMS-BRAND-002                  | `brands.create`                |
| `/admin/brands/:brandId`                      | Brand detail/edit/status tabs      | CMS-BRAND-003/004              | `brands.view/edit`             |
| `/admin/brands/:brandId/categories`           | Category mapping/commission        | CMS-BRAND-005                  | `brands.view/create/edit`      |
| `/admin/brands/:brandId/offers`               | Offer list                         | CMS-OFFER-001                  | `brands.view`                  |
| `/admin/brands/:brandId/offers/new`           | Create Offer                       | CMS-OFFER-002                  | `brands.create`                |
| `/admin/brands/:brandId/offers/:offerId`      | Offer view                         | CMS-OFFER-001/003              | `brands.view`                  |
| `/admin/brands/:brandId/offers/:offerId/edit` | Offer edit/status                  | CMS-OFFER-003/004              | `brands.edit`                  |
| `/admin/tenants`                              | Tenant list                        | CMS-TENANT-001                 | `tenants.view`                 |
| `/admin/tenants/new`                          | Create Tenant                      | CMS-TENANT-002                 | `tenants.create`               |
| `/admin/tenants/:tenantId`                    | Tenant detail/edit/status          | CMS-TENANT-003/004             | `tenants.view/edit`            |
| `/admin/tenants/:tenantId/accounts`           | Tenant Portal accounts             | CMS-TENANT-USER-001            | `tenants.accounts.*`           |
| `/admin/tenants/:tenantId/assignments`        | Brand/Offer assignment             | CMS-TENANT-VIS-001             | `tenants.assignments.*`        |
| `/admin/tenants/:tenantId/revenue-share`      | Revenue Share list/edit            | CMS-TENANT-RS-001/002          | `tenants.revenue_share.*`      |
| `/admin/configuration`                        | Configuration list/add/edit/delete | CMS-CONFIG-001..004            | `configuration.*`              |
| `/admin/transactions`                         | Transaction list/export            | TXN-001/003                    | `transactions.view/export`     |
| `/admin/transactions/:transactionId`          | Transaction detail                 | TXN-002                        | `transactions.view`            |
| `/admin/exceptions`                           | Exception list/export              | EXC-001/002                    | `exceptions.view/export`       |
| `/admin/exceptions/:exceptionId`              | Typed Exception detail/retry       | EXC-001/002                    | `exceptions.view/retry`        |

Unknown IDs render a feature-level not-found state. Direct routes without permission render the existing 403 page and must not call the feature list/detail service.

## 9. Feature contracts and SRS traceability

The SRS remains authoritative for every field, conditional required rule, message, status transition and table column. The implementation spec fixes ownership and service boundaries without duplicating those tables.

| Feature       | Types                                                                                                   | Required service operations                                                                                         | Authoritative source                                      |
| ------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Dashboard     | `AdminDashboardMetrics`, `TrendPoint`, `TopBrand`                                                       | `getDashboard(query)`                                                                                               | Reporting mockup + financial scope in CMS RBAC            |
| RBAC          | `CmsRole`, `PermissionDefinition`, `RolePermissionView`                                                 | `listRoles()`, `getMatrix(roleCode)`                                                                                | CMS Role/Permission SRS                                   |
| Categories    | `Category`, `CategoryLocaleContent`, `CategoryDependency`                                               | `list`, `get`, `create`, `update`, `changeStatus`                                                                   | Category SRS §§IV–V                                       |
| Brands/Offers | `Brand`, `BrandLocaleContent`, `BrandCategoryMapping`, `Offer`, `OfferLocaleContent`, `OfferCommission` | Brand and Offer `list/get/create/update/changeStatus`; category mapping `list/saveBatch`                            | Brand & Offer SRS §§IV–V                                  |
| Tenants       | `Tenant`, `TenantPortalUser`, `TenantAssignment`, `TenantOfferVisibility`, `TenantRevenueShare`         | Tenant `list/get/create/update/changeStatus`; account CRUD/status; assignment get/update; revenue-share list/update | Tenant Management SRS §§IV–V                              |
| Configuration | `Configuration`                                                                                         | `list/get/create/update/remove`                                                                                     | Configuration SRS §§IV–V                                  |
| Transactions  | `TransactionHeader`, `TransactionItem`, `AdjustmentEvent`, `TransactionQuery`                           | `list`, `get`, `export`                                                                                             | Order/Transaction SRS, TXN sections and data requirements |
| Exceptions    | discriminated `ExceptionDetail` by exception type                                                       | `list`, `get`, `retry`, `export`                                                                                    | Order/Transaction SRS, EXC sections                       |
| Audit         | `AuditRecord`                                                                                           | `record(command)`                                                                                                   | Audit requirements across all SRS; no UI                  |

Backend algorithms described by ORD/COM use cases are represented only through seed records covering Pending, Confirmed, Cancelled/Refunded and every Exception group.

### 9.1 Use-case disposition matrix

| Use case                      | Frontend disposition                                               |
| ----------------------------- | ------------------------------------------------------------------ |
| CMS-RBAC-001                  | Read-only system-role permission matrix                            |
| CMS-RBAC-002                  | Shared menu, route, action and financial-field enforcement         |
| CMS-CAT-001                   | Category list/filter/sort/pagination                               |
| CMS-CAT-002                   | Category create form                                               |
| CMS-CAT-003                   | Category detail/edit form                                          |
| CMS-CAT-004                   | Category status/soft-delete action                                 |
| CMS-CAT-005                   | `vi-VN`/`en-US` localized content fields and fallback              |
| CMS-BRAND-001                 | Brand list/filter/sort/pagination                                  |
| CMS-BRAND-002                 | Brand create form                                                  |
| CMS-BRAND-003                 | Brand detail/edit form                                             |
| CMS-BRAND-004                 | Brand deactivate/soft-delete action                                |
| CMS-BRAND-005                 | Category Mapping & Commission list/batch form                      |
| CMS-OFFER-001                 | Brand-scoped Offer list/filter/pagination/view                     |
| CMS-OFFER-002                 | Offer create form                                                  |
| CMS-OFFER-003                 | Offer edit, mapping and commission form                            |
| CMS-OFFER-004                 | Offer activate/deactivate action                                   |
| CMS-TENANT-001                | Tenant list/filter/pagination                                      |
| CMS-TENANT-002                | Tenant create form                                                 |
| CMS-TENANT-USER-001           | Tenant Portal account list/view/create/edit/status/delete behavior |
| CMS-TENANT-003                | Tenant detail/edit form                                            |
| CMS-TENANT-004                | Tenant deactivate action                                           |
| CMS-TENANT-VIS-001            | Tenant Brand assignment and Offer visibility UI                    |
| CMS-TENANT-RS-001             | Tenant Revenue Share list                                          |
| CMS-TENANT-RS-002             | Revenue Share default/override update UI                           |
| CMS-CONFIG-001                | Configuration search/list                                          |
| CMS-CONFIG-002                | Configuration add form                                             |
| CMS-CONFIG-003                | Configuration edit form                                            |
| CMS-CONFIG-004                | Configuration delete confirmation/action                           |
| ORD-001/002, ORD-004, ORD-006 | No processing UI; typed transaction seeds only                     |
| COM-001/002                   | No calculation engine; seeded amount fields only                   |
| ORD-003/005                   | No cancel/refund engine; seeded item/status/history states only    |
| EXC-001                       | Seed all Exception types and render list/detail states             |
| EXC-002                       | Mock retry/export request lifecycle and resulting UI state         |
| TXN-001                       | Transaction list/filter/pagination                                 |
| TXN-002                       | Transaction detail/items/history                                   |
| TXN-003                       | Mock export request lifecycle                                      |

## 10. Mock data requirements

- Store plain exported typed arrays under `src/shared/mocks/`; no mock server, repository abstraction or scenario engine.
- Seed at least: four ADMIN users, active/inactive/draft entities, list pagination volume, related/unrelated records, localized and missing-translation content, each transaction/order/item status, and all seven Exception screen groups.
- IDs are deterministic strings. Timestamps are fixed ISO values so tests are stable.
- CRUD services may use small helpers for delay, pagination and cloning. Do not simulate database transactions, optimistic locking engines, commission calculations or cascading jobs.
- Direct dependencies required by UI are enforced plainly: uniqueness, immutable identifiers, referenced-record status restrictions and tenant/brand scoping.
- ADMIN assignment/revenue-share mutations update the same hardcoded arrays read by TENANT services. No automatic background consequence is required.
- Important mutations append a simple typed `AuditRecord`.

## 11. ADMIN permission model

The implementation uses permission codes, not role-name checks. Proposed effective catalog:

- `dashboard.view`
- `rbac.view`
- `categories.view|create|edit`
- `brands.view|create|edit`
- `tenants.view|create|edit|accounts.view|accounts.create|accounts.edit|accounts.delete|assignments.view|assignments.edit|revenue_share.view|revenue_share.edit`
- `configuration.view|create|edit|delete`
- `transactions.view|export`
- `exceptions.view|export|retry`
- `financial.gross_commission.view`, `financial.tenant_share.view`, `financial.affiliate_keep.view`, `financial.rules.edit`

The CMS RBAC source matrix controls Dashboard/Category/Brand/Transaction/Exception and financial scope. Tenant/Configuration permissions follow their dedicated SRS actor rules until the central matrix is corrected. The exact merged role matrix is a review-gate decision (§16).

## 12. State and error coverage

Every route must specify and render:

- initial skeleton/loading;
- populated state;
- no-record empty state and filtered no-results state;
- validation errors, duplicate/immutable/dependency errors and conflict response where the SRS requires them;
- 401 session loss, 403 permission failure and entity not found;
- mutation pending with double-submit prevention;
- mutation success toast and query refresh;
- recoverable service error with retry;
- disabled action with accessible explanation when a business dependency blocks it.

Mock failures are injected only from tests/fixtures or deterministic service inputs. No mock-control UI is allowed.

## 13. Testing strategy

Tests use the existing `tsx --test` setup unless UI testing requires an approved dependency. Phase 1 defines these minimum gates:

- Unit: permission evaluation, financial-field projection, validation schemas, list filter/sort/pagination helpers and status formatting.
- Contract: every mock service returns its declared type and applies direct scope/permission checks.
- Routing: portal guard, role route access, safe redirects and 403 behavior.
- Feature integration/manual until a DOM test tool is approved: list → detail → create/edit/status/delete or retry, translation switching, responsive layout and upload/export lifecycle.
- Traceability: each UI-facing SRS acceptance criterion is marked covered by an automated test ID or a manual verification ID before module completion.

Commands required at every module gate:

```bash
npm run lint
npm test
npm run build
```

## 14. Code style

```ts
export interface CategoryListQuery extends PageQuery {
  status?: EntityStatus;
  keyword?: string;
}

export interface CategoryService {
  list(query: CategoryListQuery): Promise<PageResult<Category>>;
  get(id: string): Promise<Category>;
  create(input: CategoryCreateInput): Promise<Category>;
  update(id: string, input: CategoryUpdateInput): Promise<Category>;
}
```

- Use named exports, kebab-case filenames, PascalCase React components/types and camelCase functions/variables.
- Use domain terms from the SRS; do not introduce aliases that obscure traceability.
- Keep DTOs separate from view/form state when shapes differ.
- Prefer a focused feature file over generic abstractions. A helper must have at least two real consumers.
- Follow the repository ESLint/Prettier configuration; do not reformat unrelated files.

## 15. Delivery boundaries

### Always

- Reference the SRS use-case/AC IDs in implementation tasks and tests.
- Reuse existing Metronic UI components and preserve keyboard/focus behavior.
- Keep mock data typed, deterministic and replaceable behind feature service interfaces.
- Enforce portal, permission and financial scope both before rendering and in mock service methods.
- Run lint, tests and build before each completed module commit.

### Ask first

- Add a dependency, change build/CI configuration or introduce a new global state library.
- Resolve a source conflict differently from §4/§16.
- Add a route, screen, field or workflow absent from confirmed scope/SRS.
- Change the shared service contract after TENANT implementation depends on it.

### Never

- Copy mockup styling/CSS into production code.
- Persist demo auth/data/passwords or log sensitive Configuration/password values.
- Implement backend engines or invent endpoint URLs before OpenAPI is available.
- Authorize only by hidden UI or role name.
- Remove legacy features until replacements pass their verification gates and imports/routes are proven absent.

## 16. Approved Phase 1 decisions

1. The ADMIN permission catalog includes Tenant and Configuration in addition to the five modules in the central RBAC document.
2. Explicit permission tables and per-use-case actor rules override contradictory CSKH prose.
3. English is the default UI language after refresh; business-content fallback is `vi-VN`.
4. Category asset selection uses the existing image/icon input pattern and typed asset metadata; no icon-library dependency is added.
5. Brand code migration and bulk category import are excluded; Offer commission remains in the Offer form.

## 17. Phase 1 success criteria

- All confirmed scope, exclusions, routes, service boundaries and cross-portal contracts are represented here.
- Every ADMIN UI use case maps to a route and a typed service operation.
- All source SRS documents and ADMIN mockups are traceable from this document.
- Shared auth, i18n, RBAC, mock-data and error-state behavior is concrete and testable.
- Source conflicts have explicit human decisions.
- No feature implementation begins until the Phase 2/3 plan below is reviewed.

## 18. Implementation plan

### 18.1 Dependency graph

```text
Shared types + simple mock arrays
  ├─ Permission catalogs/evaluators
  ├─ Auth session + portal guards
  │    └─ Namespaced routing + menus + i18n shell
  └─ Feature service contracts
       ├─ Dashboard/RBAC
       ├─ Category → Brand → Mapping → Offer
       ├─ Tenant → Accounts → Assignments → Revenue Share
       ├─ Configuration
       └─ Transaction → Exception
            └─ Traceability/regression → legacy feature removal
```

Shared contracts, auth and routing are sequential prerequisites. After the Foundation checkpoint, independent feature groups may be implemented in separate sessions, but tasks that share Brand/Tenant arrays must retain the approved types.

### 18.2 Master execution checklist

- [ ] A1–A5: shared contracts, permissions, auth, routing and menus
- [x] A6–A9: ADMIN Dashboard, RBAC and Categories
- [x] A10–A14: Brands, Category Mapping and Offers
- [ ] A15–A19: Tenant administration, accounts, assignments and Revenue Share
- [ ] A20–A24: Configuration, Transactions and Exceptions
- [ ] A25–A27: traceability, legacy cleanup and final regression

### 18.3 Phase A — Shared foundation

| Task  | Description and acceptance criteria                                                                                                                                                            | Dependencies | Likely files                                                                                      | Verify                                                           | Size |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---- |
| A1 ✅ | Add core portal/list/error/file/audit types and deterministic typed mock arrays. No repository/mock-server abstraction; refresh resets data.                                                   | None         | `src/shared/contracts/*`, `src/shared/mocks/*`, `tests/mock-contracts.test.ts`                    | `npx tsx --test tests/mock-contracts.test.ts`; `npm run build`   | M    |
| A2 ✅ | Add approved ADMIN/TENANT permission catalogs, role matrices and financial projection helpers. Role permissions, module visibility and field projection match §11.                             | A1           | `src/shared/permissions/*`, `tests/permissions.test.ts`                                           | `npx tsx --test tests/permissions.test.ts`; manual matrix review | M    |
| A3 ✅ | Replace persisted demo auth behavior with typed in-memory `AuthSession`; implement portal-aware mock login/logout and safe redirect. Wrong-tab credentials and cross-portal `next` are denied. | A1–A2        | `src/shared/auth/*`, `src/app/auth/*`, `tests/auth-session.test.ts`, `tests/auth-store.test.ts`   | Targeted auth tests; full lint/test/build                        | M    |
| A4 ✅ | Implement `/auth/login?portal=...` tabs, EN/VI switcher and ADMIN/TENANT namespace guards. ADMIN has no recovery/registration link.                                                            | A3           | `src/app/auth/pages/*`, `src/app/routing/*`, i18n message files                                   | Role login/manual 403; `npm run build`                           | M    |
| A5 ✅ | Replace sidebar/menu composition with portal- and permission-filtered menus plus first-permitted landing logic. Direct unauthorized routes do not call feature services.                       | A2–A4        | `src/shared/config/menu.config.tsx`, `src/shared/lib/rbac/*`, layout/sidebar files, routing tests | Menu/route tests; manual keyboard check                          | M    |

#### Checkpoint F — Foundation

- [x] All four ADMIN and four TENANT seed personas authenticate only in their portal.
- [x] EN/VI switch and `/admin/*`/`/tenant/*` guards work without persistence.
- [x] `npm run lint && npm test && npm run build` passes.
- [x] Review shared contracts before feature services depend on them.

### 18.4 Phase B — ADMIN dashboard, RBAC and categories

| Task | Description and acceptance criteria                                                                                                                                 | Dependencies | Likely files                                     | Verify                                  | Size |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------ | --------------------------------------- | ---- |
| A6 ✅ | Implement ADMIN Reporting Dashboard service/query/page from the CMS mockup. Cards/charts support role financial projection and loading/empty/error states.         | F            | `features/admin/dashboard/{model,api,hooks,ui}`  | Dashboard role/manual checks; build     | M    |
| A7 ✅ | Implement read-only CMS system-role matrix for `CMS_ADMIN`; all other roles receive 403 and no mutation UI exists.                                                 | F            | `features/admin/rbac/{model,api,hooks,ui}`       | CMS-RBAC-001/002 checks                 | M    |
| A8 ✅ | Implement Category list service/query/page with filters, sort, pagination, reset and empty/error states.                                                           | F            | `features/admin/categories/{model,api,hooks,ui}` | CMS-CAT-001 verification                | M    |
| A9 ✅ | Implement Category create/detail/edit/status forms with `vi-VN`/`en-US`, dependency rules and asset metadata. All CMS-CAT-002..005 validations map to Zod/messages. | A8          | Category schema/form/page/service files          | Category CRUD manual flow; unit schemas | M    |

#### Checkpoint C — Core ADMIN shell

- [x] Dashboard financial fields differ correctly by role.
- [x] RBAC matrix is ADMIN-only and Category CRUD passes its SRS AC mapping.
- [x] Lint, tests and build pass.

### 18.5 Phase C — Brands, mappings and offers

| Task | Description and acceptance criteria                                                                                                                          | Dependencies | Likely files                                 | Verify                        | Size |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ | -------------------------------------------- | ----------------------------- | ---- |
| A10 ✅ | Implement Brand list/filter/pagination and create form with localized content/upload preview.                                                               | A9           | `features/admin/brands/{model,api,hooks,ui}` | CMS-BRAND-001/002 flow        | M    |
| A11 ✅ | Implement Brand detail/edit/deactivate with immutable/dependency constraints and dirty-form confirmation.                                                    | A10          | Brand schema/form/detail/service files       | CMS-BRAND-003/004 flow        | M    |
| A12 ✅ | Implement Brand Category Mapping & Commission list/batch editor, conditional commission rules and atomic mock save result.                                   | A11          | Mapping model/service/schema/page files      | CMS-BRAND-005 AC tests/manual | M    |
| A13 ✅ | Implement Brand-scoped Offer list/view with filters, pagination and status badges.                                                                           | A10          | Offer model/service/hooks/list/detail files  | CMS-OFFER-001 flow            | M    |
| A14 ✅ | Implement Offer create/edit/activate/deactivate, localized content, mapping and commission validation. Used codes are immutable; no calculation engine runs. | A12–A13      | Offer schema/form/page/service files         | CMS-OFFER-002..004 flow       | M    |

#### Checkpoint B — Brand domain

- [x] Brand → category mapping → Offer vertical flows work with shared typed arrays.
- [x] Permission and financial-rule scopes are enforced in UI and services.
- [x] Lint, tests and build pass.

### 18.6 Phase D — Tenant administration

| Task | Description and acceptance criteria                                                                                                                  | Dependencies  | Likely files                                  | Verify                                | Size |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------- | ------------------------------------- | ---- |
| A15 ✅ | Implement Tenant list/filter/pagination and create form with deterministic IDs and validation.                                                       | F             | `features/admin/tenants/{model,api,hooks,ui}` | CMS-TENANT-001/002 flow               | M    |
| A16 ✅ | Implement Tenant detail/edit/deactivate with dependency confirmation and no impersonation action.                                                    | A15           | Tenant schema/form/detail/service files       | CMS-TENANT-003/004 flow               | M    |
| A17 ✅ | Implement Tenant Portal account list/view/create/edit/status/delete-or-disable over the shared account array.                                        | A16           | Account model/service/hooks/pages             | CMS-TENANT-USER-001 flow              | M    |
| A18 ✅ | Implement Brand/Offer assignment pool and visibility editor using Brand/Offer shared arrays. TENANT reads reflect saved changes in the same runtime. | A11, A14, A16 | Assignment model/service/hooks/page files     | CMS-TENANT-VIS-001 cross-portal check | M    |
| A19  | Implement Tenant Revenue Share list and default/category/offer override form with direct validation only.                                            | A18           | Revenue model/service/schema/pages            | CMS-TENANT-RS-001/002 flow            | M    |

#### Checkpoint T — Tenant administration

- [ ] Tenant, account, assignment and Revenue Share flows pass SRS acceptance mapping.
- [ ] Shared data is visible to TENANT service contracts without event/cascade engines.
- [ ] Lint, tests and build pass.

### 18.7 Phase E — Configuration, Transactions and Exceptions

| Task | Description and acceptance criteria                                                                                                  | Dependencies | Likely files                                        | Verify                     | Size |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------ | --------------------------------------------------- | -------------------------- | ---- |
| A20  | Implement Configuration search/list and add/edit/delete dialogs with immutable key, masking/logging rules and ADMIN-only permission. | F            | `features/admin/configuration/{model,api,hooks,ui}` | CMS-CONFIG-001..004 flow   | M    |
| A21  | Implement Transaction list filters/sort/pagination and mock export request lifecycle with financial projection.                      | F            | `features/admin/transactions/{model,api,hooks,ui}`  | TXN-001/003 role checks    | M    |
| A22  | Implement Transaction detail with header, item status/amounts and history from seeded output models.                                 | A21          | Transaction detail/service/model files              | TXN-002 status matrix      | M    |
| A23  | Implement Exception list/filter/pagination and mock export across all seven exception groups.                                        | A21          | `features/admin/exceptions/{model,api,hooks,ui}`    | EXC-001 list/export checks | M    |
| A24  | Implement discriminated Exception detail variants and mock retry lifecycle; no backend remediation workflow is simulated.            | A23          | Exception detail/service/components files           | EXC-001/002 variant checks | M    |

#### Checkpoint O — Operations

- [ ] Configuration CRUD, Transaction projection/export and every Exception variant work.
- [ ] ORD/COM logic exists only as typed seed outputs.
- [ ] Lint, tests and build pass.

### 18.8 Phase F — Completion and legacy removal

| Task | Description and acceptance criteria                                                                                                                                           | Dependencies              | Likely files                                                   | Verify                           | Size |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | -------------------------------------------------------------- | -------------------------------- | ---- |
| A25  | Add/complete SRS AC-to-test/manual traceability ledger and contract tests for every ADMIN service. No UI-facing AC is unassigned.                                             | A6–A24                    | `docs/specs/*`, `tests/admin-*.test.ts`                        | Traceability script; full test   | M    |
| A26  | Inventory imports/routes from legacy `src/features/*`; move only genuinely shared pieces and remove replaced business/demo features. No orphan import, route or menu remains. | A25 and TENANT completion | routing/menu, moved shared files, deleted legacy feature files | `rg` dependency audit; full gate | M    |
| A27  | Run final ADMIN regression across roles, locales, responsive states and non-happy paths; fix only spec deviations and record results.                                         | A26                       | Tests/spec verification records; focused fixes                 | Full gate + manual matrix        | M    |

#### Checkpoint Done — ADMIN/shared foundation

- [ ] Every ADMIN use case and accepted decision is implemented and traceable.
- [ ] Legacy business/demo features are removed safely.
- [ ] `npm run lint && npm test && npm run build` passes from a clean worktree.
- [ ] Human reviews the completed verification ledger.

## 19. Risks and mitigations

| Risk                                                    | Impact | Mitigation                                                                              |
| ------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------- |
| Shared contracts drift while ADMIN/TENANT are built     | High   | Freeze after Checkpoint F; changes require spec update/review                           |
| SRS tables contain contradictory role prose             | High   | Use approved decisions in §16 and permission-code tests                                 |
| Feature tasks expand beyond five files                  | Medium | Split model/service and UI/form into consecutive tasks before implementation            |
| Hardcoded relationships become a mock backend framework | Medium | Plain arrays/direct helpers only; reject repositories/event engines                     |
| Legacy deletion removes reused UI                       | High   | Dependency inventory and full gate before each deletion batch                           |
| No DOM/E2E dependency exists                            | Medium | Unit/contract tests plus explicit manual verification ledger; ask before adding tooling |
