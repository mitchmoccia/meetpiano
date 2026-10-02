import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeading, PageShell } from '@/components/page-shell';
import { Alert } from '@/components/ui';
import { ResetPasswordForm } from '@/features/auth/reset-password-form';

export const metadata: Metadata = { title: 'Choose a new password' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const token = typeof params.token === 'string' && !params.error ? params.token : null;
  return (
    <PageShell width="narrow">
      <PageHeading title="Choose a new password" eyebrow="Family account" />
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <>
          <Alert variant="destructive">This reset link has expired or was already used.</Alert>
          <Link className="font-bold underline underline-offset-4" href="/forgot-password">
            Ask for a new reset link
          </Link>
        </>
      )}
    </PageShell>
  );
}
