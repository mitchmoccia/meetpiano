# First Piano Journey — slice cards

Ordered cards **MP-00 through MP-11**. Status values: `verified` · `working` · `ready` · `queued`.

Acceptance summaries are taken from the runbook [`first-piano-journey.md`](first-piano-journey.md). Teaching detail is in [`../curriculum/beginner-v1.md`](../curriculum/beginner-v1.md).

MP-00 is marked **verified** because the mission and lesson specification docs are complete. MP-01 is **verified**. All later cards stay **queued**.

---

## MP-00 — Mission and lesson specification

| Field | Value |
| --- | --- |
| Status | **verified** |
| Branch | `piany/mp-00-mission-foundation` |
| Product change | Docs only. No `dist/` behavior change. |

**Learner outcome.** None in the running app. The written contract for L01–L04 and the outline through L24 exist so later slices can teach without inventing scope.

**Acceptance**

- Repo instructions, branches, and deploy config are verified and documented.
- Skill prerequisites, input modes, versioned lesson/attempt shape, and measurement limits are defined.
- Merge/deploy authority and which services actually work are recorded honestly.
- Work is split so MP-01 can produce a playable `/learn` result immediately.
- Excludes framework rewrite, a new design system, and fabricated teacher approval.

**Handoff.** Start MP-01 after Mitch chooses merge or stack.

---

## MP-01 — Playable `/learn` + L01

| Field | Value |
| --- | --- |
| Status | **verified** |
| Depends on | MP-00 |
| Branch | `piany/mp-01-learn-l01` |
| PR | https://github.com/mitchmoccia/meetpiano/pull/3 |

**Learner outcome.** A child and grown-up can open `/learn`, start L01 *Meet the keyboard*, hear notes after a gesture, explore high/low and black-key groups of two and three, and leave an on-device Explored or Practiced record. Posture is adult-observed and labeled.

**Acceptance**

- `GET /learn` returns the lesson surface (no 404). Marketing home at `/` is unchanged in purpose.
- L01 runs with existing Web Audio and at least touch plus computer keys.
- Demo audio is replayable. Guided exploration may accept any octave.
- Device-local disclosure is visible if any progress is stored.
- No accounts, no L02–L24 implementation, no framework rewrite.

**Handoff.** MP-02 can add the shared teaching loop without restating L01 copy.

---

## MP-02 — Teaching-loop engine

| Field | Value |
| --- | --- |
| Status | **queued** |
| Depends on | MP-01 |

**Learner outcome.** Every implemented lesson can move through explanation → visual demo → replayable audio → guided practice with optional hints → independent check without hints → transfer → remediation.

**Acceptance**

- One shared loop used by L01 and ready for L02–L04.
- Attempt records persist the versioned shape in `beginner-v1.md`.
- Hints can be hidden for independent checks.
- No new design system. Reuse current typography and piano chrome.

---

## MP-03 — L02 Find C

| Field | Value |
| --- | --- |
| Status | **queued** |
| Depends on | MP-02 |

**Learner outcome.** The learner finds C from the two-black-key landmark, then finds C in a new register without a glow hint.

**Acceptance**

- Guided: two-black-key group → nearest C. Exact pitch required when a register is named.
- Independent: a different C, no glow.
- Adult-observed fingering is not required for “found C.”
- Common-error remediation from the L02 contract is present.

---

## MP-04 — L03 Neighbors C–D–E

| Field | Value |
| --- | --- |
| Status | **queued** |
| Depends on | MP-03 |

**Learner outcome.** The learner plays C, D, and E as adjacent white keys with a demonstrated fingering, then a new three-note order without highlight.

**Acceptance**

- Visual and audio demo of C–D–E and of right-hand fingers 1–2–3. Fingering success is adult-observed.
- Independent check: a new order (not C–D–E and not the marketing-site sequences alone) with hints off.
- Pitch-class may be allowed in guided exploration; independent/transfer follow the L03 exact-pitch rule when a register is specified.

---

## MP-05 — L04 First little tune

| Field | Value |
| --- | --- |
| Status | **queued** |
| Depends on | MP-04 |

**Learner outcome.** The learner plays the original home phrase *Little Wave*, a related transfer phrase, and a later replay of the home phrase.

**Acceptance**

- Home phrase and transfer phrase match `beginner-v1.md` (original C–D–E music, not a published method piece).
- Independent check is without hints.
- Later replay can occur in the same visit after a short break or on a later device-local session.
- Marketing mini-adventure on `/` remains a separate preview.

---

## MP-06 — Device-local progress and evidence states

| Field | Value |
| --- | --- |
| Status | **queued** |
| Depends on | MP-01 (can stack after MP-05) |

**Learner outcome.** A grown-up can see Explored / Practiced / Independent / Retained for lessons the device has actually attempted, with a clear “saved on this device only” disclosure.

**Acceptance**

- States match the curriculum contract. No silent promotion.
- Posture and fingering cannot reach Independent without an adult-observed mark.
- Reload keeps device-local records. Marketing XP on `/` stays session-only.
- No accounts. No server write.

---

## MP-07 — Input modes and adult-observed labels

| Field | Value |
| --- | --- |
| Status | **queued** |
| Depends on | MP-01 |

**Learner outcome.** The same lesson can be played by touch, computer keys, or optional Web MIDI. The UI states what the computer can and cannot observe.

**Acceptance**

- All three input modes work on `/learn` where the browser supports them.
- MIDI permission failure falls back to on-screen keys without blocking the lesson.
- Adult-observed prompts exist for posture (L01) and demonstrated fingering (L03+).
- Accessible alternatives from each lesson contract are listed in-product, not only in docs.

---

## MP-08 — L05–L10 sequence

| Field | Value |
| --- | --- |
| Status | **queued** |
| Depends on | MP-05, MP-02 |

**Learner outcome.** The learner continues the First Piano Journey through F and G, finger names, steps, skips, a steady pulse, and the C five-note path, using the outlines in `beginner-v1.md`.

**Acceptance**

- L05–L10 exist as playable lessons with the shared loop.
- Full teaching contracts may be expanded from the outlines in this slice or a follow-up; outlines must not be silently treated as finished copy.
- Measurement limits still apply.

---

## MP-09 — L11–L16 sequence

| Field | Value |
| --- | --- |
| Status | **queued** |
| Depends on | MP-08 |

**Learner outcome.** Left-hand C, hands taking turns, the three-black-key landmark, meeting at middle C, a longer C-neighborhood tune, and quiet/strong.

**Acceptance**

- L11–L16 playable from the outlines.
- Two-hand work does not claim coordination mastery from MIDI alone.
- Dynamics are relative (softer vs stronger), not studio-grade velocity scoring.

---

## MP-10 — L17–L24 and later review

| Field | Value |
| --- | --- |
| Status | **queued** |
| Depends on | MP-09 |

**Learner outcome.** Long and short notes, smooth vs separate, a known tune with specified fingering (adult-observed), a held left-hand C, question and answer, memory replay, a short put-together piece, and a share/review close.

**Acceptance**

- L17–L24 exist as playable lessons from the outlines.
- Later review of L01–L04 can set Retained only after a gap and a successful independent replay, per the contract.
- No fabricated performance or jury language.

---

## MP-11 — Export/import, disclosure, mission closeout

| Field | Value |
| --- | --- |
| Status | **queued** |
| Depends on | MP-06 |

**Learner outcome.** A grown-up can export this device’s First Piano Journey records and import them on another browser they control. Disclosure remains honest.

**Acceptance**

- Export is a readable file (JSON is sufficient) of lesson/attempt records only. No account tokens.
- Import validates `curriculumVersion` and lesson IDs. It does not invent Independent or Retained states.
- Mission closeout updates status docs. Production merge/deploy still requires Mitch.
- Still no billing, profiles, or educator-approval badge.

---

## Status legend

| Status | Meaning |
| --- | --- |
| verified | Slice acceptance met and recorded |
| working | Slice is in progress |
| ready | Spec is sufficient to start immediately |
| queued | Blocked only by earlier slices or a merge-or-stack decision |
