# MeetPiano

Interactive marketing website for MeetPiano, a piano-learning adventure for younger learners and their parents.

Intended production domain: **meetpiano.app**.

## Source

This is a dependency-free static website. `dist/` contains the authored source, not generated build output, and must remain tracked in Git.

- `dist/index.html`: marketing page, playable piano, learning map, memberships, and FAQs.
- `dist/styles.css`: responsive layout, typography, and theme.
- `dist/learn/`: First Piano Journey `/learn` surface — First Notes (L01–L04), Rhythm Club (L05–L08), and Read and play (L09–L12). ES modules, no build step.
- `dist/js/`: shared lesson, audio, input, and device-local progress modules for `/learn`.
- `dist/app.js`: Web Audio synthesis, three musical missions, XP, optional Web MIDI input, and interactive learning map.
- `dist/assets/`: all artwork, self-hosted fonts, font licenses, and favicon.
- `vercel.json`: static deployment configuration, including a `/learn` rewrite.
- `.openai/hosting.json`: identity of the existing ChatGPT Sites publication; Vercel does not depend on it.

## Local development

From the repository root, run:

```sh
python3 -m http.server 3000 --directory dist
```

Open `http://localhost:3000` for the marketing page, `http://localhost:3000/learn/` for the journey hub, `http://localhost:3000/learn/?lesson=L01` for Meet the keyboard, `http://localhost:3000/learn/?unit=rhythm-club` for Rhythm Club, and `http://localhost:3000/learn/?unit=read-and-play` for Read and play. No dependency installation or build step is needed.

## Vercel

Import this repository as a project named `meetpiano`. Keep the root directory at the repository root. The checked-in configuration selects the Other framework preset, skips installation and building, and publishes `dist/`.

After a successful deployment, add `meetpiano.app` in the project's domain settings. Apply the exact DNS records Vercel provides at the domain's DNS provider, then verify the domain and HTTPS status. Domain purchase alone does not configure these records.

## Current functionality

Visitors can play the preview with touch, mouse, computer keys, or an available MIDI keyboard in a supporting browser. Audio starts after an interaction. The three missions award up to 60 XP per run. Marketing XP is session-only and resets on reload or replay.

`/learn` is a separate First Piano Journey surface. First Notes (L01–L04), Rhythm Club (L05–L08), and Read and play (L09–L12) save versioned attempt records in `localStorage` under `meetpiano:beginner-v1` on this device only. Rhythm scoring uses a shared audio clock, not the screen animation. Staff pitch, clef, duration, and expected keys agree. The next activity unlocks when this device is ready. Demo playback does not earn progress. There are no accounts and no cloud sync. Physical MIDI hardware is not claimed as verified.

The full learning curriculum, coaching, accounts, billing, and family profiles are future product work. The page identifies those features as in development. This repository does not collect payments or email addresses.

## Documentation

First Piano Journey mission and lesson specification: [`docs/missions/first-piano-journey.md`](docs/missions/first-piano-journey.md).

## Checks

```sh
node --check dist/app.js dist/js/*.js dist/js/lessons/*.js dist/learn/learn.js
node scripts/mp-01-check.mjs
node scripts/mp-02-check.mjs
node scripts/mp-03-check.mjs
node scripts/mp-04-check.mjs
node scripts/mp-05-check.mjs
```

Hardware MIDI compatibility depends on the browser, operating system, keyboard, and adapter. The current preview does not assess fingering, posture, sustain pedal technique, or microphone input.
