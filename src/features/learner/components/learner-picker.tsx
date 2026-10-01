import { SubmitButton } from '@/components/form-controls';
import { LearnerAvatar } from '@/components/learner-avatar';
import type { ChildSummary } from '@/features/family/service';
import { chooseLearner, playAsGuest } from '../actions';

export function LearnerPicker({ learners }: { learners: ChildSummary[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {learners.map((learner) => (
        <li key={learner.id}>
          <form action={chooseLearner}>
            <input type="hidden" name="childId" value={learner.id} />
            <SubmitButton
              variant="outline"
              size="lg"
              className="min-h-16 w-full justify-start gap-3 bg-white text-lg"
              pendingLabel={`Opening for ${learner.nickname}…`}
            >
              <LearnerAvatar nickname={learner.nickname} avatar={learner.avatar} />
              {learner.nickname}
            </SubmitButton>
          </form>
        </li>
      ))}
    </ul>
  );
}

export function GuestChoice() {
  return (
    <form action={playAsGuest} className="flex flex-col gap-2">
      <SubmitButton variant="ghost" className="w-fit underline underline-offset-4" pendingLabel="Opening…">
        Play as a guest instead
      </SubmitButton>
      <p className="text-sm text-muted-foreground">Guest practice is saved on this device only and is not added to any learner.</p>
    </form>
  );
}
