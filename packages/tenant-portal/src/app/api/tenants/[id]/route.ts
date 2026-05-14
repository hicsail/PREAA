import { NextResponse } from 'next/server';
import {
  ApiError,
  apiHandler,
  requireAdmin,
  requireSession,
} from '@/app/lib/auth/api-guard';
import { getTenantService } from '@/app/lib/container';
import { isAdmin } from '@/app/lib/auth/roles';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tenants/[id] — fetch one tenant.
 * Admins can fetch any tenant; non-admin signed-in users can fetch only
 * their own (matched by Keycloak sub). 404 in both cases when not found
 * or not visible.
 */
export const GET = apiHandler(async (_req: Request, ctx: RouteContext) => {
  const session = await requireSession();
  const { id } = await ctx.params;

  const tenant = await getTenantService().get(id);
  if (!tenant) throw new ApiError(404, 'tenant not found');

  if (!isAdmin(session.realmRoles)) {
    // Non-admin: only their own row.
    if (tenant.keycloak_user_id !== session.user?.sub) {
      throw new ApiError(404, 'tenant not found');
    }
  }

  return NextResponse.json({ tenant });
});

/**
 * PATCH /api/tenants/[id] — partial update.
 *
 * Two distinct callers:
 *   1. Admin updating any tenant (e.g. flipping status, adjusting budget).
 *   2. The tenant themselves updating ONLY embedded_chat config from
 *      their dashboard.
 *
 * For caller (2) we whitelist embedded_chat fields and reject everything
 * else. Caller (1) can update anything in the patch shape.
 */
const TENANT_SELF_EDITABLE = new Set([
  'theme_color',
  'title',
  'welcome_message',
  'placeholder_text',
  'allowed_origins',
  'daily_message_cap',
]);

export const PATCH = apiHandler(async (req: Request, ctx: RouteContext) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const existing = await getTenantService().get(id);
  if (!existing) throw new ApiError(404, 'tenant not found');

  const admin = isAdmin(session.realmRoles);
  const owner = existing.keycloak_user_id === session.user?.sub;

  if (!admin && !owner) {
    throw new ApiError(404, 'tenant not found');
  }

  // Non-admin path: only embedded_chat subfields, only the whitelisted ones.
  if (!admin) {
    if (
      typeof body !== 'object' ||
      body === null ||
      Object.keys(body).length !== 1 ||
      !('embedded_chat' in body)
    ) {
      throw new ApiError(
        403,
        'tenant self-edit is limited to embedded_chat fields',
      );
    }
    const ec = body.embedded_chat as Record<string, unknown>;
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(ec)) {
      if (!TENANT_SELF_EDITABLE.has(k)) {
        throw new ApiError(403, `field embedded_chat.${k} is not self-editable`);
      }
      cleaned[k] = v;
    }
    const updated = await getTenantService().update(id, { embedded_chat: cleaned });
    return NextResponse.json({ tenant: updated });
  }

  // Admin path: pass the patch through. The service rejects unknown
  // top-level keys silently (it only iterates the known shape).
  const updated = await getTenantService().update(id, body as never);
  return NextResponse.json({ tenant: updated });
});

/**
 * DELETE /api/tenants/[id] — remove the tenant row.
 * Admin-only. Does NOT call out to Langflow/Langfuse/LiteLLM to deprovision
 * the upstream resources — that's a separate operation handled by the
 * suspension/teardown flow in a later commit. This just deletes our row.
 */
export const DELETE = apiHandler(async (_req: Request, ctx: RouteContext) => {
  await requireAdmin();
  const { id } = await ctx.params;

  const ok = await getTenantService().delete(id);
  if (!ok) throw new ApiError(404, 'tenant not found');

  return NextResponse.json({ deleted: true, id });
});
