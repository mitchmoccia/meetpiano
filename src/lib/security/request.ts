import { trustedOrigins } from '@/lib/env';

/** Rejects cross-site requests to cookie-authenticated route handlers. Server actions get the same check from Next.js. */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (origin) return trustedOrigins().includes(origin);
  return request.headers.get('sec-fetch-site') === 'same-origin';
}

export async function readJsonBody(request: Request, maxBytes: number): Promise<unknown> {
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > maxBytes) throw new BodyTooLargeError();
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new BodyTooLargeError();
  return JSON.parse(text) as unknown;
}

export class BodyTooLargeError extends Error {
  constructor() {
    super('Request body is too large.');
    this.name = 'BodyTooLargeError';
  }
}

const RETURN_PREFIXES = ['/family', '/play', '/admin', '/learn'];

/** Accepts only local paths into signed-in areas so sign-in links cannot redirect off-site. */
export function safeReturnPath(value: string | null | undefined, fallback = '/family'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  let parsed: URL;
  try {
    parsed = new URL(value, 'https://meetpiano.invalid');
  } catch {
    return fallback;
  }
  if (parsed.origin !== 'https://meetpiano.invalid') return fallback;
  const allowed = RETURN_PREFIXES.some((prefix) => parsed.pathname === prefix || parsed.pathname.startsWith(`${prefix}/`));
  return allowed ? `${parsed.pathname}${parsed.search}` : fallback;
}
