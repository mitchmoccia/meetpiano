import { evidenceLabel } from '@/components/evidence-badge';
import { LocalDate } from '@/components/local-date';
import { lessonTitle } from '@/features/curriculum/catalog';
import type { FamilyDetail } from '../queries';
import { Table, Td, Th } from './table';

type Learner = FamilyDetail['learners'][number];

function ProgressTable({ learner }: { learner: Learner }) {
  if (!learner.progress.length) return <p className="text-sm text-muted-foreground">No progress rows.</p>;
  return (
    <Table caption={`Progress for ${learner.nickname}`}>
      <thead>
        <tr>
          <Th>Lesson</Th>
          <Th>Evidence</Th>
          <Th>Tries</Th>
          <Th>Finished</Th>
          <Th>Imported</Th>
          <Th>Last activity</Th>
        </tr>
      </thead>
      <tbody>
        {learner.progress.map((row) => (
          <tr key={row.lessonId}>
            <Td>
              {row.lessonId} · {lessonTitle(row.lessonId)}
            </Td>
            <Td>{evidenceLabel(row.evidenceState)}</Td>
            <Td>{row.attemptCount}</Td>
            <Td>{row.completedAttemptCount}</Td>
            <Td>{row.importedAttemptCount}</Td>
            <Td>{row.lastActivityAt ? <LocalDate value={row.lastActivityAt.toISOString()} withTime /> : '—'}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function AttemptTable({ learner }: { learner: Learner }) {
  if (!learner.attempts.length) return <p className="text-sm text-muted-foreground">No tries saved.</p>;
  return (
    <Table caption={`Latest tries for ${learner.nickname}`}>
      <thead>
        <tr>
          <Th>Lesson</Th>
          <Th>Try id</Th>
          <Th>Source</Th>
          <Th>Revision</Th>
          <Th>Phase</Th>
          <Th>Evidence</Th>
          <Th>Input</Th>
          <Th>Last activity</Th>
          <Th>Received</Th>
        </tr>
      </thead>
      <tbody>
        {learner.attempts.map((row) => (
          <tr key={row.clientAttemptId}>
            <Td>
              {row.lessonId} <span className="text-xs text-muted-foreground">v{row.contentVersion}</span>
            </Td>
            <Td className="font-mono text-xs">{row.clientAttemptId.slice(0, 12)}…</Td>
            <Td>{row.source}</Td>
            <Td>{row.revision}</Td>
            <Td>{row.phase}</Td>
            <Td>{row.completedAt ? evidenceLabel(row.evidenceState) : 'Not finished'}</Td>
            <Td>{row.inputMode}</Td>
            <Td>
              <LocalDate value={row.lastActivityAt.toISOString()} withTime />
            </Td>
            <Td>
              <LocalDate value={row.receivedAt.toISOString()} withTime />
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export function LearnerDetail({ learner }: { learner: Learner }) {
  return (
    <section aria-labelledby={`learner-${learner.id}`} className="flex flex-col gap-3">
      <h2 id={`learner-${learner.id}`} className="text-xl font-extrabold">
        {learner.nickname}{' '}
        <span className="text-sm font-normal text-muted-foreground">
          added <LocalDate value={learner.createdAt.toISOString()} />
        </span>
      </h2>
      <ProgressTable learner={learner} />
      <h3 className="font-bold">Latest tries</h3>
      <AttemptTable learner={learner} />
    </section>
  );
}
