/**
 * Validates that a redirect path is a same-origin relative path.
 * Blocks protocol-relative URLs (//evil.com), absolute URLs, and javascript: URIs.
 * Returns '/' if the path is unsafe.
 */
export function safeRedirect(path: string | null): string {
  if (!path) return '/';
  // Only allow paths that start with / and don't contain :// or start with //
  if (path.startsWith('/') && !path.startsWith('//') && !path.includes('://')) {
    return path;
  }
  return '/';
}
