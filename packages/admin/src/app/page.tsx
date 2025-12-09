import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Welcome to the admin panel. Select a section to get started.
          </p>
        </div>

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

        <div className="text-center text-sm text-gray-500 dark:text-gray-500">
          <p>Select a section above to navigate</p>
        </div>
      </div>
    </div>
  );
}
