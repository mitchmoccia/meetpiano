# MeetPiano v1 cutover

Status on 2026-10-01: the v1 app is verified on a Vercel preview of `cursor/meetpiano-v1-accounts-83a2` (deployment `dpl_fQVN2P1AKyqBTTk2V8CAcL8iDy6L`) against the Neon development branch with captured email. Production has not changed:

- `meetpiano.app` serves the static site from deployment `dpl_EP7LEzsG8MXVDZViL91YjMHj8HVE` (`main` @ `9e57add`).
- Neon project `wild-flower-56273415`, production branch `br-wispy-cell-b8yh2eh5`: database `meetpiano` exists, has no tables, and is not marked.
- The Vercel project has no Production environment variables.

## Launch blockers

1. **Real email.** No SendGrid sending domain, sender, or API key exists yet, and the SendGrid code path has never sent a real message. Production configuration is rejected without SendGrid settings.
2. **Production database.** Not migrated, not marked, and the curriculum is not synced.
3. **Production configuration.** No Production environment variables are set.
4. **Privacy and consent.** The open questions below need an owner decision and legal review before any family signs up. Nothing here claims COPPA or any other compliance.
5. **Public copy.** `public/index.html` (description, structured data, membership note), `public/llms.txt`, and `public/learn/index.md` still say progress stays on this device and that there are no accounts. That is true only for guest practice. The home page has no sign-in link; `/learn` links to family profiles. Several of these phrases are pinned by `pnpm check:static` fixtures, so change the copy and the fixtures together in one deliberate edit.

## Cutover steps

Steps 1 to 4 change nothing visitors see. Step 5 switches the whole site in one deployment; step 8 undoes it.

1. **SendGrid.** In the existing SendGrid account, authenticate the `meetpiano.app` domain (Settings → Sender Authentication) and add the DNS records it lists at the domain's DNS provider. Create an API key with Restricted Access and only Mail Send enabled. Choose a sender on that domain, for example `hello@meetpiano.app`.
2. **Production database.** In Neon, first reset the `meetpiano_owner` password on the production branch: branches copy role passwords from their parent, and the development branch's credentials were handled during development. Then, from a checkout of the commit you will merge, using the production branch's direct (unpooled) connection string:

   ```sh
   DATABASE_URL_UNPOOLED='<production direct URL>' pnpm db:migrate
   ```

   In the Neon SQL editor, on the production branch only:

   ```sql
   insert into database_environment (environment) values ('production');
   ```

   Then sync the curriculum and expect `Curriculum synced to the production branch: 6 units, 24 lessons.`

   ```sh
   DATABASE_URL_UNPOOLED='<production direct URL>' pnpm curriculum:sync --expect-environment=production
   ```

   A value set in the shell overrides `.env.local`, which keeps pointing at the development branch.
3. **Vercel Production variables.** Set these for the Production target only:
   - `DATABASE_URL`: the production branch's pooled connection string (sensitive).
   - `BETTER_AUTH_SECRET`: a new value from `openssl rand -base64 48` (sensitive). Never reuse the preview secret.
   - `BETTER_AUTH_URL=https://meetpiano.app`
   - `EMAIL_TRANSPORT=sendgrid`
   - `SENDGRID_API_KEY` (sensitive), `SENDGRID_FROM_EMAIL`, and `SENDGRID_FROM_NAME=MeetPiano`

   Do not add `DATABASE_URL_UNPOOLED` to Vercel. Variables apply only to deployments built after they are set.
4. **Decide privacy, consent, and public copy** (blockers 4 and 5) before inviting families.
5. **Merge** the pull request into `main` (owner action). Vercel builds the production deployment from `main` and assigns `meetpiano.app` to it.
6. **Smoke test** `https://meetpiano.app` with a real inbox:
   - `/`, `/learn/`, and `/learn/?lesson=L01` load, and a person hears the demo notes.
   - `/dev/mailbox` returns 404.
   - Sign up, receive the verification email from the authenticated domain, follow the link, add a learner, finish L01, and see it saved on `/family`.
   - Sign in from a second browser and see the same progress. Request a password reset and receive it.
   - Vercel runtime logs show no errors.
   - Delete the smoke-test family from `/family/account`, unless it is the account you will make an admin.
7. **First admin.** Once the owner's production account is verified:

   ```sh
   DATABASE_URL_UNPOOLED='<production direct URL>' pnpm admin:grant --email=<owner email> --expect-environment=production --note="owner"
   ```

   Confirm that `/admin` opens and `/admin/audit` shows `admin.granted`.
8. **Rollback, if needed.** In Vercel, promote `dpl_EP7LEzsG8MXVDZViL91YjMHj8HVE` (Instant Rollback). The static site needs no variables or database, and guest practice in each browser is untouched. Records already saved stay in Neon. To make the rollback permanent, revert the merge commit on `main`.

After launch, replace the preview setup. The three preview variables are scoped to the `cursor/meetpiano-v1-accounts-83a2` branch. Before other branches preview, add Preview-scoped `DATABASE_URL` (development branch, pooled), a preview-only `BETTER_AUTH_SECRET`, and `EMAIL_TRANSPORT=capture`, then delete the branch-scoped ones. Rotate the development `meetpiano_owner` password and the preview secret at the same time.

## Privacy and consent: open questions

These are decisions for the owner and counsel, not settled answers.

What v1 stores (the parent-facing list is on `/family/account`):

- **Grown-up:** email address, a password hash, verification status, and sign-in sessions with the browser and network address. No name is collected.
- **Learner:** a nickname of up to 24 characters and an optional preset avatar. No birth date, photo, or contact details.
- **Practice:** per-try summaries (activity, times, input type, progress, checkpoint results). No audio and no note-by-note playing.
- **Operations:** sign-in and sign-up rate-limit counters keyed by network address, refused-save diagnostics, and the admin audit log. Audit rows keep the admin's email and the target's opaque id after a family deletes its account.

Services that handle this data: Vercel (application and request logs), Neon (database, AWS us-east-1), and SendGrid (parent email addresses and message content).

1. **COPPA scope and parental consent.** The product is aimed at young children, although learners never sign in. Sign-up asks the adult to confirm they are a parent or guardian aged 18 or over, then verifies the email address. Counsel should decide whether that is adequate or which verifiable parental consent method is required, and what the direct notice to parents must say.
2. **Privacy notice and terms.** No privacy policy or terms page exists, and sign-up does not link to one.
3. **Retention.** Records stay until a parent deletes them. Deletion is immediate, and Neon's restore history keeps deleted rows for up to one day. Nothing yet purges expired sessions and verification tokens, rate-limit rows, refused-save diagnostics, inactive accounts, or audit rows. The 2025 amendments to the COPPA Rule add duties such as a written retention policy and a written information security program; counsel should confirm which apply and from when.
4. **Staff access.** Admins can read pilot families' email addresses, learner nicknames, and progress. Access is read-only, and opening a family's detail page writes an audit row; the family list is not audited. The notice should say so.
5. **Service terms.** Confirm data processing terms with Vercel, Neon, and SendGrid, and name them in the notice.
6. **Where families live.** US state privacy laws, and for families outside the US the GDPR or the UK Children's Code, may apply. Decide whether the pilot is US-only.
7. **Operational security.** Two-factor sign-in on the Vercel, Neon, SendGrid, and GitHub accounts; who holds production credentials; secret rotation; and incident response.

## Known limits that do not block launch

- Physical MIDI hardware is not verified, and no automated check listens to audio. Follow [`../evidence/midi/hardware-midi-protocol.md`](../evidence/midi/hardware-midi-protocol.md) with a real keyboard.
- A second tab left open on a signed-out or deleted learner leaves learner mode when the browser reports the change. In the moment before that, it can recreate that learner's local records in this browser, but it never sends them under another account.
- The e2e suite leaves synthetic `@e2e.meetpiano.test` accounts on the development branch.
- The Cloud Agent environment start command still runs `python3 -m http.server 3000 --directory dist`. `dist/` is now `public/`, so that server returns 404s. Use `pnpm dev`, or `pnpm build && pnpm start`, with a development `.env.local`.
