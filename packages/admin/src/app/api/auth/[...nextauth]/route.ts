import NextAuth, { NextAuthOptions } from 'next-auth';
import Keycloak from 'next-auth/providers/keycloak';

export const authOptions: NextAuthOptions = {
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID!,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET!,
      issuer: process.env.AUTH_KEYCLOAK_ISSUER!
    })
  ]
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
