// MongoDB connection will be handled lazily when models are first accessed
// This avoids issues with Next.js edge runtime and instrumentation hooks
export async function register() {
  // Mongoose will connect automatically on first model access
  // If you need to ensure connection, do it in a route handler or API route
}
