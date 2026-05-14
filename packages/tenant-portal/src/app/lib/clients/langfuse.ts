import { injectable } from 'tsyringe';

/**
 * Wrapper around Langfuse's admin API for tenant provisioning.
 *
 * Auth model (Langfuse v3+ self-hosted):
 *   - Org-scoped admin API key in LANGFUSE_ADMIN_API_KEY (sent as
 *     Bearer). Created via Langfuse UI: Org settings → API Keys → new
 *     "organization-scoped" key with the `org-admin` scope.
 *   - LANGFUSE_ADMIN_ORG_ID identifies which org to create projects in.
 *     Same scope.
 *
 * Operations (mapped to Langfuse public API):
 *   - createProject  POST /api/public/projects
 *   - createApiKey   POST /api/public/projects/{id}/api-keys
 *   - deleteProject  DELETE /api/public/projects/{id}    (rollback)
 *
 * Note: Langfuse's admin/public API surface has shifted across major
 * versions. This client targets v3.x. If you see 404 on the endpoints,
 * check the running version against
 * https://api.reference.langfuse.com — paths sometimes move under
 * /api/public/organizations/{orgId}/... in newer builds.
 */

interface LangfuseConfig {
  baseUrl: string;
  adminApiKey: string;
  orgId: string;
}

function readConfig(): LangfuseConfig {
  const baseUrl = process.env.LANGFUSE_API_BASE;
  const adminApiKey = process.env.LANGFUSE_ADMIN_API_KEY;
  const orgId = process.env.LANGFUSE_ADMIN_ORG_ID;
  const missing: string[] = [];
  if (!baseUrl) missing.push('LANGFUSE_API_BASE');
  if (!adminApiKey) missing.push('LANGFUSE_ADMIN_API_KEY');
  if (!orgId) missing.push('LANGFUSE_ADMIN_ORG_ID');
  if (missing.length > 0) {
    throw new Error(`LangfuseClient: missing env vars: ${missing.join(', ')}`);
  }
  return {
    baseUrl: baseUrl!.replace(/\/$/, ''),
    adminApiKey: adminApiKey!,
    orgId: orgId!,
  };
}

export interface LangfuseProject {
  id: string;
  name: string;
}

export interface LangfuseApiKeyPair {
  public_key: string; // pk-lf-...
  secret_key: string; // sk-lf-...
  api_key_id: string;
}

@injectable()
export class LangfuseClient {
  private async adminFetch(
    path: string,
    init: RequestInit = {},
  ): Promise<Response> {
    const cfg = readConfig();
    return fetch(`${cfg.baseUrl}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${cfg.adminApiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create a Langfuse project in the configured org. The project name
   * should be tenant-unique; convention: `tenant-<slug>`.
   */
  async createProject(name: string): Promise<LangfuseProject> {
    const cfg = readConfig();
    const res = await this.adminFetch(
      `/api/public/organizations/${cfg.orgId}/projects`,
      {
        method: 'POST',
        body: JSON.stringify({ name }),
      },
    );
    if (!res.ok) {
      throw new Error(
        `LangfuseClient: createProject failed (HTTP ${res.status}): ${await res.text()}`,
      );
    }
    return (await res.json()) as LangfuseProject;
  }

  /**
   * Mint a public/secret API key pair scoped to a project. The pair is
   * what the tenant's LiteLLM-side telemetry hook uses to push traces to
   * their Langfuse project. The secret_key is returned ONCE here — store
   * it encrypted in our DB; we can't fetch it again later.
   */
  async createApiKey(projectId: string, note?: string): Promise<LangfuseApiKeyPair> {
    const res = await this.adminFetch(`/api/public/projects/${projectId}/api-keys`, {
      method: 'POST',
      body: JSON.stringify({ note: note ?? 'provisioned by tenant-portal' }),
    });
    if (!res.ok) {
      throw new Error(
        `LangfuseClient: createApiKey failed (HTTP ${res.status}): ${await res.text()}`,
      );
    }
    return (await res.json()) as LangfuseApiKeyPair;
  }

  /** Delete a project. Used during provisioning rollback. 404 swallowed. */
  async deleteProject(projectId: string): Promise<void> {
    const res = await this.adminFetch(`/api/public/projects/${projectId}`, {
      method: 'DELETE',
    });
    if (res.status === 404) return;
    if (!res.ok) {
      throw new Error(
        `LangfuseClient: deleteProject failed (HTTP ${res.status}): ${await res.text()}`,
      );
    }
  }
}
