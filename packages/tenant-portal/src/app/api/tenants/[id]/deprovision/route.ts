import { NextResponse } from 'next/server';
import { ApiError, apiHandler, requireAdmin } from '@/app/lib/auth/api-guard';
import { container } from '@/app/lib/container';
import { ProvisioningService } from '@/app/lib/services/provisioning.service';

/**
 * POST /api/tenants/[id]/deprovision — admin-only. Tears down all four
 * upstream systems for this tenant + deletes the Tenant row.
 *
 * Best-effort: errors from individual upstream calls are collected and
 * returned; the cleanup keeps going past failures. The caller is
 * expected to surface the errors so an admin can mop up by hand.
 *
 * Distinct from DELETE /api/tenants/[id], which only removes the row
 * in our DB without touching Keycloak / Langflow / Langfuse / LiteLLM.
 * Use DELETE for "I'm just cleaning up a misprovisioned row that
 * doesn't have any upstream resources to delete"; use this endpoint
 * when the tenant was actually provisioned and you want to clean up
 * everything.
 */

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const POST = apiHandler(async (_req: Request, ctx: RouteContext) => {
  await requireAdmin();
  const { id } = await ctx.params;

  const provisioning = container.resolve(ProvisioningService);
  const result = await provisioning.deprovision(id);

  if (result.errors.length === 0) {
    return NextResponse.json({ deprovisioned: true, id, errors: [] });
  }

  // Partial cleanup -- return 207-ish semantics in a 200. Frontend
  // shows the errors list. We avoid 500 here because the operation
  // *partially succeeded* and the caller may want to retry just the
  // failed sub-steps. Status 200 with errors[] is the honest signal.
  return NextResponse.json(
    { deprovisioned: false, id, errors: result.errors },
    { status: 200 },
  );
});

/**
 * 404 for plain DELETE to make the distinction with /api/tenants/[id]
 * clearer in the UI: deprovision is its own verb.
 */
export const GET = apiHandler(async () => {
  throw new ApiError(405, 'use POST');
});
