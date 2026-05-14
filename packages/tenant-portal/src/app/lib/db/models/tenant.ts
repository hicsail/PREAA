import { Schema, model, models, Model, Types } from 'mongoose';
import type { EncryptedValue } from '@/app/lib/services/crypto.service';

/**
 * One Tenant row per embedded-chat customer. Holds the mapping between the
 * Keycloak user (we key on `keycloak_user_id` = the sub claim) and the
 * resources we provisioned for them in Langflow, Langfuse, LiteLLM. Plus
 * the per-tenant embedded-chat widget config the tenant can self-edit.
 *
 * Lifecycle: rows start with status='pending' when the admin clicks
 * "Grant access". The provisioning saga (separate service, commit 9)
 * fills in the integration fields step-by-step, flipping status to
 * 'active' on success or 'failed' with details in `provisioning` on
 * partial failure. Tenants whose access has been revoked sit at
 * 'suspended'.
 *
 * Secrets at rest are encrypted with AES-256-GCM via CryptoService. The
 * Mongoose subdocument shape mirrors EncryptedValue from that service.
 */

export type TenantStatus = 'pending' | 'active' | 'failed' | 'suspended';

export interface ITenant {
  _id: Types.ObjectId;
  keycloak_user_id: string;
  email: string;
  display_name: string;
  status: TenantStatus;
  provisioning?: {
    step: string;
    error: string;
    at: Date;
  };

  langflow: {
    user_id?: string;
    flow_id?: string;
    endpoint_name?: string;
    api_key_encrypted?: EncryptedValue;
  };

  langfuse: {
    project_id?: string;
    public_key?: string; // pk-lf-..., safe to display unencrypted
    secret_key_encrypted?: EncryptedValue;
  };

  litellm: {
    virtual_key_id?: string;
    virtual_key_encrypted?: EncryptedValue;
    model_alias?: string;
    max_budget?: number;
    rpm_limit?: number;
  };

  embedded_chat: {
    theme_color: string;
    title: string;
    welcome_message: string;
    placeholder_text: string;
    allowed_origins: string[];
    daily_message_cap?: number;
  };

  created_at: Date;
  updated_at: Date;
  created_by: string;
}

const EncryptedValueSchema = new Schema<EncryptedValue>(
  {
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
    tag: { type: String, required: true },
  },
  { _id: false },
);

const TenantSchema = new Schema<ITenant>(
  {
    keycloak_user_id: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, index: true },
    display_name: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'active', 'failed', 'suspended'],
      default: 'pending',
      index: true,
    },
    provisioning: {
      type: new Schema(
        {
          step: { type: String, required: true },
          error: { type: String, required: true },
          at: { type: Date, required: true },
        },
        { _id: false },
      ),
      required: false,
    },

    langflow: {
      user_id: { type: String },
      flow_id: { type: String },
      endpoint_name: { type: String },
      api_key_encrypted: { type: EncryptedValueSchema, required: false },
    },

    langfuse: {
      project_id: { type: String },
      public_key: { type: String },
      secret_key_encrypted: { type: EncryptedValueSchema, required: false },
    },

    litellm: {
      virtual_key_id: { type: String },
      virtual_key_encrypted: { type: EncryptedValueSchema, required: false },
      model_alias: { type: String },
      max_budget: { type: Number },
      rpm_limit: { type: Number },
    },

    embedded_chat: {
      theme_color: { type: String, default: '#1f6feb' },
      title: { type: String, default: 'Chat' },
      welcome_message: {
        type: String,
        default: 'Hi! How can I help today?',
      },
      placeholder_text: { type: String, default: 'Type a message...' },
      allowed_origins: { type: [String], default: [] },
      daily_message_cap: { type: Number },
    },

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    created_by: { type: String, required: true },
  },
  {
    collection: 'tenants',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

/**
 * Default config for a new tenant's embedded chat. Centralized so the
 * provisioning saga and admin UI share one source of truth.
 */
export function defaultEmbeddedChatConfig(): ITenant['embedded_chat'] {
  return {
    theme_color: '#1f6feb',
    title: 'Chat',
    welcome_message: 'Hi! How can I help today?',
    placeholder_text: 'Type a message...',
    allowed_origins: [],
  };
}

// Avoid OverwriteModelError on Next.js HMR by reusing the cached model if
// Mongoose already compiled it.
export const Tenant: Model<ITenant> =
  (models.Tenant as Model<ITenant>) || model<ITenant>('Tenant', TenantSchema);
