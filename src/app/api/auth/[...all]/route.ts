import { assertDatabaseEnvironment } from '@/db/client';
import { getAuth } from '@/lib/auth/server';

async function handle(request: Request): Promise<Response> {
  await assertDatabaseEnvironment();
  return getAuth().handler(request);
}

export const GET = handle;
export const POST = handle;
