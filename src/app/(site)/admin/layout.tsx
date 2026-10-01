import Link from 'next/link';
import type { ReactNode } from 'react';
import { requireAdmin } from '@/features/admin/guard';

const LINKS = [
  ['/admin', 'Overview'],
  ['/admin/curriculum', 'Curriculum'],
  ['/admin/families', 'Pilot families'],
  ['/admin/saves', 'Save problems'],
  ['/admin/audit', 'Audit log']
] as const;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return (
    <>
      <nav aria-label="Admin" className="border-b-[1.5px] border-border bg-muted">
        <ul className="mx-auto flex max-w-4xl flex-wrap gap-1 px-4 py-1 text-sm font-semibold sm:px-6">
          {LINKS.map(([href, label]) => (
            <li key={href}>
              <Link prefetch={false} className="inline-flex min-h-11 items-center rounded-lg px-3 hover:bg-white" href={href}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </>
  );
}
