import type { Locator, Page } from '@playwright/test';
import { attemptsFor, closeDatabase } from './db';
import { addLearner, chooseLearner, COMPUTER_KEY_FOR, createVerifiedParent, expect, finishesLesson, GUIDED_NOTES, hubCard, pianoKey, test } from './support';

test.afterAll(closeDatabase);

type AudioProbe = { contexts: AudioContext[]; started: number[] };
type ProbedWindow = Window & { audioProbe: AudioProbe; simulatedMidi: { send(bytes: number[]): void } };
type Activate = (control: Locator) => Promise<void>;

/** Records each AudioContext and the frequency of each oscillator the player starts. It proves sound was scheduled, not heard. */
function installAudioProbe(): void {
  const probe: AudioProbe = { contexts: [], started: [] };
  const NativeAudioContext = window.AudioContext;
  window.AudioContext = class extends NativeAudioContext {
    constructor(options?: AudioContextOptions) {
      super(options);
      probe.contexts.push(this);
    }
  };
  const nativeStart = OscillatorNode.prototype.start;
  OscillatorNode.prototype.start = function start(this: OscillatorNode, when?: number) {
    probe.started.push(this.frequency.value);
    nativeStart.call(this, when);
  };
  Object.assign(window, { audioProbe: probe });
}

/** A stand-in Web MIDI keyboard with one connected input. The test sends its messages; no hardware is involved. */
function installSimulatedMidi(): void {
  const input = {
    id: 'e2e-simulated',
    name: 'Simulated keyboard',
    manufacturer: 'E2E',
    state: 'connected',
    type: 'input',
    onmidimessage: null as null | ((event: { data: Uint8Array }) => void)
  };
  const access = { inputs: new Map([[input.id, input]]), outputs: new Map(), sysexEnabled: false, onstatechange: null };
  Object.defineProperty(Navigator.prototype, 'requestMIDIAccess', { configurable: true, value: () => Promise.resolve(access) });
  Object.assign(window, { simulatedMidi: { send: (bytes: number[]) => input.onmidimessage?.({ data: Uint8Array.from(bytes) }) } });
}

function removeWebMidi(): void {
  delete (Navigator.prototype as { requestMIDIAccess?: unknown }).requestMIDIAccess;
}

function refuseWebMidi(): void {
  const refuse = () => Promise.reject(new DOMException('MIDI access refused', 'NotAllowedError'));
  Object.defineProperty(Navigator.prototype, 'requestMIDIAccess', { configurable: true, value: refuse });
}

const pressEnter: Activate = (control) => control.press('Enter');

function tapOrClick(hasTouch: boolean): Activate {
  return (control) => (hasTouch ? control.tap() : control.click());
}

function button(page: Page, name: string): Locator {
  return page.getByRole('button', { name, exact: true });
}

function pitch(note: number): number {
  return 440 * 2 ** ((note - 69) / 12);
}

function audioContexts(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as ProbedWindow).audioProbe.contexts.map((context) => context.state));
}

function oscillatorsStarted(page: Page, from = 0): Promise<number[]> {
  return page.evaluate((start) => (window as unknown as ProbedWindow).audioProbe.started.slice(start), from);
}

/** Runs the action and waits until each note's pitch has been started on an oscillator. */
async function expectPitches(page: Page, notes: number[], action: () => Promise<unknown>): Promise<void> {
  const before = (await oscillatorsStarted(page)).length;
  await action();
  for (const note of notes) {
    await expect.poll(() => oscillatorsStarted(page, before), { message: `pitch of note ${note}` }).toContainEqual(expect.closeTo(pitch(note), 1));
  }
}

/** No audio exists until a gesture; the high-then-low demo then plays B4 and middle C. */
async function openLessonAndHearDemo(page: Page, activate: Activate): Promise<void> {
  await page.goto('/learn/?lesson=L01');
  await expect(button(page, 'Show me the keyboard')).toBeVisible();
  expect(await audioContexts(page)).toEqual([]);
  await activate(button(page, 'Show me the keyboard'));
  await expectPitches(page, [71, 60], () => activate(button(page, 'Hear high, then low')));
  await expect.poll(() => audioContexts(page)).toEqual(['running']);
  await activate(button(page, 'Now you try'));
}

async function finishLesson(activate: Activate, page: Page): Promise<void> {
  await activate(button(page, 'Continue to a quiet check'));
  await activate(button(page, 'Save and finish for now'));
}

function guestInputModes(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const store = JSON.parse(window.localStorage.getItem('meetpiano:beginner-v1') ?? '{}');
    return (store.lessons?.L01?.attempts ?? []).map((attempt: { inputMode: string }) => attempt.inputMode);
  });
}

function sendMidiNote(page: Page, note: number): Promise<void> {
  return page.evaluate((value) => {
    const midi = (window as unknown as ProbedWindow).simulatedMidi;
    midi.send([0x90, value, 100]);
    midi.send([0x90, value, 0]);
  }, note);
}

test('the guest journey makes no sound before a gesture, then the demo and on-screen keys play the right pitches', async ({ page, hasTouch }) => {
  const activate = tapOrClick(hasTouch);
  await page.addInitScript(installAudioProbe);
  await page.goto('/learn/');
  await expect(page.locator('#unit-hub')).toBeVisible();
  await expect(hubCard(page, 'L01')).toBeVisible();
  expect(await audioContexts(page)).toEqual([]);

  await openLessonAndHearDemo(page, activate);
  for (const note of GUIDED_NOTES) await expectPitches(page, [note], () => activate(pianoKey(page, note)));
  await finishLesson(activate, page);
  await expect(page.getByText('Touch practice. Not MIDI verified.')).toBeVisible();
  expect(await guestInputModes(page)).toEqual(['touch']);
});

test('a keyboard-only player finishes with Enter and the computer keys', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Computer keys are a desktop input.');
  await page.addInitScript(installAudioProbe);
  await openLessonAndHearDemo(page, pressEnter);
  for (const note of GUIDED_NOTES) await expectPitches(page, [note], () => page.keyboard.press(COMPUTER_KEY_FOR[note] ?? ''));
  await finishLesson(pressEnter, page);
  await expect(page.getByText('Computer keys. Not MIDI verified.')).toBeVisible();
  expect(await guestInputModes(page)).toEqual(['computer-keys']);
});

test('a simulated MIDI keyboard connects, plays the lesson, and the saved try is recorded as MIDI', async ({ page, hasTouch }) => {
  const activate = tapOrClick(hasTouch);
  await page.addInitScript(installAudioProbe);
  await page.addInitScript(installSimulatedMidi);
  await createVerifiedParent(page, 'midi');
  const mia = await addLearner(page, 'Mia');
  await chooseLearner(page, 'Mia');

  await openLessonAndHearDemo(page, activate);
  await activate(page.locator('#midi-button'));
  await expect(page.locator('#midi-button')).toContainText('Keyboard connected');
  await expect(page.locator('#midi-status')).toContainText('Connected: Simulated keyboard.');
  await expect(page.locator('#midi-devices')).toHaveText('Simulated keyboard · E2E');
  for (const note of GUIDED_NOTES) await expectPitches(page, [note], () => sendMidiNote(page, note));
  const saved = page.waitForResponse((response) => finishesLesson(response, 'L01'));
  await finishLesson(activate, page);
  await saved;
  await expect(page.getByText('Heard over MIDI. Not a hardware certification.')).toBeVisible();
  const attempts = await attemptsFor(mia);
  expect(attempts).toHaveLength(1);
  expect(attempts[0]).toMatchObject({ lesson_id: 'L01', input_mode: 'midi', evidence_state: 'practiced' });
});

test('without Web MIDI the button says so and the on-screen keys still play', async ({ page, hasTouch }) => {
  await page.addInitScript(installAudioProbe);
  await page.addInitScript(removeWebMidi);
  await page.goto('/learn/?lesson=L01');
  await expect(page.locator('#midi-button')).toBeDisabled();
  await expect(page.locator('#midi-button')).toContainText('MIDI not available in this browser');
  await expect(page.locator('#midi-status')).toContainText('This browser does not offer Web MIDI.');
  await expectPitches(page, [60], () => tapOrClick(hasTouch)(pianoKey(page, 60)));
});

test('when MIDI access is refused the player explains it and the on-screen keys still play', async ({ page, hasTouch }) => {
  const activate = tapOrClick(hasTouch);
  await page.addInitScript(installAudioProbe);
  await page.addInitScript(refuseWebMidi);
  await page.goto('/learn/?lesson=L01');
  await activate(page.locator('#midi-button'));
  await expect(page.locator('#midi-button')).toContainText('Keyboard access was not available');
  await expect(page.locator('#midi-button')).toBeEnabled();
  await expect(page.locator('#midi-status')).toContainText('MIDI permission was not granted.');
  await expectPitches(page, [60], () => activate(pianoKey(page, 60)));
});
