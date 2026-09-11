# Hardware MIDI log (template)

Blank row for one physical sitting. Copy this file before filling. Do not edit a PASS into this template.

A row is evidence only when **make/model**, **OS**, **browser (+version)**, **adapter/cable or direct USB**, **date**, **tester**, **pass/fail**, and **notes** are all filled, and a real keyboard was present. `BLOCKED` (no keyboard) is not a PASS.

Protocol: [`hardware-midi-protocol.md`](hardware-midi-protocol.md).

## Log row

| Field | Value |
| --- | --- |
| make/model | |
| OS | |
| browser (+version) | |
| adapter/cable or direct USB | |
| date | |
| tester | |
| pass/fail | |
| notes | |

## Sitting checklist

Mark each step. Any unchecked required step means `FAIL` or `BLOCKED`, not `PASS`.

| Step | Result (ok / fail / blocked) |
| --- | --- |
| OS sees the keyboard | |
| Web MIDI permission granted | |
| Status names the connected input honestly | |
| Note-on heard in the page | |
| Hold does not multi-count | |
| Note-off / velocity-zero ends the hold | |
| Disconnect keeps on-screen and computer keys | |
| Reconnect hears a new note-on | |

## Surfaces used

- [ ] `/` marketing preview
- [ ] `/learn` setup strip or lesson

## Reminder

On-screen keys and computer keys must still work if MIDI is missing or the keyboard leaves. Do not write a hardware certification into the product from this row alone.
