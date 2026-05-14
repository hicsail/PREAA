import { injectable } from 'tsyringe';

/**
 * Thin wrapper around the Keycloak admin REST API for the operations the
 * provisioning saga needs:
 *   - createUser           POST /admin/realms/{realm}/users
 *   - setPassword          PUT  /admin/realms/{realm}/users/{id}/reset-password
 *   - assignRealmRole      POST /admin/realms/{realm}/users/{id}/role-mappings/realm
 *   - deleteUser           DEL  /admin/realms/{realm}/users/{id}  (rollback)
 *
 * Authenticates via client-credentials grant against the
 * `tenant-portal-admin` client (created out-of-band; has the
 * realm-management roles `manage-users`, `view-users`, `query-users`,
 * `manage-clients`, `view-clients`, `manage-realm`, `view-realm`).
 *
 * Tokens are cached in-memory for their reported lifetime minus 30s of
 * slack so we don't burn round-trips re-authing on every call inside the
 * same provisioning sequence.
 */

interface CachedToken {
  value: string;
  expiresAtMs: number;
}

interface KeycloakConfig {
  baseUrl: string;        // e.g. https://damplab-keycloak.sail.codes
  realm: string;          // e.g. preaa
  adminClientId: string;  // e.g. tenant-portal-admin
  adminClientSecret: string;
}

function readConfig(): KeycloakConfig {
  const baseUrl = process.env.KEYCLOAK_URL;
  const realm = process.env.KEYCLOAK_REALM;
  const adminClientId = process.env.KEYCLOAK_ADMIN_CLIENT_ID;
  const adminClientSecret = process.env.KEYCLOAK_ADMIN_CLIENT_SECRET;
  const missing: string[] = [];
  if (!baseUrl) missing.push('KEYCLOAK_URL');
  if (!realm) missing.push('KEYCLOAK_REALM');
  if (!adminClientId) missing.push('KEYCLOAK_ADMIN_CLIENT_ID');
  if (!adminClientSecret) missing.push('KEYCLOAK_ADMIN_CLIENT_SECRET');
  if (missing.length > 0) {
    throw new Error(
      `KeycloakAdminClient: missing env vars: ${missing.join(', ')}`,
    );
  }
  return { baseUrl: baseUrl!, realm: realm!, adminClientId: adminClientId!, adminClientSecret: adminClientSecret! };
}

export interface CreateUserInput {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  emailVerified?: boolean;
  /** If provided, set as a non-temporary password. Otherwise the user is
   * created without credentials and an admin can trigger a reset email. */
  password?: string;
}

export interface RealmRoleRef {
  id: string;
  name: string;
}

@injectable()
export class KeycloakAdminClient {
  private cachedToken: CachedToken | null = null;

  private async getToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && this.cachedToken.expiresAtMs > now + 30_000) {
      return this.cachedToken.value;
    }
    const cfg = readConfig();
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: cfg.adminClientId,
      client_secret: cfg.adminClientSecret,
    });
    const res = await fetch(
      `${cfg.baseUrl}/realms/${cfg.realm}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      },
    );
    if (!res.ok) {
      throw new Error(
        `KeycloakAdminClient: token grant failed (HTTP ${res.status}): ${await res.text()}`,
      );
    }
    const json = (await res.json()) as { access_token: string; expires_in: number };
    this.cachedToken = {
      value: json.access_token,
      expiresAtMs: now + json.expires_in * 1000,
    };
    return json.access_token;
  }

  private async adminFetch(
    pathFromRealm: string,
    init: RequestInit = {},
  ): Promise<Response> {
    const cfg = readConfig();
    const token = await this.getToken();
    return fetch(`${cfg.baseUrl}/admin/realms/${cfg.realm}${pathFromRealm}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * Create a user and return its Keycloak UUID. Throws on 409
   * (user already exists) with a precise message.
   *
   * If `password` is provided, it's set as a non-temporary credential
   * in a second PUT call (Keycloak doesn't honor credentials in the
   * initial POST consistently).
   */
  async createUser(input: CreateUserInput): Promise<string> {
    const res = await this.adminFetch('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: input.username,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        emailVerified: input.emailVerified ?? true,
        enabled: true,
      }),
    });
    if (res.status === 409) {
      throw new Error(
        `KeycloakAdminClient: user already exists (username=${input.username})`,
      );
    }
    if (!res.ok) {
      throw new Error(
        `KeycloakAdminClient: createUser failed (HTTP ${res.status}): ${await res.text()}`,
      );
    }
    // Keycloak returns the new user's UUID in the Location header.
    const location = res.headers.get('location');
    if (!location) {
      throw new Error('KeycloakAdminClient: createUser missing Location header');
    }
    const id = location.split('/').pop();
    if (!id) {
      throw new Error(
        `KeycloakAdminClient: createUser unparseable Location: ${location}`,
      );
    }
    if (input.password) {
      await this.setPassword(id, input.password);
    }
    return id;
  }

  /**
   * Set a password for an existing user. `temporary: false` so the user
   * doesn't have to reset on first login.
   */
  async setPassword(userId: string, password: string): Promise<void> {
    const res = await this.adminFetch(`/users/${userId}/reset-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'password', value: password, temporary: false }),
    });
    if (!res.ok) {
      throw new Error(
        `KeycloakAdminClient: setPassword failed (HTTP ${res.status}): ${await res.text()}`,
      );
    }
  }

  /**
   * Look up a realm role by name; returns the {id, name} ref needed for
   * role-mapping. Throws if not found.
   */
  async getRealmRole(name: string): Promise<RealmRoleRef> {
    const res = await this.adminFetch(`/roles/${encodeURIComponent(name)}`);
    if (!res.ok) {
      throw new Error(
        `KeycloakAdminClient: getRealmRole(${name}) failed (HTTP ${res.status})`,
      );
    }
    const json = (await res.json()) as { id: string; name: string };
    return { id: json.id, name: json.name };
  }

  /**
   * Assign one or more realm roles to a user. Pass refs returned by
   * getRealmRole(). Idempotent on the Keycloak side.
   */
  async assignRealmRoles(userId: string, roles: RealmRoleRef[]): Promise<void> {
    if (roles.length === 0) return;
    const res = await this.adminFetch(`/users/${userId}/role-mappings/realm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roles),
    });
    if (!res.ok) {
      throw new Error(
        `KeycloakAdminClient: assignRealmRoles failed (HTTP ${res.status}): ${await res.text()}`,
      );
    }
  }

  /**
   * Convenience: look up `embedded-chat-tenant` role and assign it.
   * The most common operation during tenant provisioning, so worth a
   * one-liner.
   */
  async assignTenantRole(userId: string): Promise<void> {
    const role = await this.getRealmRole('embedded-chat-tenant');
    await this.assignRealmRoles(userId, [role]);
  }

  /**
   * Delete a user. Used during provisioning rollback.
   * 404 is swallowed (already gone is success).
   */
  async deleteUser(userId: string): Promise<void> {
    const res = await this.adminFetch(`/users/${userId}`, { method: 'DELETE' });
    if (res.status === 404) return;
    if (!res.ok) {
      throw new Error(
        `KeycloakAdminClient: deleteUser failed (HTTP ${res.status}): ${await res.text()}`,
      );
    }
  }
}
