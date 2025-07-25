'use client';

import { AuthProvider } from 'react-admin';
import { SessionContextValue, signIn, signOut } from 'next-auth/react'

export const getAuth = (session: SessionContextValue): AuthProvider => {
  return {
    login: async () => {
      await signIn('keycloak');
    },
    checkAuth: async () => {
      console.log(`check auth called: ${session.status}`);
      // If unauthenticated, redirect to login
      if (session.status === 'unauthenticated') {
        console.log('here');
        await signIn('keycloak');
      }

      // Otherwise do nothing yet
    },
    handleCallback: async () => {

    },
    logout: async () => {
      console.log('log out called')
      await fetch('/api/auth/signoutprovider', {
        method: 'PUT'
      });
      const result = await signOut();

      session.update(null);
      console.log('logged out');
      console.log(result);
    },
    checkError: async () => {

    }
  }
};
