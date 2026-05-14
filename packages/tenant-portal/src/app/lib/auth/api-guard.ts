import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from './config';
import { isAdmin } from './roles';

/**
 * API-route helpers for auth + structured error responses.
 *
 * Pages are guarded by src/middleware.ts (cookie-based, edge runtime).
 * API routes need their own guard because next-auth middleware doesn't
 * cover /api/* by default — and we'd rather not redirect API callers, we
 * want them to get a clean 401/403 JSON.
 *
 * Usage:
 *
 *   export const GET = apiHandler(async () => {
 *     const session = await requireAdmin();
 *     // ...
 *     return NextResponse.json({...});
 *   });
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    public reason: string,
  ) {
    super(reason);
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getServerSession(authOptions);
  if (!session) throw new ApiError(401, 'not signed in');
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();
  if (!isAdmin(session.realmRoles)) {
    throw new ApiError(403, 'admin role required');
  }
  return session;
}

/**
 * Wraps a route handler so any thrown ApiError becomes a clean JSON
 * response and any unexpected exception becomes a 500 (with the actual
 * error logged but not returned to the client).
 */
export function apiHandler<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (e) {
      if (e instanceof ApiError) {
        return NextResponse.json({ error: e.reason }, { status: e.status });
      }
      console.error('API handler error:', e);
      return NextResponse.json({ error: 'internal error' }, { status: 500 });
    }
  };
}
