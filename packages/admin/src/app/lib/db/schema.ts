import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * DeepChat proxy definitions.
 *
 * Formerly a MongoDB collection (`DeepchatProxy`). `apiKey` is stored
 * encrypted at rest (AES-256-GCM) — see lib/crypto/encryption.ts. It is never
 * returned to clients; only proxyRequest decrypts it internally.
 */
export const deepchatProxies = pgTable('deepchat_proxies', {
  id: uuid('id').primaryKey().defaultRandom(),
  modelName: text('model_name').notNull(),
  apiKey: text('api_key').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export type DeepchatProxyRow = typeof deepchatProxies.$inferSelect;
export type NewDeepchatProxyRow = typeof deepchatProxies.$inferInsert;
