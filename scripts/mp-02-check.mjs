import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyMidiEvent, createHeldNotes, describeMidiState, parseMidiMessage } from '../dist/js/midi.js';
import { assessHeardPitch, shouldCountTowardProgress } from '../dist/js/assess.js';
import { STORAGE_KEY, createProgress, validateAttempt } from '../dist/js/progress.js';
import { createPlayer } from '../dist/js/player.js';

const fixtures = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixtures/mp-02-midi.json'), 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function memoryStorage(seed) {
  const data = seed ? { [STORAGE_KEY]: seed } : {};
  return {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
    removeItem: (key) => { delete data[key]; }
  };
}

function runMidiFixture(name) {
  const held = createHeldNotes();
  const scored = [];
  for (const step of fixtures[name]) {
    const result = applyMidiEvent(held, step.data, 'fixture-keyboard');
    const expect = step.expect;
    if (expect.ignored) {
      assert(result.ignored, `${name}: expected ignored MIDI`);
      continue;
    }
    assert(result.parsed?.type === expect.type, `${name}: type ${result.parsed?.type} !== ${expect.type}`);
    if (expect.scored != null) assert(result.scored === expect.scored, `${name}: scored ${result.scored} !== ${expect.scored}`);
    if (expect.released != null) assert(result.released === expect.released, `${name}: released ${result.released} !== ${expect.released}`);
    if (expect.reason) assert(result.reason === expect.reason, `${name}: reason ${result.reason} !== ${expect.reason}`);
    if (expect.channel != null) assert(result.parsed.channel === expect.channel, `${name}: channel`);
    if (result.scored) scored.push(result.parsed.note);
  }
  return scored;
}

const heldScores = runMidiFixture('heldKey');
assert(heldScores.length === 2 && heldScores.every((note) => note === 60), 'held key scores only on first press and after release');

const zeroOff = runMidiFixture('velocityZeroNoteOff');
assert(zeroOff.length === 2, 'velocity-zero note-off unlocks a later press');

const repeats = runMidiFixture('repeatedNotes');
assert(repeats.length === 2, 'note-off then note-on counts as a new try');

runMidiFixture('channelNoteOn');
runMidiFixture('ignoredControl');

const parsedOff = parseMidiMessage([144, 64, 0]);
assert(parsedOff?.type === 'note-off', 'note-on with velocity 0 is note-off');
const parsedOn = parseMidiMessage([144, 64, 1]);
assert(parsedOn?.type === 'note-on', 'note-on with velocity 1 is note-on');

const wrongOctave = assessHeardPitch(fixtures.exactPitchWrongOctave);
assert(wrongOctave.match === false && wrongOctave.reason === 'wrong-octave', 'exact-pitch rejects another octave');
const anyOctave = assessHeardPitch(fixtures.pitchClassAnyOctave);
assert(anyOctave.match === true, 'pitch-class accepts another octave');

assert(shouldCountTowardProgress('demo', false) === false, 'demo source never counts');
assert(shouldCountTowardProgress('midi', true) === false, 'notes during demo playback never count');
assert(shouldCountTowardProgress('midi', false) === true, 'learner MIDI counts');

const disconnected = describeMidiState({
  supported: true,
  permission: 'granted',
  devices: [],
  previousIds: ['abc']
});
assert(disconnected.kind === 'disconnected', 'empty after a known device is a disconnect');
assert(/disconnected/i.test(disconnected.status), 'disconnect copy is honest');

const reconnected = describeMidiState({
  supported: true,
  permission: 'granted',
  devices: [{ id: 'abc', name: 'Simulated USB Piano', state: 'connected' }],
  previousIds: []
});
assert(reconnected.kind === 'connected', 'a present input is connected');
assert(/Simulated USB Piano/.test(reconnected.status), 'connected copy lists the device');

const unsupported = describeMidiState({ supported: false });
assert(unsupported.kind === 'unsupported', 'missing Web MIDI is unsupported');
assert(/on-screen keys/.test(unsupported.status), 'unsupported copy keeps the fallback');

const empty = describeMidiState({ supported: true, permission: 'granted', devices: [] });
assert(empty.kind === 'ready-empty', 'granted with no device is ready-empty');
assert(/No keyboard is connected/.test(empty.status), 'no-device copy is honest');

const player = createPlayer({ progress: createProgress(memoryStorage()) });
player.advanceFrom('explanation');
player.advanceFrom('demo');
player.setDemoPlaying(true);
const demoResult = player.handleNote(fixtures.demoIgnored.note, 'demo');
assert(demoResult.reason === 'demo-playback' && demoResult.counted === false, 'demo handleNote is ignored');
assert(player.view().attempt.evidenceState == null, 'demo does not explore');
assert(player.view().attempt.events.some((event) => event.type === 'demo-played'), 'demo-played is recorded as diagnostics only');
player.setDemoPlaying(false);

const duringDemo = player.handleNote(60, 'midi', { device: fixtures.device });
assert(duringDemo.reason !== 'demo-playback', 'learner notes count after demo ends');

player.setOctavePolicyUsed('exact-pitch');
const exactMiss = player.handleNote(72, 'midi', {
  expected: 60,
  octavePolicy: 'exact-pitch',
  device: fixtures.device
});
assert(exactMiss.ok === false && exactMiss.reason === 'wrong-octave', 'player exact-pitch rejects C5 for C4');
assert(player.view().attempt.inputMode === 'midi', 'MIDI source is stored on the attempt');
assert(player.view().attempt.inputDevice?.name === fixtures.device.name, 'device identity is stored');
assert(player.view().attempt.octavePolicyUsed === 'exact-pitch', 'exact policy is stored');

const exactHit = player.handleNote(60, 'midi', { expected: 60, octavePolicy: 'exact-pitch' });
assert(exactHit.ok === true, 'exact-pitch accepts the named MIDI note');

player.setOctavePolicyUsed('pitch-class');
const classHit = player.handleNote(72, 'computer-keys', { expected: 60, octavePolicy: 'pitch-class' });
assert(classHit.ok === true, 'exploratory pitch-class accepts another C');
assert(player.view().attempt.inputMode === 'mixed', 'touch-default plus MIDI plus computer-keys becomes mixed');

const saved = player.view().attempt;
const checked = validateAttempt(saved, 'L01');
assert(checked?.inputMode === 'mixed', 'validated attempt keeps inputMode');
assert(checked?.inputDevice?.id === fixtures.device.id, 'validated attempt keeps device identity');

console.log('mp-02 checks passed');
