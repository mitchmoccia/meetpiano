import type { ComponentProps } from 'react';
import { SubmitButton } from '@/components/form-controls';
import { chooseLearner } from '../actions';

type PracticeButtonProps = {
  childId: string;
  next?: string;
  label: string;
  ariaLabel?: string;
  variant?: ComponentProps<typeof SubmitButton>['variant'];
  size?: ComponentProps<typeof SubmitButton>['size'];
};

/** Opens the lesson page as this learner. The server re-checks that the learner belongs to the signed-in parent. */
export function PracticeButton({ childId, next = '/learn/', label, ariaLabel, variant = 'default', size = 'default' }: PracticeButtonProps) {
  return (
    <form action={chooseLearner}>
      <input type="hidden" name="childId" value={childId} />
      <input type="hidden" name="next" value={next} />
      <SubmitButton variant={variant} size={size} pendingLabel="Opening…" aria-label={ariaLabel}>
        {label}
      </SubmitButton>
    </form>
  );
}
