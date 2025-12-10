import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * CORS Middleware
 * Validates and sets CORS headers based on allowed origins from environment variable
 */

/**
 * Check if an origin matches an allowed origin pattern
 * Supports wildcard subdomains (e.g., *.bu.edu matches https://subdomain.bu.edu)
 */
function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  for (const allowed of allowedOrigins) {
    // Exact match
    if (allowed === origin) {
      return true;
    }

    // Wildcard subdomain match (e.g., *.bu.edu)
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2); // Remove '*.' prefix
      try {
        const originUrl = new URL(origin);
        const originHost = originUrl.hostname;

        // Check if origin host ends with the domain (e.g., subdomain.bu.edu ends with bu.edu)
        if (originHost === domain || originHost.endsWith('.' + domain)) {
          return true;
        }
      } catch {
        // Invalid URL, skip
        continue;
      }
    }
  }

  return false;
}

/**
 * Get allowed origins from environment variable
 */
function getAllowedOrigins(): string[] {
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || '';
  
  if (!allowedOriginsEnv.trim()) {
    // If not set, default to empty array (no origins allowed)
    // In development, you might want to allow localhost
    if (process.env.NODE_ENV === 'development') {
      return ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'];
    }
    return [];
  }

  return allowedOriginsEnv
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Only apply CORS to proxy API routes, exclude NextAuth and other internal routes
  // Matches both /api/proxies and /api/proxies/*
  if (!pathname.startsWith('/api/proxies')) {
    return NextResponse.next();
  }

  const origin = request.headers.get('origin');
  const allowedOrigins = getAllowedOrigins();

  // Handle preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });

    if (origin && isOriginAllowed(origin, allowedOrigins)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS');
      response.headers.set(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-API-Key, Authorization'
      );
      response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    }

    return response;
  }

  // For actual requests, set CORS headers if origin is allowed
  const response = NextResponse.next();

  if (origin && isOriginAllowed(origin, allowedOrigins)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

export const config = {
  // Only match proxy API routes, not NextAuth routes
  // Matches both /api/proxies and /api/proxies/*
  matcher: ['/api/proxies', '/api/proxies/:path*']
};
