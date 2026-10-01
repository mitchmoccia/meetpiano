'use client';

/** Shows a date in the viewer's own time zone; the server render may differ, so the text mismatch is expected. */
export function LocalDate({ value, withTime = false }: { value: string; withTime?: boolean }) {
  const date = new Date(value);
  const text = withTime
    ? date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : date.toLocaleDateString(undefined, { dateStyle: 'medium' });
  return (
    <time dateTime={value} suppressHydrationWarning>
      {text}
    </time>
  );
}
