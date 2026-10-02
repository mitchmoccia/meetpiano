'use client';

import { attemptSummary, type CloudSummary } from '@learn/cloud-summary.js';
import { STORAGE_KEY, validateStore } from '@learn/progress.js';
import { useState } from 'react';
import { Alert, Button } from '@/components/ui';
import { importGuestPracticeAction } from '../actions';
import type { ImportReport } from '../import';

type Scan = { attempts: Array<CloudSummary & { revision: 1 }>; skipped: number; lessons: number };
type Stage =
  | { kind: 'start' }
  | { kind: 'none' }
  | { kind: 'found'; scan: Scan }
  | { kind: 'importing'; scan: Scan; done: number }
  | { kind: 'finished'; report: ImportReport; skipped: number }
  | { kind: 'error'; message: string };

const BATCH = 100;

function readGuestRecords(): Scan | null {
  const parsed = validateStore(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null'));
  if (!parsed.ok) return null;
  const scan: Scan = { attempts: [], skipped: 0, lessons: 0 };
  const lessons = new Set<string>();
  for (const lesson of Object.values(parsed.store.lessons)) {
    for (const attempt of lesson.attempts) {
      const summary = attemptSummary(attempt);
      if (summary) {
        scan.attempts.push({ ...summary, revision: 1 });
        lessons.add(summary.lessonId);
      } else scan.skipped += 1;
    }
  }
  scan.lessons = lessons.size;
  return scan.attempts.length ? scan : null;
}

function addReports(a: ImportReport, b: ImportReport): ImportReport {
  return { saved: a.saved + b.saved, alreadySaved: a.alreadySaved + b.alreadySaved, otherLearner: a.otherLearner + b.otherLearner, rejected: a.rejected + b.rejected };
}

function reportText(report: ImportReport, skipped: number): string {
  const parts = [`Saved ${report.saved} ${report.saved === 1 ? 'try' : 'tries'}.`];
  if (report.alreadySaved) parts.push(`${report.alreadySaved} were already saved.`);
  if (report.otherLearner) parts.push(`${report.otherLearner} already belong to another learner and were left alone.`);
  if (report.rejected + skipped) parts.push(`${report.rejected + skipped} could not be imported.`);
  return `${parts.join(' ')} Guest records stay on this browser.`;
}

/** Copies this browser's guest tries into one learner only after the parent confirms who practiced. */
export function GuestImport({ childId, nickname }: { childId: string; nickname: string }) {
  const [stage, setStage] = useState<Stage>({ kind: 'start' });
  const [confirmed, setConfirmed] = useState(false);

  function check() {
    try {
      const scan = readGuestRecords();
      setStage(scan ? { kind: 'found', scan } : { kind: 'none' });
    } catch {
      setStage({ kind: 'error', message: 'The guest records on this browser could not be read.' });
    }
  }

  async function runImport(scan: Scan) {
    let total: ImportReport = { saved: 0, alreadySaved: 0, otherLearner: 0, rejected: 0 };
    for (let start = 0; start < scan.attempts.length; start += BATCH) {
      setStage({ kind: 'importing', scan, done: start });
      const result = await importGuestPracticeAction(childId, scan.attempts.slice(start, start + BATCH), confirmed);
      if (!result.ok) return setStage({ kind: 'error', message: `${result.message} ${start ? reportText(total, 0) : ''}`.trim() });
      total = addReports(total, result.report);
    }
    setStage({ kind: 'finished', report: total, skipped: scan.skipped });
  }

  if (stage.kind === 'start') return <Button variant="outline" className="w-fit" onClick={check}>Check this browser for guest practice</Button>;
  if (stage.kind === 'none') return <Alert>No guest practice was found on this browser.</Alert>;
  if (stage.kind === 'error') return <Alert variant="destructive">{stage.message}</Alert>;
  if (stage.kind === 'finished') return <Alert variant="success">{reportText(stage.report, stage.skipped)}</Alert>;
  const { scan } = stage;
  const busy = stage.kind === 'importing';
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">
        Found {scan.attempts.length} guest {scan.attempts.length === 1 ? 'try' : 'tries'} across {scan.lessons}{' '}
        {scan.lessons === 1 ? 'activity' : 'activities'}.
        {scan.skipped ? ` ${scan.skipped} older or unreadable tries will be left out.` : ''}
      </p>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5 size-5 shrink-0 accent-primary" />
        <span>These guest tries on this browser were done by {nickname}.</span>
      </label>
      <Button className="w-fit" disabled={!confirmed || busy} onClick={() => runImport(scan)}>
        {busy ? `Importing… ${stage.done} of ${scan.attempts.length}` : `Import to ${nickname}`}
      </Button>
    </div>
  );
}
