import type { Metadata } from 'next';
import { LocalDate } from '@/components/local-date';
import { PageHeading, PageShell } from '@/components/page-shell';
import { getDb } from '@/db/client';
import { recentAudit } from '@/features/admin/audit';
import { Table, Td, Th } from '@/features/admin/components/table';
import { requireAdmin } from '@/features/admin/guard';

export const metadata: Metadata = { title: 'Audit log · Admin' };

function detailText(details: Record<string, string | number | boolean | null>): string {
  return Object.entries(details)
    .map(([key, value]) => `${key}: ${value ?? '—'}`)
    .join(' · ');
}

export default async function AuditPage() {
  await requireAdmin();
  const entries = await recentAudit(getDb());
  return (
    <PageShell>
      <PageHeading title="Audit log" eyebrow="Admin">
        The latest 100 admin actions: lesson changes, family views, and admin grants made with the operator script.
      </PageHeading>
      {entries.length ? (
        <Table caption="Latest admin actions">
          <thead>
            <tr>
              <Th>When</Th>
              <Th>Who</Th>
              <Th>Action</Th>
              <Th>Target</Th>
              <Th>Details</Th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <Td>
                  <LocalDate value={entry.createdAt.toISOString()} withTime />
                </Td>
                <Td>{entry.actorLabel}</Td>
                <Td className="font-mono text-xs">{entry.action}</Td>
                <Td>
                  {entry.targetType} {entry.targetId}
                </Td>
                <Td className="text-muted-foreground">{detailText(entry.details)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">No admin actions recorded yet.</p>
      )}
    </PageShell>
  );
}
