# First Piano Journey — status

Single active-slice board. Update this file at the start and end of each slice.

| Field | Value |
| --- | --- |
| Mission | First Piano Journey |
| Active slice | **MP-09** Expression and first recital L21–L24 |
| Slice status | **working** |
| Run ID | `piany-mp09-20260909-0000UTC` |
| Branch | `piany/mp-09-expression-recital` |
| Base | `piany/mp-08-together` @ `898e84b4bafdb40c77dbad9a9ab36fb42ecba0f7` |
| Start time | 2026-09-09 03:33 UTC |
| Last evidence | [`../evidence/first-piano-journey/mp-09.md`](../evidence/first-piano-journey/mp-09.md) |
| Blockers | Physical MIDI keyboard not available in this environment — hardware check unverified |
| Next action | Mitch review of draft PR into `piany/mp-08-together`. Do not merge or deploy production from this slice. |
| Next eligible slice | MP-10 leftover review or MP-11 closeout |

## Notes

- Stacked on `piany/mp-08-together` @ `898e84b`. Draft PR targets `piany/mp-08-together`, not `main`.
- Copyright footer from `main` @ `05ba06a8df48898f9e66a2f1bf832232abe0950e` (PR #8) remains an ancestor. `dist/js/copyright.js` and the `/` + `/learn` footer markup (`data-copyright-year`, Xpancom, LLC) are unchanged.
- Canonical hosting is a single Vercel project `meetpiano` plus `https://meetpiano.app`. This slice does not change Vercel projects, domains, or DNS.
- `/learn` is the journey hub: First Notes (L01–L04), Rhythm Club (L05–L08), Read and play (L09–L12), Left hand (L13–L16), Together (L17–L20), and Expression (L21–L24).
- Unlock: L21 after L20 Independent; L22 after L21 Practiced; L23 after L22 Practiced; L24 after L23 Independent. Checkpoint B: all 24 lessons authored and reachable when prerequisites are met.
- Quiet versus strong uses velocity only when the input sent it. Technique is never inferred.
- Recital mode hides glowing keys and lets a share finish through wobbles. Results list notes, rhythm, assistance, self-observation, and a later transfer check separately.
- Progress key: `localStorage` `meetpiano:beginner-v1`. Device-local only. Demo playback cannot earn progress.
- Branch `cursor/setup-cloud-agent-env-d108` was left untouched.
- Production deploy is not part of this slice. Mitch approval is required to merge or deploy production.
- Do not mark physical MIDI verified.
