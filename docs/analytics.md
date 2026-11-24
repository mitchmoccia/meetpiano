# Funnel analytics

MeetPiano measures the product funnel with Vercel Web Analytics. The collector is cookieless and first-party: the browser loads `/_vercel/insights/script.js` and posts to `/_vercel/insights/view` and `/_vercel/insights/event`. No third-party script host is added to the content security policy. `script-src` and `connect-src` stay `'self'`.

Static pages (`/`, `/learn`, `/songs`) cannot use an inline bootstrap. They load `public/js/analytics.js`. App routes load that same file with the page's CSP nonce. Signup calls `track()` from `@vercel/analytics`, which uses the queue that file registers. The package's `<Analytics>` component is not used, because its development mode requests `va.vercel-scripts.com`.

## No-PII rule

Do not send names, emails, nicknames, child data, account ids, device names, free text, note names, or raw URLs.

Allowed props are coarse and closed:

| Prop | Values |
| --- | --- |
| `page` | `home`, `learn`, `songs`, `signup`, `signin`, `check_email`, `forgot_password`, `reset_password`, `play`, `family`, `family_welcome`, `family_account`, `family_child_new`, `verify` |
| `lesson` | `L01`–`L24` |
| `song` | a slug from the public-domain song catalog |
| `view` | `keys`, `drop`, `sheet`, `legend` |
| `level` | `noob`, `pro`, `expert` (the Level control, not the Beginner/Step-up filter) |
| `grade` | `S`, `A`, `B`, `C` |

Each event has at most two props so it fits Vercel Pro without the Web Analytics Plus add-on. An event with any other prop, or a value outside the list, is dropped. Query strings are removed. Pages that are not in the table (including `/family/children/[childId]` and `/admin`) do not load the script.

`scripts/analytics-allowlist-check.mjs` compares `src/lib/analytics/events.ts` with `public/js/analytics.js` and checks every call site. `tests/analytics.test.ts` covers the same rules.

## Events

| Event | When it fires | Props |
| --- | --- | --- |
| Page view | Vercel records a page view on an allowlisted path. The stored path is the coarse path, with no query string. | none in our payload; the path is the page |
| `page_view` | The same page load, as a custom event | `page` |
| `lesson_start` | A lesson opens, and again when the learner starts that lesson over | `lesson` |
| `lesson_complete` | The lesson reaches its result during this visit, including "finish for now". Reopening a saved result does not fire it again. | `lesson` |
| `song_open` | A song becomes the current song, including the first song on the page | `song` |
| `song_play` | Play starts | `song`, `level` |
| `song_complete` | A non-looped run reaches the end | `song`, `grade` |
| `view_change` | The learner picks a different view | `view`, `song` |
| `level_change` | The learner picks a different level | `level`, `song` |
| `note_inspect_open` | The note popover opens. The pitch is not sent. | `song`, `view` |
| `see_results_open` | The results dialog opens | `song`, `grade` |
| `midi_connect_success` | A MIDI keyboard becomes connected. Device names are not sent. | none |
| `signup_start` | The grown-up submits the create-account form after the passwords match | none |
| `signup_complete` | The account is created. The email stays in the form and in session storage. | none |

A looped phrase is not `song_complete`. Hearing the tune is not `song_play`.

## Privacy behavior

- Do Not Track (`1` or `yes`) and Global Privacy Control skip the script. No event is queued.
- The code never calls `identify`, `group`, or `enableCookie`.
- Insights posts use `credentials: 'omit'` and `referrerPolicy: 'no-referrer'`, so the session cookie and the full URL are not attached to the beacon.
- Requests to `va.vercel-scripts.com`, `cdn.vercel-insights.com`, and `vitals.vercel-insights.com` are not sent.
- Vercel still builds a visitor hash from the request. Their docs say the hash lasts 24 hours, is not a cookie, and is not shared across sites. They also store country or region derived from the IP, then discard the IP, plus browser, OS, and device class. That processing happens only if Web Analytics is enabled for the project.

Local `next dev` will 404 `/_vercel/insights/script.js`. The page still works. Events are delivered only on a Vercel deployment where Web Analytics is enabled.
