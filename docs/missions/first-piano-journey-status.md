# First Piano Journey — status

Single active-slice board. Update this file at the start and end of each slice.

| Field | Value |
| --- | --- |
| Mission | First Piano Journey |
| Active slice | **MP-05** Read and play L09–L12 |
| Slice status | **working** |
| Run ID | `piany-mp05-20260909-0000UTC` |
| Branch | `piany/mp-05-read-and-play` |
| Base | `piany/mp-04-rhythm-club` @ `d144baa88357f69b90caf7a427b6bd3c3c2731db` |
| Start time | 2026-09-09 00:00 UTC |
| Last evidence | [`../evidence/first-piano-journey/mp-05.md`](../evidence/first-piano-journey/mp-05.md) (filled 2026-09-09; product `c9c95de`, checks `50b940c`, PR #7) |
| Blockers | Physical MIDI keyboard not available in this environment — hardware check unverified |
| Next action | Mitch review of draft PR into `piany/mp-04-rhythm-club`. Do not merge or deploy production from this slice. |
| Next eligible slice | MP-06 — Device-local progress polish (or MP-08 leftover neighborhood skills) |

## Notes

- Stacked on `piany/mp-04-rhythm-club` @ `d144baa`. Draft PR targets that branch, not `main`.
- Canonical hosting is a single Vercel project `meetpiano` plus `https://meetpiano.app`. `https://meetpiano.app/learn` already serves the First Notes hub on current `main` (HTTP 200). The former `meetpiano-app` project was deleted.
- `/learn` is the journey hub: First Notes (L01–L04), Rhythm Club (L05–L08), and Read and play (L09–L12). L01 remains at `/learn/?lesson=L01`.
- Unlock: L09 after L08 Independent; L10 after L09 Practiced; L11 after L10 Practiced; L12 after L11 Independent. No buttons to L13+.
- Staff pitch, clef, duration, demo audio, and expected keys agree. Independent/transfer that name a preview register use exact MIDI pitch.
- Progress key: `localStorage` `meetpiano:beginner-v1`. Device-local only. Demo playback cannot earn progress. Help/replay do not erase saved evidence.
- Branch `cursor/setup-cloud-agent-env-d108` was left untouched.
- Do not change Vercel projects, domains, or DNS.
- Production deploy is not part of this slice. Mitch approval is required to merge or deploy production.
- Do not mark physical MIDI verified.
