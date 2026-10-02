import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeading, PageShell } from '@/components/page-shell';
import { buttonVariants, Card, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { DeleteAccountForm } from '@/features/family/components/delete-account-form';
import { requireParent } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Account and data' };

const STORED = [
  ['Grown-up account', 'Email address, a hashed password, whether the email is verified, and sign-in sessions with the browser and network address used, for security.'],
  ['Learners', 'A nickname and an optional preset avatar for each learner. No birth dates, photos, or contact details.'],
  ['Practice tries', 'Which activity, when it started and finished, the input type (touch, computer keys, or MIDI), how far it got, and checkpoint results. No audio, recordings, or note-by-note playing.']
] as const;

export default async function AccountPage() {
  const session = await requireParent('/family/account');
  return (
    <PageShell>
      <PageHeading title="Account and data" eyebrow="Family">
        Signed in as <span className="font-bold text-foreground">{session.email}</span>
      </PageHeading>
      <Card>
        <CardHeader>
          <CardTitle>What MeetPiano stores</CardTitle>
          <CardDescription>Kept in MeetPiano&apos;s database, hosted in the United States.</CardDescription>
        </CardHeader>
        <dl className="flex flex-col gap-3 text-sm">
          {STORED.map(([term, detail]) => (
            <div key={term}>
              <dt className="font-bold">{term}</dt>
              <dd className="text-muted-foreground">{detail}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-muted-foreground">
          Records stay until you delete them. Deleting removes them from the database right away; the database restore history can hold
          deleted records for about one more day before it expires.
        </p>
        <a className={buttonVariants({ variant: 'outline', className: 'w-fit' })} href="/api/family/export" download>
          Download family data (JSON)
        </a>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>A reset link goes to {session.email}. Resetting the password signs out every device.</CardDescription>
        </CardHeader>
        <Link className="w-fit text-sm font-bold underline underline-offset-4" href="/forgot-password">
          Send a password reset link
        </Link>
      </Card>
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Delete account</CardTitle>
          <CardDescription>
            Deletes the grown-up account, every learner profile, and all saved practice. To remove one learner only, open that
            learner from the family dashboard.
          </CardDescription>
        </CardHeader>
        <DeleteAccountForm />
      </Card>
    </PageShell>
  );
}
