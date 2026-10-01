import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeading, PageShell } from '@/components/page-shell';
import { SignUpForm } from '@/features/auth/sign-up-form';
import { currentParent } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Create a family account' };

export default async function SignUpPage() {
  if (await currentParent()) redirect('/family');
  return (
    <PageShell width="narrow">
      <PageHeading title="Create a family account" eyebrow="For grown-ups">
        One account per family. Add learner profiles after you confirm your email, and their practice saves to the family.
      </PageHeading>
      <SignUpForm />
      <p className="text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link className="font-bold text-foreground underline underline-offset-4" href="/signin">
          Sign in
        </Link>
      </p>
    </PageShell>
  );
}
