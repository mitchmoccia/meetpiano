# Critical-path browser matrix (N08)

Honest record of the First Piano Journey critical path on named browsers. **Untested browsers are BLOCKED with a reason.** They are not silent green.

This document records only the sitings in the table. Do not read a Chrome desktop row as a pass for Safari, iPadOS, Firefox, or any other browser.

Product tip exercised: `3bd163a504666a6e9293ccb134b6e75694f1febc` (`main` after the N07 merge). N08 adds this matrix, a blank row template, and an honesty fixture. It does not expand MIDI, add accounts, or redesign `/learn`.

Physical MIDI hardware remains **not verified** ([`../midi/hardware-midi-protocol.md`](../midi/hardware-midi-protocol.md)).

## Columns

Every row uses these fields: **browser+version**, **OS/device**, **tip SHA**, **date**, **tester**, **critical-path results**, **label**.

Allowed **label** values:

| Label | Meaning |
| --- | --- |
| `physical-device` | Sitting on a real family device in someone’s hands |
| `listening` | Tester heard a real note on speakers or headphones |
| `simulated` | Software path exercised without acoustic confirmation, or not on a physical family device |
| `BLOCKED` + reason | The sitting was not run |

## Critical path (every row)

1. **(a) open `/learn`**
2. **(b) L01 hear note** — real (`listening`) or labeled `simulated`
3. **(c) progress save** — `meetpiano:beginner-v1` written on this browser
4. **(d) grown-up view** — `/learn/?view=grown-up`

If a step was not run, write **BLOCKED** and the reason. Do not write PASS.

## Summary

| browser+version | OS/device | tip SHA | date | tester | critical-path results | label |
| --- | --- | --- | --- | --- | --- | --- |
| Google Chrome 148.0.7778.96 | Ubuntu 24.04.4 LTS, Linux 6.12.94+ x86_64, Cloud Agent desktop VM (not a family device) | `3bd163a504666a6e9293ccb134b6e75694f1febc` | 2026-09-11 | Piany (Cloud Agent) | (a) PASS — hub loads. (b) PASS (simulated) — Wake the sound + Try a key / on-screen path; no ear confirmation. (c) PASS — `meetpiano:beginner-v1` written. (d) PASS — grown-up helper honesty. | `simulated` — Cloud Agent VM; Web Audio / on-screen key path; no acoustic listening; not a physical-device sitting |
| Safari (not installed) | macOS Safari — not available | `3bd163a504666a6e9293ccb134b6e75694f1febc` | 2026-09-11 | Piany (Cloud Agent) | (a) BLOCKED (b) BLOCKED (c) BLOCKED (d) BLOCKED | `BLOCKED` — Safari is not installed on this Linux Cloud Agent VM |
| Safari on iPadOS (not available) | iPad / iPadOS — not available | `3bd163a504666a6e9293ccb134b6e75694f1febc` | 2026-09-11 | Piany (Cloud Agent) | (a) BLOCKED (b) BLOCKED (c) BLOCKED (d) BLOCKED | `BLOCKED` — No iPad or iPadOS runtime is available on this Cloud Agent VM |
| Firefox (not installed) | Desktop Firefox — not available | `3bd163a504666a6e9293ccb134b6e75694f1febc` | 2026-09-11 | Piany (Cloud Agent) | (a) BLOCKED (b) BLOCKED (c) BLOCKED (d) BLOCKED | `BLOCKED` — Firefox is not installed on this Cloud Agent VM |

Blank row for a later sitting: [`critical-path-row.template.md`](critical-path-row.template.md).

## Chrome desktop baseline (detail)

| Field | Value |
| --- | --- |
| browser+version | Google Chrome 148.0.7778.96 |
| OS/device | Ubuntu 24.04.4 LTS (`noble`), Linux 6.12.94+ x86_64, Cloud Agent VM with `DISPLAY=:1`. This is a remote Linux desktop, not a parent’s laptop or a child’s iPad. |
| tip SHA | `3bd163a504666a6e9293ccb134b6e75694f1febc` |
| date | 2026-09-11 |
| tester | Piany (Cloud Agent) |
| label | `simulated` |

| Step | Result | Notes |
| --- | --- | --- |
| (a) open `/learn` | PASS | Local `python3 -m http.server 3000 --directory dist`. Title `First Piano Journey · MeetPiano`. First-sit strip, six worlds in the hub, Grown-up helper in chrome (`#grownup-link`). |
| (b) L01 hear note | PASS (simulated) | **Wake the sound** then **Try a key**. `AudioContext` present and `running`. Setup store `meetpiano:first-session-setup` recorded `heardNote: true` and `soundUnlocked: true`. L01 opened (`Meet the keyboard`). **No acoustic listening** on this VM — not a `listening` row. |
| (c) progress save | PASS | `meetpiano:beginner-v1` written on hub open (`touchSession`). L01 open created attempt `731ef47d-49a9-4cb6-9e71-06f6a4971822` on session `530b1bc4-e592-4426-bf80-9ff499530988`. Reload still had the same session and L01 attempt. |
| (d) grown-up view | PASS | `/learn/?view=grown-up` title `Grown-up helper · First Piano Journey · MeetPiano`. Honesty includes device-local observation aid, not a login, and not privacy protection. |

Headed Chrome 148 on the same VM walked the same four steps (hub → Wake the sound → Try a key → L01 → grown-up helper). The first-sit strip hid after Try a key. No speakers: still not a `listening` row. Grown-up view lists lessons with a stored evidence state; a fresh L01 attempt with `evidenceState: null` is not invented as an observed activity.

Not claimed on this row: physical MIDI, Safari, iPadOS, Firefox, a real tablet, or spoken-word quality.

## BLOCKED rows (detail)

These browsers were **not** opened. The cells are BLOCKED, not PASS.

### Safari (macOS)

| Field | Value |
| --- | --- |
| browser+version | Safari (version unknown — not installed) |
| OS/device | macOS — not present on this VM |
| tip SHA | `3bd163a504666a6e9293ccb134b6e75694f1febc` |
| date | 2026-09-11 |
| tester | Piany (Cloud Agent) |
| critical-path results | (a) BLOCKED (b) BLOCKED (c) BLOCKED (d) BLOCKED |
| label | `BLOCKED` — Safari is not installed on this Linux Cloud Agent VM |

### Safari / iPadOS

| Field | Value |
| --- | --- |
| browser+version | Safari on iPadOS (version unknown — no device) |
| OS/device | iPad / iPadOS — not present |
| tip SHA | `3bd163a504666a6e9293ccb134b6e75694f1febc` |
| date | 2026-09-11 |
| tester | Piany (Cloud Agent) |
| critical-path results | (a) BLOCKED (b) BLOCKED (c) BLOCKED (d) BLOCKED |
| label | `BLOCKED` — No iPad or iPadOS runtime is available on this Cloud Agent VM |

A CSS viewport resize in Chrome is not an iPadOS sitting.

### Firefox

| Field | Value |
| --- | --- |
| browser+version | Firefox (version unknown — not installed) |
| OS/device | Desktop Firefox — not present |
| tip SHA | `3bd163a504666a6e9293ccb134b6e75694f1febc` |
| date | 2026-09-11 |
| tester | Piany (Cloud Agent) |
| critical-path results | (a) BLOCKED (b) BLOCKED (c) BLOCKED (d) BLOCKED |
| label | `BLOCKED` — Firefox is not installed on this Cloud Agent VM |

## What this matrix is not

- Not a “works everywhere” or “works in all browsers” claim
- Not universal compatibility or universal browser support
- Not a physical-device family sitting
- Not a hardware MIDI PASS (see N07)
- Not learning-effectiveness evidence

Automated check: `scripts/fixtures/n08-cross-browser-honesty.json` via `scripts/pilot-cta-check.mjs`.

## After a later human sitting

1. Copy [`critical-path-row.template.md`](critical-path-row.template.md). Keep the blank template in git.
2. Fill every column. Use `listening` only if a person heard the note. Use `physical-device` only for a real device in someone’s hands.
3. Add the row to the summary table. Leave other browsers **BLOCKED** until they are actually sat.
4. Still do not claim universal compatibility. One Chrome row is one Chrome row.

## Authority

Matrix and fixture may land in a PR. Gort merges after Quarty PASS and Mozty accept. Do not merge or deploy from this check alone.
