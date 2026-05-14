import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone output bundles all needed files for Docker, no node_modules in
  // the runtime stage. Matches packages/admin/Dockerfile expectations.
  output: 'standalone',

  // No global CORS rule here. The widget-config public endpoint will set CORS
  // per-tenant inside its route handler (validating against allowed_origins);
  // all other /api routes are first-party (auth-gated, same-origin).
};

export default nextConfig;
