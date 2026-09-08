# First Piano Journey — status

Single active-slice board. Update this file at the start and end of each slice.

| Field | Value |
| --- | --- |
| Mission | First Piano Journey |
| Active slice | **MP-01** Playable `/learn` + L01 |
| Slice status | **working** |
| Run ID | `piany-mp01-20260908-2230UTC` |
| Branch | `piany/mp-01-learn-l01` |
| Base | `piany/mp-00-mission-foundation` @ `1cf494ffb73ca33d037b7b47ced6d74d5161d5e5` |
| Start time | 2026-09-08 22:30 UTC |
| Last evidence | [`../evidence/first-piano-journey/mp-01.md`](../evidence/first-piano-journey/mp-01.md) |
| Blockers | None |
| Next action | Verify browser L01 path, then mark MP-01 verified |
| Next eligible slice | MP-02 — teaching-loop engine |

## Notes

- `/learn` is a static `dist/learn/index.html` surface. `vercel.json` rewrites `/learn` and `/learn/` to that file. Marketing home at `/` is unchanged in purpose.
- Progress key: `localStorage` `meetpiano:beginner-v1`. Device-local only. Demo playback cannot earn progress.
- Branch `cursor/setup-cloud-agent-env-d108` was left untouched.
- Production deploy is not part of this slice. Mitch approval is required to merge or deploy production.
