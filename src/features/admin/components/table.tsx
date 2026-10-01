import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Table({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border-[1.5px] border-border bg-white">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function Th({ className, ...props }: ComponentProps<'th'>) {
  return <th scope="col" className={cn('border-b-[1.5px] border-border bg-muted px-3 py-2 font-bold whitespace-nowrap', className)} {...props} />;
}

export function Td({ className, ...props }: ComponentProps<'td'>) {
  return <td className={cn('border-b border-border px-3 py-2 align-top', className)} {...props} />;
}
