# First Piano Journey — MP-11 release verification packet

Materials for Mitch and Gort. This packet does **not** merge, promote production, change DNS, or change the Vercel project. It does **not** contact educators or learners.

Related: [`first-piano-journey.md`](first-piano-journey.md) · [`first-piano-journey-slices.md`](first-piano-journey-slices.md) · [`first-piano-journey-status.md`](first-piano-journey-status.md) · [`../evidence/first-piano-journey/mp-11.md`](../evidence/first-piano-journey/mp-11.md) · N09 fixture [`../../scripts/fixtures/n09-docs-tip-refresh.json`](../../scripts/fixtures/n09-docs-tip-refresh.json) · N10 readiness fixture [`../../scripts/fixtures/n10-pilot-readiness.json`](../../scripts/fixtures/n10-pilot-readiness.json)

## Current live (N09, 2026-09-11)

Re-verified git `main` tip at the start of N09: **`6ea24b9d36cfb71a07d5fb62b87451ded4456d62`** (N08 merge, PR #24). First Piano Journey **L01–L24** is on that tip. Do not treat former tip `3da09b9` as current.

| Field | Fact now |
| --- | --- |
| Current live git tip | `6ea24b9d36cfb71a07d5fb62b87451ded4456d62` |
| Live lessons | **L01–L24** (First Notes through Expression; Checkpoint B) |
| Live `/learn` worlds | Six: First Notes, Rhythm Club, Read and play, Left hand, Together, Expression |
| Brand `/learn` | `https://meetpiano.app/learn` returned HTTP 200 on 2026-09-11 and describes twenty-four jobs (L01–L24). N09 does not deploy. |
| Hardware MIDI | **Unverified** (N07). No filled PASS log. |
| Learning validation | **Pending**. No educator review, no learner sitting, no efficacy claims. |
| Browser honesty | Chrome desktop on the Cloud Agent VM is **simulated** (N08). Safari, iPadOS, and Firefox are **BLOCKED**. |
| Former tip (not current) | `3da09b909fc54aaf54f0be8b00b374c3adf5cf5f` was `main` at the MP-11 inspect (PR #9 / MP-06, then **L01–L12**). Historical only. |

## Status labels (accurate)

| Label | Meaning now |
| --- | --- |
| **Engineering preview ready on merged `main`** | Software, fixtures, and Chrome-on-this-VM checks cover L01–L24 plus kid/grown-up UX. That engineering preview is now on `main` @ `6ea24b9d36cfb71a07d5fb62b87451ded4456d62`. It is not learning validation. |
| **Learning validation pending** | No educator review, no learner sitting, no classroom pass. Leftover neighborhood outlines remain unauthored. Do not mark the journey educator-approved. |
| **Live brand is merged `main` only** | Current live git tip is `6ea24b9d36cfb71a07d5fb62b87451ded4456d62`. Live `/learn` is First Notes + Rhythm Club + Read and play + Left hand + Together + Expression (**L01–L24**), device-local evidence lanes, export/import, MP-10 UX, N01–N08 honesty, and the Xpancom copyright. |

Export/import and disclosure already shipped in **MP-06**. This slice does not re-implement them.

## What is live now

Inspected **2026-09-11** against `main` @ `6ea24b9d36cfb71a07d5fb62b87451ded4456d62`. The 2026-09-09 live-vs-stacked table (L01–L12 on brand vs L01–L24 on stacked PRs) is no longer current.

| Surface | Current live (`main` @ `6ea24b9d36cfb71a07d5fb62b87451ded4456d62`) |
| --- | --- |
| Marketing `/` | Mini-adventure, five marketing worlds, learn-entry to the six `/learn` units (N02). Home nav says **Learn**. |
| `/learn` worlds | Six: First Notes, Rhythm Club, Read and play, Left hand, Together, Expression |
| Lessons | L01–L24 (Checkpoint B) |
| Kid yellow job / Hear the words / Pause | Present (MP-10) |
| Grown-up view `?view=grown-up` | Present |
| First-sit setup strip | Present (N04) |
| Device-local progress + export/import | Present (MP-06), plus the N05 device-switch warning and N06 Enough for today closer |
| Copyright | © year Xpancom, LLC |
| Hardware MIDI | Unverified (N07) |
| Cross-browser | Chrome desktop **simulated**; Safari / iPadOS / Firefox **BLOCKED** (N08) |

Merged stack heads that are now ancestors of the current tip (historical; not a pending stack):

| PR | Branch | Head SHA | Base | Preview (engineering only) |
| --- | --- | --- | --- | --- |
| [#10](https://github.com/mitchmoccia/meetpiano/pull/10) | `piany/mp-07-left-hand` | `b901df6dfeab91d0305e1fc4ade590e2264a22c3` | `main` | `meetpiano-git-piany-mp-07-left-hand-mitchmoccias-projects.vercel.app` |
| [#11](https://github.com/mitchmoccia/meetpiano/pull/11) | `piany/mp-08-together` | `a5e2485ae02dceebe7065591606ad07688f65375` | #10 branch | `meetpiano-git-piany-mp-08-together-mitchmoccias-projects.vercel.app` |
| [#12](https://github.com/mitchmoccia/meetpiano/pull/12) | `piany/mp-09-expression-recital` | `980bf17a22223a4279ac50ccca3cf0814d454307` | #11 branch | `meetpiano-git-piany-mp-09-expressi-a16b49-mitchmoccias-projects.vercel.app` |
| [#13](https://github.com/mitchmoccia/meetpiano/pull/13) | `piany/mp-10-kid-grownup-ux` | `2fdcfad0e8bdc62bb6511f0790855c532a0cc198` | #12 branch | `meetpiano-git-piany-mp-10-kid-grownup-ux-mitchmoccias-projects.vercel.app` |
| [#14](https://github.com/mitchmoccia/meetpiano/pull/14) | `piany/mp-11-release-packet` | see evidence table / branch tip | #13 branch | draft only; not production |

`www.meetpiano.app` still does not resolve. Branch `cursor/setup-cloud-agent-env-d108` was left untouched.

## 1. Complete-flow verification notes

Focused checks on this VM, plus prior slice evidence. This is not a new learner study.

### Marketing static site

| Check | Result | Evidence |
| --- | --- | --- |
| `GET https://meetpiano.app` | HTTP 200, Vercel, title MeetPiano | Re-checked 2026-09-11 |
| `GET https://meetpiano.app/learn` | HTTP 200; meta describes twenty-four jobs (L01–L24) | N09, 2026-09-11 |
| `GET https://meetpiano.vercel.app` | HTTP 200 | This packet; re-checked 2026-09-11 |
| Current live git tip | `6ea24b9d36cfb71a07d5fb62b87451ded4456d62` / PR #24 (N08) | Re-verified from `origin/main` at N09 start. Former `3da09b9` / PR #9 is not current. |
| Mini-adventure C–D–E | Still completes; XP is session-only | [mp-01](../evidence/first-piano-journey/mp-01.md) … [mp-10](../evidence/first-piano-journey/mp-10.md); re-checked locally this slice |
| Marketing worlds | Six marketing panels. N02 deep-links each into the matching `/learn` unit. They are still marketing copy, not a second catalog. | `dist/app.js`; N02 fixture |
| FAQ / memberships | Still “in the making” for Adventure/Family. Must not be read as “L01–L24 is the launched full app” | Public-copy constraints below |
| Copyright | Xpancom, LLC on `/` and `/learn` | [mp-07](../evidence/first-piano-journey/mp-07.md); `copyright-check.mjs` |

### Learning flows L01–L24 (focused)

Each unit was fixture-checked and given a Chrome smoke on its first open lesson. Full teaching loops live in the linked evidence. Do not treat this table as a human beginner pass.

| Unit | Lessons | Focused check this packet | Prior evidence |
| --- | --- | --- | --- |
| First Notes | L01–L04 | Hub open; L01 yellow job, one-octave piano, Pause/Exit; unlocks unchanged | [mp-01](../evidence/first-piano-journey/mp-01.md), [mp-03](../evidence/first-piano-journey/mp-03.md), [mp-10](../evidence/first-piano-journey/mp-10.md) |
| Rhythm Club | L05–L08 | Locked until L04 Independent; L05 clock take still scores on the audio clock | [mp-04](../evidence/first-piano-journey/mp-04.md) |
| Read and play | L09–L12 | Locked until L08 Independent; L09 F/G + L11 staff still load | [mp-05](../evidence/first-piano-journey/mp-05.md) |
| Left hand | L13–L16 | Locked until L12 Independent; L13 two-room piano; no L17 on a Left-hand-only seed | [mp-07](../evidence/first-piano-journey/mp-07.md) |
| Together | L17–L20 | Locked until L16 Independent; L17 left-room prep + stand-in copy | [mp-08](../evidence/first-piano-journey/mp-08.md) |
| Expression | L21–L24 | Locked until L20 Independent; L21 quiet/strong copy; L24 recital shell; 24 cards when prereqs met | [mp-09](../evidence/first-piano-journey/mp-09.md) |
| Kid / grown-up UX | all | Hear-the-words failure stays visual; grown-up view invents no L24; reset/export stay local | [mp-10](../evidence/first-piano-journey/mp-10.md) |
| Progress honesty | all | Separate lanes; import cannot invent Independent/Retained; touch is never MIDI verified | [mp-06](../evidence/first-piano-journey/mp-06.md) |
| Input | all | Held-key / demo-ignored / exact-pitch fixtures still pass. **Physical MIDI unverified.** | [mp-02](../evidence/first-piano-journey/mp-02.md) |

Software re-run this slice (stack tip): `node --check` plus `mp-01-check` through `mp-11-check` and `copyright-check.mjs`.

### Fixes found during verification

| Item | Action |
| --- | --- |
| Home nav still said **First Notes** while stacked `/learn` has six worlds | Small honesty fix: nav label is **Learn**. Marketing worlds 03–05 stay panels without new `/learn` buttons. |
| Live FAQ still describes only the mini-adventure as ready | Not rewritten here (marketing source stays). Recorded as a promote-time copy constraint. |
| Hub `null` text from omitted continue nodes | Already fixed on the stack in MP-07 (`008a0ca`). No new occurrence this packet. |

No other clear product bugs were found in the focused pass. Leftover outlines (later house, middle C, long tune, smooth/separate, named fingers, held-C review) stay unbound.

## 2. Honest support matrix

Claim only what was actually exercised. Empty cells are **unverified**.

| Claim | Evidence | Status |
| --- | --- | --- |
| Chrome desktop (Linux VM) + on-screen keys | MP-01–MP-10 walkthroughs; this packet | Checked |
| Chrome desktop + computer keys | MP-01–MP-03 notes; mapping still in product | Checked in earlier slices |
| Chrome emulated 390×844 + reduced motion | [mp-10](../evidence/first-piano-journey/mp-10.md) | Checked (emulated, not a physical phone) |
| Web MIDI API present in Chrome | [mp-02](../evidence/first-piano-journey/mp-02.md) | API present; permission denied / unused |
| **Hardware MIDI keyboard** | None | **Unverified** |
| Safari / Firefox / iOS / iPadOS / Android | [N08 critical-path matrix](../evidence/browsers/critical-path-matrix.md) | **BLOCKED** in N08 (not silent green). Still untested here. |
| Real tablet or phone touch | None (viewport only) | **Unverified** |
| Spoken words on a real voice engine | MP-10 fixtures + Chrome speak button | Failure path checked; voice quality **unverified** |
| Screen reader / full WCAG audit | None | **Unverified** |
| `www.meetpiano.app` | DNS lookup 2026-09-08 and 2026-09-09 | Does not resolve |

Do not publish “works on every browser” or “MIDI verified.”

## 3. Pilot packet (materials only)

**Do not contact** anyone from this packet. Outreach stays blocked until Mitch says go.

The thin sitting outline that used to live here is replaced by the v1 pack:

**[`../pilots/first-piano-journey-v1/`](../pilots/first-piano-journey-v1/)**

| File | Use |
| --- | --- |
| [`README.md`](../pilots/first-piano-journey-v1/README.md) | Purpose, 3–5 family cap, usability-not-efficacy success, Chrome evidence limit, device-local honesty |
| [`readiness-checklist.md`](../pilots/first-piano-journey-v1/readiness-checklist.md) | Pack ↔ live agreement (N10). Materials only. **DO NOT SEND.** |
| [`session-script.md`](../pilots/first-piano-journey-v1/session-script.md) | What the facilitator says (setup strip, L01→toward L04, grown-up view, export warning, Enough for today) |
| [`observation-checklist.md`](../pilots/first-piano-journey-v1/observation-checklist.md) | Setup friction, stalls, assistance, tools, input mode; adult posture/fingers kept separate |
| [`grown-up-prompt.md`](../pilots/first-piano-journey-v1/grown-up-prompt.md) | Short grown-up sheet — no grading language |
| [`recruiting-notes.md`](../pilots/first-piano-journey-v1/recruiting-notes.md) | Draft invite marked **DO NOT SEND until Mitch authorizes outreach** |

Still true: no educator names as “approved,” no learning-effectiveness claims, no recording upload, tests alone do not authorize a live release.

## 4. Merge order recommendation (#10 → #13, then this packet)

N09: the MP-07–MP-11 stack and N01–N08 are already on `main` @ `6ea24b9d36cfb71a07d5fb62b87451ded4456d62`. The list below is the historical MP-11 recommendation, not a pending merge list. This slice does **not** merge or deploy.

Merge **only** after Mitch approval. Suggested order, one PR at a time, no force-push, no rebase-onto-main mid-stack unless a conflict appears:

1. **#10** `piany/mp-07-left-hand` → `main` (L13–L16). After merge, retarget **#11** to `main` if GitHub still points at the old base.
2. **#11** `piany/mp-08-together` → `main` (L17–L20). Retarget **#12** if needed.
3. **#12** `piany/mp-09-expression-recital` → `main` (L21–L24). Retarget **#13** if needed.
4. **#13** `piany/mp-10-kid-grownup-ux` → `main` (kid/grown-up UX).
5. **This packet** `piany/mp-11-release-packet` → then `main` (docs + Learn nav). Or squash the packet onto `main` after #13 if the stack is already fast-forward.

Do not merge #11 before #10. Do not promote a preview alias to `meetpiano.app`. Do not create a second Vercel project.

After each merge: run `node --check dist/app.js dist/js/*.js dist/js/lessons/*.js dist/learn/learn.js` and `node scripts/mp-01-check.mjs` through the highest shipped `mp-xx-check.mjs` plus `copyright-check.mjs`.

## 5. Post-merge verification checklist (`meetpiano.app/learn`)

The stack is on `main` @ `6ea24b9d36cfb71a07d5fb62b87451ded4456d62`. Use this as a live `/learn` verification list. N09 does not merge or deploy.

- [ ] `https://meetpiano.app` still plays the three-mission mini-adventure. Session XP still resets on reload.
- [ ] Footer is © {year} Xpancom, LLC on `/` and `/learn`.
- [ ] Home nav **Learn** opens `/learn`. Learn-entry lists all six units.
- [ ] `/learn` shows **six** worlds and **24** cards. Fresh device: only L01 open.
- [ ] Worlds: First Notes, Rhythm Club, Read and play, Left hand, Together, Expression.
- [ ] Locked copy still names the real gate (L04 / L08 / L12 / L16 / L20 / L23 as authored).
- [ ] L01: yellow job, Hear the words, Pause / Exit / Resume, one-octave piano.
- [ ] `/learn/?view=grown-up`: honesty includes not a login and not privacy protection. No invented L24.
- [ ] Export / import / reset remain device-local. Import cannot invent Independent or Retained.
- [ ] L13 two-room piano after L12 Independent. L17 stand-in copy after L16 Independent. L21 / L24 shells after their gates.
- [ ] Marketing worlds 03–05 still do not pretend to be the six `/learn` worlds unless copy is updated on purpose.
- [ ] FAQ is updated **or** left clearly about memberships/coaching — not silently implying the 24-lesson path is unreleased if it is live.
- [ ] Hardware MIDI still not claimed. No teacher-approved / grade / guaranteed-outcome copy.
- [ ] `www.meetpiano.app` still optional; do not block on it.
- [ ] Current live git tip recorded: `6ea24b9d36cfb71a07d5fb62b87451ded4456d62`. Former MP-06 SHA `3da09b9` / `dpl_CMUa49cvzShs9x59RDrpQVJ6iMJ3` is historical, not current.

## 6. Public-copy constraints

`/learn` must not claim:

- teacher approved, educator-approved, or certified syllabus
- grade 1 complete
- guaranteed outcomes, including guaranteed improvement
- full beginner proficiency
- MIDI-verified hardware or a MIDI-verified release
- that tests alone authorize a live release

Existing marketing voice (“getting better,” “confident two-handed playing,” “full learning app is in development”) stays on `/` as authored. When the stack is promoted, do **not** reuse that voice to say the 24-lesson path is a launched replacement for a teacher or a finished membership product.

Honest lines that may be used:

- First Piano Journey is a device-local beginner path on `/learn`.
- L01–L24 is on merged `main` @ `6ea24b9d36cfb71a07d5fb62b87451ded4456d62`. Learning validation is pending. Hardware MIDI is unverified.
- On-screen keys are a stand-in. MIDI reports pitch, time, and velocity if sent.
- A nearby grown-up marks sitting, fingers, hand choice, and listening.
- Chrome desktop evidence is simulated. Safari, iPadOS, and Firefox are BLOCKED.

The packet **must not claim** learning effectiveness.

## 7. Recovery plan

| Event | What to do |
| --- | --- |
| Bad production after a later change | Roll back to a SHA Mitch records. Former MP-06 deploy `dpl_CMUa49cvzShs9x59RDrpQVJ6iMJ3` (`main` @ `3da09b9`, then L01–L12) is historical. Current live git tip is `6ea24b9d36cfb71a07d5fb62b87451ded4456d62` (L01–L24). No DNS change from this slice. |
| Need to stop mid-stack | Historical MP-11 note. The stack is already on `main`. Do not treat L01–L12 as the current live range. |
| Families already used a preview | Progress is `localStorage` key `meetpiano:beginner-v1` on **that browser**. Rolling back the site does not upload or delete those records. |
| Corrupt store | Existing pink notice + reset path from MP-01/MP-06/MP-10. Reset asks first. |
| MIDI panic | On-screen and computer keys stay available. Do not ship a “reconnect required” blocker. |
| Speech engine missing | Yellow job stays on screen (MP-10). |
| Wrong public claim slips out | Revert to the honesty lines in §6. Do not add effectiveness percentages. |

Hourly resume routines are still **not** configured.

## 8. Authorization checklist (Mitch / Gort)

- [ ] Gort accepts this packet as engineering-preview closeout, not as learning validation.
- [ ] Mitch authorizes merge order #10 → #13 (and this packet) **or** asks for changes.
- [ ] Mitch authorizes production promote separately. Tests alone do not authorize a live release.
- [ ] Hardware MIDI remains unlabeled until a real instrument pass is written.
- [ ] No educator names or “approved” badges without a later human review.
