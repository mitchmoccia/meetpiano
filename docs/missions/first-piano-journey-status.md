# First Piano Journey — status

Single active-slice board. Update this file at the start and end of each slice.

| Field | Value |
| --- | --- |
| Mission | First Piano Journey |
| Active slice | **MP-04** Rhythm Club L05–L08 |
| Slice status | **working** |
| Run ID | `piany-mp04-20260909-0000UTC` |
| Branch | `piany/mp-04-rhythm-club` |
| Base | `main` @ `96860fa8262bfe2f8a902910c55745054d21eeb5` |
| Start time | 2026-09-09 00:00 UTC |
| Last evidence | [`../evidence/first-piano-journey/mp-04.md`](../evidence/first-piano-journey/mp-04.md) (filled 2026-09-09; product `93bc2c7`, checks `f798cd3`, PR #6) |
| Blockers | Physical MIDI keyboard not available in this environment — hardware check unverified |
| Next action | Mitch review of draft PR into `main`. Do not merge or deploy production from this slice. |
| Next eligible slice | MP-06 — Device-local progress polish (or MP-08 neighborhood skills) |

## Notes

- Stacked on current `main` after Mitch merged MP-02 + MP-03 (`96860fa`). Draft PR targets `main`, not the old stack branches.
- Canonical hosting is a single Vercel project `meetpiano` plus `https://meetpiano.app`. `https://meetpiano.app/learn` already serves the First Notes hub (HTTP 200). The former `meetpiano-app` project was deleted.
- `/learn` is the journey hub: First Notes (L01–L04) and Rhythm Club (L05–L08). L01 remains at `/learn/?lesson=L01`.
- Unlock: L05 after L04 Independent; L06 after L05 Practiced; L07 after L06 Practiced; L08 after L07 Independent. No buttons to L09+.
- Rhythm scoring uses a shared audio clock (not rAF-only). Guided windows are wider than performance windows.
- Progress key: `localStorage` `meetpiano:beginner-v1`. Device-local only. Demo playback cannot earn progress. Help/replay do not erase saved evidence.
- Branch `cursor/setup-cloud-agent-env-d108` was left untouched.
- Do not change Vercel projects, domains, or DNS.
- Production deploy is not part of this slice. Mitch approval is required to merge or deploy production.
- Do not mark physical MIDI verified.
