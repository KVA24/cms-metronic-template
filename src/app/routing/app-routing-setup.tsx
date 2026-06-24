import { lazy, Suspense } from 'react';
import { UserRole } from '@/shared/lib/rbac/roles';
import { SuspenseLoading } from '@/shared/ui/molecules/suspense-loading';
import { Demo1Layout } from '@/widgets/layouts/demo1/layout';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthRouting } from '@/app/auth/auth-routing';
import { ProtectedRoute } from '@/app/auth/protected-route';
import { RequireAuth } from '@/app/auth/require-auth';
import { ErrorRouting } from '@/app/errors/error-routing';

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
          </Route>
        </Route>
        <Route path="error/*" element={<ErrorRouting />} />
        <Route path="auth/*" element={<AuthRouting />} />
        <Route path="*" element={<Navigate to="/error/404" />} />
      </Routes>
    </Suspense>
  );
}
