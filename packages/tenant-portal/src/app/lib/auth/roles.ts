/**
 * Keycloak realm roles for the embedded-chat product.
 *
 * Named after the product domain (not the package) so they read clearly in
 * the Keycloak admin UI. The Keycloak client mapper for the `preaa-staging`
 * client must expose `realm_access.roles` in the access token for these to
 * land in the NextAuth session.
 */
export const ROLES = {
  ADMIN: 'embedded-chat-admin',
  TENANT: 'embedded-chat-tenant',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export function hasRole(roles: string[] | undefined, role: Role): boolean {
  return Array.isArray(roles) && roles.includes(role);
}

export function isAdmin(roles: string[] | undefined): boolean {
  return hasRole(roles, ROLES.ADMIN);
}

/** Admins are implicitly tenants too (so they can see the tenant dashboard). */
export function isTenant(roles: string[] | undefined): boolean {
  return hasRole(roles, ROLES.TENANT) || hasRole(roles, ROLES.ADMIN);
}
