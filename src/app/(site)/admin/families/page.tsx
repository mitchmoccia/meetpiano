import type { Metadata } from 'next';
import Link from 'next/link';
import { LocalDate } from '@/components/local-date';
import { PageHeading, PageShell } from '@/components/page-shell';
import { getDb } from '@/db/client';
import { Table, Td, Th } from '@/features/admin/components/table';
import { requireAdmin } from '@/features/admin/guard';
import { familyList } from '@/features/admin/queries';

export const metadata: Metadata = { title: 'Pilot families · Admin' };

export default async function FamiliesPage() {
  await requireAdmin();
  const families = await familyList(getDb());
  return (
    <PageShell>
      <PageHeading title="Pilot families" eyebrow="Admin">
        Read-only. Opening a family is recorded in the audit log.
      </PageHeading>
      {families.length ? (
        <Table caption="Families, newest first">
          <thead>
            <tr>
              <Th>Grown-up</Th>
              <Th>Learners</Th>
              <Th>Joined</Th>
              <Th>Last practice</Th>
            </tr>
          </thead>
          <tbody>
            {families.map((row) => (
              <tr key={row.id}>
                <Td>
                  <Link prefetch={false} className="font-bold underline underline-offset-4" href={`/admin/families/${row.id}`}>
                    {row.email}
                  </Link>
                  {row.emailVerified ? null : <span className="text-xs text-muted-foreground"> · email not verified</span>}
                </Td>
                <Td>{row.learners}</Td>
                <Td>
                  <LocalDate value={row.createdAt.toISOString()} />
                </Td>
                <Td>{row.lastActivityAt ? <LocalDate value={row.lastActivityAt.toISOString()} withTime /> : 'None yet'}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">No families yet.</p>
      )}
    </PageShell>
  );
}
