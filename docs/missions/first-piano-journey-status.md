# First Piano Journey — status

Single active-slice board. Update this file at the start and end of each slice.

| Field | Value |
| --- | --- |
| Mission | First Piano Journey |
| Active slice | **MP-02** Trustworthy keyboard / MIDI input |
| Slice status | **working** |
| Run ID | `piany-mp02-20260908-2257UTC` |
| Branch | `piany/mp-02-midi-input` |
| Base | `main` @ `13fbd6b29f0f78278a72e25ea0fbfb65e609a1aa` |
| Start time | 2026-09-08 22:57 UTC |
| Last evidence | [`../evidence/first-piano-journey/mp-02.md`](../evidence/first-piano-journey/mp-02.md) |
| Blockers | Physical MIDI keyboard not available in this environment |
| Next action | Finish fixture checks and honest evidence. Do not merge or deploy production from this slice. |
| Next eligible slice | MP-03 — L02 Find C |

## Notes

- MP-00 and MP-01 are merged to `main` (`13fbd6b`). This slice is stacked on `main`, not on the old MP-01 branch.
- `/learn` stays a static `dist/learn/index.html` surface. No Next.js rewrite.
- Progress key: `localStorage` `meetpiano:beginner-v1`. Device-local only. Demo playback cannot earn progress.
- Attempt records now store `inputMode` and optional MIDI `inputDevice`.
- Branch `cursor/setup-cloud-agent-env-d108` was left untouched.
- Do not change Vercel projects, domains, or DNS.
- Production deploy is not part of this slice. Mitch approval is required to merge or deploy production.
