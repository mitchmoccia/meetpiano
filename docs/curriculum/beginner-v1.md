# Beginner v1 — First Piano Journey curriculum

Curriculum version: **`beginner-v1`**. Original MeetPiano teaching copy. Do not copy or reconstruct Faber, RCM, or other published method text.

This file is the teaching and assessment contract. Product slices implement it; they do not invent a parallel curriculum.

Related: [`../missions/first-piano-journey.md`](../missions/first-piano-journey.md).

## Who it is for

A curious younger beginner with a grown-up nearby for setup and for skills the computer cannot see. Older beginners may use the same lessons. The copy assumes a helper can read a short on-screen note. It does not assume the helper plays piano.

## Skill prerequisites

Skills are identifiers. A lesson lists which ones it needs and which one it introduces.

| ID | Skill | How it can be evidenced |
| --- | --- | --- |
| `S-SETUP` | Device, sound after a gesture, seating at a keyboard or stand-in | Adult-observed seating; app can confirm audio unlocked |
| `S-HIGH-LOW` | Hear and show that right/up is higher, left/down is lower on a standard keyboard | App can hear relative pitch if two notes are played; spatial gesture is adult-observed if no sound |
| `S-BLACK-GROUPS` | Find a group of two black keys and a group of three | App can detect the matching black-key MIDI/pitch-class pair if played; pointing without sound is adult-observed |
| `S-POSTURE` | Tall seat, relaxed shoulders, forearms roughly level, feet supported if possible | **Adult-observed only** |
| `S-FIND-C` | Find C immediately left of a two-black-key group | App: pitch-class C, or exact MIDI pitch when a register is named |
| `S-REGISTER-C` | Find a C in a different register from the first one | App: exact MIDI pitch different from the first C |
| `S-NEIGHBOR` | Play the next white key up or down | App: adjacent white-key pitch classes or exact pitches |
| `S-FINGER-CDE` | Right-hand thumb–index–middle (1–2–3) on C–D–E as demonstrated | **Adult-observed** for finger numbers; app can only hear C–D–E |
| `S-ORDER-CDE` | Play a specified three-note order using C, D, and E | App: pitch sequence; exact pitch if register specified |
| `S-PHRASE` | Play a short learned C–D–E phrase | App: note sequence vs the stored phrase |
| `S-TRANSFER-PHRASE` | Play a related new phrase without the home-phrase highlight | App: sequence vs the transfer phrase |
| `S-REPLAY` | Play a known phrase again after a gap | App: sequence; Retained requires the gap rule below |

Later outlines (L05–L24) add skills such as F/G, named fingers 1–5, steps, skips, pulse, left-hand C, turns, three-black-key landmark, dynamics, long/short, smooth/separate, held bass, question/answer, and memory. Those skill IDs are introduced in each outline.

## Input modes

A lesson may allow any of these. The attempt record stores which ones were used.

| Mode | ID | What the app can observe | What it cannot |
| --- | --- | --- | --- |
| On-screen touch / pointer | `touch` | Which displayed key was pressed, timing of presses | Real-piano posture, finger number, weight |
| Computer keys | `computer-keys` | Mapped letter → preview MIDI number (A=C4 … J=B4 in the current site) | Same as touch |
| Web MIDI keyboard | `midi` | MIDI note number, velocity if sent, note-on/off | Posture, which finger, hand shape, sitting height, pedal |
| Mixed | `mixed` | Union of the above in one attempt | Same limits |
| Grown-up mark | `adult-observed` | Whatever the grown-up checks | Not machine evidence |

Silent / no-audio fallback: the learner may still tap keys and see highlights. The attempt must record that audio was unavailable. Independent pitch checks are then incomplete, not passed.

## Versioned lesson shape

```text
LessonSpec {
  lessonId        string      // stable, e.g. "L01"
  curriculumVersion "beginner-v1"
  title           string
  prerequisites   SkillId[]
  primaryNewSkill SkillId
  octavePolicy    "pitch-class-any-octave" | "exact-pitch-when-specified" | "mixed-by-phase"
  phases          // explanation, visualDemo, audioDemo, guided, independent, transfer, remediation, laterReview
  equipment       { required, accessibleAlternatives, cannotObserve }
}
```

Stable lesson IDs in this version: `L01` … `L24`. Do not reuse an ID for a different skill. If a lesson’s contract changes incompatibly, bump `curriculumVersion` and keep the old records readable.

## Versioned attempt shape

```text
AttemptRecord {
  attemptId          string          // unique on this device
  lessonId           string
  curriculumVersion  "beginner-v1"
  startedAt          ISO-8601
  completedAt        ISO-8601 | null
  inputMode          "touch" | "computer-keys" | "midi" | "mixed"
  audioUnlocked      boolean
  phase              "explanation" | "demo" | "guided" | "independent" | "transfer" | "remediation" | "review"
  evidenceState      "explored" | "practiced" | "independent" | "retained"
  events             AttemptEvent[]  // optional, keep small
  adultObserved      {
    posture?: boolean
    fingering?: boolean
    note?: string            // short helper note, not a grade
  }
  octavePolicyUsed   "pitch-class" | "exact-pitch"
  exportable         true            // always, even before MP-11 ships import UI
}

AttemptEvent {
  t            ISO-8601 or ms-from-start
  type         "note-on" | "note-off" | "hint-shown" | "hint-hidden" | "demo-played" | "phase-change"
  expected     number | number[] | null   // MIDI note or pitch-class 0–11 when relevant
  heard        number | null
  match        boolean | null
}
```

Progress store (this phase): **device-local only** (for example `localStorage` keyed by `meetpiano:beginner-v1`). Disclose that. No account id. Marketing playground XP is **not** an `AttemptRecord`.

## Evidence states

| State | Meaning | Must not mean |
| --- | --- | --- |
| **Explored** | Opened the lesson and did at least one on-task action (heard a demo, tapped a key, or marked an adult-observed prompt) | Mastery |
| **Practiced** | Finished guided practice, with or without hints | Ready to perform |
| **Independent** | Passed the independent check with hints off | Teacher-certified skill |
| **Retained** | Passed a later review after a gap (new session or an in-visit pause the lesson names) | Permanent memory |

Promotion is one-way only when the new evidence is real. A failed independent check leaves Practiced. Adult-observed skills cannot become Independent unless the grown-up mark is present.

## Measurement limits

- MIDI note-on proves a pitch (and maybe velocity), not a finger, not posture, not a relaxed wrist.
- Touch and computer keys prove a *represented* pitch, not a piano action.
- Early exploration may accept **pitch-class in any octave** (`note % 12`). Location and notation checks use **exact MIDI pitch** when the lesson names a register (for example “the C under this group,” “a higher C”).
- Timing is coarse. This version does not score rubato, swing, or exam-grade rhythm.
- No camera, microphone, or pedal data.
- Do not display “teacher approved,” “grade 1 complete,” or effectiveness percentages.

## Equipment and access (all lessons)

**Required to use the app:** a device with a browser, a way to tap or type, and a user gesture so Web Audio may start.

**Best for real-piano transfer:** a piano or digital keyboard the learner can sit at. MIDI is optional.

**Accessible alternatives**

- On-screen keyboard if no piano is present (state that this is a stand-in).
- Computer keys when touch is hard.
- A grown-up may play the requested key while the learner points, if motor control is not yet possible; mark the attempt `adult-observed` and do not store it as independent motor skill.
- Headphones help but are not required. A mute control must remain available.
- If Web MIDI is missing or denied, continue with on-screen keys.

**Cannot be observed by the app:** sitting bones and bench height, spinal posture, shoulder tension, wrist alignment, which finger pressed a physical key, looking at the hands vs the screen, effort, joy, or “readiness for a recital.”

---

## L01 — Meet the keyboard

| Field | Value |
| --- | --- |
| Stable ID | `L01` |
| Title | Meet the keyboard |
| Curriculum version | `beginner-v1` |
| Prerequisites | None |
| Primary new skill | `S-SETUP`, then `S-HIGH-LOW` and `S-BLACK-GROUPS` (`S-POSTURE` is required and adult-observed) |
| Octave policy | `pitch-class-any-octave` for exploration. No named register. |

### Short explanation

A piano is a long row of hills. White keys are the path. Black keys stand up in clumps of **two** and **three**. Notes get **higher** as you move to the **right** (and usually toward the thinner strings / shorter side on a real piano) and **lower** to the **left**. Before playing, we sit so arms can reach without hunching.

### Visual demo

- Show a keyboard excerpt with one group of two black keys and one group of three, labeled “2” and “3” without note names.
- Animate a highlight sliding right while a rising figure plays, then left while a falling figure plays.
- Show a simple side-view seating sketch: bench, feet, level forearms. Caption: “A grown-up checks this. The app cannot see your sitting.”

### Replayable audio notes

- Two-note high/low pair (for example C5 then C4, or any two pitches a fifth or more apart). Button: “Hear high, then low.”
- Optional cluster: two black keys together, then three black keys together, as a color of sound, not as named pitches.

### Guided practice (hints optional)

1. Unlock sound with a tap.
2. Play any high-sounding key, then any low-sounding key. A hint may glow the rightmost and leftmost keys on the on-screen instrument.
3. Tap or play inside a group of two black keys, then a group of three. A hint may outline those groups.
4. Grown-up prompt: “Are shoulders soft and the bench a comfortable height?” Optional checkbox.

### Independent check (no hints)

- Play one note the learner calls high, then one they call low. App passes if the second MIDI/pitch is lower than the first (or the reverse if the prompt asks low-then-high). If the on-screen range is too small to be obvious, ask for leftmost vs rightmost visible keys instead.
- Activate any two-black group and any three-black group, in either order, with group outlines off.

### Transfer pattern

Find a *different* two-black group than the one used in guided practice (another octave on MIDI, or the other visible pair on the small preview). Same for a three-black group if two are visible; if only one three-group is visible, ask the learner to point to it on a real piano and have the grown-up confirm.

### Remediation for a common error

**Error:** Learner says a left-hand note is “higher” because the key is physically taller (black key) or because they looked at the screen’s vertical CSS, not pitch.  
**Response:** Replay the high/low audio while the same key color is used both times (two white keys). Say: “Higher means the sound climbs, usually to the right — not which key is taller.”

### Later review

On a later visit, repeat the independent high/low and both black-key groups with hints off. Success after a gap → `S-HIGH-LOW` and `S-BLACK-GROUPS` may move to Retained. Posture never auto-retains; ask the grown-up again.

### Equipment, alternatives, cannot observe

- Required: browser instrument or real keyboard plus this page.
- Alternatives: grown-up plays while learner points; mute + visual-only motion for high/low is incomplete evidence.
- Cannot observe: posture quality, whether the bench is safe, whether the learner is looking at their hands.

---

## L02 — Find C

| Field | Value |
| --- | --- |
| Stable ID | `L02` |
| Title | Find C |
| Curriculum version | `beginner-v1` |
| Prerequisites | `S-SETUP`, `S-BLACK-GROUPS` |
| Primary new skill | `S-FIND-C` (then `S-REGISTER-C` on the independent/transfer checks) |
| Octave policy | Landmark intro may accept **any C** (pitch-class). “This C” and “a new register” require **exact MIDI pitch**. |

### Short explanation

Find a group of **two** black keys. The white key hugging the left side of that group is **C**. Every two-black group has its own C. They sound like family members with the same name in different rooms.

### Visual demo

- Glow a two-black-key group, then the white key immediately to its left. Caption: “Left of the two black keys — C.”
- Do not show a staff yet. Optional letter **C** appears on that key after the motion, then fades.

### Replayable audio notes

- Play that C, then the two black keys as a soft cluster, then C again.
- “Hear a higher C” / “Hear a lower C” using two concrete MIDI pitches the on-screen or MIDI range can reach (for the preview instrument: C4 = 60 and, if only one C is visible, say so and use a helper piano or a second C when MIDI is connected).

### Guided practice (hints optional)

1. Highlight a two-black group. Ask for the C beside it. Hint: glow that C.
2. Name it aloud: “C.” Replay audio if wanted.
3. If MIDI or a wider keyboard is present, ask for *any* other C with a lighter hint (all C keys dim-glow).

### Independent check (no hints, no glow)

Find **C in a new register** — not the same MIDI note as the guided C. On the one-octave marketing piano, the independent check is: hide the glow and ask for C again (pitch-class C), and add an adult-observed prompt: “Point to a different C on your real piano if you have one.” That adult mark is required before `S-REGISTER-C` can become Independent when only one C is playable in-app.

### Transfer pattern

Start from a two-black group that was not the guided group. Ask: “What white key sits on its left?” No letter labels.

### Remediation for a common error

**Error:** Learner plays the white key *between* the two black keys (D) or the right-side white key (E).  
**Response:** Show the two black keys as a tiny house. “C is the doorstep on the left, not the room in the middle.” Replay C, then D, and ask which one was the doorstep.

### Later review

Another day (or after leaving `/learn` and returning): find any C with no glow. If exact register was previously independent, ask for a C that is not the last stored C pitch.

### Equipment, alternatives, cannot observe

- Required: a view of at least one two-black group.
- Alternatives: paper keyboard printout; grown-up points to a real C while learner plays it on-screen.
- Cannot observe: whether the learner used the landmark or guessed from a remaining letter label on the marketing piano. Independent checks must hide letter hints when possible.

---

## L03 — Neighbors C–D–E

| Field | Value |
| --- | --- |
| Stable ID | `L03` |
| Title | Neighbors C–D–E |
| Curriculum version | `beginner-v1` |
| Prerequisites | `S-FIND-C` |
| Primary new skill | `S-NEIGHBOR`, with demonstrated `S-FINGER-CDE` (adult-observed) and `S-ORDER-CDE` on the independent check |
| Octave policy | Guided exploration may accept C–D–E in **any octave** (pitch-class). Independent and transfer use the **named register** when one is shown; otherwise pitch-class.

### Short explanation

D lives next door to C, one white key to the right. E is next door to D. Together they are three neighbors. We can walk C–D–E with right-hand fingers **1 (thumb), 2, 3** as a demonstrated pattern. The app can hear the notes. A grown-up watches the fingers.

### Visual demo

- Three white keys in a row: C, then D, then E, lighting in order.
- A simple hand diagram (not a photo of a branded method book) with thumb on C, index on D, middle on E. Caption: “A grown-up checks fingers. MIDI cannot.”

### Replayable audio notes

- C, D, E ascending, one at a time.
- E, D, C descending, as a contrast, clearly labeled “just listening.”

### Guided practice (hints optional)

1. Find C (learner’s known landmark).
2. Play the next white key (D), then the next (E). Optional glow on the next neighbor only.
3. Play C–D–E in a row. Optional finger-number overlay 1–2–3.
4. Grown-up checkbox: “Thumb was on C, next two fingers on D and E.”

### Independent check (no hints, no highlight)

A **new three-note order** using only C, D, and E, for example **D–C–E** or **E–C–D**. Do not use the marketing mini-adventure orders as the only passing sequences (those are C–D–E, E–D–C, and E–D–C–D–E). Hints off. Finger overlay off. Fingering is not scored by the app.

### Transfer pattern

Same three pitch classes in another register if available; otherwise the same register with a different new order than the independent check.

### Remediation for a common error

**Error:** Skip from C to E (leaving out D) or play a black key “because it sits between.”  
**Response:** “Neighbors share a fence — the next *white* key. Black keys are a different path.” Show C→D only, then add E.

### Later review

Replay C–D–E and one shuffled order with no highlight. Fingering review is adult-observed again if Independent fingering is claimed.

### Equipment, alternatives, cannot observe

- Required: three adjacent white keys C–D–E visible or on a real keyboard.
- Alternatives: one-finger playing of the correct keys if 1–2–3 is not yet possible; record fingering as not observed.
- Cannot observe: actual finger numbers without a grown-up.

---

## L04 — First little tune

| Field | Value |
| --- | --- |
| Stable ID | `L04` |
| Title | First little tune |
| Curriculum version | `beginner-v1` |
| Prerequisites | `S-ORDER-CDE` |
| Primary new skill | `S-PHRASE`, then `S-TRANSFER-PHRASE` and `S-REPLAY` |
| Octave policy | Exact MIDI pitches when the demo names the on-screen C–D–E (preview C4–D4–E4 = 60–62–64). Guided may accept pitch-class. Independent and later replay of the *named* tune use the demonstrated register if it is visible; otherwise pitch-class plus an adult note that the real-piano register was used. |

### Short explanation

A tune is neighbors in a pattern we can remember. This lesson’s original home phrase is **Little Wave**. It is MeetPiano’s own three-note shape, not a published primer song.

**Home phrase — Little Wave**

`C – D – E – D | E – D – C`

**Transfer phrase — Wave the other way**

`E – D – C – D | C – D – E`

### Visual demo

- Note tiles light in the home-phrase order. A small arc graphic rises then falls (the “wave”).
- Replay control under the tiles. No staff required in this lesson.

### Replayable audio notes

- Home phrase at a walking pace (about one note per beat, no metronome requirement).
- Transfer phrase, labeled “a cousin of Little Wave.”
- Single-note C, D, E for checking.

### Guided practice (hints optional)

1. Hear Little Wave.
2. Echo it in parts: first four notes, then the last three, then all seven. Optional glow on the next note.
3. Hear the transfer phrase once without being asked to play it yet.

### Independent check (no hints)

Play **Little Wave** with highlights off. Then play **Wave the other way**. Each phrase may be retried. Hints stay off after the first independent prompt.

### Transfer pattern

The transfer phrase above is the required transfer. Do not accept only a transposition of Little Wave as transfer; the contour must flip as specified.

### Remediation for a common error

**Error:** Learner continues into extra notes or repeats C–D–E as a scale and never returns.  
**Response:** Clap the seven slots. “The wave goes up to E, back to D, then down to C. Stop on C.” Play the last three notes in isolation.

### Later review

After a gap (new session, or a pause the UI names as “play something else, then come back”), replay Little Wave with no tiles. Pass → `S-REPLAY` / Retained for this phrase. A pass on the same visit with no pause may count as Independent, not Retained.

### Equipment, alternatives, cannot observe

- Required: C, D, and E playable.
- Alternatives: learner sings the contour while a grown-up plays; mark as adult-supported, not independent keyboard skill.
- Cannot observe: whether they memorized by ear vs by leftover on-screen letters; turn letter names off for independent and review when the UI can.

---

## L05–L24 — outlines (First Piano Journey sequence)

These are sequence outlines, not full contracts. Later slices expand them. IDs and titles are stable.

### L05 — Friends F and G

Meet the next two white keys to the right of E. Landmark reminder: F sits at the left of a **three**-black-key group. Play C–D–E–F–G as a neighborhood, not a named scale exam. New skill: `S-NEIGHBOR` extended to F and G.

### L06 — Finger names 1 to 5

Name fingers 1–5 on both hands (thumb is 1). Play five slow taps on one key, one finger at a time, adult-observed. App hears repetition only. New skill: `S-FINGERS-15` (adult-observed).

### L07 — Steps next door

A **step** is the next white key. Step up from C to D to E; step down from E to D to C. No skips. New skill: `S-STEP`.

### L08 — Skips over a neighbor

A **skip** lands on the white key beyond the next one (C to E, D to F). Contrast one step with one skip. New skill: `S-SKIP`.

### L09 — Steady walking notes

Play known notes in an even walking pulse. The app may show a silent visual pulse; it does not fail the lesson on millisecond timing. New skill: `S-PULSE` (coarse).

### L10 — The C five-note path

Walk C–D–E–F–G and back G–F–E–D–C. Optional demonstrated right-hand 1–5, adult-observed. New skill: `S-PENTAPATH-C`.

### L11 — Left-hand C

Find C with the left hand using the same two-black-key landmark. One comfortable left-hand finger is enough. New skill: `S-LH-C`.

### L12 — Hands take turns

Right hand plays a short C–D–E pattern; left hand answers with C. Not yet together. New skill: `S-TURNS`.

### L13 — Three-black-key landmark

Use a group of three black keys to find F (left white key) and G (next white key to the right of F, or as specified in the expanded contract). New skill: `S-LANDMARK-3`.

### L14 — Meeting at middle C

When two C keys are available, notice they share a name. Call the meeting C the one the grown-up and learner choose as “ours” (often near the middle of a full piano). Exact pitch when that C is named. New skill: `S-MIDDLE-C`.

### L15 — A longer C-neighborhood tune

Original 6–8 note tune using C–G, built from steps and one skip. New skill: `S-PHRASE-LONG`.

### L16 — Quiet and strong

Same short pattern twice: quieter, then stronger. Relative only. New skill: `S-DYNAMIC`.

### L17 — Long notes and short notes

Hold a neighbor, then tap shorter neighbors. Count is spoken, not exam-notated. New skill: `S-LONG-SHORT`.

### L18 — Smooth and separate

Three neighbors connected (no gaps in sound) versus three clearly separated. MIDI note-off can hint, not certify legato. New skill: `S-SMOOTH-SEPARATE`.

### L19 — Same tune, new fingers

Replay a known C–D–E phrase with a specified fingering. App hears pitches; fingering is adult-observed. New skill: `S-FINGER-REPEAT`.

### L20 — Left hand holds C

Left hand holds C while right hand walks neighbors. Balance is adult-observed. New skill: `S-LH-HOLD`.

### L21 — Question and answer

A two-part idea: a rising or “asking” C–E pattern, then a falling “answer.” New skill: `S-QA`.

### L22 — Play it from memory

Replay L04 Little Wave or L15’s tune with no tiles and no audio lead-in after the first reminder. New skill: `S-MEMORY` (feeds Retained).

### L23 — Put it together

A short original piece using C–G, one dynamic change, and either turns or a held C. New skill: `S-COMBINE`.

### L24 — Share the journey

Learner chooses one piece (L04, L15, or L23) to play for a grown-up. Adult-observed “we listened all the way through.” Review L01–L04 independent prompts. New skill: `S-SHARE`. No jury language.

---

## Honesty notice

This curriculum is a product specification for MeetPiano. It is not a certified syllabus, not a substitute for a teacher, and not evidence that any learner will progress at a given rate. Implementers must not add educator-approval badges or effectiveness claims in the UI.
