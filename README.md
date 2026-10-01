# MeetPiano

MeetPiano is a piano-learning adventure for young learners and their grown-ups. Production domain: **meetpiano.app**.

The site is a Next.js App Router application on Vercel. Parents sign in with Better Auth, and family and practice records live in Neon Postgres through Drizzle. The First Piano Journey player (L01–L24) is still a static, build-free surface at `/learn`.

## Layout

- `public/`: the marketing page (`index.html`, `app.js`, `styles.css`) and the `/learn` player (`learn/`, `js/`, `assets/`), served as static files with their own strict CSP.
- `src/app/(site)/`: parent pages (`/signup`, `/signin`, `/family`, `/play`) and the internal `/admin` area.
- `src/app/api/`: Better Auth (`/api/auth/*`), learner context and attempt saves (`/api/learner/*`), and the family data export.
- `src/features/`: server logic by feature (auth, family, learner, progress, curriculum, admin).
- `src/db/schema/` and `drizzle/`: the Drizzle schema and its committed SQL migrations.
- `scripts/db/`: operator scripts for seeding, curriculum sync, and admin access.
- `tests/` (Vitest unit tests) and `e2e/` (Playwright journeys).
- `.openai/hosting.json`: identity of the earlier ChatGPT Sites publication. Vercel does not use it.

## How practice is kept

Guest practice on `/learn` needs no account and stays in this browser's `localStorage` under `meetpiano:beginner-v1`, as before. A signed-in parent picks who is playing at `/play`. The player then sends a bounded summary of each try at its checkpoints to `/api/learner/attempts`, and the server records it for that learner. Unsent tries wait in a queue keyed to that parent and learner, and are never sent after sign-out or under another account. A parent can bring one browser's guest practice into a learner from that learner's page, after confirming who played. Lesson content stays in code; the database holds the lesson list, content versions, and availability.

## Environment variables

| Variable | Used by | Notes |
| --- | --- | --- |
| `DATABASE_URL` | app | Neon pooled connection string for this environment's branch. |
| `DATABASE_URL_UNPOOLED` | migrations, scripts, e2e | Direct connection string. Keep it in `.env.local` or the operator's shell; Vercel does not need it. |
| `BETTER_AUTH_SECRET` | app | 32 or more random characters, different in every environment. |
| `BETTER_AUTH_URL` | app | Public origin. Production requires `https://meetpiano.app`. Previews use Vercel's branch URL instead. |
| `EMAIL_TRANSPORT` | app | `capture` stores email in the development database; `sendgrid` delivers it. Production accepts only `sendgrid`. |
| `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME` | app | Required with `sendgrid`. |
| `SEED_PARENT_PASSWORD` | `pnpm db:seed` | Password for the synthetic seed parents. |

`src/lib/env.ts` validates these on first use and names a failing field without printing its value. `.env.example` lists them with placeholders.

## Local development

```sh
pnpm install
cp .env.example .env.local   # point it at the Neon development branch
pnpm db:migrate
SEED_PARENT_PASSWORD='choose-a-password' pnpm db:seed
pnpm dev
```

`pnpm db:seed` syncs the curriculum and creates two synthetic families, `river.family@seed.meetpiano.test` and `harbor.family@seed.meetpiano.test`, with learners and practice. It is safe to rerun. With `EMAIL_TRANSPORT=capture`, verification and reset emails for reserved test domains appear at `/dev/mailbox`. That page returns 404 in production.

## Database

- **Migrations.** After changing `src/db/schema/`, run `pnpm db:generate`, review the new file in `drizzle/`, and commit it. `pnpm db:migrate` applies pending migrations to `DATABASE_URL_UNPOOLED`. Builds and app startup never migrate: run migrations by hand before deploying code that needs them, and keep them additive.
- **Branch marker.** Mark each Neon branch once, after its first migration, in the Neon SQL editor:

  ```sql
  insert into database_environment (environment) values ('development'); -- or 'production'
  ```

  Production deployments run only against a `production` marker. Previews, local servers, `pnpm db:seed`, and the e2e suite run only against `development`. `pnpm curriculum:sync` and the admin scripts require `--expect-environment=` and stop on a mismatch without changing anything.
- **Curriculum.** `pnpm curriculum:sync --expect-environment=production` mirrors the lesson catalog in `public/js/` into the database. Titles, unlock rules, and content versions follow the code; an admin's pause and ordering are kept. Run it before deploying a lesson change. Earlier content versions stay valid for tries already in progress.

## Admin access

Signing up never grants admin access. An operator with database access grants it to an existing account whose email is verified:

```sh
pnpm admin:grant --email=person@example.com --expect-environment=production --note="pilot operator"
pnpm admin:revoke --email=person@example.com --expect-environment=production
```

Both commands write an audit row. Signed-out visitors to `/admin` are sent to sign-in, signed-in accounts without access get a 404, and every admin page and action rechecks access on the server. Admins can pause, resume, and reorder lessons, view pilot families read-only, review refused saves, and read the audit log. There is no content editor, impersonation, or record editing.

## Email

Production sends verification and password-reset email through SendGrid's v3 Mail Send API, with click tracking off so links are not rewritten. Before launch, authenticate the `meetpiano.app` sending domain in SendGrid, create a restricted API key with Mail Send access only, and set the SendGrid variables in Vercel's Production environment. Production configuration is rejected without SendGrid settings.

## Checks

```sh
pnpm lint
pnpm typecheck
pnpm test          # Vitest unit tests in tests/
pnpm check:static  # player syntax and the static content checks
pnpm build
pnpm test:e2e      # Playwright, desktop Chrome and Pixel 7 profiles
```

`pnpm check:static` runs `node --check` on the player modules, then `scripts/mp-01-check.mjs` through `scripts/mp-11-check.mjs`, `scripts/copyright-check.mjs`, `scripts/aeo-check.mjs`, and `scripts/pilot-cta-check.mjs`.

`pnpm test:e2e` uses `pnpm start` on port 3100, so run `pnpm build` first. It reads `.env.local`, refuses any database not marked `development`, and leaves synthetic `@e2e.meetpiano.test` accounts on that branch. Set `E2E_BROWSER_CHANNEL=chrome` to use an installed Chrome, or run `pnpm exec playwright install chromium`. MIDI tests drive a simulated Web MIDI input. Physical MIDI hardware is not verified, and no automated check listens to audio: the tests confirm that notes are scheduled at the expected pitches.

## Deployment

The Vercel project `meetpiano` builds from `vercel.json` (Next.js, `pnpm build`, output `.next`) on Node 24.

- **Preview** deployments sit behind Vercel Authentication. They need Preview-scoped `DATABASE_URL` (development branch, pooled), `BETTER_AUTH_SECRET`, and `EMAIL_TRANSPORT=capture`. The variables set so far are scoped to the `cursor/meetpiano-v1-accounts-83a2` branch, so other branches need their own.
- **Production** needs its own values: the production branch's pooled `DATABASE_URL`, a new `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=https://meetpiano.app`, `EMAIL_TRANSPORT=sendgrid`, and the SendGrid variables. Migrate and mark the production branch before the first production deployment.

Cutover steps, launch blockers, and open privacy questions: [`docs/operations/v1-cutover.md`](docs/operations/v1-cutover.md).

## Rollback

- **App:** in Vercel, roll production back to the last static-site deployment, `dpl_EP7LEzsG8MXVDZViL91YjMHj8HVE`, or revert the merge on `main`. Guest practice keeps working. Learner practice recorded on the server stays in Neon until the app returns.
- **Schema:** migrations are additive. Fix forward with a new migration; never edit an applied one.
- **Data:** the Neon project keeps one day of restore history. Restore to a new branch, compare, then decide.

## Documentation

First Piano Journey mission and lesson specification: [`docs/missions/first-piano-journey.md`](docs/missions/first-piano-journey.md). Curriculum contract: [`docs/curriculum/beginner-v1.md`](docs/curriculum/beginner-v1.md). Current live status (N09): L01–L24 at `main` @ `6ea24b9d36cfb71a07d5fb62b87451ded4456d62` — [`docs/missions/first-piano-journey-status.md`](docs/missions/first-piano-journey-status.md). MP-11 release packet: [`docs/missions/first-piano-journey-release.md`](docs/missions/first-piano-journey-release.md). Pilot pack (materials only; outreach blocked until Mitch says go): [`docs/pilots/first-piano-journey-v1/`](docs/pilots/first-piano-journey-v1/). N10 readiness checklist (pack ↔ live; **DO NOT SEND**): [`docs/pilots/first-piano-journey-v1/readiness-checklist.md`](docs/pilots/first-piano-journey-v1/readiness-checklist.md). Hardware MIDI verification protocol (physical hardware is not verified until a filled PASS log exists): [`docs/evidence/midi/hardware-midi-protocol.md`](docs/evidence/midi/hardware-midi-protocol.md). Critical-path browser matrix (untested browsers are BLOCKED with a reason): [`docs/evidence/browsers/critical-path-matrix.md`](docs/evidence/browsers/critical-path-matrix.md).
