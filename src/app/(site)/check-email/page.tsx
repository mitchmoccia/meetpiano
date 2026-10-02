import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeading, PageShell } from '@/components/page-shell';
import { EmailRequestForm } from '@/features/auth/email-request-form';

export const metadata: Metadata = { title: 'Check your email' };

export default function CheckEmailPage() {
  return (
    <PageShell width="narrow">
      <PageHeading title="Check your email" eyebrow="Almost there">
        We sent a confirmation link. It works once and expires in 24 hours. Opening it signs you in and takes you to add your
        first learner.
      </PageHeading>
      <section aria-labelledby="resend-heading" className="flex flex-col gap-3">
        <h2 id="resend-heading" className="text-lg font-extrabold">
          No email after a few minutes?
        </h2>
        <p className="text-sm text-muted-foreground">Check spam, then ask for a new link.</p>
        <EmailRequestForm kind="verification" submitLabel="Send a new link" />
      </section>
      <p className="text-sm text-muted-foreground">
        Already confirmed?{' '}
        <Link className="font-bold text-foreground underline underline-offset-4" href="/signin">
          Sign in
        </Link>
      </p>
    </PageShell>
  );
}
