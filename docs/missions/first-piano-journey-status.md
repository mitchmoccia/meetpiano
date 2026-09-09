# First Piano Journey — status

Single active-slice board. Update this file at the start and end of each slice.

| Field | Value |
| --- | --- |
| Mission | First Piano Journey |
| Active slice | **MP-08** Together L17–L20 |
| Slice status | **working** |
| Run ID | `piany-mp08-20260909-0000UTC` |
| Branch | `piany/mp-08-together` |
| Base | `piany/mp-07-left-hand` @ `b901df6dfeab91d0305e1fc4ade590e2264a22c3` |
| Start time | 2026-09-09 02:49 UTC |
| Last evidence | [`../evidence/first-piano-journey/mp-08.md`](../evidence/first-piano-journey/mp-08.md) |
| Blockers | Physical MIDI keyboard not available in this environment — hardware check unverified |
| Next action | Mitch review of draft PR into `piany/mp-07-left-hand`. Do not merge or deploy production from this slice. |
| Next eligible slice | MP-09 leftover neighborhood or MP-11 closeout |

## Notes

- Stacked on `piany/mp-07-left-hand` because PR #10 is not merged to `main` yet. Draft PR targets `piany/mp-07-left-hand`, not `main`.
- Copyright footer from `main` @ `05ba06a8df48898f9e66a2f1bf832232abe0950e` (PR #8) remains an ancestor. `dist/js/copyright.js` and the `/` + `/learn` footer markup (`data-copyright-year`, Xpancom, LLC) are unchanged.
- Canonical hosting is a single Vercel project `meetpiano` plus `https://meetpiano.app`. This slice does not change Vercel projects, domains, or DNS.
- `/learn` is the journey hub: First Notes (L01–L04), Rhythm Club (L05–L08), Read and play (L09–L12), Left hand (L13–L16), and Together (L17–L20).
- Unlock: L17 after L16 Independent; L18 after L17 Practiced; L19 after L18 Practiced; L20 after L19 Independent. No buttons to L21+.
- Per-hand preparation precedes combined attempts. Simultaneous groups, held bass, extras, and releases are scored. A wrong tap does not skip later pairs.
- On-screen keys are labeled as an exploration stand-in, not proof of hand coordination. MIDI reports pitch and time only.
- Progress key: `localStorage` `meetpiano:beginner-v1`. Device-local only. Demo playback cannot earn progress.
- Branch `cursor/setup-cloud-agent-env-d108` was left untouched.
- Production deploy is not part of this slice. Mitch approval is required to merge or deploy production.
- Do not mark physical MIDI verified.
