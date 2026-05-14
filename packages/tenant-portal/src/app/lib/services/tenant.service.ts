import { injectable } from 'tsyringe';
import { ensureSchema, getPool } from '@/app/lib/db/pg';
import {
  defaultEmbeddedChatConfig,
  EmbeddedChatFields,
  LangflowFields,
  LangfuseFields,
  LiteLLMFields,
  ProvisioningFields,
  TenantRow,
  TenantStatus,
} from '@/app/lib/db/types';

/**
 * Input for creating a tenant placeholder row. Provisioning saga fills in
 * langflow/langfuse/litellm via update() after this returns.
 */
export interface CreateTenantInput {
  keycloak_user_id: string;
  email: string;
  display_name: string;
  embedded_chat?: Partial<EmbeddedChatFields>;
}

/**
 * Partial patch shape. Each top-level integration field is JSONB on the
 * Postgres side and gets merged with `||` (jsonb concatenation), which is
 * a TOP-LEVEL merge -- existing sibling keys preserved, only the keys
 * present in the patch are overwritten. That's exactly what the
 * provisioning saga needs (a step that sets just langflow.user_id won't
 * blow away a langflow.flow_id set by a later step).
 *
 * Note: the encrypted blobs (api_key_encrypted etc.) are leaf objects, so
 * a patch like `{langflow: {api_key_encrypted: {ciphertext, iv, tag}}}`
 * replaces the whole encrypted value -- which is correct (we never want
 * to merge into half of an encrypted value).
 *
 * Pass `provisioning: null` to clear the provisioning column.
 */
export type TenantPatch = Partial<{
  status: TenantStatus;
  provisioning: ProvisioningFields | null;
  langflow: Partial<LangflowFields>;
  langfuse: Partial<LangfuseFields>;
  litellm: Partial<LiteLLMFields>;
  embedded_chat: Partial<EmbeddedChatFields>;
  display_name: string;
  email: string;
}>;

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

function toSummary(t: TenantRow): TenantSummary {
  return {
    id: t.id,
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
  private async ready() {
    // Make sure the schema is in place before any query. Idempotent + gated
    // by a global flag so this is a one-time cost per process.
    await ensureSchema();
  }

  async list(): Promise<TenantSummary[]> {
    await this.ready();
    const { rows } = await getPool().query<TenantRow>(
      `SELECT * FROM tenants ORDER BY created_at DESC`,
    );
    return rows.map(toSummary);
  }

  async get(id: string): Promise<TenantRow | null> {
    await this.ready();
    const { rows } = await getPool().query<TenantRow>(
      `SELECT * FROM tenants WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async findByKeycloakSub(sub: string): Promise<TenantRow | null> {
    await this.ready();
    const { rows } = await getPool().query<TenantRow>(
      `SELECT * FROM tenants WHERE keycloak_user_id = $1`,
      [sub],
    );
    return rows[0] ?? null;
  }

  async create(
    input: CreateTenantInput,
    createdBy: string,
  ): Promise<TenantRow> {
    await this.ready();
    const embedded = { ...defaultEmbeddedChatConfig(), ...input.embedded_chat };
    try {
      const { rows } = await getPool().query<TenantRow>(
        `INSERT INTO tenants
           (keycloak_user_id, email, display_name, status, embedded_chat, created_by)
         VALUES ($1, $2, $3, 'pending', $4::jsonb, $5)
         RETURNING *`,
        [
          input.keycloak_user_id,
          input.email,
          input.display_name,
          JSON.stringify(embedded),
          createdBy,
        ],
      );
      return rows[0];
    } catch (e: unknown) {
      // 23505 = unique_violation; only constraint here is the keycloak_user_id
      // uniqueness, so we can give a precise message back.
      if (
        typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        (e as { code: string }).code === '23505'
      ) {
        throw new Error(
          `Tenant for Keycloak user ${input.keycloak_user_id} already exists.`,
        );
      }
      throw e;
    }
  }

  async update(id: string, patch: TenantPatch): Promise<TenantRow | null> {
    await this.ready();

    // Build SET clauses dynamically. Top-level scalar columns use `= $n`;
    // JSONB columns use `= column || $n::jsonb` for top-level merge.
    // Provisioning explicitly set to null clears the column.
    const sets: string[] = [];
    const values: unknown[] = [];

    const push = (sql: string, value: unknown) => {
      values.push(value);
      sets.push(sql.replace('$?', `$${values.length}`));
    };

    if (patch.status !== undefined) {
      push(`status = $?`, patch.status);
    }
    if (patch.display_name !== undefined) {
      push(`display_name = $?`, patch.display_name);
    }
    if (patch.email !== undefined) {
      push(`email = $?`, patch.email);
    }
    if (patch.provisioning === null) {
      // Explicit null = clear.
      sets.push(`provisioning = NULL`);
    } else if (patch.provisioning !== undefined) {
      push(`provisioning = $?::jsonb`, JSON.stringify(patch.provisioning));
    }
    const mergeJsonb = (col: keyof TenantPatch, val: unknown) => {
      push(`${col} = ${col} || $?::jsonb`, JSON.stringify(val));
    };
    if (patch.langflow !== undefined) mergeJsonb('langflow', patch.langflow);
    if (patch.langfuse !== undefined) mergeJsonb('langfuse', patch.langfuse);
    if (patch.litellm !== undefined) mergeJsonb('litellm', patch.litellm);
    if (patch.embedded_chat !== undefined) {
      mergeJsonb('embedded_chat', patch.embedded_chat);
    }

    if (sets.length === 0) {
      // Nothing to update; return current row.
      return this.get(id);
    }

    values.push(id);
    const { rows } = await getPool().query<TenantRow>(
      `UPDATE tenants SET ${sets.join(', ')}
       WHERE id = $${values.length}
       RETURNING *`,
      values,
    );
    return rows[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    await this.ready();
    const { rowCount } = await getPool().query(
      `DELETE FROM tenants WHERE id = $1`,
      [id],
    );
    return (rowCount ?? 0) > 0;
  }
}
