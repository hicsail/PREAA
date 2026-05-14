/**
 * Next.js calls this once at server start. We use it to load
 * reflect-metadata, which tsyringe relies on for constructor-based
 * dependency injection.
 *
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // Only the Node.js server runtime needs reflect-metadata; the edge
  // runtime can't run it and never imports services that need DI.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('reflect-metadata');
  }
}
