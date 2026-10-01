'use client';

import { useActionState } from 'react';
import { Field } from '@/components/field';
import { FormMessage, SubmitButton } from '@/components/form-controls';
import { LearnerAvatar } from '@/components/learner-avatar';
import { IDLE } from '@/lib/forms';
import { createChildAction, updateChildAction } from '../actions';
import { AVATAR_LABELS, AVATARS, type Avatar } from '../validation';

const OPTION_CLASS =
  'flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border-[1.5px] border-border bg-white px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-muted has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ring';

type ChildFormProps = {
  mode: 'create' | 'edit';
  flow?: 'welcome' | 'family';
  child?: { id: string; nickname: string; avatar: Avatar | null };
};

export function ChildForm({ mode, flow = 'family', child }: ChildFormProps) {
  const [state, action] = useActionState(mode === 'create' ? createChildAction : updateChildAction, IDLE);
  return (
    <form action={action} className="flex flex-col gap-4">
      <FormMessage state={state} />
      {child ? <input type="hidden" name="childId" value={child.id} /> : null}
      <input type="hidden" name="flow" value={flow} />
      <Field
        id={`nickname-${child?.id ?? 'new'}`}
        name="nickname"
        label="Nickname"
        defaultValue={child?.nickname}
        maxLength={24}
        autoComplete="off"
        hint="A first name or nickname only. Up to 24 characters."
        required
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">Avatar (optional)</legend>
        <div className="flex flex-wrap gap-2">
          <label className={OPTION_CLASS}>
            <input type="radio" name="avatar" value="" defaultChecked={!child?.avatar} className="sr-only" />
            <LearnerAvatar nickname="–" avatar={null} />
            None
          </label>
          {AVATARS.map((avatar) => (
            <label key={avatar} className={OPTION_CLASS}>
              <input type="radio" name="avatar" value={avatar} defaultChecked={child?.avatar === avatar} className="sr-only" />
              <LearnerAvatar nickname={AVATAR_LABELS[avatar]} avatar={avatar} />
              {AVATAR_LABELS[avatar]}
            </label>
          ))}
        </div>
      </fieldset>
      <SubmitButton className="w-fit" pendingLabel="Saving…">
        {mode === 'create' ? 'Add learner' : 'Save changes'}
      </SubmitButton>
    </form>
  );
}
