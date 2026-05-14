import { injectable } from 'tsyringe';

/**
 * Wrapper around LiteLLM's admin API for tenant provisioning.
 *
 * LiteLLM exposes a master-key-protected admin surface for managing
 * "virtual keys" -- proxy-side tokens that map to underlying LLM
 * provider keys, with per-key budgets and rate limits. Each tenant gets
 * one virtual key scoped to the LiteLLM models they're allowed to call
 * (typically just their own Langflow flow as a model alias).
 *
 * Endpoints used:
 *   - POST /key/generate     create a virtual key, returns {key, key_name}
 *   - POST /key/delete       delete a virtual key by id (rollback)
 *   - GET  /key/info         lookup (used for status checks)
 *
 * Auth: bearer LITELLM_MASTER_KEY (the same master key end users use).
 */

interface LiteLLMConfig {
  baseUrl: string;
  masterKey: string;
}

function readConfig(): LiteLLMConfig {
  const baseUrl = process.env.LITELLM_API_BASE;
  const masterKey = process.env.LITELLM_MASTER_KEY;
  const missing: string[] = [];
  if (!baseUrl) missing.push('LITELLM_API_BASE');
  if (!masterKey) missing.push('LITELLM_MASTER_KEY');
  if (missing.length > 0) {
    throw new Error(`LiteLLMClient: missing env vars: ${missing.join(', ')}`);
  }
  return { baseUrl: baseUrl!.replace(/\/$/, ''), masterKey: masterKey! };
}

export interface CreateVirtualKeyInput {
  /** Human-readable label for this key, e.g. "tenant-acme-corp". Shows up
   * in LiteLLM's spend dashboards so admins can see per-tenant usage. */
  key_alias: string;

  /** LiteLLM model_name values this key is permitted to call. Empty array
   * = all models the LiteLLM proxy knows about, which is rarely what we
   * want -- always pass at least the tenant's flow alias. */
  models: string[];

  /** Hard spend cap in USD over the key's lifetime. Optional. */
  max_budget?: number;

  /** Requests per minute. Optional. */
  rpm_limit?: number;

  /** Tokens per minute. Optional. */
  tpm_limit?: number;

  /** Optional metadata blob LiteLLM stores alongside the key. We use it
   * to record the tenant id so support can correlate spend back to a
   * tenant row in our DB. */
  metadata?: Record<string, unknown>;
}

export interface VirtualKey {
  /** The actual sk-... value the tenant uses to call LiteLLM. Returned
   * once at create time only -- store encrypted in our DB. */
  key: string;
  /** LiteLLM's internal id used in subsequent /key/delete + /key/info
   * calls. Often the same as `key` but treat as opaque. */
  key_name?: string;
  /** Echoed back from input. */
  models?: string[];
  max_budget?: number;
  rpm_limit?: number;
  tpm_limit?: number;
}

@injectable()
export class LiteLLMClient {
  private async adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const cfg = readConfig();
    return fetch(`${cfg.baseUrl}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${cfg.masterKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Generate a new virtual key. The returned `key` is the secret the
   * tenant uses; store it encrypted. The `key_name` (LiteLLM's internal
   * id) is what we use for subsequent delete/info calls -- but in many
   * LiteLLM builds the two are the same string, so default to `key` if
   * key_name is absent.
   */
  async createVirtualKey(input: CreateVirtualKeyInput): Promise<VirtualKey> {
    const res = await this.adminFetch('/key/generate', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      throw new Error(
        `LiteLLMClient: createVirtualKey failed (HTTP ${res.status}): ${await res.text()}`,
      );
    }
    return (await res.json()) as VirtualKey;
  }

  /**
   * Delete a virtual key. Used both for revocation and provisioning
   * rollback. 404 is swallowed.
   */
  async deleteVirtualKey(keyOrId: string): Promise<void> {
    const res = await this.adminFetch('/key/delete', {
      method: 'POST',
      body: JSON.stringify({ keys: [keyOrId] }),
    });
    if (res.status === 404) return;
    if (!res.ok) {
      throw new Error(
        `LiteLLMClient: deleteVirtualKey failed (HTTP ${res.status}): ${await res.text()}`,
      );
    }
  }

  /**
   * Get a virtual key's current status (spend so far, limits, etc.).
   * Used by the tenant dashboard to show usage; the provisioning saga
   * doesn't call this directly.
   */
  async getKeyInfo(keyOrId: string): Promise<unknown> {
    const url = `/key/info?key=${encodeURIComponent(keyOrId)}`;
    const res = await this.adminFetch(url);
    if (!res.ok) {
      throw new Error(
        `LiteLLMClient: getKeyInfo failed (HTTP ${res.status}): ${await res.text()}`,
      );
    }
    return res.json();
  }
}
