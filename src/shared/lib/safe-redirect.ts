/**
 * Validates that a redirect path is a same-origin relative path.
 * Blocks protocol-relative URLs (//evil.com), absolute URLs, and javascript: URIs.
 * Returns '/' if the path is unsafe.
 */
export function safeRedirect(path: string | null): string {
  if (!path) return '/';

  try {
    const applicationOrigin = 'https://application.invalid';
    const target = new URL(path, applicationOrigin);
    const containsUnsafeCharacters = /[\\\u0000-\u001f\u007f]/.test(path);

    if (
      path.startsWith('/') &&
      !path.startsWith('//') &&
      !containsUnsafeCharacters &&
      target.origin === applicationOrigin
    ) {
      return path;
    }
  } catch {
    return '/';
  }

  return '/';
}
