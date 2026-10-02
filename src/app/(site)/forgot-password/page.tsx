import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeading, PageShell } from '@/components/page-shell';
import { EmailRequestForm } from '@/features/auth/email-request-form';

export const metadata: Metadata = { title: 'Reset your password' };

export default function ForgotPasswordPage() {
  return (
    <PageShell width="narrow">
      <PageHeading title="Reset your password" eyebrow="Family account">
        Enter the account email and we will send a link to choose a new password.
      </PageHeading>
      <EmailRequestForm kind="reset" submitLabel="Send reset link" />
      <Link className="text-sm font-bold underline underline-offset-4" href="/signin">
        Back to sign in
      </Link>
    </PageShell>
  );
}
