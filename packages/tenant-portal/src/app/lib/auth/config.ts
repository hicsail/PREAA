import { NextAuthOptions } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';

/**
 * Pull `realm_access.roles` out of a Keycloak access token without verifying
 * the signature. Safe to skip verification here because we obtained the
 * token from Keycloak ourselves via the OIDC flow — we trust the source.
 *
 * Returns [] on any parse error or missing field, so callers can treat the
 * absence of roles the same as having none.
 */
function decodeRealmRoles(accessToken: string | undefined | null): string[] {
  if (!accessToken) return [];
  try {
    const [, payload] = accessToken.split('.');
    if (!payload) return [];
    const decoded = Buffer.from(
      payload.replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString('utf-8');
    const parsed = JSON.parse(decoded) as {
      realm_access?: { roles?: string[] };
    };
    return parsed.realm_access?.roles ?? [];
  } catch {
    return [];
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
      authorization: {
        params: { scope: 'openid profile email' },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // First sign-in: account is present. Capture the access token (used
      // for downstream API calls if we ever need it) and the realm roles
      // extracted from it.
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.realmRoles = decodeRealmRoles(account.access_token);
      }
      // Keycloak's sub claim is the stable user id; preserve it across
      // refreshes.
      if (profile?.sub && !token.sub) {
        token.sub = profile.sub;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.realmRoles = token.realmRoles ?? [];
      if (session.user) {
        session.user.sub = token.sub;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/',
  },
};
