import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { safeRedirect } from '../src/shared/lib/safe-redirect';

describe('safeRedirect', () => {
  it('allows same-origin application paths', () => {
    assert.equal(
      safeRedirect('/account?tab=security#password'),
      '/account?tab=security#password',
    );
  });

  it('rejects protocol-relative and absolute URLs', () => {
    assert.equal(safeRedirect('//evil.example'), '/');
    assert.equal(safeRedirect('https://evil.example'), '/');
  });

  it('rejects backslash paths that browsers resolve cross-origin', () => {
    assert.equal(safeRedirect('/\\evil.example'), '/');
  });
});
