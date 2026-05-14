/**
 * TypeScript shapes that mirror the Postgres `tenants` table. Hand-written
 * because we're not using an ORM that generates types. Keep in sync with
 * `migrations/0001_init.sql`.
 *
 * Encrypted values are serialized via CryptoService and stored inside the
 * JSONB integration columns (langflow.api_key_encrypted, etc.).
 */

export type TenantStatus = 'pending' | 'active' | 'failed' | 'suspended';

export interface EncryptedValue {
  ciphertext: string; // base64
  iv: string;         // base64
  tag: string;        // base64
}

export interface LangflowFields {
  user_id?: string;
  flow_id?: string;
  endpoint_name?: string;
  api_key_encrypted?: EncryptedValue;
}

export interface LangfuseFields {
  project_id?: string;
  public_key?: string; // pk-lf-..., safe to display unencrypted
  secret_key_encrypted?: EncryptedValue;
}

export interface LiteLLMFields {
  virtual_key_id?: string;
  virtual_key_encrypted?: EncryptedValue;
  model_alias?: string;
  max_budget?: number;
  rpm_limit?: number;
}

export interface EmbeddedChatFields {
  theme_color: string;
  title: string;
  welcome_message: string;
  placeholder_text: string;
  allowed_origins: string[];
  daily_message_cap?: number;
}

export interface ProvisioningFields {
  step: string;
  error: string;
  at: string; // ISO timestamp
}

/**
 * Shape of a row from SELECT * FROM tenants. Note: JSONB columns come
 * back as parsed objects by node-postgres (it ships a JSONB type parser
 * by default), so no manual JSON.parse needed.
 */
export interface TenantRow {
  id: string; // uuid
  keycloak_user_id: string;
  email: string;
  display_name: string;
  status: TenantStatus;
  provisioning: ProvisioningFields | null;
  langflow: LangflowFields;
  langfuse: LangfuseFields;
  litellm: LiteLLMFields;
  embedded_chat: EmbeddedChatFields;
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

export function defaultEmbeddedChatConfig(): EmbeddedChatFields {
  return {
    theme_color: '#1f6feb',
    title: 'Chat',
    welcome_message: 'Hi! How can I help today?',
    placeholder_text: 'Type a message...',
    allowed_origins: [],
  };
}
