import { getSessionCookie } from 'better-auth/cookies';
import { NextResponse, type NextRequest } from 'next/server';

const SIGNED_IN_AREAS = ['/family', '/play', '/admin'];

function contentSecurityPolicy(nonce: string): string {
  const development = process.env.NODE_ENV !== 'production';
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(development ? [] : ['upgrade-insecure-requests'])
  ].join('; ');
}

function needsSession(pathname: string): boolean {
  return SIGNED_IN_AREAS.some((area) => pathname === area || pathname.startsWith(`${area}/`));
}

/**
 * Sets a per-request CSP nonce and sends visitors without a session cookie to sign-in.
 * The cookie check is only a convenience redirect; every page and action re-validates the session on the server.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (needsSession(pathname) && !getSessionCookie(request)) {
    const signIn = new URL('/signin', request.url);
    signIn.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(signIn);
  }
  const nonce = btoa(crypto.randomUUID());
  const policy = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', policy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', policy);
  return response;
}

export const config = {
  matcher: [
    {
      source:
        '/((?!api/|_next/static|_next/image|assets/|js/|learn|index\\.html|app\\.js|styles\\.css|llms\\.txt|robots\\.txt|sitemap\\.xml|favicon).+)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' }
      ]
    }
  ]
};
