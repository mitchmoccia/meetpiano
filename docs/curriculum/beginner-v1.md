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
| `S-FIND-FG` | Find F left of a three-black-key group and G as the next white key to the right of F | App: pitch-class F/G, or exact MIDI when a register is named |
| `S-STEP-SKIP` | Hear and play a white-key step, a repeat, and a skip | App: adjacent / same / skip-one white-key intervals |
| `S-STAFF-MAP` | Map a known keyboard pattern onto a treble-clef staff | App: exact staff pitch and matching key; letters may be on for guided only |
| `S-READ-PHRASE` | Read a new short phrase from the staff, not a memorized keyboard path | App: sequence vs the stored staff phrase |
| `S-LH-C` | Find C in the lower / left-hand room | App: pitch-class C below middle C, or exact MIDI C3 when this C is named |
| `S-FINGER-LH` | Left-hand pinky–ring–middle (5–4–3) on C–D–E as demonstrated | **Adult-observed** for finger numbers; app can only hear C–D–E |
| `S-HAND-CHOICE` | Use the requested hand | **Adult-observed**. MIDI reports pitch/time only |
| `S-BASS-MAP` | Map a known left-hand pattern onto a bass-clef staff | App: exact staff pitch and matching key; letters may be on for guided only |
| `S-TURNS` | Play a question in one room and an answer in the other, taking turns | App: pitch sequence; hand choice is adult-observed |
| `S-TWO-PULSE` | Hold a lower C while a higher walk shares one pulse | App: pitch and time vs the stored pattern; coordination is not certified |
| `S-TOGETHER` | Play two named keys on the same click | App: pitch and time for a simultaneous group; coordination is not certified |
| `S-KEEP-GOING` | Continue a short together walk without stopping after the first pair | App: pitch and time vs the stored walk; a wrong tap does not skip later pairs |
| `S-SMALL-HARMONY` | Play a named two-note color (C with E, C with G) | App: pitch and time for the stored pairs; blend is not certified |
| `S-LITTLE-PIECE` | Play a short original piece with a held bass, a walk, and a landing | App: pitch, time, and named hold length; not a recital |

Rhythm Club (L05–L08) adds `S-PULSE`, `S-LONG-SHORT`, `S-REST`, and `S-RHYTHM-PHRASE`. Read and play (L09–L12) adds `S-FIND-FG`, `S-STEP-SKIP`, `S-STAFF-MAP`, and `S-READ-PHRASE`. Left hand (L13–L16) adds `S-LH-C`, `S-FINGER-LH`, `S-HAND-CHOICE`, `S-BASS-MAP`, `S-TURNS`, and `S-TWO-PULSE`. Together (L17–L20) adds `S-TOGETHER`, `S-KEEP-GOING`, `S-SMALL-HARMONY`, and `S-LITTLE-PIECE`. Later leftover outlines add named fingers 1–5 as a later review, the C five-note path, a later three-black-key house, dynamics, smooth/separate, held-bass review, question/answer review, and memory. Those leftover skill IDs wait for a later slice. Long/short first teaching stays in L06. Left-hand C and turns stay in L13–L16. Two-part pulse first teaching stays in L16.

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
  inputDevice        { id, name, manufacturer } | null   // MIDI identity when the browser exposes it
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
- Timing is coarse. Rhythm Club scores onsets (and holds when a lesson names long or short) against an audio-clock transport. It does not score rubato, swing, or exam-grade rhythm. Guided windows are wider than performance windows by design.
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

## L05 — Hear the heartbeat

| Field | Value |
| --- | --- |
| Stable ID | `L05` |
| Title | Hear the heartbeat |
| Curriculum version | `beginner-v1` |
| Unit | Rhythm Club |
| Prerequisites | `S-PHRASE` (First Notes complete on this device) |
| Primary new skill | `S-PULSE` (coarse) |
| Octave policy | Pitch-class C in any octave. This lesson scores **when**, not which room. |

### Short explanation

Music has a heartbeat. We can wait for it, then tap with it. The computer uses a shared audio clock — not the screen’s animation — to listen. A late picture on the screen does not move the beat.

### Visual demo

- A yellow pulse marks each beat. Caption: “The glow is a helper. The clock is the sound.”
- Four taps on C, one per beat, after a four-beat count-in.

### Replayable audio notes

- Count-in clicks, then four C heartbeats at a walking tempo (default 80 bpm).
- Optional slower heartbeat (about 60 bpm) for a calmer try.

### Guided practice (hints optional)

1. Hear the heartbeat with the pulse glow on.
2. Echo four C taps with the pulse. Guided timing windows are wide on purpose.
3. A rushed tap (too early) or a sleepy tap (too late) is named, not silently passed.

### Independent check (no hints)

Four C taps after a count-in, **performance** windows, pulse glow off. Correct C at arbitrary times does not pass.

### Transfer pattern

Four C taps at a slightly quicker heartbeat (96 bpm). Same skill, new pace.

### Remediation for a common error

**Error:** Taps bunch together, or chase the picture instead of the click.  
**Response:** “Wait for the next heartbeat. The click is the boss, not the glow.” Replay the count-in.

### Later review

After a named pause or a new visit, four performance taps. Success after a gap → `S-PULSE` may move to Retained.

### Equipment, alternatives, cannot observe

- Required: one playable C (on-screen stand-in is enough).
- Alternatives: grown-up taps while the learner counts aloud — mark adult-supported, not independent pulse skill.
- Cannot observe: inner counting, body movement, or exam-grade steadiness.

---

## L06 — Long and short

| Field | Value |
| --- | --- |
| Stable ID | `L06` |
| Title | Long and short |
| Curriculum version | `beginner-v1` |
| Unit | Rhythm Club |
| Prerequisites | `S-PULSE` |
| Primary new skill | `S-LONG-SHORT` |
| Octave policy | Pitch-class C. Releases are scored, not only presses. |

### Short explanation

Some notes stay. Some notes wave hello and go. A long note needs a hold. A short note needs a let-go. The clock listens to both the press and the release.

### Visual demo

- A wide yellow bar (long) then two short pink taps, all on C.
- Count-in, then **long – short – short**.

### Replayable audio notes

- Home pattern: hold C for two beats, then two short C taps.
- Transfer pattern: two short C taps, then one long C.

### Guided practice (hints optional)

1. Hear long then short-short.
2. Echo it. Duration bars may show. Guided hold windows are kinder.
3. Letting go too soon on the long note, or sitting on a short note, is named.

### Independent check (no hints)

Home pattern with bars off, performance windows. Correct C presses at the right times still fail if the long note is chopped or a short note is held.

### Transfer pattern

**Short – short – long.** A copied home pattern does not count.

### Remediation for a common error

**Error:** Every tap is the same length.  
**Response:** “The first one stays for two heartbeats. The next two are quick waves.” Isolate the long hold.

### Later review

Replay long–short–short after a gap. Hold quality is still coarse, not studio sustain.

### Equipment, alternatives, cannot observe

- Required: a key that can be held and released (touch, computer key, or MIDI).
- Alternatives: grown-up holds while the learner says “stay… now short.”
- Cannot observe: arm weight, legato, or pedal.

---

## L07 — Silence belongs

| Field | Value |
| --- | --- |
| Stable ID | `L07` |
| Title | Silence belongs |
| Curriculum version | `beginner-v1` |
| Unit | Rhythm Club |
| Prerequisites | `S-LONG-SHORT` |
| Primary new skill | `S-REST` |
| Octave policy | Pitch-class C. A note in the quiet slot is an extra, not a pass. |

### Short explanation

Quiet is part of the music. A rest is a place we leave empty on purpose. Playing the right note in the hole does not count as keeping the beat.

### Visual demo

- Four beat boxes. Beat 2 is a rest (“shh”). C on 1, quiet on 2, C on 3, C on 4.
- Caption: “The empty box is a note too — a silent one.”

### Replayable audio notes

- Home: C, rest, C, C.
- Transfer: C, C, rest, C.

### Guided practice (hints optional)

1. Hear the hole.
2. Echo C — (shh) — C — C. The rest box may glow. Guided windows stay wide.
3. A tap in the rest is named “that hole was music too.”

### Independent check (no hints)

Home rest pattern, rest glow off, performance windows. Extra notes in the rest fail the take. Missing the C after the rest also fails.

### Transfer pattern

Rest moves to beat 3: C, C, rest, C.

### Remediation for a common error

**Error:** Filling every beat because silence feels like a mistake.  
**Response:** “Leave beat two empty. The quiet is the point.” Hear only the rest slot.

### Later review

Home rest pattern after a gap, hints off.

### Equipment, alternatives, cannot observe

- Required: one playable C and a way to wait.
- Alternatives: learner claps the sounding beats and holds still on the rest.
- Cannot observe: whether they counted “1-2-3-4” internally.

---

## L08 — Notes with a beat

| Field | Value |
| --- | --- |
| Stable ID | `L08` |
| Title | Notes with a beat |
| Curriculum version | `beginner-v1` |
| Unit | Rhythm Club |
| Prerequisites | `S-REST` |
| Primary new skill | `S-RHYTHM-PHRASE` |
| Octave policy | Guided may accept C–D–E pitch-class. Independent and transfer use the named preview register (C4–D4–E4 = 60–62–64) when those keys are visible. |

### Short explanation

Neighbors can walk **on** the heartbeat. The home walk is **C – D – E – C**, one note per beat. The same letters at any old time are a different piece. Rhythm Club does not pass pitch-only.

### Visual demo

- Tiles C D E C lighting with the pulse.
- Contrast clip labeled “same letters, wrong time” (rushed C–D–E–C) that must not be treated as a pass.

### Replayable audio notes

- Home walk at 80 bpm, four beats, count-in.
- Transfer walk: long C (two beats), then D, then E — same letters, new rhythm.

### Guided practice (hints optional)

1. Hear the walk.
2. Echo C–D–E–C with the pulse. Optional next-tile hint.
3. Hear the cousin rhythm once without playing it yet.

### Independent check (no hints)

Home walk, tiles off, performance windows. A correct C–D–E–C dumped as fast as possible fails. Early, late, missed, or extra notes fail.

### Transfer pattern

Long C, then D, then E. A copied even walk does not count.

### Remediation for a common error

**Error:** Playing the right keys as soon as they remember the letters.  
**Response:** “The letters wait for the heartbeat. One key per click.” Clap four slots, then play.

### Later review

Home walk after a named pause. Pass → `S-RHYTHM-PHRASE` may move to Retained.

### Equipment, alternatives, cannot observe

- Required: C, D, and E playable.
- Alternatives: learner sings the walk while a grown-up plays — adult-supported, not independent keyboard rhythm.
- Cannot observe: fingering, reading vs ear, or swing.

---

## L09–L12 — Read and play (full contracts)

These expand the First Piano Journey sequence after Rhythm Club. Earlier placeholder titles on L05–L08 (F/G, fingers, steps, skips) and the old L09–L12 outlines (steady walking, C five-note path, left-hand C, hands take turns) are **not** bound to these IDs. Rhythm Club owns L05–L08. Read and play owns L09–L12. Left hand owns L13–L16. Pentapath and a later three-black-key house wait for a later slice.

Staff pitch, clef, duration, demo audio, and expected input use the same MIDI numbers and the same duration kind. A quarter on the staff is a quarter in the ear and one tap. Independent and transfer checks that name a preview register use **exact MIDI pitch**. A same-name note in another octave is `wrong-octave`, not a pass.

---

## L09 — Meet F and G

| Field | Value |
| --- | --- |
| Stable ID | `L09` |
| Title | Meet F and G |
| Curriculum version | `beginner-v1` |
| Unit | Read and play |
| Prerequisites | `S-RHYTHM-PHRASE` (Rhythm Club Independent on this device) |
| Primary new skill | `S-FIND-FG` |
| Octave policy | Landmark intro may accept **any F or G** (pitch-class). “This F” and “this G” on the preview use **exact MIDI** F4 = 65 and G4 = 67. |

### Short explanation

Find a group of **three** black keys. The white key hugging the left side of that group is **F**. The next white key to its right is **G**. C still lives left of two black keys. F and G live beside the house of three.

### Visual demo

- Glow a three-black-key group, then the white key immediately to its left. Caption: “Left of the three black keys — F.”
- Then glow the next white key. Caption: “Next door to the right — G.”
- Optional letters **F** and **G** appear on those keys after the motion, then fade. No staff yet.

### Replayable audio notes

- F, then the three black keys as a soft cluster, then F again.
- G alone. Then F then G as neighbors.
- “Hear a higher F” / “Hear a higher G” using concrete MIDI the range can reach. On the one-octave stand-in, say so.

### Guided practice (hints optional)

1. Highlight a three-black group. Ask for the F beside it. Hint: glow that F.
2. Name it aloud: “F.” Replay audio if wanted.
3. Play G, the next white key to the right. Optional glow on G only.
4. Grown-up prompt (optional): demonstrated fingers on F and G. Fingering is adult-observed.

### Independent check (no hints)

Find **this F**, then **this G**, with glow and letters off. Preview register is F4 then G4. A pitch-class F in another octave is the wrong room. Extra notes before F or G fail that try.

### Transfer pattern

Play **G then F** — the neighbors the other way. A copied F-then-G does not count.

### Remediation for a common error

**Error:** Learner plays E (right of the two-black house) or A (past G).  
**Response:** Show the three black keys as a longer house. “F is the doorstep on the left of *three*. G is the next white key, not a skip.” Replay F, then G.

### Later review

On a later visit, find F and G with no glow. Exact register if it was previously independent.

### Equipment, alternatives, cannot observe

- Required: a view of at least one three-black group.
- Alternatives: paper keyboard; grown-up points to a real F or G while the learner plays on-screen.
- Cannot observe: whether they used the landmark or a leftover letter. Independent checks hide letter hints.

---

## L10 — Steps, repeats, and skips

| Field | Value |
| --- | --- |
| Stable ID | `L10` |
| Title | Steps, repeats, and skips |
| Curriculum version | `beginner-v1` |
| Unit | Read and play |
| Prerequisites | `S-FIND-FG` |
| Primary new skill | `S-STEP-SKIP` |
| Octave policy | Guided exploration may accept the named interval in **any octave** (pitch-class). Independent and transfer use the **named preview register** (C4–G4 = 60–67). |

### Short explanation

A **step** is the next white key. A **repeat** is the same key again. A **skip** leaves out one white key (C to E, D to F, E to G). We hear the jump before we name it.

### Visual demo

- C then D light as a step. Caption: “Next door.”
- G then G as a repeat. Caption: “Same place.”
- C then E as a skip. Caption: “One white key takes a rest.”
- Letter names may show, then fade. Still no staff required.

### Replayable audio notes

- Hear a step (C–D). Hear a repeat (G–G). Hear a skip (C–E).
- Contrast clip: a skip that must not be treated as a step.

### Guided practice (hints optional)

1. From C, play a step up (D). Optional next-key glow.
2. Play a repeat on G.
3. From C, play a skip up (E).
4. Creativity: make any three-note goodbye that uses **one step and one skip**. Any valid mix passes this choice; it is not the independent pattern.

### Independent check (no hints, letters off)

Play the named pattern **C – D – D – F** (step, repeat, skip) in the preview register. Correct letters in another octave fail. A copied C–D–E walk does not count.

### Transfer pattern

**G – F – F – D** (step down, repeat, skip down). A copied home pattern does not count.

### Remediation for a common error

**Error:** Playing D when asked for a skip from C, or skipping when asked for a step.  
**Response:** “A step shares a fence. A skip leaves one white key sitting.” Isolate C→D, then C→E.

### Later review

Replay the home interval chain with no letters.

### Equipment, alternatives, cannot observe

- Required: C through G playable.
- Alternatives: grown-up plays the interval while the learner names step / repeat / skip.
- Cannot observe: fingering or whether they counted keys vs listened.

---

## L11 — Patterns to the staff

| Field | Value |
| --- | --- |
| Stable ID | `L11` |
| Title | Patterns to the staff |
| Curriculum version | `beginner-v1` |
| Unit | Read and play |
| Prerequisites | `S-STEP-SKIP` |
| Primary new skill | `S-STAFF-MAP` |
| Octave policy | **Exact pitch.** The staff shows one register. The matching key and the demo audio use the same MIDI number. |

### Short explanation

Notes can sit on a picture of five lines. This lesson uses the **treble clef**. The curly G of the clef wraps the line where **G** lives (G4, second line). A known walk on the keys can live on that picture.

**Staff walk** (quarters): `C4 – D4 – E4` (60–62–64).  
**Staff neighbors** (quarters): `F4 – G4` (65–67).  
Each quarter is one tap and one same-length sound. Clef, staff pitch, audio, and expected key agree.

### Visual demo

- Treble staff. Landmark G on the G-clef line. Middle C on a short ledger line below.
- The C–D–E walk appears as three quarters. Then F–G as two quarters.
- Guided may show letter names under the heads. They fade.

### Replayable audio notes

- Staff walk at a walking pace (one quarter each).
- Staff neighbors F then G.
- Single-note C, E, F, G for checking. Same MIDI as the heads.

### Guided practice (hints optional)

1. Hear the staff walk. Echo C–D–E. Letters may show.
2. Hear F–G on the staff. Echo those two.
3. Ear: hear F then G, then point/play the matching heads.

### Independent check (no hints, letters off)

Play the **staff walk** from the picture: C–D–E, preview register, no key glow. Memorized Little Wave or a dumped C–D–E–C does not match this picture.

### Transfer pattern

A new order of known notes on the staff: **E – C – F** (64–60–65). Letters off. A copied C–D–E does not count.

### Remediation for a common error

**Error:** Playing the right keys from memory while looking at the keyboard, ignoring the staff.  
**Response:** “The picture is the boss. This C is the ledger C, not any C you remember.” Hide key letters. Replay the two-note neighbors.

### Later review

Staff walk with letters off.

### Equipment, alternatives, cannot observe

- Required: C, D, E, F, and G playable; a view of the staff.
- Alternatives: grown-up points to each head while the learner plays.
- Cannot observe: whether they read the head or guessed from leftover letters. Independent hides letters.

---

## L12 — Read a little tune

| Field | Value |
| --- | --- |
| Stable ID | `L12` |
| Title | Read a little tune |
| Curriculum version | `beginner-v1` |
| Unit | Read and play |
| Prerequisites | `S-STAFF-MAP` |
| Primary new skill | `S-READ-PHRASE` (then later replay can feed Retained) |
| Octave policy | **Exact pitch** for the named staff register. |

### Short explanation

A tune we have not memorized on the keys can still be read. This lesson’s original home phrase is **Porch Steps**. It is MeetPiano’s own shape, not Little Wave and not a published primer song.

**Home phrase — Porch Steps** (all quarters)

`C – E – F – G | F – E – C`

MIDI: `60 – 64 – 65 – 67 – 65 – 64 – 60`

**Transfer phrase — Porch the other way** (all quarters)

`G – E – C – E | F – G – G`

MIDI: `67 – 64 – 60 – 64 – 65 – 67 – 67`

Each quarter is one tap and one same-length sound. Staff, clef, duration, audio, and expected keys agree. The skip C–E and the repeat G–G check reading, not a remembered C–D–E path.

### Visual demo

- Staff shows Porch Steps. No letter names after the first demo fade.
- Replay control under the staff.

### Replayable audio notes

- Home phrase at a walking pace.
- Transfer phrase, labeled “a cousin — just listening” until transfer.
- Optional contrast: a long G then a short G, listen-only, so duration on the staff stays honest when we say quarter.

### Guided practice (hints optional)

1. Hear Porch Steps while the staff lights.
2. Echo it in parts: first four, last three, then all seven. Optional next-head hint. Letters fade.
3. Creativity: make a three-note goodbye that uses F or G. This choice sits beside the reading check; it does not replace it.
4. Hear the transfer phrase once without playing it yet.

### Independent check (no hints)

Play **Porch Steps** from the staff with letters and key glow off. Then play **Porch the other way**. Each phrase may be retried. A copied Little Wave or the L08 walk does not pass.

### Transfer pattern

The transfer phrase above is required. Do not accept only a transposition of Porch Steps.

### Remediation for a common error

**Error:** Walking C–D–E from muscle memory, or grabbing the nearest lettered key.  
**Response:** “This tune starts with a skip: C up to E. The picture does not walk every neighbor.” Isolate the first two heads.

### Later review

After a named pause or a new visit, replay Porch Steps with no letters. Pass → Retained for this phrase. A pass on the same visit with no pause may count as Independent, not Retained.

### Equipment, alternatives, cannot observe

- Required: C, E, F, and G playable.
- Alternatives: learner sings the contour while a grown-up plays — adult-supported, not independent reading.
- Cannot observe: fingering, or silent inner counting.

---

## L13–L16 — Left hand (full contracts)

These expand the First Piano Journey sequence after Read and play. Earlier placeholder titles on L13–L16 (later three-black-key house, meeting at middle C, a longer C-neighborhood tune, quiet and strong) are **not** bound to these IDs. Left hand owns L13–L16. Those leftover outlines wait for a later slice.

Both clefs and both keyboard rooms can show. Staff pitch, clef, duration, demo audio, and expected input use the same MIDI numbers and the same duration kind. MIDI reports pitch and time only. It does not certify which hand pressed a key. Hand choice and left-hand fingering are adult-observed labels.

A learner may practice one hand and return. Phase, step, and saved evidence stay. Switching the hand picture does not restart the lesson.

---

## L13 — Meet the left hand

| Field | Value |
| --- | --- |
| Stable ID | `L13` |
| Title | Meet the left hand |
| Curriculum version | `beginner-v1` |
| Unit | Left hand |
| Prerequisites | `S-READ-PHRASE` (Read a little tune Independent on this device) |
| Primary new skill | `S-LH-C` (`S-FINGER-LH` and `S-HAND-CHOICE` are adult-observed) |
| Octave policy | Landmark intro may accept a **lower-room C** (pitch-class below middle C). “This C” on the preview uses **exact MIDI** C3 = 48. |

### Short explanation

The left hand lives on the lower side of the keyboard. Find **C** the same way — left of two black keys — in this lower room. Left-hand pinky is finger **5** and often sits on that C. The higher C is a different room.

### Visual demo

- Glow the lower house of two, then the white key on its left. Caption: “Left of the lower house — C.”
- Show left-hand fingers 5–4–3 on C–D–E. Caption: “A grown-up checks fingers and which hand. MIDI cannot.”
- Both keyboard rooms may show. The left room is the one this lesson names.

### Replayable audio notes

- Lower house, then C3.
- C3–D3–E3.
- Lower C then higher C (C3 then C4), so the rooms stay honest.

### Guided practice (hints optional)

1. Find the lower C. Hint may glow C3.
2. Name it aloud: “C.”
3. Walk C–D–E in the left room.
4. Grown-up prompt: left-hand fingers 5–4–3 and “this was the left hand.” Adult-observed.

### Independent check (no hints)

Find **this C**, then D, then E, glow off. Preview register is C3–D3–E3 (48–50–52). A pitch-class C in the higher room is the wrong room.

### Transfer pattern

**E – D – C** in the left room. A copied C–D–E does not count.

### Remediation for a common error

**Error:** Playing the higher C because that is the remembered doorstep.  
**Response:** “Same letter. Different room. Left-hand C is the lower doorstep.” Replay C3 then C4.

### Later review

Find the lower C and its neighbors with no glow.

### Equipment, alternatives, cannot observe

- Required: a view of a lower C left of two black keys.
- Alternatives: grown-up plays while the learner points — adult-supported, not independent motor skill.
- Cannot observe: which hand, finger number, or bench height.

---

## L14 — Left-hand reading

| Field | Value |
| --- | --- |
| Stable ID | `L14` |
| Title | Left-hand reading |
| Curriculum version | `beginner-v1` |
| Unit | Left hand |
| Prerequisites | `S-LH-C` |
| Primary new skill | `S-BASS-MAP` |
| Octave policy | **Exact pitch.** The bass staff shows one register. The matching key and the demo audio use the same MIDI number. |

### Short explanation

Notes can sit on a picture of five lines. This lesson uses the **bass clef**. The F of the clef wraps the line where **F** lives (F3 = 53). A known left-hand walk can live on that picture.

**Bass walk** (quarters): `C3 – D3 – E3` (48–50–52).  
**Bass neighbors** (quarters): `F3 – G3` (53–55).  
Each quarter is one tap and one same-length sound. Clef, staff pitch, audio, and expected key agree.

### Visual demo

- Bass staff. Landmark F on the F-clef line.
- The C–D–E walk appears as three quarters. Then F–G as two quarters.
- Guided may show letter names under the heads. They fade.

### Replayable audio notes

- Bass walk at a walking pace.
- Bass neighbors F then G.
- Single-note C, E, F, G for checking. Same MIDI as the heads.

### Guided practice (hints optional)

1. Hear the bass walk. Echo C–D–E. Letters may show.
2. Hear F–G on the bass staff. Echo those two.
3. Ear: hear F then G, then play the matching heads.

### Independent check (no hints, letters off)

Play the **bass walk** from the picture: C–D–E, preview register, no key glow. A memorized higher C–D–E does not match this picture.

### Transfer pattern

A new order of known notes on the bass staff: **E – C – F** (52–48–53). Letters off. A copied C–D–E does not count.

### Remediation for a common error

**Error:** Playing the higher walk from memory.  
**Response:** “This C lives on the bass staff.” Hide letters. Replay the two-note neighbors.

### Later review

Bass walk with letters off.

### Equipment, alternatives, cannot observe

- Required: lower C, D, E, and F playable; a view of the bass staff.
- Alternatives: grown-up points to each head while the learner plays.
- Cannot observe: which hand, or whether they read versus guessed leftover letters.

---

## L15 — Musical conversation

| Field | Value |
| --- | --- |
| Stable ID | `L15` |
| Title | Musical conversation |
| Curriculum version | `beginner-v1` |
| Unit | Left hand |
| Prerequisites | `S-BASS-MAP` |
| Primary new skill | `S-TURNS` |
| Octave policy | **Exact pitch** for the named rooms. |

### Short explanation

One hand can ask. The other can answer. The **question** lives on the treble staff. The **answer** lives on the bass staff. Turns, not both hands at once.

**Question** (quarters): `C4 – D4 – E4` (60–62–64).  
**Answer** (quarters): `E3 – D3 – C3` (52–50–48).  
**Home conversation:** question, then answer.  
**Transfer:** answer, then question.

Both clefs and both keyboard rooms show. A learner may practice one hand and return without losing the step. MIDI hears the pitch order. A grown-up marks which hand asked and which hand answered.

### Visual demo

- Grand staff: question on treble, answer on bass.
- Keyboard regions labeled left and right.
- Hand-focus control: Left / Right / Both. Changing it does not restart the lesson.

### Replayable audio notes

- Question alone. Answer alone. Whole conversation.

### Guided practice (hints optional)

1. Play only the question.
2. Play only the answer.
3. Play the conversation: question, then answer.
4. Grown-up prompt: the hands took turns as shown. Adult-observed.

### Independent check (no hints)

Play the home conversation with letters and glow off. Practicing one hand is allowed; the quiet check still wants both parts.

### Transfer pattern

Answer first, then the question. A copied question-then-answer does not count.

### Remediation for a common error

**Error:** Staying in one room, or playing both parts at once.  
**Response:** “The question climbs in the right room. The answer walks home in the left room.” Isolate one part, then return.

### Later review

Home conversation, letters off.

### Equipment, alternatives, cannot observe

- Required: lower C–E and higher C–E playable; both clefs.
- Alternatives: grown-up plays one part while the learner plays the other.
- Cannot observe: which hand played which part.

---

## L16 — Two parts one pulse

| Field | Value |
| --- | --- |
| Stable ID | `L16` |
| Title | Two parts one pulse |
| Curriculum version | `beginner-v1` |
| Unit | Left hand |
| Prerequisites | `S-TURNS` |
| Primary new skill | `S-TWO-PULSE` |
| Octave policy | Guided may accept pitch-class. Independent and transfer use **exact pitch** and the shared audio clock. |

### Short explanation

The left hand can **hold C** while the right hand walks **C – D – E – C**. Both parts share one heartbeat from Rhythm Club. Plant the hold first, then walk. Correct pitches dumped as fast as possible fail.

**Home pattern:** long C3 from beat 0 (four beats), plus C4–D4–E4–C4 one per beat.  
**Transfer pattern:** the hold stays; the walk comes down: E4–D4–C4–C4.

MIDI reports pitch and time. It does not certify which hand held, balance, or coordination mastery.

### Visual demo

- Grand staff and both keyboard rooms.
- Pulse helper. The click is the boss.
- Contrast: same letters, wrong time — listen only.

### Replayable audio notes

- Both parts with the heartbeat.
- Same letters rushed — must not pass.

### Guided practice (hints optional)

1. Hear the hold and the walk.
2. Echo with the clock. Practice one hand, then return to both.
3. Hear the cousin once without playing it yet.
4. Grown-up prompt: one hand held and the other walked. Adult-observed.

### Independent check (no hints)

Both parts with performance windows. Tiles off. Early, late, missed, extra, or a short hold fail.

### Transfer pattern

Hold C3. Walk E–D–C–C on the clicks. A copied even walk does not count.

### Remediation for a common error

**Error:** Playing the right keys as soon as they remember the letters.  
**Response:** “The hold starts with the first real click. The walk waits for each click.”

### Later review

Home pattern after a named pause. Pass → `S-TWO-PULSE` may move to Retained.

### Equipment, alternatives, cannot observe

- Required: lower C and higher C–E playable.
- Alternatives: grown-up holds the bass while the learner walks.
- Cannot observe: which hand held, balance, or coordination mastery.

---

## L17–L20 — Together (full contracts)

These expand the First Piano Journey sequence after Left hand. Earlier leftover titles on L17–L20 (long and short notes, smooth and separate, same tune new fingers, left hand holds C) are **not** bound to these IDs. Together owns L17–L20. Those leftover outlines wait for a later slice.

Simultaneous note groups share one onset. A held bass can sit under a melody. Extra notes and release events are recorded. A wrong tap is an extra; it does not consume the next expected pair. Per-hand preparation precedes a combined attempt. Slow practice and a small passage loop are allowed. Keyboard range is the two named rooms (lower C through higher G). No forced stretch past a five-finger place.

On-screen and computer keys are an **exploration stand-in**. They are not proof that two hands coordinated at a piano. MIDI reports pitch and time (and hold length when a lesson names it). Hand choice remains adult-observed.

---

## L17 — First together

| Field | Value |
| --- | --- |
| Stable ID | `L17` |
| Title | First together |
| Curriculum version | `beginner-v1` |
| Unit | Together |
| Prerequisites | `S-TWO-PULSE` (Two parts one pulse Independent on this device) |
| Primary new skill | `S-TOGETHER` (`S-HAND-CHOICE` is adult-observed) |
| Octave policy | Guided may accept pitch-class. Independent and transfer use **exact pitch** and the shared audio clock. |

### Short explanation

Two keys can sound on the same click. Lower C with higher C. Then lower C with higher E. Prepare the left key, then the right key, then both.

**Home pattern:** beat 0: C3+C4; beat 2: C3+E4.  
**Transfer pattern:** beat 0: C3+D4; beat 2: C3+C4.

### Visual demo

- Grand staff and both keyboard rooms.
- Two heads stacked on one click, then the second pair.
- Caption: on-screen keys explore; they do not prove coordination.

### Replayable audio notes

- Both pairs with the heartbeat.
- Same letters rushed — must not pass.

### Guided practice (hints optional)

1. Left room only: lower C on each click.
2. Right room only: higher C, then E.
3. Both rooms together.
4. Hear the cousin once without playing it yet.
5. Grown-up prompt: both hands were ready before the together try. Adult-observed.

### Independent check (no hints)

Home pairs. Tiles off. Extra or wrong taps fail the take without skipping the next pair.

### Transfer pattern

C3+D4, then C3+C4. A copied C-then-E does not count.

### Remediation for a common error

**Error:** Playing the two keys one after the other, not on one click.  
**Response:** “Plant the lower C. Meet it with the higher key on the same click.”

### Later review

Home pairs after a named pause.

### Equipment, alternatives, cannot observe

- Required: lower C and higher C–E playable. No stretch.
- Alternatives: grown-up plays one part; on-screen is a stand-in.
- Cannot observe: which hand, or coordination mastery.

---

## L18 — Keep going

| Field | Value |
| --- | --- |
| Stable ID | `L18` |
| Title | Keep going |
| Curriculum version | `beginner-v1` |
| Unit | Together |
| Prerequisites | `S-TOGETHER` |
| Primary new skill | `S-KEEP-GOING` |
| Octave policy | Guided may accept pitch-class. Independent and transfer use **exact pitch** and the shared audio clock. |

### Short explanation

Keep going after the first pair. The left room taps C on every click. The right room walks C–D–E–C. A small loop of the first two clicks is allowed. Slow is allowed.

**Home pattern** (quarters): C3+C4, C3+D4, C3+E4, C3+C4.  
**Head loop:** the first two clicks only.  
**Transfer pattern:** C3+E4, C3+D4, C3+C4, C3+C4.

### Visual demo

- Grand staff. Four stacked pairs.
- Pulse helper. Slower heartbeat available.

### Replayable audio notes

- The four-click walk.
- Same letters rushed — must not pass.

### Guided practice (hints optional)

1. Left C only.
2. Higher walk only.
3. Loop the first two clicks.
4. The whole walk.
5. Hear the cousin once.

### Independent check (no hints)

Four together clicks. A wrong tap does not skip later pairs.

### Transfer pattern

Walk down together. A copied climb does not count.

### Remediation for a common error

**Error:** Stopping after the first pair.  
**Response:** “Loop the first two clicks slowly. Then add E and the last C.”

### Later review

Home walk after a named pause.

### Equipment, alternatives, cannot observe

- Required: lower C and higher C–E playable.
- Alternatives: slow loop; grown-up plays one part; on-screen stand-in.
- Cannot observe: evenness or which hand.

---

## L19 — Small harmony

| Field | Value |
| --- | --- |
| Stable ID | `L19` |
| Title | Small harmony |
| Curriculum version | `beginner-v1` |
| Unit | Together |
| Prerequisites | `S-KEEP-GOING` |
| Primary new skill | `S-SMALL-HARMONY` |
| Octave policy | Guided may accept pitch-class. Independent and transfer use **exact pitch** and the shared audio clock. |

### Short explanation

Two friends share a click and make a thicker sound. Lower C with higher E. Then lower C with higher G. G is the top of the right-hand five-finger place — no stretch.

**Home pattern:** beat 0: C3+E4 (two beats); beat 2: C3+G4 (two beats).  
**Transfer pattern:** C3+G4, then C3+E4.

### Visual demo

- Grand staff stacked pairs.
- Caption: extra notes are extras; the next pair still waits.

### Replayable audio notes

- The two colors.
- Same letters rushed — must not pass.

### Guided practice (hints optional)

1. Lower C only.
2. Higher E, then G.
3. Both colors together.
4. Hear the cousin once.

### Independent check (no hints)

Home colors. Extra notes fail the take without skipping the next pair.

### Transfer pattern

G first, then E. A copied E-then-G does not count.

### Remediation for a common error

**Error:** Reaching for a far G.  
**Response:** “G is the top of this five-finger place. No stretch.”

### Later review

Home colors after a named pause.

### Equipment, alternatives, cannot observe

- Required: lower C and higher E–G playable. No stretch.
- Alternatives: grown-up plays one part; on-screen stand-in.
- Cannot observe: blend or “pretty.”

---

## L20 — Complete little piece

| Field | Value |
| --- | --- |
| Stable ID | `L20` |
| Title | Complete little piece |
| Curriculum version | `beginner-v1` |
| Unit | Together |
| Prerequisites | `S-SMALL-HARMONY` |
| Primary new skill | `S-LITTLE-PIECE` |
| Octave policy | Guided may accept pitch-class. Independent and transfer use **exact pitch**, the shared audio clock, and scored releases on the named hold. |

### Short explanation

A short original piece: hold lower C while the higher walk goes C–D–E–C. Then land on C with E, and home on two C keys. This is not a second first teaching of L16’s pulse. It puts a known hold under a complete little shape.

**Home pattern:** long C3 from beat 0 (four beats) plus C4–D4–E4–C4; then C3+E4 (two beats); then C3+C4 (two beats).  
**Transfer pattern:** the hold stays; the walk comes down E–D–C–C; then the same landings.

Release events on the named hold are scored. Extra releases of keys that were not open are ignored.

### Visual demo

- Grand staff and both rooms.
- Pulse helper. Hold, walk, land.

### Replayable audio notes

- The little piece.
- Same letters rushed — must not pass.

### Guided practice (hints optional)

1. Left hold and landings only.
2. Higher walk only.
3. The whole piece. Slow if wanted.
4. Hear the cousin once.

### Independent check (no hints)

The whole piece. A short hold fails the hold. A wrong tap does not skip later landings.

### Transfer pattern

Walk down, then the same landings. A copied climb does not count.

### Remediation for a common error

**Error:** Dropping the hold to chase the walk.  
**Response:** “Plant the hold with the first click. The walk waits for each click. Then the two landings.”

### Later review

Home piece after a named pause. Pass → `S-LITTLE-PIECE` may move to Retained.

### Equipment, alternatives, cannot observe

- Required: lower C and higher C–E playable.
- Alternatives: grown-up holds the bass; on-screen stand-in.
- Cannot observe: which hand held, balance, or recital readiness.

---

## Later leftovers and L21–L24 — outlines

IDs stay stable. Together owns L17–L20. These leftover titles are **not** bound to L17–L20.

### Later leftover — Three-black-key landmark (later house)

First teaching of F and G from the three-black-key landmark is **L09**. This later outline is another house / another register of the same landmark, not a second first teaching. Review skill: `S-FIND-FG` / `S-LANDMARK-3`.

### Later leftover — Meeting at middle C

When two C keys are available, notice they share a name. Call the meeting C the one the grown-up and learner choose as “ours” (often near the middle of a full piano). Exact pitch when that C is named. New skill: `S-MIDDLE-C`. Left-hand C is already first taught in L13.

### Later leftover — A longer C-neighborhood tune

Original 6–8 note tune using C–G, built from steps and one skip. New skill: `S-PHRASE-LONG`.

### Later leftover — Quiet and strong

Same short pattern twice: quieter, then stronger. Relative only. New skill: `S-DYNAMIC`.

### Later leftover — Long notes and short notes

Hold a neighbor, then tap shorter neighbors. Count is spoken, not exam-notated. First teaching of long/short is **L06**. This leftover is a later review, not a second first teaching. Review skill: `S-LONG-SHORT`.

### Later leftover — Smooth and separate

Three neighbors connected (no gaps in sound) versus three clearly separated. MIDI note-off can hint, not certify legato. New skill: `S-SMOOTH-SEPARATE`.

### Later leftover — Same tune, new fingers

Replay a known C–D–E phrase with a specified fingering. App hears pitches; fingering is adult-observed. New skill: `S-FINGER-REPEAT`.

### Later leftover — Left hand holds C

Later review of L16. Left hand holds C while right hand walks neighbors. Balance is adult-observed. Review skill: `S-TWO-PULSE` / `S-LH-HOLD`. Not a second first teaching. L20’s held bass is a complete little piece, not this leftover review.

### L21 — Question and answer

A two-part idea: a rising or “asking” C–E pattern, then a falling “answer.” New skill: `S-QA`.

### L22 — Play it from memory

Replay L04 Little Wave or L15’s tune with no tiles and no audio lead-in after the first reminder. New skill: `S-MEMORY` (feeds Retained).

### L23 — Put it together

A short original piece using C–G, one dynamic change, and either turns or a held C. New skill: `S-COMBINE`. L20 already ships one complete little piece; this leftover can add dynamics later.

### L24 — Share the journey

Learner chooses one piece (L04, L15, L20, or L23) to play for a grown-up. Adult-observed “we listened all the way through.” Review L01–L04 independent prompts. New skill: `S-SHARE`. No jury language.

---

## Honesty notice

This curriculum is a product specification for MeetPiano. It is not a certified syllabus, not a substitute for a teacher, and not evidence that any learner will progress at a given rate. Implementers must not add educator-approval badges or effectiveness claims in the UI.
