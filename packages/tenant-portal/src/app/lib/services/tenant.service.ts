import { injectable } from 'tsyringe';
import { getMongo } from '@/app/lib/db/mongo';
import {
  Tenant,
  ITenant,
  TenantStatus,
  defaultEmbeddedChatConfig,
} from '@/app/lib/db/models/tenant';

/**
 * Input for creating a tenant via the admin "Grant Access" flow. The
 * caller supplies the Keycloak user id + email + display name; the
 * service initializes the row with status='pending' and default
 * embedded-chat config. Integration fields (langflow, langfuse, litellm)
 * are populated later by the provisioning saga via update().
 */
export interface CreateTenantInput {
  keycloak_user_id: string;
  email: string;
  display_name: string;
  embedded_chat?: Partial<ITenant['embedded_chat']>;
}

/**
 * Patch shape for updates. All fields optional; nested objects (langflow
 * etc.) get merged onto the existing document via dot-paths so a saga
 * step that only knows the langflow_user_id can update just that.
 */
export type TenantPatch = Partial<{
  status: TenantStatus;
  provisioning: ITenant['provisioning'] | null;
  langflow: Partial<ITenant['langflow']>;
  langfuse: Partial<ITenant['langfuse']>;
  litellm: Partial<ITenant['litellm']>;
  embedded_chat: Partial<ITenant['embedded_chat']>;
  display_name: string;
  email: string;
}>;

/**
 * Summary projection for the admin tenants list — no encrypted blobs.
 */
export interface TenantSummary {
  id: string;
  keycloak_user_id: string;
  email: string;
  display_name: string;
  status: TenantStatus;
  has_langflow: boolean;
  has_langfuse: boolean;
  has_litellm: boolean;
  created_at: Date;
  updated_at: Date;
}

function toSummary(t: ITenant): TenantSummary {
  return {
    id: t._id.toString(),
    keycloak_user_id: t.keycloak_user_id,
    email: t.email,
    display_name: t.display_name,
    status: t.status,
    has_langflow: !!t.langflow?.user_id,
    has_langfuse: !!t.langfuse?.project_id,
    has_litellm: !!t.litellm?.virtual_key_id,
    created_at: t.created_at,
    updated_at: t.updated_at,
  };
}

@injectable()
export class TenantService {
  private async db() {
    await getMongo();
  }

  async list(): Promise<TenantSummary[]> {
    await this.db();
    const tenants = await Tenant.find().sort({ created_at: -1 }).lean();
    return tenants.map((t) => toSummary(t as unknown as ITenant));
  }

  async get(id: string): Promise<ITenant | null> {
    await this.db();
    return Tenant.findById(id).lean<ITenant>();
  }

  async findByKeycloakSub(sub: string): Promise<ITenant | null> {
    await this.db();
    return Tenant.findOne({ keycloak_user_id: sub }).lean<ITenant>();
  }

  async create(input: CreateTenantInput, createdBy: string): Promise<ITenant> {
    await this.db();
    // Guard against double-provisioning the same Keycloak user.
    const existing = await Tenant.findOne({ keycloak_user_id: input.keycloak_user_id });
    if (existing) {
      throw new Error(
        `Tenant for Keycloak user ${input.keycloak_user_id} already exists (id ${existing._id}).`,
      );
    }
    const tenant = await Tenant.create({
      keycloak_user_id: input.keycloak_user_id,
      email: input.email,
      display_name: input.display_name,
      status: 'pending',
      embedded_chat: { ...defaultEmbeddedChatConfig(), ...input.embedded_chat },
      langflow: {},
      langfuse: {},
      litellm: {},
      created_by: createdBy,
    });
    return tenant.toObject();
  }

  async update(id: string, patch: TenantPatch): Promise<ITenant | null> {
    await this.db();
    // Build $set with dot-paths for nested fields so partial nested
    // updates don't clobber sibling subfields. Mongoose's default behavior
    // when you pass `{ langflow: { user_id: 'x' } }` is to replace the
    // whole `langflow` subdocument; the dot-path approach merges instead.
    const set: Record<string, unknown> = {};
    const unset: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) continue;
      if (k === 'provisioning' && v === null) {
        unset.provisioning = '';
        continue;
      }
      if (
        v !== null &&
        typeof v === 'object' &&
        !Array.isArray(v) &&
        !(v instanceof Date)
      ) {
        for (const [nk, nv] of Object.entries(v)) {
          if (nv !== undefined) set[`${k}.${nk}`] = nv;
        }
      } else {
        set[k] = v;
      }
    }
    const updateDoc: Record<string, unknown> = {};
    if (Object.keys(set).length > 0) updateDoc.$set = set;
    if (Object.keys(unset).length > 0) updateDoc.$unset = unset;
    if (Object.keys(updateDoc).length === 0) {
      // Nothing to update; just fetch and return.
      return Tenant.findById(id).lean<ITenant>();
    }
    return Tenant.findByIdAndUpdate(id, updateDoc, { new: true }).lean<ITenant>();
  }

  async delete(id: string): Promise<boolean> {
    await this.db();
    const res = await Tenant.findByIdAndDelete(id);
    return res !== null;
  }
}
