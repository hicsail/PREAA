import { NextResponse } from 'next/server';
import { ApiError, apiHandler, requireAdmin } from '@/app/lib/auth/api-guard';
import { container } from '@/app/lib/container';
import { ProvisioningService } from '@/app/lib/services/provisioning.service';

/**
 * POST /api/tenants/provision — admin-only entry point for the full
 * provisioning saga. Creates accounts in Keycloak / Langflow / Langfuse /
 * LiteLLM, clones the ECE Chat flow, persists everything to the Tenant
 * row, and marks it 'active'.
 *
 * Idempotent on the same (email, slug) input: a retry resumes from the
 * first incomplete step.
 *
 * Body shape:
 *   {
 *     email:        string,   // becomes Keycloak username + email
 *     display_name: string,   // human-readable; "First Last"
 *     slug:         string,   // url-safe, unique across tenants;
 *                              // used for langflow username, langflow
 *                              // endpoint_name, langfuse project,
 *                              // litellm key alias
 *     max_budget?:  number,   // USD lifetime cap on the LiteLLM key
 *     rpm_limit?:   number,
 *     tpm_limit?:   number,
 *   }
 *
 * Synchronous: the request doesn't return until the saga completes (or
 * fails). For tenants with slow upstream APIs this may take 5-15 seconds.
 * Future: move to a job queue + status polling if this becomes a problem.
 */
interface ProvisionBody {
  email?: string;
  display_name?: string;
  slug?: string;
  max_budget?: number;
  rpm_limit?: number;
  tpm_limit?: number;
}

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

export const POST = apiHandler(async (req: Request) => {
  const session = await requireAdmin();
  const body = (await req.json().catch(() => ({}))) as ProvisionBody;

  if (!body.email || typeof body.email !== 'string') {
    throw new ApiError(400, 'email is required');
  }
  if (!body.display_name || typeof body.display_name !== 'string') {
    throw new ApiError(400, 'display_name is required');
  }
  if (!body.slug || typeof body.slug !== 'string') {
    throw new ApiError(400, 'slug is required');
  }
  if (!SLUG_RE.test(body.slug)) {
    throw new ApiError(
      400,
      'slug must be 1-40 chars, lowercase alphanumeric + hyphens, starting and ending with alphanumeric',
    );
  }

  const provisioning = container.resolve(ProvisioningService);
  try {
    const tenant = await provisioning.provision(
      {
        email: body.email,
        display_name: body.display_name,
        slug: body.slug,
        max_budget: body.max_budget,
        rpm_limit: body.rpm_limit,
        tpm_limit: body.tpm_limit,
      },
      session.user?.sub ?? 'unknown',
    );
    return NextResponse.json({ tenant }, { status: 201 });
  } catch (e) {
    // Surface the underlying error message but keep status 500 so the
    // admin UI knows something blew up. The Tenant row will have the
    // failed step + error persisted by ProvisioningService.
    const msg = e instanceof Error ? e.message : String(e);
    throw new ApiError(500, `provisioning failed: ${msg}`);
  }
});
