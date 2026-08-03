import { lazy, Suspense } from 'react';
import { UserRole } from '@/shared/lib/rbac/roles';
import { SuspenseLoading } from '@/shared/ui/molecules/suspense-loading';
import { Demo1Layout } from '@/widgets/layouts/demo1/layout';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthRouting } from '@/app/auth/auth-routing';
import { ProtectedRoute } from '@/app/auth/protected-route';
import { RequireAuth } from '@/app/auth/require-auth';
import { ErrorRouting } from '@/app/errors/error-routing';
import { PortalLandingRedirect } from './portal-landing-redirect';

// Auth pages
const AuthAccountDeactivatedPage = lazy(() =>
  import('@/app/auth/pages/auth-account-deactivated-page').then((m) => ({
    default: m.AuthAccountDeactivatedPage,
  })),
);
const AuthWelcomeMessagePage = lazy(() =>
  import('@/app/auth/pages/auth-welcome-message-page').then((m) => ({
    default: m.AuthWelcomeMessagePage,
  })),
);

// Feature pages
const WelcomePage = lazy(() =>
  import('@/features/welcome/ui/welcome-page').then((m) => ({
    default: m.WelcomePage,
  })),
);
const DashboardPage = lazy(() =>
  import('@/features/dashboards').then((m) => ({ default: m.DashboardPage })),
);
const AdminDashboardPage = lazy(() =>
  import('@/features/admin/dashboard/ui/admin-dashboard-page').then((m) => ({
    default: m.AdminDashboardPage,
  })),
);
const AdminRbacPage = lazy(() =>
  import('@/features/admin/rbac/ui/admin-rbac-page').then((m) => ({
    default: m.AdminRbacPage,
  })),
);
const AdminCategoryListPage = lazy(() =>
  import('@/features/admin/categories/ui/admin-category-list-page').then(
    (m) => ({ default: m.AdminCategoryListPage }),
  ),
);
const AdminCategoryDetailPage = lazy(() =>
  import('@/features/admin/categories/ui/admin-category-detail-page').then(
    (m) => ({ default: m.AdminCategoryDetailPage }),
  ),
);
const AdminCategoryFormPage = lazy(() =>
  import('@/features/admin/categories/ui/admin-category-form-page').then(
    (m) => ({ default: m.AdminCategoryFormPage }),
  ),
);
const AdminBrandListPage = lazy(() =>
  import('@/features/admin/brands/ui/admin-brand-list-page').then((m) => ({
    default: m.AdminBrandListPage,
  })),
);
const AdminBrandCreatePage = lazy(() =>
  import('@/features/admin/brands/ui/admin-brand-create-page').then((m) => ({
    default: m.AdminBrandCreatePage,
  })),
);
const AdminBrandDetailPage = lazy(() =>
  import('@/features/admin/brands/ui/admin-brand-detail-page').then((m) => ({
    default: m.AdminBrandDetailPage,
  })),
);
const AdminBrandMappingPage = lazy(() =>
  import('@/features/admin/brands/ui/admin-brand-mapping-page').then((m) => ({
    default: m.AdminBrandMappingPage,
  })),
);
const AdminOfferListPage = lazy(() =>
  import('@/features/admin/brands/ui/admin-offer-list-page').then((m) => ({
    default: m.AdminOfferListPage,
  })),
);
const AdminOfferDetailPage = lazy(() =>
  import('@/features/admin/brands/ui/admin-offer-detail-page').then((m) => ({
    default: m.AdminOfferDetailPage,
  })),
);
const AdminOfferCreatePage = lazy(() =>
  import('@/features/admin/brands/ui/admin-offer-form-page').then((m) => ({
    default: m.AdminOfferCreatePage,
  })),
);
const AdminOfferEditPage = lazy(() =>
  import('@/features/admin/brands/ui/admin-offer-form-page').then((m) => ({
    default: m.AdminOfferEditPage,
  })),
);
const AdminTenantListPage = lazy(() =>
  import('@/features/admin/tenants/ui/admin-tenant-list-page').then((m) => ({
    default: m.AdminTenantListPage,
  })),
);
const AdminTenantCreatePage = lazy(() =>
  import('@/features/admin/tenants/ui/admin-tenant-create-page').then((m) => ({
    default: m.AdminTenantCreatePage,
  })),
);
const AdminTenantDetailPage = lazy(() =>
  import('@/features/admin/tenants/ui/admin-tenant-detail-page').then((m) => ({
    default: m.AdminTenantDetailPage,
  })),
);
const AdminTenantAccountPage = lazy(() =>
  import('@/features/admin/tenants/ui/admin-tenant-account-page').then((m) => ({
    default: m.AdminTenantAccountPage,
  })),
);
const AdminTenantAssignmentPage = lazy(() =>
  import('@/features/admin/tenants/ui/admin-tenant-assignment-page').then((m) => ({
    default: m.AdminTenantAssignmentPage,
  })),
);
const AdminTenantRevenueListPage = lazy(() =>
  import('@/features/admin/tenants/ui/admin-tenant-revenue-list-page').then((m) => ({
    default: m.AdminTenantRevenueListPage,
  })),
);
const AdminTenantRevenueFormPage = lazy(() =>
  import('@/features/admin/tenants/ui/admin-tenant-revenue-form-page').then((m) => ({
    default: m.AdminTenantRevenueFormPage,
  })),
);
const AdminConfigurationPage = lazy(() =>
  import('@/features/admin/configuration/ui/admin-configuration-page').then((m) => ({
    default: m.AdminConfigurationPage,
  })),
);
const AdminTransactionListPage = lazy(() =>
  import('@/features/admin/transactions/ui/admin-transaction-list-page').then((m) => ({
    default: m.AdminTransactionListPage,
  })),
);
const AdminTransactionDetailPage = lazy(() =>
  import('@/features/admin/transactions/ui/admin-transaction-detail-page').then((m) => ({
    default: m.AdminTransactionDetailPage,
  })),
);
const AdminExceptionListPage = lazy(() =>
  import('@/features/admin/exceptions/ui/admin-exception-list-page').then((m) => ({
    default: m.AdminExceptionListPage,
  })),
);
const AdminExceptionDetailPage = lazy(() =>
  import('@/features/admin/exceptions/ui/admin-exception-detail-page').then((m) => ({
    default: m.AdminExceptionDetailPage,
  })),
);
const TenantRoutePlaceholderPage = lazy(() =>
  import('@/features/tenant/access/ui/tenant-route-placeholder-page').then((m) => ({ default: m.TenantRoutePlaceholderPage })),
);
const AccountManagementPage = lazy(() =>
  import('@/features/account').then((m) => ({ default: m.AccountPage })),
);
const ConfigPage = lazy(() =>
  import('@/features/config').then((m) => ({ default: m.ConfigPage })),
);
const ActivityLogPage = lazy(() =>
  import('@/features/activity-log').then((m) => ({
    default: m.ActivityLogPage,
  })),
);

export function AppRoutingSetup() {
  return (
    <Suspense fallback={<SuspenseLoading />}>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route element={<Demo1Layout />}>
            <Route path="/" element={<WelcomePage />} />
            <Route
              path="/admin"
              element={<PortalLandingRedirect portalType="ADMIN" />}
            />
            <Route
              path="/tenant"
              element={<PortalLandingRedirect portalType="TENANT" />}
            />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/access/roles" element={<AdminRbacPage />} />
            <Route path="/admin/categories" element={<AdminCategoryListPage />} />
            <Route
              path="/admin/categories/new"
              element={<AdminCategoryFormPage mode="create" />}
            />
            <Route
              path="/admin/categories/:categoryId/edit"
              element={<AdminCategoryFormPage mode="edit" />}
            />
            <Route
              path="/admin/categories/:categoryId"
              element={<AdminCategoryDetailPage />}
            />
            <Route path="/admin/brands" element={<AdminBrandListPage />} />
            <Route path="/admin/brands/new" element={<AdminBrandCreatePage />} />
            <Route path="/admin/brands/:brandId/offers" element={<AdminOfferListPage />} />
            <Route path="/admin/brands/:brandId/offers/new" element={<AdminOfferCreatePage />} />
            <Route path="/admin/brands/:brandId/offers/:offerId/edit" element={<AdminOfferEditPage />} />
            <Route path="/admin/brands/:brandId/offers/:offerId" element={<AdminOfferDetailPage />} />
            <Route path="/admin/brands/:brandId/categories" element={<AdminBrandMappingPage />} />
            <Route path="/admin/brands/:brandId" element={<AdminBrandDetailPage />} />
            <Route path="/admin/tenants" element={<AdminTenantListPage />} />
            <Route path="/admin/tenants/new" element={<AdminTenantCreatePage />} />
            <Route path="/admin/tenants/:tenantId/accounts" element={<AdminTenantAccountPage />} />
            <Route path="/admin/tenants/:tenantId/assignments" element={<AdminTenantAssignmentPage />} />
            <Route path="/admin/tenants/:tenantId/revenue-share/:brandId" element={<AdminTenantRevenueFormPage />} />
            <Route path="/admin/tenants/:tenantId/revenue-share" element={<AdminTenantRevenueListPage />} />
            <Route path="/admin/tenants/:tenantId" element={<AdminTenantDetailPage />} />
            <Route path="/admin/configuration" element={<AdminConfigurationPage />} />
            <Route path="/admin/transactions" element={<AdminTransactionListPage />} />
            <Route path="/admin/transactions/:transactionId" element={<AdminTransactionDetailPage />} />
            <Route path="/admin/exceptions" element={<AdminExceptionListPage />} />
            <Route path="/admin/exceptions/:exceptionId" element={<AdminExceptionDetailPage />} />
            <Route path="/tenant/dashboard" element={<TenantRoutePlaceholderPage />} />
            <Route path="/tenant/assigned-brands" element={<TenantRoutePlaceholderPage />} />
            <Route path="/tenant/earn-display" element={<TenantRoutePlaceholderPage />} />
            <Route path="/tenant/earn-display/:brandId" element={<TenantRoutePlaceholderPage />} />
            <Route path="/tenant/transactions" element={<TenantRoutePlaceholderPage />} />
            <Route path="/tenant/transactions/:transactionId" element={<TenantRoutePlaceholderPage />} />
            <Route path="/tenant/account/roles" element={<TenantRoutePlaceholderPage />} />
            <Route path="/tenant/account/roles/new" element={<TenantRoutePlaceholderPage />} />
            <Route path="/tenant/account/roles/:roleId" element={<TenantRoutePlaceholderPage />} />
            <Route path="/tenant/account/roles/:roleId/edit" element={<TenantRoutePlaceholderPage />} />
            <Route path="/tenant/account/roles/:roleId/permissions" element={<TenantRoutePlaceholderPage />} />
            <Route path="/tenant/account/users" element={<TenantRoutePlaceholderPage />} />
            <Route path="/tenant/account/users/new" element={<TenantRoutePlaceholderPage />} />
            <Route path="/tenant/account/users/:userId" element={<TenantRoutePlaceholderPage />} />
            <Route path="/tenant/account/users/:userId/edit" element={<TenantRoutePlaceholderPage />} />
            <Route path="/tenant/account/profile" element={<TenantRoutePlaceholderPage />} />
            <Route
              path="/auth/welcome-message"
              element={<AuthWelcomeMessagePage />}
            />
            <Route
              path="/auth/account-deactivated"
              element={<AuthAccountDeactivatedPage />}
            />

            <Route
              element={<ProtectedRoute requiredRoles={[UserRole.ADMIN]} />}
            >
              <Route path="/config" element={<ConfigPage />} />
              <Route path="/activity-log" element={<ActivityLogPage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute
                  requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}
                />
              }
            >
              <Route path="/dashboards" element={<DashboardPage />} />
              <Route path="/account" element={<AccountManagementPage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute
                  requiredRoles={[
                    UserRole.ADMIN,
                    UserRole.OPERATOR,
                    UserRole.CS,
                  ]}
                />
              }
            ></Route>

            <Route
              path="/admin/*"
              element={<Navigate to="/error/404" replace />}
            />
            <Route
              path="/tenant/*"
              element={<Navigate to="/error/404" replace />}
            />
          </Route>
        </Route>
        <Route path="error/*" element={<ErrorRouting />} />
        <Route path="auth/*" element={<AuthRouting />} />
        <Route path="*" element={<Navigate to="/error/404" />} />
      </Routes>
    </Suspense>
  );
}
