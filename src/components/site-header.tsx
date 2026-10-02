import Link from 'next/link';
import { isAdminUser } from '@/features/admin/guard';
import { currentParent } from '@/lib/auth/session';
import { SignOutButton } from './sign-out-button';

const linkClass = 'inline-flex min-h-11 items-center rounded-lg px-3 hover:bg-muted';

export async function SiteHeader() {
  const session = await currentParent();
  const admin = session ? await isAdminUser(session.userId) : false;
  return (
    <header className="border-b-[1.5px] border-border">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
        <a href="/" className="inline-flex min-h-11 items-center font-display text-xl font-extrabold">
          meetpiano<span className="text-ring">.</span>
        </a>
        <nav aria-label="Account">
          <ul className="flex flex-wrap items-center gap-1 text-sm font-semibold">
            {session ? (
              <>
                <li><Link className={linkClass} href="/family">Family</Link></li>
                <li><Link className={linkClass} href="/play">Play</Link></li>
                <li><Link className={linkClass} href="/family/account">Account</Link></li>
                {admin ? <li><Link className={linkClass} href="/admin">Admin</Link></li> : null}
                <li><SignOutButton userId={session.userId} /></li>
              </>
            ) : (
              <>
                <li><a className={linkClass} href="/learn/">Play as guest</a></li>
                <li><Link className={linkClass} href="/signin">Sign in</Link></li>
                <li><Link className={linkClass} href="/signup">Create account</Link></li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
