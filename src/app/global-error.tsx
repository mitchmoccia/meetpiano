'use client';

import './globals.css';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <main id="main" className="mx-auto flex max-w-md flex-col gap-4 px-4 py-16">
          <h1 className="text-3xl font-extrabold">Something went wrong</h1>
          <p className="text-muted-foreground">MeetPiano could not load this page. Try again in a moment.</p>
          <button
            type="button"
            onClick={reset}
            className="min-h-11 w-fit rounded-lg border-[1.5px] border-primary bg-primary px-5 font-bold text-primary-foreground"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
