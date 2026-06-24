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
const CategoryPage = lazy(() =>
  import('@/features/category').then((m) => ({ default: m.CategoryPage })),
);
const CurrencyPage = lazy(() =>
  import('@/features/currency').then((m) => ({ default: m.CurrencyPage })),
);
const GameRewardsPage = lazy(() =>
  import('@/features/game-rewards').then((m) => ({
    default: m.GameRewardsPage,
  })),
);
const ValidationRulePage = lazy(() =>
  import('@/features/validation-rule').then((m) => ({
    default: m.ValidationRulePage,
  })),
);
const UserListPage = lazy(() =>
  import('@/features/users').then((m) => ({ default: m.UserListPage })),
);
const UserDetailPage = lazy(() =>
  import('@/features/users').then((m) => ({ default: m.UserDetailPage })),
);
const ActivityLogPage = lazy(() =>
  import('@/features/activity-log').then((m) => ({
    default: m.ActivityLogPage,
  })),
);
const PointHistoryPage = lazy(() =>
  import('@/features/history').then((m) => ({ default: m.PointHistoryPage })),
);
const EventListPage = lazy(() =>
  import('@/features/events').then((m) => ({ default: m.EventListPage })),
);
const EventFormPage = lazy(() =>
  import('@/features/events').then((m) => ({ default: m.EventFormPage })),
);
const PartnerListPage = lazy(() =>
  import('@/features/partners').then((m) => ({ default: m.PartnerListPage })),
);
const PartnerFormPage = lazy(() =>
  import('@/features/partners').then((m) => ({ default: m.PartnerFormPage })),
);
const TierListPage = lazy(() =>
  import('@/features/tiers').then((m) => ({ default: m.TierListPage })),
);
const TierFormPage = lazy(() =>
  import('@/features/tiers').then((m) => ({ default: m.TierFormPage })),
);
const TierDowngradeRulePage = lazy(() =>
  import('@/features/tier-downgrade-rules').then((m) => ({
    default: m.TierDowngradeRulePage,
  })),
);
const TierMetricListPage = lazy(() =>
  import('@/features/tier-metrics').then((m) => ({
    default: m.TierMetricListPage,
  })),
);
const TierMetricFormPage = lazy(() =>
  import('@/features/tier-metrics').then((m) => ({
    default: m.TierMetricFormPage,
  })),
);
const CampaignListPage = lazy(() =>
  import('@/features/campaigns').then((m) => ({ default: m.CampaignListPage })),
);
const CampaignFormPage = lazy(() =>
  import('@/features/campaigns').then((m) => ({ default: m.CampaignFormPage })),
);
const MetadataListPage = lazy(() =>
  import('@/features/metadata').then((m) => ({ default: m.MetadataListPage })),
);
const MetadataFormPage = lazy(() =>
  import('@/features/metadata').then((m) => ({ default: m.MetadataFormPage })),
);
const GameItemPage = lazy(() =>
  import('@/features/game-items').then((m) => ({ default: m.GameItemPage })),
);
const GamePoolsPage = lazy(() =>
  import('@/features/game-pools').then((m) => ({ default: m.GamePoolsPage })),
);
const GamePoolFormPage = lazy(() =>
  import('@/features/game-pools').then((m) => ({
    default: m.GamePoolFormPage,
  })),
);
const GameTransactionsPage = lazy(() =>
  import('@/features/game-transactions').then((m) => ({
    default: m.GameTransactionsPage,
  })),
);
const ExpiryPolicyPage = lazy(() =>
  import('@/features/expiry-policy').then((m) => ({
    default: m.ExpiryPolicyPage,
  })),
);
const RedemptionPackagePage = lazy(() =>
  import('@/features/redemption-package').then((m) => ({
    default: m.RedemptionPackagePage,
  })),
);
const RedemptionCodeInventoryPage = lazy(() =>
  import('@/features/redemption-code-inventory').then((m) => ({
    default: m.RedemptionCodeInventoryPage,
  })),
);
const RedemptionTransactionPage = lazy(() =>
  import('@/features/redemption-transactions').then((m) => ({
    default: m.RedemptionTransactionPage,
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
              <Route path="/partners" element={<PartnerListPage />} />
              <Route
                path="/partners/view/:id"
                element={<PartnerFormPage mode="view" />}
              />
              <Route
                path="/partners/create"
                element={<PartnerFormPage mode="create" />}
              />
              <Route
                path="/partners/edit/:id"
                element={<PartnerFormPage mode="edit" />}
              />
              <Route path="/expiry-policies" element={<ExpiryPolicyPage />} />
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
              <Route path="/categories" element={<CategoryPage />} />
              <Route path="/currencies" element={<CurrencyPage />} />
              <Route path="/game-rewards" element={<GameRewardsPage />} />
              <Route
                path="/validation-rules"
                element={<ValidationRulePage />}
              />
              <Route path="/event-schemas" element={<EventListPage />} />
              <Route
                path="/event-schemas/create"
                element={<EventFormPage mode="create" />}
              />
              <Route
                path="/event-schemas/edit/:id"
                element={<EventFormPage mode="edit" />}
              />
              <Route
                path="/event-schemas/view/:id"
                element={<EventFormPage mode="view" />}
              />
              <Route
                path="/tiers/create"
                element={<TierFormPage mode="create" />}
              />
              <Route
                path="/tiers/edit/:id"
                element={<TierFormPage mode="edit" />}
              />
              <Route
                path="/tier-metrics/create"
                element={<TierMetricFormPage mode="create" />}
              />
              <Route
                path="/tier-metrics/edit/:id"
                element={<TierMetricFormPage mode="edit" />}
              />
              <Route
                path="/campaigns/create"
                element={<CampaignFormPage mode="create" />}
              />
              <Route
                path="/campaigns/edit/:id"
                element={<CampaignFormPage mode="edit" />}
              />
              <Route path="/metadata" element={<MetadataListPage />} />
              <Route
                path="/metadata/create"
                element={<MetadataFormPage mode="create" />}
              />
              <Route
                path="/metadata/edit/:id"
                element={<MetadataFormPage mode="edit" />}
              />
              <Route
                path="/metadata/view/:id"
                element={<MetadataFormPage mode="view" />}
              />
              <Route path="/game-items" element={<GameItemPage />} />
              <Route
                path="/game-pools/create"
                element={<GamePoolFormPage mode="create" />}
              />
              <Route
                path="/game-pools/edit/:id"
                element={<GamePoolFormPage mode="edit" />}
              />
              <Route path="/game-pools" element={<GamePoolsPage />} />
              <Route
                path="/game-pools/view/:id"
                element={<GamePoolFormPage mode="view" />}
              />
              <Route path="/campaigns" element={<CampaignListPage />} />
              <Route
                path="/campaigns/view/:id"
                element={<CampaignFormPage mode="view" />}
              />
              <Route path="/tier-metrics" element={<TierMetricListPage />} />
              <Route
                path="/tier-metrics/view/:id"
                element={<TierMetricFormPage mode="view" />}
              />
              <Route path="/tiers" element={<TierListPage />} />
              <Route
                path="/tiers/view/:id"
                element={<TierFormPage mode="view" />}
              />
              <Route
                path="/tier-downgrade-rules"
                element={<TierDowngradeRulePage />}
              />
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
            >
              <Route path="/users" element={<UserListPage />} />
              <Route path="/users/:id" element={<UserDetailPage />} />
              <Route path="/point-history" element={<PointHistoryPage />} />
              <Route
                path="/redemption-packages"
                element={<RedemptionPackagePage />}
              />
              <Route
                path="/redemption-packages/:id/inventory"
                element={<RedemptionCodeInventoryPage />}
              />
              <Route
                path="/reward-transactions"
                element={<RedemptionTransactionPage />}
              />
              <Route
                path="/game-transactions"
                element={<GameTransactionsPage />}
              />
            </Route>
          </Route>
        </Route>
        <Route path="error/*" element={<ErrorRouting />} />
        <Route path="auth/*" element={<AuthRouting />} />
        <Route path="*" element={<Navigate to="/error/404" />} />
      </Routes>
    </Suspense>
  );
}
