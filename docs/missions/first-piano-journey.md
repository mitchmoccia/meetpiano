# First Piano Journey — mission runbook

Canonical mission specification for MeetPiano slice work **MP-00 through MP-11**. This file is the runbook. Slice cards live in [`first-piano-journey-slices.md`](first-piano-journey-slices.md). Live status lives in [`first-piano-journey-status.md`](first-piano-journey-status.md). The teaching contract lives in [`../curriculum/beginner-v1.md`](../curriculum/beginner-v1.md).

MP-00 establishes this mission and the first lesson specification only. It does **not** rewrite the app framework, add a design system, or change `dist/` product behavior.

## Mission

Help a young beginner and a nearby grown-up take a first, honest piano journey: sit at a keyboard, hear high and low, find C from the two-black-key landmark, play C–D–E as neighbors, and finish a short original three-note tune they can play again later.

The product name for this path is **First Piano Journey**. Curriculum version: **beginner-v1**. The learner-facing surface for later slices is **`/learn`**. That path does not exist on production today (HTTP 404 as of the inspection below). MP-01 is scoped to ship a playable `/learn` result immediately from this spec.

This phase does not claim that the app replaces a teacher, that MIDI proves technique, or that any sequence is educator-approved. Those claims are out of scope and must not be fabricated.

## Scope

### In scope for the mission (MP-00 through MP-11)

- One versioned beginner curriculum (`beginner-v1`) with full teaching contracts for L01–L04 and outlines for L05–L24.
- A playable `/learn` path that reuses the existing dependency-free static site, Web Audio, and input patterns rather than replacing them.
- Device-local progress with four evidence states: Explored, Practiced, Independent, Retained.
- Honest measurement limits, including adult-observed labels for posture, hand shape, and fingering.
- Later-slice export/import of device-local records. No accounts or cloud progress in this mission.
- Preview deploys on the existing Vercel project so a grown-up can try `/learn` without a production merge.

### Out of scope (explicitly excluded)

- Broad framework rewrite, new bundler, or new design system.
- Accounts, family profiles, backend, billing, or email capture.
- Camera, microphone, or sustain-pedal assessment.
- Fabricated teacher endorsement or learning-effectiveness claims.
- Changing the marketing mini-adventure in `dist/` except where a later slice must add a docs-only path note or a minimal `/learn` entry that leaves the authored marketing source intact.
- Merging or deleting branch `cursor/setup-cloud-agent-env-d108`.

### Device and progress scope (this phase)

Progress is **device-local only**. Records stay on the browser that created them. The UI must disclose that fact when progress is shown. Export and import are planned for later slices (see MP-11), not this one. Reloading the current marketing playground still resets session-only XP; that existing behavior is not curriculum progress.

## Permissions and authority

| Action | Who |
| --- | --- |
| Push feature branches and open or update draft PRs | Piany |
| Merge to `main` | Mitch approval required |
| Production deploy / promote the custom domain | Mitch approval required |
| Change Vercel project, DNS, or billing | Mitch only |
| Mark a slice verified in this runbook | Piany may propose; Mitch confirms on merge |

Piany may prepare production-ready PRs. Piany may not merge to `main` or ship production without Mitch’s approval.

## Services that work — and that do not

Recorded 2026-09-08. Only list what was actually checked.

| Service | Status | Evidence |
| --- | --- | --- |
| GitHub repo `mitchmoccia/meetpiano` | Works | Clone, branch, and PR access via the existing account |
| Vercel team `mitchmoccias-projects` | Works | Project `meetpiano` (`prj_1Qh2hfNb231cT3oqKwbH1jnkbLl9`) is reachable; preview/deploy access exists on the existing account |
| Vercel project `meetpiano` | Works | `framework: null`, empty install/build, `outputDirectory: dist` in repo `vercel.json`; production alias `meetpiano.vercel.app` returns HTTP 200 |
| Custom domain `https://meetpiano.app` | Works | HTTP 200 from Vercel on 2026-09-08 (~18:23 America/New_York). Brand domain is already live. |
| `www.meetpiano.app` | Does not resolve | DNS lookup failed on 2026-09-08. Not a blocker for this mission. |
| `/learn` on production | Missing | `https://meetpiano.app/learn` returns HTTP 404. Expected until MP-01. |
| GitHub-linked Vercel project `meetpiano-app` | Present, secondary | `prj_2Y10k6je8CHOKAAdWHdtZBePoqat` is linked to this repo and also serves the static site. Do not treat it as the brand-domain project. Confirm with Mitch before changing it. |
| Hourly resume routines | Not configured | No scheduled resume, heartbeat, or slice-runner automation is set up yet. |

## Inspected baseline (live remote)

Inspected **2026-09-08 ~18:23 America/New_York**.

- Repo: https://github.com/mitchmoccia/meetpiano
- Live `main` SHA: `2385bd72a176c140aaf4a50849d197adea69579b`
- Message: `Import complete MeetPiano site, artwork, piano demo, and Vercel configuration`
- Extra branch `cursor/setup-cloud-agent-env-d108` is **+1 commit** (`b141d3489fb29845937a63d5361b21e9ca3125aa`) adding only `.cursor/environment.json`. Do not merge or delete it. Leave it alone.
- Hosting: Vercel project `meetpiano` in `mitchmoccias-projects`; `vercel.json` uses `outputDirectory: dist` and empty build/install commands.
- `dist/` is authored source, not generated output, and stays tracked.

### Product behavior on that SHA

- Dependency-free static site. No package.json build. Documented local check: `node --check dist/app.js`.
- `dist/app.js` has three C–D–E missions. Assessment uses pitch-class (`note % 12`), so any octave of C, D, or E counts.
- Web Audio starts after a user gesture. Touch/pointer, computer keys (A S D F G H J and sharps on W E T Y U), and optional Web MIDI are wired.
- XP is session-only (20 per mission, 60 per run) and resets on reload or replay.
- Five “worlds” on the journey map are marketing panels only. They do not unlock lessons.
- No accounts, backend, curriculum engine, or billing. Membership cards other than the free preview are labeled “In the making.”
- MIDI cannot assess fingering, posture, sustain pedal, or microphone input. The README already says this.

## Decisions (MP-00)

1. **Docs first, product second.** MP-00 ships specification only. The marketing site stays as authored.
2. **`/learn` is the curriculum surface.** MP-01 adds it. The home-page mini-adventure remains a preview, not the lesson engine.
3. **Reuse, do not rewrite.** Later slices extend the existing static files, Web Audio, and input handling. No new framework.
4. **Pitch policy is lesson-specific.** Early exploration may accept a pitch-class in any octave. Location and notation checks require an exact MIDI pitch when the lesson names a register.
5. **Progress is device-local this phase.** Disclose it. Export/import comes later. No silent cloud sync.
6. **Evidence states are Explored / Practiced / Independent / Retained.** MIDI or tap data alone cannot promote a posture or fingering skill past adult-observed Independent.
7. **Original curriculum copy.** Do not quote or reconstruct Faber, RCM, or other published method text.
8. **Production stays gated.** Mitch approval is required to merge or deploy. Piany prepares branches and PRs.

## Acceptance gates for MP-00

- [x] Repo instructions, branches, and deploy config verified and documented (this file).
- [x] Skill prerequisites, input modes, versioned lesson/attempt shape, and measurement limits defined in `docs/curriculum/beginner-v1.md`.
- [x] Merge/deploy authority and working services recorded honestly (no hourly resume routines).
- [x] Work split so MP-01 can produce a playable `/learn` result immediately (see next slice).
- [x] Excluded: framework rewrite, full new design system, fabricated teacher approval.

## Work split — start MP-01 here

MP-01 should be able to ship a playable result without waiting for L02–L24 implementation.

**MP-01 target:** a static `/learn` URL that loads L01 (“Meet the keyboard”) using the existing piano, Web Audio, and input modes. Learner can start the lesson, hear demo notes after a gesture, explore high/low and black-key groups, and record an Explored or Practiced attempt on-device. Adult-observed posture is a labeled checkbox or prompt, not a MIDI score.

Do not build accounts, export/import, or the remaining lessons in MP-01. Point implementers at L01 in [`../curriculum/beginner-v1.md`](../curriculum/beginner-v1.md) and at the MP-01 card in [`first-piano-journey-slices.md`](first-piano-journey-slices.md).

After MP-00 is merged or Mitch chooses to stack, the next action is **start MP-01**.

## Slice index

| ID | Title | Status after MP-00 |
| --- | --- | --- |
| MP-00 | Mission and lesson specification | Verified (docs complete) |
| MP-01 | Playable `/learn` + L01 | Ready |
| MP-02 | Teaching-loop engine | Queued |
| MP-03 | L02 Find C | Queued |
| MP-04 | L03 Neighbors C–D–E | Queued |
| MP-05 | L04 First little tune | Queued |
| MP-06 | Device-local progress and evidence states | Queued |
| MP-07 | Input modes and adult-observed labels | Queued |
| MP-08 | L05–L10 sequence | Queued |
| MP-09 | L11–L16 sequence | Queued |
| MP-10 | L17–L24 and later review | Queued |
| MP-11 | Export/import, disclosure, mission closeout | Queued |

Acceptance summaries for each card are in [`first-piano-journey-slices.md`](first-piano-journey-slices.md).
