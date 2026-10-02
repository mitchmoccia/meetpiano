import { desc, sql } from 'drizzle-orm';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LocalDate } from '@/components/local-date';
import { PageHeading, PageShell } from '@/components/page-shell';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { assertDatabaseEnvironment, getDb } from '@/db/client';
import { devEmailCapture } from '@/db/schema';
import { appEnv, serverEnv } from '@/lib/env';

export const metadata: Metadata = { title: 'Development mailbox' };

/** Only reserved test domains are shown, so mail captured for a real address on a preview never appears here. */
const RESERVED_ADDRESS = '@([a-z0-9-]+\\.)*(example\\.(com|net|org)|[a-z0-9-]+\\.test)$';
const LINK = /https?:\/\/[^\s<>"]+/g;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function MailboxPage({ searchParams }: { searchParams: SearchParams }) {
  if (appEnv() === 'production' || serverEnv().EMAIL_TRANSPORT !== 'capture') notFound();
  await assertDatabaseEnvironment();
  const { to } = await searchParams;
  const address = typeof to === 'string' ? to.trim().toLowerCase() : '';
  const reserved = sql`${devEmailCapture.toAddress} ~* ${RESERVED_ADDRESS}`;
  const rows = await getDb()
    .select()
    .from(devEmailCapture)
    .where(address ? sql`${reserved} and ${devEmailCapture.toAddress} = ${address}` : reserved)
    .orderBy(desc(devEmailCapture.createdAt))
    .limit(30);
  return (
    <PageShell>
      <PageHeading title="Development mailbox" eyebrow="Not available in production">
        Email captured by development and preview deployments for test addresses (example.com, example.net, example.org, and .test).
      </PageHeading>
      {rows.length ? null : <p className="text-sm text-muted-foreground">No captured email{address ? ` for ${address}` : ''}.</p>}
      {rows.map((row) => (
        <Card key={row.id}>
          <CardHeader>
            <CardTitle>{row.subject}</CardTitle>
            <CardDescription>
              To {row.toAddress} · <LocalDate value={row.createdAt.toISOString()} withTime />
            </CardDescription>
          </CardHeader>
          <ul className="flex flex-col gap-1 text-sm">
            {[...row.textBody.matchAll(LINK)].map(([url], index) => (
              <li key={`${row.id}-${index}`}>
                <a className="break-all font-bold underline underline-offset-4" href={url}>
                  {url}
                </a>
              </li>
            ))}
          </ul>
          <pre className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs">{row.textBody}</pre>
        </Card>
      ))}
    </PageShell>
  );
}
