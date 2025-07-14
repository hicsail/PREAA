import { container, AUTH_PROVIDER } from '@/app/lib/container';
import { NextAuthResult } from 'next-auth';

// Get the endpoints for the auth provider
const { handlers } = container.resolve<NextAuthResult>(AUTH_PROVIDER);

// Re-export the get and post handlers
export const { GET, POST } = handlers;
