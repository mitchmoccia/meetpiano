# MeetPiano

Interactive marketing website for MeetPiano, a piano-learning adventure for younger learners and their parents.

Intended production domain: **meetpiano.app**.

## Source

This is a dependency-free static website. `dist/` contains the authored source, not generated build output, and must remain tracked in Git.

- `dist/index.html`: marketing page, playable piano, learning map, memberships, and FAQs.
- `dist/styles.css`: responsive layout, typography, and theme.
- `dist/app.js`: Web Audio synthesis, three musical missions, XP, optional Web MIDI input, and interactive learning map.
- `dist/assets/`: all artwork, self-hosted fonts, font licenses, and favicon.
- `vercel.json`: static deployment configuration.
- `.openai/hosting.json`: identity of the existing ChatGPT Sites publication; Vercel does not depend on it.

## Local development

From the repository root, run:

```sh
python3 -m http.server 3000 --directory dist
```

Open `http://localhost:3000`. No dependency installation or build step is needed.

## Vercel

Import this repository as a project named `meetpiano`. Keep the root directory at the repository root. The checked-in configuration selects the Other framework preset, skips installation and building, and publishes `dist/`.

After a successful deployment, add `meetpiano.app` in the project's domain settings. Apply the exact DNS records Vercel provides at the domain's DNS provider, then verify the domain and HTTPS status. Domain purchase alone does not configure these records.

## Current functionality

Visitors can play the preview with touch, mouse, computer keys, or an available MIDI keyboard in a supporting browser. Audio starts after an interaction. The three missions award up to 60 XP per run. Progress is session-only and resets on reload or replay.

The full learning curriculum, coaching, accounts, billing, and family profiles are future product work. The page identifies those features as in development. This repository does not collect payments or email addresses.

## Documentation

First Piano Journey mission and lesson specification: [`docs/missions/first-piano-journey.md`](docs/missions/first-piano-journey.md).

## Checks

```sh
node --check dist/app.js
```

Hardware MIDI compatibility depends on the browser, operating system, keyboard, and adapter. The current preview does not assess fingering, posture, sustain pedal technique, or microphone input.
