import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { resetMockData } from '../src/shared/mocks/mock-data';
import { initializeAuth, useAuthStore } from '../src/shared/stores/auth-store';

describe('in-memory auth store', () => {
  beforeEach(() => {
    resetMockData();
    useAuthStore.setState({
      session: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,
    });
  });

  it('initializes without restoring a persisted session', async () => {
    await initializeAuth();

    const state = useAuthStore.getState();
    assert.equal(state.isInitialized, true);
    assert.equal(state.isAuthenticated, false);
    assert.equal(state.session, null);
  });

  it('stores a portal-aware session after login', async () => {
    await useAuthStore.getState().login({
      portalType: 'ADMIN',
      username: 'admin@cms.test',
      password: 'Admin123!',
    });

    const state = useAuthStore.getState();
    assert.equal(state.isAuthenticated, true);
    assert.equal(state.session?.portalType, 'ADMIN');
    assert.equal(state.session?.roleCode, 'CMS_ADMIN');
    assert.equal(state.user?.username, 'admin@cms.test');
  });

  it('clears the entire session on logout', async () => {
    await useAuthStore.getState().login({
      portalType: 'TENANT',
      username: 'admin@lotus.test',
      password: 'Tenant123!',
    });

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    assert.equal(state.session, null);
    assert.equal(state.user, null);
    assert.equal(state.isAuthenticated, false);
  });
});
