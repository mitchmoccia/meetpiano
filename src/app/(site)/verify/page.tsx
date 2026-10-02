import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeading, PageShell } from '@/components/page-shell';
import { Alert } from '@/components/ui';
import { EmailRequestForm } from '@/features/auth/email-request-form';
import { safeReturnPath } from '@/lib/security';

export const metadata: Metadata = { title: 'Confirm your email' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Landing page for confirmation links and sign-in redirects: success continues to a safe local path. */
export default async function VerifyPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  if (!params.error) redirect(safeReturnPath(typeof params.next === 'string' ? params.next : null, '/family'));
  return (
    <PageShell width="narrow">
      <PageHeading title="That link did not work" eyebrow="Confirm your email" />
      <Alert variant="destructive">This confirmation link has expired or was already used.</Alert>
      <p className="text-sm text-muted-foreground">
        If you already confirmed,{' '}
        <Link className="font-bold text-foreground underline underline-offset-4" href="/signin">
          sign in
        </Link>
        . Otherwise ask for a new link.
      </p>
      <EmailRequestForm kind="verification" submitLabel="Send a new link" />
    </PageShell>
  );
}
