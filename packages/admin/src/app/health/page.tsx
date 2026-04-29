'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';

type ServiceStatus = {
  name: string;
  status: 'up' | 'down';
  statusCode: number | null;
  responseTime: number;
};

type HealthData = {
  services: ServiceStatus[];
  checkedAt: string;
};

export default function HealthPage() {
  const { status } = useSession();
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchHealth() {
    setLoading(true);
    const res = await fetch('/api/health');
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    if (status === 'authenticated') fetchHealth();
  }, [status]);

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (status === 'unauthenticated') {
    signIn('keycloak');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Health Check</h1>
            {data && (
              <p className="text-sm text-gray-500 mt-1">
                Last checked: {new Date(data.checkedAt).toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Refresh'}
            </button>
            <a
              href="/"
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100"
            >
              ← Back
            </a>
          </div>
        </div>

        {loading && !data ? (
          <p className="text-gray-500">Checking services...</p>
        ) : (
          <div className="flex flex-col gap-4">
            {data?.services.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-6 py-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      service.status === 'up' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-lg font-medium text-gray-800">{service.name}</span>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span>{service.responseTime}ms</span>
                  {service.statusCode && <span>HTTP {service.statusCode}</span>}
                  <span className={`font-semibold ${service.status === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {service.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
