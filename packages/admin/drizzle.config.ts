import { defineConfig } from 'drizzle-kit';

// Runtime table provisioning happens in src/instrumentation.ts (idempotent,
// portable). This config is for local schema authoring / generating SQL
// migrations with drizzle-kit as the schema grows.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/app/lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://psql:postgres@localhost:5432/admin'
  }
});
