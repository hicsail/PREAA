import { NextResponse } from 'next/server';
import { ApiError, apiHandler, requireAdmin } from '@/app/lib/auth/api-guard';
import { getTenantService } from '@/app/lib/container';

/**
 * GET /api/tenants — list all tenants (summary projection, no secrets).
 * Admin-only.
 */
export const GET = apiHandler(async () => {
  await requireAdmin();
  const tenants = await getTenantService().list();
  return NextResponse.json({ tenants });
});

/**
 * POST /api/tenants — create a new tenant row in 'pending' status.
 * Admin-only.
 *
 * In this commit, POST is just data-layer: it persists the row and
 * returns it. The provisioning saga (commit 9) will be responsible for
 * actually creating accounts in Langflow / Langfuse / LiteLLM and
 * flipping the row to 'active'. Callers should treat the response as
 * "tenant placeholder created" rather than "tenant fully provisioned".
 *
 * Body shape:
 *   {
 *     keycloak_user_id: string,    // Keycloak sub of the target user
 *     email:            string,
 *     display_name:     string,
 *     embedded_chat?:   { theme_color?, title?, welcome_message?, ... }
 *   }
 */
interface CreateBody {
  keycloak_user_id?: string;
  email?: string;
  display_name?: string;
  embedded_chat?: Record<string, unknown>;
}

export const POST = apiHandler(async (req: Request) => {
  const session = await requireAdmin();
  const body = (await req.json().catch(() => ({}))) as CreateBody;

  // Minimal validation. Real Zod/yup schema can come in commit 10 with
  // the admin UI form, since that's where input flows from.
  if (!body.keycloak_user_id || typeof body.keycloak_user_id !== 'string') {
    throw new ApiError(400, 'keycloak_user_id is required');
  }
  if (!body.email || typeof body.email !== 'string') {
    throw new ApiError(400, 'email is required');
  }
  if (!body.display_name || typeof body.display_name !== 'string') {
    throw new ApiError(400, 'display_name is required');
  }

  const tenant = await getTenantService().create(
    {
      keycloak_user_id: body.keycloak_user_id,
      email: body.email,
      display_name: body.display_name,
      embedded_chat: body.embedded_chat as never,
    },
    session.user?.sub ?? 'unknown',
  );

  return NextResponse.json(
    { tenant: { id: tenant._id.toString(), ...tenant } },
    { status: 201 },
  );
});
