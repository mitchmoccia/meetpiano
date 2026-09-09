# First Piano Journey — status

Single active-slice board. Update this file at the start and end of each slice.

| Field | Value |
| --- | --- |
| Mission | First Piano Journey |
| Active slice | **MP-10** Kid-friendly UX and grown-up view |
| Slice status | **working** |
| Run ID | `piany-mp10-20260909-0000UTC` |
| Branch | `piany/mp-10-kid-grownup-ux` |
| Base | `piany/mp-09-expression-recital` @ `980bf17a22223a4279ac50ccca3cf0814d454307` |
| Start time | 2026-09-09 03:52 UTC |
| Last evidence | [`../evidence/first-piano-journey/mp-10.md`](../evidence/first-piano-journey/mp-10.md) |
| Blockers | Physical MIDI keyboard not available in this environment — hardware check unverified |
| Next action | Mitch review of draft PR into `piany/mp-09-expression-recital`. Do not merge or deploy production from this slice. |
| Next eligible slice | Later leftover outlines or MP-11 closeout |

## Notes

- Stacked on `piany/mp-09-expression-recital` @ `980bf17`. Draft PR targets `piany/mp-09-expression-recital`, not `main`.
- Copyright footer from `main` @ `05ba06a8df48898f9e66a2f1bf832232abe0950e` (PR #8) remains an ancestor. `dist/js/copyright.js` and the `/` + `/learn` footer markup (`data-copyright-year`, Xpancom, LLC) are unchanged.
- Canonical hosting is a single Vercel project `meetpiano` plus `https://meetpiano.app`. This slice does not change Vercel projects, domains, or DNS.
- `/learn` keeps all 24 lessons. MP-10 adds a yellow “Do this now” job, optional spoken words, Pause / Exit / Resume, device-local reset next to export/import, and `/learn/?view=grown-up`.
- Grown-up view lists skills this browser already stored and one offline practice idea. It is a helper card, not a login and not privacy protection.
- Narration uses the browser speech engine when present. If speech fails, the job stays on screen. Piano demo buttons stay separate and replayable.
- Progress key: `localStorage` `meetpiano:beginner-v1`. Pause key: `meetpiano:beginner-v1:pause`. Device-local only. Demo playback cannot earn progress.
- Branch `cursor/setup-cloud-agent-env-d108` was left untouched.
- Production deploy is not part of this slice. Mitch approval is required to merge or deploy production.
- Do not mark physical MIDI verified.
