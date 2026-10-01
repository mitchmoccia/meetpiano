import { getDb } from '@/db/client';
import { familyExport } from '@/features/family/export';
import { readParentSession } from '@/lib/auth/session';
import { jsonResponse } from '@/lib/http';
import { errorName, log } from '@/lib/log';

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await readParentSession(request.headers);
    if (!session) return jsonResponse({ error: 'signed-out' }, 401);
    const data = await familyExport(getDb(), session.userId);
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'attachment; filename="meetpiano-family-data.json"',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    log.error('family.export_failed', { error: errorName(error) });
    return jsonResponse({ error: 'server-error' }, 500);
  }
}
