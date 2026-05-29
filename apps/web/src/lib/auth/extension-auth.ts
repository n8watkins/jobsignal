/**
 * Opt-in shared-secret gate for the public extension endpoints (CORS `*`).
 *
 * When EXTENSION_SHARED_SECRET is unset the request passes through, preserving
 * the local-dev default. When it is set, the request must present a matching
 * `x-extension-secret` header — keeping arbitrary websites from POSTing into
 * the single-user database.
 */
export function checkExtensionSecret(request: Request): boolean {
  const expected = process.env.EXTENSION_SHARED_SECRET;
  if (!expected) return true;
  return request.headers.get("x-extension-secret") === expected;
}
