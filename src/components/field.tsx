import type { ComponentProps } from 'react';
import { Input, Label } from '@/components/ui';

type FieldProps = ComponentProps<typeof Input> & { id: string; label: string; hint?: string };

export function Field({ id, label, hint, ...props }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-describedby={hintId} {...props} />
      {hint ? (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
