import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeading, PageShell } from '@/components/page-shell';
import { Alert } from '@/components/ui';
import { SignInForm } from '@/features/auth/sign-in-form';
import { currentParent } from '@/lib/auth/session';
import { safeReturnPath } from '@/lib/security';

export const metadata: Metadata = { title: 'Sign in' };

const NOTICES: Record<string, string> = {
  reset: 'Password changed. Sign in with the new one.',
  signedOut: 'Signed out. Practice records for this account were removed from this browser.',
  deleted: 'The account and all family data were deleted.'
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = safeReturnPath(typeof params.next === 'string' ? params.next : null, '/family');
  if (await currentParent()) redirect(next);
  const notice = Object.keys(NOTICES).find((key) => params[key] === '1');
  return (
    <PageShell width="narrow">
      <PageHeading title="Grown-up sign in" eyebrow="Family account" />
      {notice ? <Alert variant="success">{NOTICES[notice]}</Alert> : null}
      <SignInForm next={next} />
      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
        <Link className="font-bold text-foreground underline underline-offset-4" href="/forgot-password">
          Forgot your password?
        </Link>
        <p>
          New here?{' '}
          <Link className="font-bold text-foreground underline underline-offset-4" href="/signup">
            Create a family account
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
