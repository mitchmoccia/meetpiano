# First Piano Journey — status

Single active-slice board. Update this file at the start and end of each slice.

| Field | Value |
| --- | --- |
| Mission | First Piano Journey |
| Active slice | **MP-06** Device-local progress and next-session recommendation |
| Slice status | **working** |
| Run ID | `piany-mp06-20260909-0000UTC` |
| Branch | `piany/mp-06-adaptive-next` |
| Base | `piany/mp-05-read-and-play` @ `54d0d0c96f2e0d2b15c0992fa5f884b49c62da87` |
| Start time | 2026-09-09 01:13 UTC |
| Last evidence | [`../evidence/first-piano-journey/mp-05.md`](../evidence/first-piano-journey/mp-05.md) (MP-05 filled; MP-06 evidence pending) |
| Blockers | Physical MIDI keyboard not available in this environment — hardware check unverified |
| Next action | Implement skill evidence, next-session recommendation, and device-local export/import. Do not merge or deploy production from this slice. |
| Next eligible slice | MP-07 input labels, MP-08 leftover neighborhood, or MP-11 closeout |

## Notes

- Stacked on `piany/mp-05-read-and-play` @ `54d0d0c`. Draft PR targets that branch, not `main`.
- Canonical hosting is a single Vercel project `meetpiano` plus `https://meetpiano.app`. `https://meetpiano.app/learn` already serves the First Notes hub on current `main` (HTTP 200). The former `meetpiano-app` project was deleted.
- `/learn` is the journey hub: First Notes (L01–L04), Rhythm Club (L05–L08), and Read and play (L09–L12). L01 remains at `/learn/?lesson=L01`.
- Unlock: L09 after L08 Independent; L10 after L09 Practiced; L11 after L10 Practiced; L12 after L11 Independent. No buttons to L13+.
- Staff pitch, clef, duration, demo audio, and expected keys agree. Independent/transfer that name a preview register use exact MIDI pitch.
- Progress key: `localStorage` `meetpiano:beginner-v1`. Device-local only. Demo playback cannot earn progress. Help/replay do not erase saved evidence.
- Branch `cursor/setup-cloud-agent-env-d108` was left untouched.
- Do not change Vercel projects, domains, or DNS.
- Production deploy is not part of this slice. Mitch approval is required to merge or deploy production.
- Do not mark physical MIDI verified.
