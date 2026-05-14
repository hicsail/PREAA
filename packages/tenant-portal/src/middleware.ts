import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { ROLES } from '@/app/lib/auth/roles';

/**
 * Route guard for /admin/* and /dashboard/*.
 *
 * - Unauthenticated → redirected to / by next-auth's default (`authorized`
 *   callback below).
 * - Authenticated but wrong role → redirected to / explicitly, so a tenant
 *   trying /admin lands back on the home page instead of seeing a 403.
 *
 * Admins are allowed on /dashboard too — useful for impersonation /
 * debugging from the admin's own account.
 */
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const roles = (req.nextauth.token?.realmRoles as string[] | undefined) ?? [];

    if (pathname.startsWith('/admin')) {
      if (!roles.includes(ROLES.ADMIN)) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    if (pathname.startsWith('/dashboard')) {
      const allowed = roles.includes(ROLES.TENANT) || roles.includes(ROLES.ADMIN);
      if (!allowed) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Must be signed in at all (with any role) for protected routes.
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
