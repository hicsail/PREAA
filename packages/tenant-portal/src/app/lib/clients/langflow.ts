import { injectable } from 'tsyringe';

/**
 * Wrapper around Langflow's admin API for tenant provisioning. Uses two
 * different auth pathways depending on the operation:
 *
 *   - Admin operations (createUser, deleteUser, createFlow, deleteFlow):
 *     authenticate with the long-lived service-account API key in
 *     LANGFLOW_ADMIN_API_KEY (header: x-api-key).
 *
 *   - Per-user operations (createApiKeyAs): no admin shortcut exists in
 *     Langflow's REST surface; the /api/v1/api_key endpoint creates a key
 *     for the *authenticated* user. So we log in as the target user with
 *     the password we just set, capture the JWT, then call the key-create
 *     endpoint with that bearer.
 *
 * Base URL comes from LANGFLOW_API_BASE (e.g. http://langflow:7860 inside
 * docker, https://langflow-preaa-staging.sail.codes from outside).
 */

interface LangflowConfig {
  baseUrl: string;
  adminApiKey: string;
}

function readConfig(): LangflowConfig {
  const baseUrl = process.env.LANGFLOW_API_BASE;
  const adminApiKey = process.env.LANGFLOW_ADMIN_API_KEY;
  const missing: string[] = [];
  if (!baseUrl) missing.push('LANGFLOW_API_BASE');
  if (!adminApiKey) missing.push('LANGFLOW_ADMIN_API_KEY');
  if (missing.length > 0) {
    throw new Error(`LangflowClient: missing env vars: ${missing.join(', ')}`);
  }
  return { baseUrl: baseUrl!.replace(/\/$/, ''), adminApiKey: adminApiKey! };
}

export interface CreateLangflowUserInput {
  username: string;
  password: string;
  isSuperuser?: boolean;
}

export interface LangflowUser {
  id: string;
  username: string;
  is_active: boolean;
  is_superuser: boolean;
}

export interface LangflowFlow {
  id: string;
  name: string;
  endpoint_name: string | null;
  user_id: string | null;
}

@injectable()
export class LangflowClient {
  private async adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const cfg = readConfig();
    return fetch(`${cfg.baseUrl}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        'x-api-key': cfg.adminApiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create a Langflow user. Returns the new user's UUID + username. The
   * caller is expected to have set is_superuser=false (per design — we
   * never want tenants to be Langflow admins).
   */
  async createUser(input: CreateLangflowUserInput): Promise<LangflowUser> {
    const res = await this.adminFetch('/api/v1/users/', {
      method: 'POST',
      body: JSON.stringify({
        username: input.username,
        password: input.password,
        is_superuser: input.isSuperuser ?? false,
        is_active: true,
      }),
    });
    if (!res.ok) {
      throw new Error(
        `LangflowClient: createUser failed (HTTP ${res.status}): ${await res.text()}`,
      );
    }
    return (await res.json()) as LangflowUser;
  }

  /** Delete a Langflow user. 404 swallowed. */
  async deleteUser(userId: string): Promise<void> {
    const res = await this.adminFetch(`/api/v1/users/${userId}`, { method: 'DELETE' });
    if (res.status === 404) return;
    if (!res.ok) {
      throw new Error(
        `LangflowClient: deleteUser failed (HTTP ${res.status}): ${await res.text()}`,
      );
    }
  }

  /**
   * Create a flow from a flow-export JSON (the shape Langflow's UI exports
   * via "Export Flow" + the same shape used internally by /api/v1/flows).
   * The caller should have already templated the JSON for this specific
   * tenant: regenerated the top-level id, set endpoint_name to something
   * unique per tenant, blanked out any embedded API keys, etc.
   */
  async createFlow(
    flow: Record<string, unknown>,
  ): Promise<LangflowFlow> {
    const res = await this.adminFetch('/api/v1/flows/', {
      method: 'POST',
      body: JSON.stringify(flow),
    });
    if (!res.ok) {
      throw new Error(
        `LangflowClient: createFlow failed (HTTP ${res.status}): ${await res.text()}`,
      );
    }
    return (await res.json()) as LangflowFlow;
  }

  /** Delete a flow. 404 swallowed. */
  async deleteFlow(flowId: string): Promise<void> {
    const res = await this.adminFetch(`/api/v1/flows/${flowId}`, { method: 'DELETE' });
    if (res.status === 404) return;
    if (!res.ok) {
      throw new Error(
        `LangflowClient: deleteFlow failed (HTTP ${res.status}): ${await res.text()}`,
      );
    }
  }

  /**
   * Create an API key on behalf of a specific (non-admin) Langflow user.
   *
   * Langflow's /api/v1/api_key creates a key for the authenticated caller.
   * To create one for the new tenant user without making them log in
   * themselves, we log in here using the password we just set, capture
   * the JWT, then call api_key with that bearer.
   *
   * The login + key-create is two round trips; cheap enough for the
   * once-per-tenant provisioning path.
   */
  async createApiKeyAs(
    username: string,
    password: string,
    keyName: string,
  ): Promise<string> {
    const cfg = readConfig();

    // 1. Login as the user.
    const loginRes = await fetch(`${cfg.baseUrl}/api/v1/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username, password }),
    });
    if (!loginRes.ok) {
      throw new Error(
        `LangflowClient: login as ${username} failed (HTTP ${loginRes.status})`,
      );
    }
    const { access_token } = (await loginRes.json()) as { access_token: string };

    // 2. Create an API key under their session.
    const keyRes = await fetch(`${cfg.baseUrl}/api/v1/api_key/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: keyName }),
    });
    if (!keyRes.ok) {
      throw new Error(
        `LangflowClient: createApiKey for ${username} failed (HTTP ${keyRes.status}): ${await keyRes.text()}`,
      );
    }
    const { api_key } = (await keyRes.json()) as { api_key: string };
    return api_key;
  }
}
