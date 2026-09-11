# Hardware MIDI verification protocol

This is the written check for **physical** MIDI keyboards against MeetPiano.

It does **not** certify technique, fingering, posture, hand choice, or learning effectiveness.

Web MIDI in a supporting browser stays **optional**. On-screen keys and computer keys stay first-class. Do not rewrite the MIDI stack to satisfy this protocol.

## Current status (N07)

**No filled PASS log exists.**

| Lane | Result |
| --- | --- |
| Software honesty | Checkable in-repo. Home, `/learn`, setup strip, grown-up helper, and AEO copy must keep optional Web MIDI and must not claim hardware was verified. `node scripts/pilot-cta-check.mjs` (N07 fixture) is the automated lane. |
| Physical hardware | **BLOCKED** until a tester with a real keyboard fills a log from [`hardware-midi-log.template.md`](hardware-midi-log.template.md). A Cloud Agent or fixture run without an attached keyboard cannot produce a PASS. |

Do not treat `navigator.requestMIDIAccess`, a permission prompt, a denied prompt, simulated fixtures, or an AttemptRecord with `midiVerified: true` as a hardware PASS. That flag means **heard over MIDI in software**, not a hardware certification.

Until a PASS row exists, product copy must keep the baseline: physical MIDI hardware is **not verified**. Do not add a green verified badge.

## Required log fields

Every physical check uses these fields. Copy them into a dated log (or fill one template row). Cite this file in the PR.

| Field | What to write |
| --- | --- |
| make/model | Keyboard brand and model as printed on the device or shown by the OS. |
| OS | Operating system and version (for example macOS 15.1, Windows 11 24H2, ChromeOS). |
| browser (+version) | Browser name and full version string. |
| adapter/cable or direct USB | `direct USB` or the adapter/cable make/model (USB-C hub, DIN-to-USB, etc.). |
| date | ISO date of the sitting (`YYYY-MM-DD`). |
| tester | Who ran the sitting (name or role). |
| pass/fail | `PASS`, `FAIL`, or `BLOCKED`. `BLOCKED` means no keyboard was present — it is not a PASS. |
| notes | What happened, including any FAIL step and whether on-screen / computer keys still worked. |

Template: [`hardware-midi-log.template.md`](hardware-midi-log.template.md).

## What a PASS requires

A PASS is only valid when a real instrument was connected and every step below succeeded on that sitting. Record the required fields first.

1. Connect the keyboard (direct USB or named adapter/cable). Confirm the OS sees it.
2. Open `/` or `/learn` in the logged browser. Keep on-screen keys and computer keys available.
3. Request Web MIDI. Permission is granted.
4. Status names the connected input (or an honest connected state). Copy must not say hardware is certified.
5. **Note-on:** one key produces a heard note in the page.
6. **Hold:** keeping the key down does not count the same press again.
7. **Note-off:** release, or a silent / velocity-zero event, ends the hold. A new press counts as a new try.
8. **Disconnect:** unplug. Copy says the keyboard left. On-screen keys and computer keys still work.
9. **Reconnect:** plug back in. A new note-on is heard without reloading the page if the browser keeps the session.

If any required step cannot be run, the row is `FAIL` or `BLOCKED`, not `PASS`.

## What is not a PASS

- Fixtures in `scripts/fixtures/mp-02-midi.json` or `node scripts/mp-02-check.mjs`
- Web MIDI API present with **no** attached keyboard
- Permission denied, dismissed, or unused
- Marketing “Keyboard connected” / setup-strip optional MIDI copy
- `inputMode: 'midi'` or `midiVerified: true` on a device-local attempt
- Bluetooth audio paired as headphones (not MIDI)

## Software honesty (always)

Quarty (and this repo’s fixtures) always check copy. Physical presence is not required for this lane.

Honesty surfaces must keep:

- Optional Web MIDI
- On-screen keys and computer keys
- Baseline **not verified** for physical hardware

Honesty surfaces must never claim, without a filled PASS log:

- hardware midi verified
- midi-verified
- universal keyboard support

Related in-product lines (do not weaken):

- Home meta / FAQ: physical MIDI hardware is not verified; compatibility depends on keyboard, adapter, OS, and browser
- `/learn` disclosure and setup strip: MIDI is optional; physical hardware is not verified
- Grown-up / evidence copy: heard over MIDI is not a hardware certification
- AEO (`dist/llms.txt`): Physical MIDI hardware is not verified

Automated check: `scripts/fixtures/n07-hardware-midi-honesty.json` via `scripts/pilot-cta-check.mjs`.

## After a later human PASS

1. Fill a log row from the template. Keep the blank template in git.
2. Store the filled row next to this file, named with the date (for example `hardware-midi-log-2026-09-11.md`).
3. Only then may release notes cite that **one** make/model + OS + browser sitting.
4. Still do not claim universal keyboard support. One PASS is one sitting.

## Authority

Protocol and template may land in a PR. Gort merges after Quarty PASS and Mozty accept. Do not merge or deploy from this check alone. Do not promote a MIDI-certified release without a filled PASS log and Mitch approval.
