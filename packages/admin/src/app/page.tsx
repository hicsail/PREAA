'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
          {session ? (
            <div className="space-y-2">
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Welcome, {session.user?.name || session.user?.email}!
              </p>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Please sign in to access the admin panel.
              </p>
              <button
                onClick={() => signIn('keycloak')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Sign In with Keycloak
              </button>
            </div>
          )}
        </div>

        {session && (
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href="/admin"
              className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm transition-all hover:shadow-md hover:scale-105"
            >
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Admin Panel</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage models and proxies using the react-admin interface
                </p>
              </div>
              <div className="mt-4 text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
                Go to Admin →
              </div>
            </Link>

            {/* Add more navigation cards here as you add more pages */}
          </div>
        )}

        {session && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-500">
            <p>Select a section above to navigate</p>
          </div>
        )}
      </div>
    </div>
  );
}
