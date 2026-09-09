# First Piano Journey — status

Single active-slice board. Update this file at the start and end of each slice.

| Field | Value |
| --- | --- |
| Mission | First Piano Journey |
| Active slice | **MP-07** Left hand L13–L16 |
| Slice status | **working** |
| Run ID | `piany-mp07-20260909-0000UTC` |
| Branch | `piany/mp-07-left-hand` |
| Base | `main` @ `3da09b909fc54aaf54f0be8b00b374c3adf5cf5f` |
| Start time | 2026-09-09 01:41 UTC |
| Last evidence | [`../evidence/first-piano-journey/mp-07.md`](../evidence/first-piano-journey/mp-07.md) |
| Blockers | Physical MIDI keyboard not available in this environment — hardware check unverified |
| Next action | Mitch review of draft PR into `main`. Do not merge or deploy production from this slice. |
| Next eligible slice | MP-08 leftover neighborhood or MP-11 closeout |

## Notes

- Recreated on current `main` after Mitch merged #6 / #7 / #9. Draft PR targets `main`, not the old stacked bases. This slice did not re-merge those PRs.
- Copyright footer from `main` @ `05ba06a8df48898f9e66a2f1bf832232abe0950e` (PR #8) is an ancestor of the `3da09b9` base. `dist/js/copyright.js` and the `/` + `/learn` footer markup (`data-copyright-year`, Xpancom, LLC) are unchanged from that commit.
- Canonical hosting is a single Vercel project `meetpiano` plus `https://meetpiano.app`. Live `/learn` already serves First Notes + Rhythm Club + Read and play + evidence lanes + Xpancom copyright.
- `/learn` is the journey hub: First Notes (L01–L04), Rhythm Club (L05–L08), Read and play (L09–L12), and Left hand (L13–L16).
- Unlock: L13 after L12 Independent; L14 after L13 Practiced; L15 after L14 Practiced; L16 after L15 Independent. No buttons to L17+.
- Both clefs and both keyboard rooms can show. MIDI reports pitch and time only. Hand choice is adult-observed.
- A learner may practice one hand and return without losing the step.
- Progress key: `localStorage` `meetpiano:beginner-v1`. Device-local only. Demo playback cannot earn progress.
- Copyright footer (`dist/js/copyright.js`, `data-copyright-year`, Xpancom, LLC) is preserved from `main`.
- Branch `cursor/setup-cloud-agent-env-d108` was left untouched.
- Do not change Vercel projects, domains, or DNS.
- Production deploy is not part of this slice. Mitch approval is required to merge or deploy production.
- Do not mark physical MIDI verified.
