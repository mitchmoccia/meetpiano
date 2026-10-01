import 'server-only';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { getDb } from '@/db/client';
import { adminOperator } from '@/db/schema';
import { currentParent, type ParentSession } from '@/lib/auth/session';

/** Admin access comes only from an admin_operator row, which only the operator CLI grants. */
export const isAdminUser = cache(async (userId: string): Promise<boolean> => {
  const [row] = await getDb()
    .select({ userId: adminOperator.userId })
    .from(adminOperator)
    .where(eq(adminOperator.userId, userId))
    .limit(1);
  return Boolean(row);
});

/** Every admin page and action calls this. Anyone else gets a plain 404, so the area is not advertised. */
export async function requireAdmin(): Promise<ParentSession> {
  const session = await currentParent();
  if (!session || !(await isAdminUser(session.userId))) notFound();
  return session;
}
