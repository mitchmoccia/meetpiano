# Critical-path browser row (template)

Blank row for one browser/OS sitting. Copy this file before filling. Do not edit a PASS into this template.

A row is evidence only when **browser+version**, **OS/device**, **tip SHA**, **date**, **tester**, **critical-path results**, and **label** are all filled. Untested browsers are `BLOCKED` plus a reason — not silent green.

Matrix: [`critical-path-matrix.md`](critical-path-matrix.md).

## Row

| Field | Value |
| --- | --- |
| browser+version | |
| OS/device | |
| tip SHA | |
| date | |
| tester | |
| critical-path results | |
| label | physical-device / listening / simulated / BLOCKED + reason |

## Critical path

Mark each step. Any step that was not run is `BLOCKED`, not `PASS`.

| Step | Result (PASS / FAIL / BLOCKED) | Notes |
| --- | --- | --- |
| (a) open `/learn` | | |
| (b) L01 hear note (real listening, or labeled simulated) | | |
| (c) progress save (`meetpiano:beginner-v1`) | | |
| (d) grown-up view (`/learn/?view=grown-up`) | | |

## Label rules

- `physical-device` — sitting on a real family device in someone’s hands
- `listening` — tester heard a real note on speakers or headphones
- `simulated` — software path exercised without acoustic confirmation, or not on a physical family device
- `BLOCKED` + reason — the sitting was not run (missing browser, missing device, no permission)

Viewport emulation is not a `physical-device` row. A Cloud Agent VM without confirmed sound is `simulated`, not `listening`.

## Reminder

Do not write that MeetPiano works everywhere, works in all browsers, or has universal compatibility. Physical MIDI hardware stays under the N07 protocol and is not verified from this row.
