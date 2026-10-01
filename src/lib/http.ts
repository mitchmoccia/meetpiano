import { NextResponse } from 'next/server';
import { BodyTooLargeError, readJsonBody } from '@/lib/security';

export function jsonResponse(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export type BodyResult = { ok: true; value: unknown } | { ok: false; response: NextResponse };

export async function readBody(request: Request, maxBytes: number): Promise<BodyResult> {
  try {
    return { ok: true, value: await readJsonBody(request, maxBytes) };
  } catch (error) {
    if (error instanceof BodyTooLargeError) return { ok: false, response: jsonResponse({ error: 'too-large' }, 413) };
    if (error instanceof SyntaxError) return { ok: false, response: jsonResponse({ error: 'invalid-json' }, 400) };
    throw error;
  }
}
