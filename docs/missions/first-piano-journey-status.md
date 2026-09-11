# First Piano Journey — status

Single active-slice board. Update this file at the start and end of each slice.

| Field | Value |
| --- | --- |
| Mission | First Piano Journey |
| Active slice | **N10** Pilot readiness software pass (pack ↔ live) |
| Slice status | **working** (copy/path/checklist only; no merge/deploy/outreach by this slice) |
| Run ID | `piany-n10-20260911-0441UTC` |
| Branch | `cursor/n10-pilot-readiness-91c0` |
| Base | `main` @ `09df2ba0b8fdd9631a22142d606be3857d7ea3c2` (N09 merge, PR #25) |
| Start time | 2026-09-11 04:41 UTC |
| Last evidence | Pilot pack [`../pilots/first-piano-journey-v1/`](../pilots/first-piano-journey-v1/) · readiness [`../pilots/first-piano-journey-v1/readiness-checklist.md`](../pilots/first-piano-journey-v1/readiness-checklist.md) · fixture [`../../scripts/fixtures/n10-pilot-readiness.json`](../../scripts/fixtures/n10-pilot-readiness.json) · packet [`first-piano-journey-release.md`](first-piano-journey-release.md) |
| Blockers | Hardware MIDI unverified (N07). Learning validation pending. Safari / iPadOS / Firefox **BLOCKED** (N08). Outreach held — escalate to Gort/Mitch in notes only. |
| Next action | Quarty/Mozty review of this docs PR. Do not merge or deploy from this slice. Do not contact pilots. **DO NOT SEND.** |
| Next eligible slice | Later leftover outlines / a filled hardware-MIDI PASS log / a human browser sitting (only after Mitch authorizes outreach) |

## Notes

- **Current live** (N10 start, 2026-09-11): First Piano Journey **L01–L24** is on merged `main` @ `09df2ba0b8fdd9631a22142d606be3857d7ea3c2` (N09 merge). N09 had recorded `6ea24b9d36cfb71a07d5fb62b87451ded4456d62` (N08 merge) as the tip at N09 start. Product range is unchanged.
- Brand `https://meetpiano.app/learn` returned HTTP 200 the same day and describes twenty-four jobs (L01–L24). This slice does not deploy.
- MP-07 through MP-11 and N01–N09 product/docs work is already on that tip. N10 changes pack copy, the readiness checklist, and the readiness fixture only.
- **Learning validation pending.** No educator review, no learner sitting, no classroom pass, no efficacy claims.
- **Hardware MIDI unverified** (N07). No filled PASS log. On-screen keys and computer keys stay first-class.
- Browser honesty stays with N08: Chrome desktop on the Cloud Agent VM is **simulated**. Safari, iPadOS, and Firefox are **BLOCKED**, not silent green.
- Do not treat the former MP-06 / PR #9 tip (then L01–L12 only) as the current tip.
- Canonical hosting is a single Vercel project `meetpiano` plus `https://meetpiano.app`. This slice does not change Vercel projects, domains, or DNS.
- Branch `cursor/setup-cloud-agent-env-d108` was left untouched.
- Do not mark physical MIDI verified. Do not claim guaranteed outcomes or full beginner proficiency.
- Outreach stays blocked until Mitch says go. **DO NOT SEND.** Escalate held outreach to Gort/Mitch in notes only.
