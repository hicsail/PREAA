'use client';

import { AuthProvider } from 'react-admin';
import { SessionContextValue, signIn, signOut } from 'next-auth/react'

export const getAuth = (session: SessionContextValue): AuthProvider => {
  return {
    login: async () => {
      await signIn('keycloak');
    },
    checkAuth: async () => {
      console.log(session);
      // If unauthenticated, redirect to login
      if (session.status === 'unauthenticated') {
        await signIn('keycloak');
      }

      // Otherwise do nothing yet
    },
    handleCallback: async () => {

    },
    logout: async () => {
      const result = await signOut({ redirect: false });

      session.update(null);
      console.log(result);
    },
    checkError: async () => {

    }
  }
};
