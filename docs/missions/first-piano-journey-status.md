# First Piano Journey — status

Single active-slice board. Update this file at the start and end of each slice.

| Field | Value |
| --- | --- |
| Mission | First Piano Journey |
| Active slice | **N09** Facts-only status/release docs refresh |
| Slice status | **working** (docs only; no merge/deploy by this slice) |
| Run ID | `piany-n09-20260911-0426UTC` |
| Branch | `cursor/n09-docs-tip-refresh-3939` |
| Base | `main` @ `6ea24b9d36cfb71a07d5fb62b87451ded4456d62` (N08 merge, PR #24) |
| Start time | 2026-09-11 04:26 UTC |
| Last evidence | Packet [`first-piano-journey-release.md`](first-piano-journey-release.md) · fixture [`../../scripts/fixtures/n09-docs-tip-refresh.json`](../../scripts/fixtures/n09-docs-tip-refresh.json) · MP-11 packet history [`../evidence/first-piano-journey/mp-11.md`](../evidence/first-piano-journey/mp-11.md) |
| Blockers | Hardware MIDI unverified (N07). Learning validation pending. Safari / iPadOS / Firefox **BLOCKED** (N08). |
| Next action | Quarty/Mozty review of this docs PR. Do not merge or deploy from this slice. Do not contact pilots. |
| Next eligible slice | Later leftover outlines / a filled hardware-MIDI PASS log / a human browser sitting |

## Notes

- **Current live** (re-verified 2026-09-11): First Piano Journey **L01–L24** is on merged `main` @ `6ea24b9d36cfb71a07d5fb62b87451ded4456d62`. Six `/learn` worlds: First Notes, Rhythm Club, Read and play, Left hand, Together, Expression.
- Brand `https://meetpiano.app/learn` returned HTTP 200 the same hour and describes twenty-four jobs (L01–L24). This slice does not deploy.
- MP-07 through MP-11 and N01–N08 product work is already on that tip. N09 changes docs and the tip-refresh fixture only.
- **Learning validation pending.** No educator review, no learner sitting, no classroom pass, no efficacy claims.
- **Hardware MIDI unverified** (N07). No filled PASS log. On-screen keys and computer keys stay first-class.
- Browser honesty stays with N08: Chrome desktop on the Cloud Agent VM is **simulated**. Safari, iPadOS, and Firefox are **BLOCKED**, not silent green.
- Do not treat the former MP-06 / PR #9 tip (then L01–L12 only) as the current tip.
- Canonical hosting is a single Vercel project `meetpiano` plus `https://meetpiano.app`. This slice does not change Vercel projects, domains, or DNS.
- Branch `cursor/setup-cloud-agent-env-d108` was left untouched.
- Do not mark physical MIDI verified. Do not claim guaranteed outcomes or full beginner proficiency.
- Outreach stays blocked until Mitch says go.
