import mongoose from 'mongoose';

/**
 * Connect to Mongo lazily and share the same connection across the server
 * lifetime. The `global` cache is needed because Next.js dev mode HMR
 * re-evaluates modules; without it we'd open a new connection on every
 * code edit and exhaust the pool.
 */

declare global {
  // eslint-disable-next-line no-var
  var _tenantPortalMongoConn: Promise<typeof mongoose> | undefined;
}

export async function getMongo(): Promise<typeof mongoose> {
  const uri = process.env.TENANT_PORTAL_MONGO_URI;
  if (!uri) {
    throw new Error(
      'TENANT_PORTAL_MONGO_URI is not set. ' +
        'Set it in .env.local for dev (e.g. mongodb://localhost:27017/tenant_portal) ' +
        'or in the Portainer stack env for staging/prod.',
    );
  }
  if (!global._tenantPortalMongoConn) {
    global._tenantPortalMongoConn = mongoose.connect(uri, {
      // Mongo connection pool size of 10 is plenty for an admin tool that
      // serves <1 req/s. Bump if/when traffic warrants it.
      maxPoolSize: 10,
    });
  }
  return global._tenantPortalMongoConn;
}
