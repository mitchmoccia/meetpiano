import { userInfo } from 'node:os';
import { eq } from 'drizzle-orm';
import type { Database } from '@/db/client';
import { adminAuditLog, adminOperator, authUser } from '@/db/schema';
import { argValue, expectedEnvironment, openDatabase, runScript } from './connect';

const USAGE =
  'Usage: pnpm admin:grant --email=person@example.com --expect-environment=production [--note="why"]\n' +
  '       pnpm admin:revoke --email=person@example.com --expect-environment=production';

type Command = 'grant' | 'revoke';
type Target = { id: string; emailVerified: boolean };

async function apply(db: Database, command: Command, user: Target, note: string | null): Promise<boolean> {
  const operator = `operator-cli:${userInfo().username}`;
  return db.transaction(async (tx) => {
    const changed =
      command === 'grant'
        ? await tx.insert(adminOperator).values({ userId: user.id, grantedBy: operator, note }).onConflictDoNothing().returning({ userId: adminOperator.userId })
        : await tx.delete(adminOperator).where(eq(adminOperator.userId, user.id)).returning({ userId: adminOperator.userId });
    if (!changed.length) return false;
    await tx.insert(adminAuditLog).values({
      actorUserId: null,
      actorLabel: operator,
      action: command === 'grant' ? 'admin.granted' : 'admin.revoked',
      targetType: 'admin',
      targetId: user.id,
      details: { note }
    });
    return true;
  });
}

/** The only way to make an admin: an operator with database access runs this against a verified account. */
void runScript(async () => {
  const command = process.argv[2];
  const email = argValue('email')?.trim().toLowerCase();
  if ((command !== 'grant' && command !== 'revoke') || !email) throw new Error(USAGE);
  const note = argValue('note')?.trim().slice(0, 200) || null;
  const environment = expectedEnvironment();
  const { db, close } = await openDatabase(environment);
  try {
    const [user] = await db.select({ id: authUser.id, emailVerified: authUser.emailVerified }).from(authUser).where(eq(authUser.email, email)).limit(1);
    if (!user) throw new Error('No account uses that email.');
    if (command === 'grant' && !user.emailVerified) throw new Error('Verify the account email before granting admin access.');
    const changed = await apply(db, command, user, note);
    const verb = command === 'grant' ? 'granted' : 'revoked';
    console.info(changed ? `Admin access ${verb} on the ${environment} branch.` : `Nothing to do: access was already ${verb}.`);
  } finally {
    await close();
  }
});
