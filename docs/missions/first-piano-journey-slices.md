# First Piano Journey — slice cards

Ordered cards **MP-00 through MP-11**. Status values: `verified` · `working` · `ready` · `queued`.

Acceptance summaries are taken from the runbook [`first-piano-journey.md`](first-piano-journey.md). Teaching detail is in [`../curriculum/beginner-v1.md`](../curriculum/beginner-v1.md).

MP-00 is marked **verified** because the mission and lesson specification docs are complete. MP-01 is **verified** and merged to `main`. MP-02 is **software/fixture verified** (Gort accepted; hardware MIDI unverified — not a MIDI-verified release). MP-03 First Notes, MP-04 Rhythm Club, MP-05 Read and play, and MP-06 device-local progress are **working** and merged to `main`. MP-07 Left hand (L13–L16) is **working** on `piany/mp-07-left-hand`. MP-08 Together (L17–L20) is **working** on `piany/mp-08-together`. MP-09 Expression (L21–L24) is **working** on `piany/mp-09-expression-recital` (Checkpoint B). MP-10 kid-and-grown-up UX is **working** on `piany/mp-10-kid-grownup-ux`. MP-11 is the release verification packet on `piany/mp-11-release-packet` — **engineering preview ready on the stack**, **learning validation pending**, live brand still merged `main` only (L01–L12). Later leftover outlines stay **queued**. The original isolated MP-04/MP-05 cards (L03/L04) landed with Checkpoint A. Historical MP-05 (L04 First little tune) is recorded below as MP-05b. Historical MP-11 (export/import UI) landed with MP-06.

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
| PR | https://github.com/mitchmoccia/meetpiano/pull/3 (merged to `main`) |

**Learner outcome.** A child and grown-up can open `/learn`, start L01 *Meet the keyboard*, hear notes after a gesture, explore high/low and black-key groups of two and three, and leave an on-device Explored or Practiced record. Posture is adult-observed and labeled.

**Acceptance**

- `GET /learn` returns the lesson surface (no 404). Marketing home at `/` is unchanged in purpose.
- L01 runs with existing Web Audio and at least touch plus computer keys.
- Demo audio is replayable. Guided exploration may accept any octave.
- Device-local disclosure is visible if any progress is stored.
- No accounts, no L02–L24 implementation, no framework rewrite.

**Handoff.** MP-02 adds trustworthy physical-keyboard / MIDI input on the existing L01 loop.

---

## MP-02 — Trustworthy keyboard / MIDI input

| Field | Value |
| --- | --- |
| Status | **software/fixture verified** (Gort accepted; hardware MIDI unverified) |
| Depends on | MP-01 |
| Branch | `piany/mp-02-midi-input` |
| Base | `main` @ `13fbd6b29f0f78278a72e25ea0fbfb65e609a1aa` |
| PR | https://github.com/mitchmoccia/meetpiano/pull/4 (draft into `main`) |

**Learner outcome.** A grown-up can connect a compatible Web MIDI keyboard when the browser offers it, see clear connect / disconnect / unsupported copy, and know that on-screen and computer keys still work. Learner presses are counted once per hold. Demo audio never earns progress. Lessons can require an exact MIDI pitch or allow a pitch-class in any octave.

**Acceptance**

- Device setup UX: request access, list connected inputs, reconnect / disconnect messaging, honest unsupported or no-device fallback. On-screen and computer keys stay usable.
- Input normalization: note-on, velocity-zero note-off, repeated notes, held keys (no multi-count while held). Browser blur silences sound and does not keep incrementing a held key.
- Octave-aware assessment: exploratory lessons may accept pitch-class in any octave; location lessons can require exact MIDI pitch. Wired into the L01 player path and ready for L02+.
- Demo events stay separate from learner events. Demo notes never count toward progress.
- Each AttemptRecord stores `inputMode` and MIDI device identity when the browser exposes it.
- Simulated fixtures cover held key, note-off, wrong octave when exact is required, and ignored demo notes.
- Real hardware check is recorded separately. Do not claim a physical keyboard was verified unless one was actually used.
- Marketing `/` and `/learn` L01 still work. No Next.js rewrite. No Vercel / DNS changes.

**Handoff.** L02 can require exact pitch when a register is named. The L01 teaching loop remains the current lesson path.

---

## MP-03 — First Notes L01–L04 (Checkpoint A)

| Field | Value |
| --- | --- |
| Status | **working** (merged to `main`) |
| Depends on | MP-02 |
| Branch | `piany/mp-03-first-notes` (merged) |
| Base | `main` now includes this slice @ `96860fa8262bfe2f8a902910c55745054d21eeb5` |

**Learner outcome.** A beginner can explore the keyboard (L01), find C (L02), play neighboring C–D–E (L03), and complete the original *Little Wave* tune (L04) as a First Notes unit. The next activity unlocks only when this device is ready. No buttons lead to lessons beyond L04.

**Acceptance**

- Playable First Notes world at `/learn` with continue/resume and device-local disclosure.
- L01 path stays healthy at `/learn/?lesson=L01`. Marketing preview on `/` stays a separate playground.
- L02: two-black-key group → nearest C; independent C with no glow; new register via another MIDI C or adult mark; doorstep remediation present. Fingering is not required to find C.
- L03: visual/audio C–D–E and fingers 1–2–3; fingering is adult-observed; independent order is a changed pattern (not C–D–E and not the marketing sequences alone).
- L04: Little Wave and Wave the other way match `beginner-v1.md`; independent is without hints; later replay after a named pause can become Retained.
- Demos show keyboard geometry and intentional fingering. Hints fade. Help/replay do not erase saved progress.
- MIDI hardware remains **unverified**. No accounts, billing, educator-approval, or learning-effectiveness claims.

**Handoff.** First Notes is on `main`. Isolated historical L03/L04 cards below record the original split. MP-04 now means Rhythm Club.

---

## MP-04 — Rhythm Club L05–L08

| Field | Value |
| --- | --- |
| Status | **working** |
| Depends on | MP-03 |
| Branch | `piany/mp-04-rhythm-club` |
| Base | `main` @ `96860fa8262bfe2f8a902910c55745054d21eeb5` |

**Learner outcome.** After First Notes is Independent on this device, a beginner can hear a heartbeat (L05), hold long and tap short (L06), leave a rest empty (L07), and walk C–D–E–C on the beat (L08). Guided windows are wider than performance windows. Correct pitches at arbitrary times do not pass.

**Acceptance**

- Rhythm Club unit on `/learn` with unlock from L04 Independent. No buttons to L09+.
- Shared audio-clock transport and scoring (not rAF-only). Visual pulse may use rAF for display only.
- Guided vs performance modes differ by window size and helpers.
- Synthetic fixtures cover correct, early, late, missed, extra, releases, count-in, replay, tempo reduction, pause/resume, and disconnect without unfair failures.
- L08 rhythmic variation cannot pass by dumping C–D–E–C as fast as possible.
- Device-local progress. Hardware MIDI remains unverified.
- Marketing playground stays a separate preview. No Vercel / DNS changes.

**Handoff.** L05–L08 teaching is on this branch. Read and play (L09–L12) is the next unit. Neighborhood leftover skills (C five-note path, left-hand C, turns) wait for a later slice.

---

## MP-05 — Read and play L09–L12

| Field | Value |
| --- | --- |
| Status | **working** |
| Depends on | MP-04 |
| Branch | `piany/mp-05-read-and-play` |
| Base | `piany/mp-04-rhythm-club` @ `d144baa88357f69b90caf7a427b6bd3c3c2731db` |

**Learner outcome.** After Rhythm Club is Independent on this device, a beginner can meet F and G from the three-black-key landmark (L09), hear and play steps, repeats, and skips (L10), map known patterns onto a treble staff (L11), and read an original little tune from the staff (L12). Letter names start as helpers and come off. A new phrase checks reading, not a memorized C–D–E path. Ear activities and a short creativity choice sit beside notation. Exact preview pitches are required when a register is named.

**Acceptance**

- Read and play unit on `/learn` with unlock from L08 Independent. No buttons to L13+.
- L09–L12 full lesson loops from the expanded contracts in `beginner-v1.md`.
- Staff pitch, clef, duration, demo audio, and expected input use the same MIDI numbers and duration kind.
- Landmarks and relationships first; independent/transfer hide letter names.
- L12 Porch Steps is not Little Wave and not the L08 walk. Wrong-octave F/G fails when exact pitch is required.
- Device-local progress. Hardware MIDI remains unverified.
- First Notes and Rhythm Club stay healthy. Marketing playground stays a separate preview. No Vercel / DNS changes.

**Handoff.** L09–L12 teaching is on `main`. Left hand (L13–L16) is MP-07. Pentapath waits for a later slice.

---

## MP-04b — L03 Neighbors C–D–E (historical)

| Field | Value |
| --- | --- |
| Status | **working** (landed with MP-03 Checkpoint A) |
| Depends on | MP-03 |
| Branch | `main` |

**Learner outcome.** The learner plays C, D, and E as adjacent white keys with a demonstrated fingering, then a new three-note order without highlight.

**Acceptance**

- Visual and audio demo of C–D–E and of right-hand fingers 1–2–3. Fingering success is adult-observed.
- Independent check: a new order (not C–D–E and not the marketing-site sequences alone) with hints off.
- Pitch-class may be allowed in guided exploration; independent/transfer follow the L03 exact-pitch rule when a register is specified.

---

## MP-05b — L04 First little tune (historical)

| Field | Value |
| --- | --- |
| Status | **working** (landed with MP-03 Checkpoint A) |
| Depends on | MP-04 |
| Branch | `piany/mp-03-first-notes` |

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
| Status | **working** |
| Depends on | MP-01 (stacked after MP-05) |

**Learner outcome.** A grown-up can see Explored / Practiced / Independent / Retained for lessons the device has actually attempted, with a clear “saved on this device only” disclosure. A new visit recommends a next step from that evidence, not an identical retry.

**Acceptance**

- States match the curriculum contract. No silent promotion. Practiced, Independent, and Retained are stored and shown as separate lanes.
- Attempts persist assistance, tempo, input source, skill ids, and curriculum/skill versions. Touch practice cannot be labeled MIDI verified.
- Replay in the same visit cannot manufacture Retained. A new-session check revisits an earlier Independent skill with another pattern.
- Repeated misses switch to targeted easier work instead of the same hard check.
- Curriculum or skill-contract updates keep historical attempts and invalidate only affected live evidence.
- Device-local export/import validates versions and merges repeat-safe attempt IDs. Import cannot invent Independent or Retained.
- `/learn` hub shows a useful next-session recommendation.
- Posture and fingering cannot reach Independent without an adult-observed mark.
- Reload keeps device-local records. Marketing XP on `/` stays session-only.
- No accounts. No server write. Hardware MIDI remains unverified.

---

## MP-07 — Left hand L13–L16

| Field | Value |
| --- | --- |
| Status | **working** |
| Depends on | MP-06 |
| Branch | `piany/mp-07-left-hand` |
| Base | `main` @ `3da09b909fc54aaf54f0be8b00b374c3adf5cf5f` |

**Learner outcome.** After Read and play is Independent on this device, a beginner can meet the left hand (L13), read a bass-clef walk (L14), take turns in a musical conversation (L15), and share one pulse with two parts (L16). Both clefs and both keyboard rooms can show. MIDI reports pitch and time only. Hand choice is adult-observed.

**Acceptance**

- Left-hand unit on `/learn` with unlock from L12 Independent. No buttons to L17+.
- L13–L16 full lesson loops from the expanded contracts in `beginner-v1.md`.
- Both clefs and keyboard regions display correctly.
- Fingering and hand instructions are visually clear. MIDI does not certify hand choice.
- Learner can practice a hand separately and return without losing context.
- Device-local progress. Hardware MIDI remains unverified.
- First Notes, Rhythm Club, and Read and play stay healthy. Copyright footer is preserved. No Vercel / DNS changes.

**Handoff.** L13–L16 teaching is on this branch. Together (L17–L20) is MP-08. Pentapath and later leftover outlines wait for a later slice.

---

## MP-08 — Together L17–L20

| Field | Value |
| --- | --- |
| Status | **working** |
| Depends on | MP-07 |
| Branch | `piany/mp-08-together` |
| Base | `piany/mp-07-left-hand` @ `b901df6dfeab91d0305e1fc4ade590e2264a22c3` |
| PR | https://github.com/mitchmoccia/meetpiano/pull/11 (draft into `piany/mp-07-left-hand`; #10 not merged) |

**Learner outcome.** After Left hand is Independent on this device, a beginner can play two keys on one click (L17), keep a short together walk going (L18), play a small harmony (L19), and finish a complete little piece with a held bass (L20). Per-hand preparation comes first. On-screen keys are an exploration stand-in, not proof of hand coordination. MIDI reports pitch and time only.

**Acceptance**

- Together unit on `/learn` with unlock from L16 Independent. No buttons to L21+.
- L17–L20 full lesson loops from the expanded contracts in `beginner-v1.md`.
- Simultaneous note groups, held bass under melody, extra notes, and release events are handled. A wrong note does not derail later alignment.
- Per-hand preparation precedes combined attempts. Slow practice and a small passage loop are available.
- Keyboard ranges stay in the declared two rooms. No forced stretches.
- On-screen mode is labeled as an exploration alternative, not proof of hand coordination.
- Device-local progress. Hardware MIDI remains unverified.
- First Notes, Rhythm Club, Read and play, and Left hand stay healthy. Copyright footer is preserved. No Vercel / DNS changes.

**Handoff.** L17–L20 teaching is on this branch. Expression and first recital (L21–L24) is MP-09.

---

## MP-09 — Expression and first recital L21–L24 (Checkpoint B)

| Field | Value |
| --- | --- |
| Status | **working** |
| Depends on | MP-08 |
| Branch | `piany/mp-09-expression-recital` |
| Base | `piany/mp-08-together` @ `898e84b4bafdb40c77dbad9a9ab36fb42ecba0f7` |
| PR | https://github.com/mitchmoccia/meetpiano/pull/12 (draft into `piany/mp-08-together`) |

**Learner outcome.** After Together is Independent on this device, a beginner can shape a walk quieter then stronger (L21), choose an ending without one melody being labeled correct (L22), practice a named job that keeps notes and rhythm apart (L23), and share a first recital with no glowing keys (L24). Velocity feedback is used only when the input sent velocity. Technique is never inferred. A share can finish through wobbles. All 24 lessons are authored and reachable when prerequisites are met.

**Acceptance**

- Expression unit on `/learn` with unlock from L20 Independent. L01–L24 authored (Checkpoint B).
- L21–L24 full lesson loops from the expanded contracts in `beginner-v1.md`.
- Creative choices accept more than one valid ending. The app does not crown one arbitrary melody.
- Velocity-based quiet/strong is conditional on input capability. Technique is never inferred.
- Recital mode removes glowing-key prompts and allows finishing through mistakes.
- Results distinguish notes, rhythm, assistance, self-observation, and a later transfer check.
- Music/audio is original Web Audio. Provenance is recorded in evidence.
- Device-local progress. Hardware MIDI remains unverified.
- Prior units stay healthy. Copyright footer is preserved. No Vercel / DNS changes.

**Handoff.** L21–L24 teaching is on this branch. MP-10 polishes kid-and-grown-up UX across L01–L24. Later leftover outlines (house, middle C, long tune, smooth/separate, named fingers) stay queued after this UX slice.

---

## MP-10 — A seven-year-old can use it and a grown-up can help

| Field | Value |
| --- | --- |
| Status | **working** |
| Depends on | MP-09 |
| Branch | `piany/mp-10-kid-grownup-ux` |
| Base | `piany/mp-09-expression-recital` @ `980bf17a22223a4279ac50ccca3cf0814d454307` |
| PR | https://github.com/mitchmoccia/meetpiano/pull/13 (draft into `piany/mp-09-expression-recital`) |

**Learner outcome.** A child can follow a short yellow job on every L01–L24 step, hear optional spoken words, pause or exit and come back, and keep using the page if speech fails. A nearby grown-up can open a helper view of skills this device actually stored and get one offline practice idea. That view is not a login and not privacy protection.

**Acceptance**

- Short child-facing copy, a clear current job, readable ink-on-yellow contrast, and restrained motion (reduced-motion honored).
- Replayable narration where the browser can speak. Narration failure leaves the visual/text job. Piano demos stay replayable on their own buttons.
- Keyboard and touch navigation, 44px targets, small-screen layout, and Escape to pause/resume.
- Clear Pause / Exit / Resume. Device-local reset plus MP-06 export/import. Reset and export stay on browsers the family controls.
- Grown-up view reports observed skills only and suggests one offline practice activity. Copy says it is not authenticated privacy protection.
- No child email, public profile, chat, recording upload, advertising tracker, or billing.
- All 24 lessons remain reachable when prerequisites are met. Hardware MIDI remains unverified. Copyright footer is preserved. No Vercel / DNS changes.

**Handoff.** Kid-and-grown-up UX is on this branch. Later leftover outlines still wait. MP-11 is the release verification packet.

---

## MP-11 — Validate, correct, and release the journey

| Field | Value |
| --- | --- |
| Status | **working** (packet ready; merge/deploy gated) |
| Depends on | MP-10 |
| Branch | `piany/mp-11-release-packet` |
| Base | `piany/mp-10-kid-grownup-ux` @ `2fdcfad0e8bdc62bb6511f0790855c532a0cc198` |
| Packet | [`first-piano-journey-release.md`](first-piano-journey-release.md) |
| PR | https://github.com/mitchmoccia/meetpiano/pull/14 (draft into `piany/mp-10-kid-grownup-ux`) |

**Learner outcome.** No new lesson. A grown-up reviewing the stack can read what was actually checked, what is live versus stacked, how to merge, and what public copy must not say.

**Acceptance**

- Complete-flow notes for the marketing static site and focused L01–L24 checks, with links to MP-00–MP-10 evidence.
- Honest support matrix: browser/device claims only from actual evidence. Hardware MIDI explicitly unverified.
- Pilot packet outline for educator/learner review (scripts and materials only — do not contact anyone).
- Small documented fixes only. Home nav says Learn because `/learn` has six worlds on this stack.
- Evidence file includes a recovery plan and public-copy constraints.
- Labels stay accurate: engineering preview ready on the stack; learning validation pending; live brand is merged `main` only (L01–L12 + MP-06 progress + copyright).
- Merge order recommendation is #10 → #13, then this packet. Post-merge checklist covers `meetpiano.app/learn` with all six worlds.
- Export/import and disclosure already shipped in MP-06. This slice does not re-implement them.
- Excludes guaranteed outcomes, full beginner proficiency, educator-approval badges, and a live release from tests alone.
- Production merge/deploy still requires Mitch. No DNS or Vercel project changes.

**Handoff.** Packet is on this branch. Leftover outlines still wait. Do not merge or promote without Mitch.

---

## Status legend

| Status | Meaning |
| --- | --- |
| verified | Slice acceptance met and recorded |
| working | Slice is in progress |
| ready | Spec is sufficient to start immediately |
| queued | Blocked only by earlier slices or a merge-or-stack decision |
