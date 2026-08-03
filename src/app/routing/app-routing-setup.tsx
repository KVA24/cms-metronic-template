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
            <Route path="/admin/brands/:brandId/categories" element={<AdminBrandMappingPage />} />
            <Route path="/admin/brands/:brandId" element={<AdminBrandDetailPage />} />
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
