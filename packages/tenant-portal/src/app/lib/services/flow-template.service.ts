import crypto from 'crypto';
import { injectable } from 'tsyringe';
import eceChatTemplate from './templates/ece-chat.json';

/**
 * Loads the ECE Chat flow JSON (committed at templates/ece-chat.json) and
 * customizes it for one tenant. Output is ready to POST to Langflow's
 * /api/v1/flows.
 *
 * What we change per-tenant:
 *   - top-level `id`: fresh UUID. Required — Langflow uses this as the
 *     flow's primary key, can't collide with the template's value or any
 *     other tenant's clone.
 *   - top-level `name` + `description` + `endpoint_name`: tenant-specific
 *     so admins can tell flows apart in the Langflow UI.
 *   - top-level `user_id`: the Langflow user we just created for this
 *     tenant. Makes the flow show up under their account, not the
 *     superuser's.
 *
 * What we BLANK per-tenant:
 *   - any node-level field marked `password: true` in its template
 *     metadata (the Langflow convention for a secret). Catches OpenAI
 *     keys, AstraDB tokens, etc. that the template author had inline.
 *     Tenants fill in their own credentials via the Langflow UI later.
 *
 * What we DON'T change:
 *   - node `id`s, even though some have random suffixes. Node IDs are
 *     flow-local; edges reference them by id. Regenerating them is risky
 *     (easy to break a wire) and unnecessary.
 *   - the actual graph topology / prompts / model choices. Those are
 *     what makes the template useful as a starting point.
 */

interface CloneInput {
  /** Display name (admin-visible). Convention: "<tenant slug> chat". */
  name: string;
  /** URL-safe endpoint identifier; appears as part of the flow's run URL
   * in Langflow. Convention: "<tenant-slug>-chat". */
  endpointName: string;
  /** Langflow user UUID (the tenant's Langflow account). */
  userId: string;
  /** Optional override for the description shown in the Langflow UI. */
  description?: string;
}

/** Shape of one node's template field. Langflow nodes have a
 * `data.node.template[<fieldName>]` object whose `password: true` flag
 * marks the field as a secret. */
interface NodeTemplateField {
  password?: boolean;
  value?: unknown;
  // ...plus many other Langflow-specific properties we don't touch
}

/** Subset of a node's shape we need to walk. */
interface NodeLike {
  data?: {
    node?: {
      template?: Record<string, NodeTemplateField>;
    };
  };
}

@injectable()
export class FlowTemplateService {
  /**
   * Clone the ECE Chat template for a specific tenant. Returns the
   * customized flow object ready to POST to Langflow's /api/v1/flows.
   */
  cloneEceChat(input: CloneInput): Record<string, unknown> {
    // Deep clone via JSON round-trip. The template is ~140 KB so this
    // is cheap (sub-millisecond) and avoids any shared-reference bugs
    // if multiple tenants get provisioned concurrently.
    const clone = JSON.parse(JSON.stringify(eceChatTemplate)) as Record<
      string,
      unknown
    >;

    // Top-level fields
    clone.id = crypto.randomUUID();
    clone.name = input.name;
    clone.endpoint_name = input.endpointName;
    clone.user_id = input.userId;
    if (input.description !== undefined) {
      clone.description = input.description;
    }

    // Walk every node and blank password fields. This is "best effort":
    // if the template's schema changes (e.g. Langflow renames `password`
    // → `is_secret` in a future version) we'll miss new secret fields.
    // The risk is asymmetric: blanking too aggressively = tenant just
    // has to re-enter a value; missing a secret = leaking a key. Keep
    // an eye on this when bumping Langflow versions.
    const data = clone.data as { nodes?: NodeLike[] } | undefined;
    const nodes = data?.nodes ?? [];
    let blanked = 0;
    for (const node of nodes) {
      const tmpl = node.data?.node?.template;
      if (!tmpl) continue;
      for (const fieldName of Object.keys(tmpl)) {
        const field = tmpl[fieldName];
        if (field && typeof field === 'object' && field.password === true) {
          field.value = '';
          blanked += 1;
        }
      }
    }
    // Stash the count on the cloned object so the saga can log it.
    // Non-standard field; Langflow ignores extra top-level keys on POST.
    (clone as Record<string, unknown>)._tenant_portal_blanked_secret_count = blanked;

    return clone;
  }
}
