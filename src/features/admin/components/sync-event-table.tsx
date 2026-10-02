import Link from 'next/link';
import { LocalDate } from '@/components/local-date';
import { Badge } from '@/components/ui';
import { Table, Td, Th } from './table';

type SyncEventRow = {
  id: string;
  createdAt: Date;
  outcome: string;
  reason: string;
  lessonId: string | null;
  clientAttemptId: string | null;
  familyId?: string | null;
};

const OUTCOME_VARIANT: Record<string, 'destructive' | 'default' | 'muted'> = { rejected: 'destructive', conflict: 'default', imported: 'muted' };

export function SyncEventTable({ events, caption }: { events: SyncEventRow[]; caption: string }) {
  if (!events.length) return <p className="text-sm text-muted-foreground">No save problems or imports recorded.</p>;
  const showFamily = events.some((event) => event.familyId !== undefined);
  return (
    <Table caption={caption}>
      <thead>
        <tr>
          <Th>When</Th>
          <Th>Outcome</Th>
          <Th>Reason</Th>
          <Th>Lesson</Th>
          <Th>Try id</Th>
          {showFamily ? <Th>Family</Th> : null}
        </tr>
      </thead>
      <tbody>
        {events.map((event) => (
          <tr key={event.id}>
            <Td>
              <LocalDate value={event.createdAt.toISOString()} withTime />
            </Td>
            <Td>
              <Badge variant={OUTCOME_VARIANT[event.outcome] ?? 'muted'}>{event.outcome}</Badge>
            </Td>
            <Td>{event.reason}</Td>
            <Td>{event.lessonId ?? '—'}</Td>
            <Td className="font-mono text-xs">{event.clientAttemptId ? `${event.clientAttemptId.slice(0, 12)}…` : '—'}</Td>
            {showFamily ? (
              <Td>
                {event.familyId ? (
                  <Link prefetch={false} className="underline underline-offset-4" href={`/admin/families/${event.familyId}`}>
                    Open
                  </Link>
                ) : (
                  '—'
                )}
              </Td>
            ) : null}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
