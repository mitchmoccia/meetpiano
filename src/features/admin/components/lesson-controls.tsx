import { SubmitButton } from '@/components/form-controls';
import type { LessonSetting } from '@/features/curriculum/settings';
import { moveLessonAction, setLessonStatusAction } from '../actions';

const INPUT_CLASS = 'min-h-11 rounded-lg border-[1.5px] border-border bg-white px-2 text-sm';

export function LessonStatusForm({ lesson }: { lesson: LessonSetting }) {
  return (
    <form action={setLessonStatusAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="lessonId" value={lesson.id} />
      <label className="flex flex-col gap-1 text-xs font-bold">
        Status
        <select name="status" defaultValue={lesson.status} className={INPUT_CLASS}>
          <option value="available">Available</option>
          <option value="paused">Paused</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-bold">
        Internal note
        <input name="note" defaultValue={lesson.statusNote ?? ''} maxLength={200} className={`${INPUT_CLASS} w-44`} />
      </label>
      <SubmitButton size="sm" variant="outline" pendingLabel="Saving…" aria-label={`Save status for ${lesson.id}`}>
        Save
      </SubmitButton>
    </form>
  );
}

export function LessonMoveButtons({ lesson, first, last }: { lesson: LessonSetting; first: boolean; last: boolean }) {
  return (
    <div className="flex gap-1">
      {(['up', 'down'] as const).map((direction) => (
        <form key={direction} action={moveLessonAction}>
          <input type="hidden" name="lessonId" value={lesson.id} />
          <input type="hidden" name="direction" value={direction} />
          <SubmitButton
            size="sm"
            variant="ghost"
            pendingLabel="…"
            disabled={direction === 'up' ? first : last}
            aria-label={`Move ${lesson.id} ${direction}`}
          >
            {direction === 'up' ? '↑' : '↓'}
          </SubmitButton>
        </form>
      ))}
    </div>
  );
}
