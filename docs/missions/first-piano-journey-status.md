# First Piano Journey — status

Single active-slice board. Update this file at the start and end of each slice.

| Field | Value |
| --- | --- |
| Mission | First Piano Journey |
| Active slice | **MP-03** First Notes L01–L04 (Checkpoint A) |
| Slice status | **working** |
| Run ID | `piany-mp03-20260908-2330UTC` |
| Branch | `piany/mp-03-first-notes` |
| Base | `piany/mp-02-midi-input` @ `f478ed60993227c04f47427c217d3b90b2e0981f` |
| Start time | 2026-09-08 23:30 UTC |
| Last evidence | [`../evidence/first-piano-journey/mp-03.md`](../evidence/first-piano-journey/mp-03.md) (filled 2026-09-08; product `912e6bc`, HEAD `72f4e5b`, PR #5) |
| Blockers | Physical MIDI keyboard not available in this environment — hardware check unverified |
| Next action | Mitch review of draft PR into `piany/mp-02-midi-input`. Do not merge or deploy production from this slice. |
| Next eligible slice | MP-06 — Device-local progress polish (L03/L04 teaching already in this Checkpoint A branch) |

## Notes

- Stacked on `piany/mp-02-midi-input` (MP-02 MIDI work not yet merged). If that base disappears, retarget `main`.
- `/learn` is the First Notes unit hub. L01 remains at `/learn/?lesson=L01`.
- L02 Find C, L03 Neighbors, and L04 Little Wave are playable on this branch (Checkpoint A). Unlock: L02 after L01 Practiced, L03 after L02 Practiced, L04 after L03 Independent.
- Progress key: `localStorage` `meetpiano:beginner-v1`. Device-local only. Demo playback cannot earn progress. Help/replay do not erase saved evidence.
- Branch `cursor/setup-cloud-agent-env-d108` was left untouched.
- Do not change Vercel projects, domains, or DNS.
- Production deploy is not part of this slice. Mitch approval is required to merge or deploy production.
- Do not mark physical MIDI verified.
