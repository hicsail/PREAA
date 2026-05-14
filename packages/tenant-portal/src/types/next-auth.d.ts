// Module augmentation so `session.realmRoles`, `session.accessToken`, and
// `session.user.sub` are typed in components and middleware. Pairs with the
// callbacks in src/app/lib/auth/config.ts.

import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    /** Raw Keycloak access token. Available to server-side code if it needs
     * to call protected APIs as the user. Not exposed to widget config. */
    accessToken?: string;

    /** Realm roles extracted from the Keycloak access token. Empty array if
     * none / token didn't include them. */
    realmRoles?: string[];

    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      /** Keycloak `sub` claim — the stable user id we key Tenant rows on. */
      sub?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    realmRoles?: string[];
    sub?: string;
  }
}
