import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageShellProps = { children: ReactNode; width?: 'narrow' | 'wide'; className?: string };

export function PageShell({ children, width = 'wide', className }: PageShellProps) {
  return (
    <main id="main" tabIndex={-1} className={cn('mx-auto flex w-full flex-col gap-6 px-4 pb-16 pt-6 sm:px-6', width === 'narrow' ? 'max-w-md' : 'max-w-4xl', className)}>
      {children}
    </main>
  );
}

export function PageHeading({ title, eyebrow, children }: { title: string; eyebrow?: string; children?: ReactNode }) {
  return (
    <header className="flex flex-col gap-2">
      {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</p> : null}
      <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{title}</h1>
      {children ? <div className="text-base text-muted-foreground">{children}</div> : null}
    </header>
  );
}
