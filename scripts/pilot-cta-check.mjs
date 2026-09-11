import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emptyStore } from '../dist/js/progress.js';
import { recommendNext } from '../dist/js/recommend.js';
import { parseGrownupView } from '../dist/js/learn-view.js';
import { GROWNUP_HONESTY } from '../dist/js/grownup.js';
import { JOURNEY_LESSONS, isLessonUnlocked, meetsUnlock, parseLessonId, parseUnitId } from '../dist/js/unit.js';
import {
  SETUP_CONTINUE_HREF,
  SETUP_COPY,
  SETUP_STORAGE_KEY,
  SETUP_SURFACES,
  applySetupEvent,
  describeAudioUnlock,
  describeSetupMidi,
  emptySetupState,
  shouldShowSetupStrip
} from '../dist/js/setup-strip.js';
import {
  DEVICE_SWITCH_COPY,
  DEVICE_SWITCH_POINTER_ID,
  DEVICE_SWITCH_WARNING_ID,
  EXISTING_EXPORT_HREF,
  EXISTING_EXPORT_ID,
  focusExistingExport
} from '../dist/js/device-switch.js';
import {
  CLOSER_CONTROL_ID,
  CLOSER_COPY,
  CLOSER_CUE_ID,
  CLOSER_HUB_ID,
  CLOSER_OVERLAY_ID,
  CLOSER_RESUME_ID,
  CLOSER_STAY_ID,
  closerResumeTarget
} from '../dist/js/session-closer.js';
import { clearPause, readPause, resumeHref, writePause } from '../dist/js/session-pause.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const packDir = 'docs/pilots/first-piano-journey-v1';
const packFiles = [
  'README.md',
  'session-script.md',
  'observation-checklist.md',
  'grown-up-prompt.md',
  'recruiting-notes.md'
];
for (const file of packFiles) {
  const rel = `${packDir}/${file}`;
  assert(existsSync(join(root, rel)), `pilot pack includes ${rel}`);
}

const packReadme = read(`${packDir}/README.md`);
assert(packReadme.includes('3–5') || packReadme.includes('3-5'), 'pilot README caps families at 3–5');
assert(/usability/i.test(packReadme), 'pilot README frames usability');
assert(!/efficac/i.test(packReadme) || /not.*efficac|usability.*not.*efficac/i.test(packReadme), 'pilot README rejects efficacy as success');
assert(/Chrome/i.test(packReadme), 'pilot README names the Chrome evidence limit');
assert(/this device|device-local|this browser/i.test(packReadme), 'pilot README keeps device-local honesty');
assert(/Mitch must approve outreach|approval before outreach|Do not contact families/i.test(packReadme), 'pilot README requires outreach approval');

const script = read(`${packDir}/session-script.md`);
assert(/L01/.test(script) && /L04/.test(script), 'session script covers First Notes L01 toward L04');
assert(/grown-up view/i.test(script), 'session script includes grown-up view');
assert(/export/i.test(script), 'session script mentions optional export');
assert(/30–40|30-40/.test(script), 'session script is a 30–40 minute sitting');
assert(/about seven|about 7/i.test(script), 'session script is for about age seven');

const checklist = read(`${packDir}/observation-checklist.md`);
assert(/setup friction/i.test(checklist), 'checklist covers setup friction');
assert(/stall/i.test(checklist), 'checklist covers stalls');
assert(/Hear the words/i.test(checklist), 'checklist covers Hear the words');
assert(/Pause/i.test(checklist), 'checklist covers Pause');
assert(/grown-up view/i.test(checklist), 'checklist covers grown-up view');
assert(/input mode/i.test(checklist), 'checklist records input mode');
assert(/return interest/i.test(checklist), 'checklist asks about return interest');
assert(/separate from the app|separate from app/i.test(checklist), 'checklist keeps adult posture/fingers separate');

const grownup = read(`${packDir}/grown-up-prompt.md`);
assert(/not.*grade|no grade|not a report card/i.test(grownup), 'grown-up prompt avoids grading language');
assert(/off the screen|paper|real piano/i.test(grownup), 'grown-up prompt has one offline idea');

const recruiting = read(`${packDir}/recruiting-notes.md`);
assert(recruiting.includes('DO NOT SEND until Mitch authorizes outreach'), 'recruiting notes block send until Mitch says go');
assert(/consent|privacy/i.test(recruiting), 'recruiting notes cover consent/privacy');
assert(/no recording upload/i.test(recruiting), 'recruiting notes forbid recording upload');
assert(/minimize|minimal/i.test(recruiting), 'recruiting notes minimize child data');

const packet = read('docs/missions/first-piano-journey-release.md');
assert(packet.includes('docs/pilots/first-piano-journey-v1') || packet.includes('../pilots/first-piano-journey-v1'), 'release packet points at the v1 pilot pack');
assert(packet.includes('Do not contact'), 'release packet still blocks outreach');

const home = read('dist/index.html');
const appJs = read('dist/app.js');
assert(home.includes('Start First Piano Journey'), 'home hero primary CTA is Start First Piano Journey');
assert(/href="\/learn\/?" class="button button-dark hero-cta"/.test(home), 'hero primary points at /learn');
assert(home.includes('Play the mini adventure'), 'home keeps a secondary mini-adventure path');
assert(home.includes('Saved on this device · short jobs · grown-up nearby for setup.'), 'home CTA microcopy is honest');
assert(home.includes('Continue into First Piano Journey'), 'celebration continues into the journey');
assert(/id="explore-button"[^>]*href="\/learn\/?"/.test(home) || home.includes('href="/learn/" id="explore-button"'), 'celebration CTA points at /learn');
assert(!home.includes('See what’s next'), 'celebration no longer says See what’s next');
assert(home.includes('>Journey <'), 'header button is Journey');
assert(/href="\/learn\/?" class="button button-small button-dark"/.test(home), 'header Journey points at /learn');
assert(/href="\/learn">Learn</.test(home), 'nav Learn stays');
assert(home.includes('learn-entry-primary') && home.includes('Start First Piano Journey'), 'learn-entry leads with Start First Piano Journey');
assert(!/learn-entry">Want the real first lessons\? <a href="\/learn">Open First Notes</.test(home), 'learn-entry is not only Open First Notes');
assert(home.includes('/learn/?unit=left-hand'), 'home still deep-links Left hand');
assert(home.includes('/learn/?unit=together'), 'home still deep-links Together');
assert(home.includes('/learn/?unit=expression'), 'home still deep-links Expression');
assert(home.includes('data-copyright-year') && home.includes('Xpancom, LLC'), 'home copyright stays');

const worldBlock = appJs.slice(appJs.indexOf('const worlds'), appJs.indexOf('const names'));
const matrix = JSON.parse(read('scripts/fixtures/n02-world-href-matrix.json'));
const liveUnitIds = matrix.liveUnitIds;
const unitTitles = matrix.unitTitles;
assert(liveUnitIds.join(',') === 'first-notes,rhythm-club,read-and-play,left-hand,together,expression', 'fixture lists the six live unit ids');
assert(liveUnitIds.every((id) => parseUnitId(id) === id), 'fixture unit ids parse as catalog units');

const appWorlds = [...worldBlock.matchAll(/\{([^}]+)\}/g)].map((match) => {
  const body = match[1];
  const get = (key) => {
    const found = body.match(new RegExp(`${key}:'([^']*)'`));
    return found ? found[1] : null;
  };
  return {
    kicker: get('kicker'),
    learnHref: get('learnHref'),
    learnLabel: get('learnLabel'),
    futureLabel: get('futureLabel'),
    future: /\bfuture:\s*true\b/.test(body)
  };
});
const htmlStops = [...home.matchAll(/<button class="journey-stop[^"]*"[^>]*data-world="(\d+)"[\s\S]*?<strong>([^<]+)<\/strong>(?:<span>([^<]*)<\/span>)?/g)];
assert(htmlStops.length === matrix.worlds.length, `home map has ${matrix.worlds.length} world stops`);
assert(appWorlds.length === matrix.worlds.length, `app.js worlds match the ${matrix.worlds.length}-stop fixture`);

const linkedUnits = new Set();
const invented = [];
matrix.worlds.forEach((expected, index) => {
  const appWorld = appWorlds[index];
  const stop = htmlStops[index];
  assert(stop, `home has journey stop ${expected.stop}`);
  assert(stop[1] === String(index), `stop ${expected.stop} data-world is ${index}`);
  assert(stop[2] === expected.label, `stop ${expected.stop} label is ${expected.label}`);
  assert(appWorld, `app.js has world ${expected.stop}`);

  if (expected.future) {
    assert(!expected.learnHref && !appWorld.learnHref, `future world ${expected.stop} has no /learn href`);
    assert(appWorld.future === true, `world ${expected.stop} is marked future in app.js`);
    const futureCopy = `${appWorld.futureLabel || ''} ${matrix.futureLabelMustInclude}`;
    assert(futureCopy.includes(matrix.futureLabelMustInclude), `future world ${expected.stop} uses the Coming later label`);
    return;
  }

  assert(expected.learnHref && appWorld.learnHref === expected.learnHref, `world ${expected.stop} href matches the fixture`);
  assert(!appWorld.future, `live world ${expected.stop} is not marked future`);
  const unitMatch = expected.learnHref.match(/[?&]unit=([^&]+)/);
  const lessonMatch = expected.learnHref.match(/[?&]lesson=(L\d+)/i);
  if (unitMatch) {
    const unitId = parseUnitId(unitMatch[1]);
    assert(unitId && liveUnitIds.includes(unitId), `world ${expected.stop} links a live unit id`);
    assert(expected.label === unitTitles[unitId], `world ${expected.stop} label matches ${unitTitles[unitId]}`);
    assert(appWorld.learnLabel.includes(unitTitles[unitId]), `world ${expected.stop} learnLabel names ${unitTitles[unitId]}`);
    linkedUnits.add(unitId);
  } else if (lessonMatch) {
    const lessonId = parseLessonId(lessonMatch[1]);
    assert(lessonId && JOURNEY_LESSONS.some((item) => item.lessonId === lessonId), `world ${expected.stop} links a real lesson`);
    const lesson = JOURNEY_LESSONS.find((item) => item.lessonId === lessonId);
    linkedUnits.add(lesson.unitId);
  } else {
    invented.push(expected.learnHref);
  }
});
assert(invented.length === 0, `no invented world slugs: ${invented.join(', ')}`);
const leftoverLive = liveUnitIds.filter((id) => !linkedUnits.has(id));
for (const id of liveUnitIds) {
  const titled = matrix.worlds.filter((world) => world.label === unitTitles[id]);
  for (const world of titled) {
    assert(!world.future, `${unitTitles[id]} is a live unit and must not be a future panel`);
    assert((world.learnHref || '').includes(`unit=${id}`), `${unitTitles[id]} panel href matches that unit`);
  }
}
assert(leftoverLive.every((id) => !matrix.worlds.some((world) => world.label === unitTitles[id])), 'omitted live units do not keep a same-named dead panel');
assert(!home.includes('Two-Hand Land'), 'retired Two-Hand Land marketing name is gone');
assert(!home.includes('Make It Yours'), 'retired Make It Yours marketing name is gone');
assert(!home.includes('The Big Stage'), 'retired The Big Stage marketing name is gone');

const bannedHome = ['limited time', 'only today', 'buy now', 'teacher approved', 'grade 1', 'midi-verified'];
const homeLower = home.toLowerCase();
for (const phrase of bannedHome) {
  assert(!homeLower.includes(phrase), `home must not say ${phrase}`);
}

const honesty = JSON.parse(read('scripts/fixtures/n01-home-honesty.json'));
const faqReady = home.match(/<details><summary>Is MeetPiano ready to use\?[\s\S]*?<\/summary><p>([\s\S]*?)<\/p><\/details>/);
assert(faqReady, 'FAQ “Is MeetPiano ready to use?” is present');
const faqReadyText = faqReady[1];
for (const needle of honesty.faqReadyMustInclude) {
  assert(faqReadyText.includes(needle), `ready FAQ states ${needle}`);
}
assert(/playable|ready to play|ready now/i.test(faqReadyText), 'ready FAQ says Journey is playable, not only the mini-adventure');
for (const phrase of honesty.faqReadyMustNotImplyUnreleasedJourney) {
  assert(!faqReadyText.includes(phrase), 'ready FAQ must not treat L01–L24 as unreleased');
}

const faqParent = home.match(/<details><summary>Does a parent need to know how to play\?[\s\S]*?<\/summary><p>([\s\S]*?)<\/p><\/details>/);
assert(faqParent, 'FAQ “Does a parent need to know how to play?” is present');
assert(
  home.includes(honesty.parentMustCiteGrownUpView) && faqParent[1].includes('grown-up'),
  'parent FAQ cites the existing grown-up view'
);
assert(home.includes('href="/learn/?view=grown-up"'), 'home links /learn/?view=grown-up');

const membership = home.slice(home.indexOf('id="membership"'), home.indexOf('id="questions"'));
assert(membership.includes('<h3>Adventure</h3>'), 'Adventure membership card stays');
assert(membership.includes('<h3>Family</h3>'), 'Family membership card stays');
assert((membership.match(/In the making/g) || []).length >= 2, 'Adventure and Family stay marked In the making');
assert(!/featured[\s\S]*<h3>Adventure<\/h3>[\s\S]*A continuing, personal learning path/.test(membership), 'Adventure card does not treat L01–L24 as the unreleased membership path');
for (const phrase of honesty.membershipNoteMustNotSay) {
  assert(!home.includes(phrase), `memberships must not say ${phrase}`);
}
assert(home.includes('class="membership-note"') && /L01|L24|First Piano Journey/.test(home.match(/class="membership-note">([\s\S]*?)<\/p>/)[1]), 'membership note says Journey L01–L24 is already playable');

const parentBlock = home.slice(home.indexOf('id="grown-ups"'), home.indexOf('id="membership"'));
assert(parentBlock.includes(honesty.parentMustCiteGrownUpView), 'parent section cites /learn/?view=grown-up if cloud progress views stay planned');
assert(/progress views planned|family profiles planned/i.test(parentBlock), 'parent section still marks cloud family/progress as planned');

assert(home.includes('Play the mini adventure'), 'mini-adventure remains a secondary path');
assert(home.indexOf('Start First Piano Journey') < home.indexOf('Play the mini adventure'), 'Journey remains the primary hero CTA');

for (const phrase of honesty.bannedClaims) {
  assert(!homeLower.includes(phrase.toLowerCase()), `home must not claim ${phrase}`);
}
assert(!homeLower.includes('lime') && !home.includes('vermilion'), 'home copy does not introduce banned palette names');

const fresh = recommendNext(emptyStore(), { isNew: true, sessionId: 'fresh' });
assert(fresh.lessonId === 'L01' && fresh.action === 'Start Meet the keyboard', 'fresh hub recommends Start Meet the keyboard');

const hubJs = read('dist/js/learn-view.js');
assert(hubJs.includes("'Start Meet the keyboard'"), 'hub primary on a fresh device is Start Meet the keyboard');
assert(hubJs.includes('Continue ${continueCard.title}'), 'hub primary with progress continues the next unlocked lesson');
assert(hubJs.includes("hub-grownup"), 'hub shows Grown-up view beside the continue card');
assert(hubJs.includes('hub-continue'), 'hub continue is a strong button');
assert(hubJs.includes("href: '/learn/?view=grown-up'"), 'hub secondary is Grown-up view');

const learnHtml = read('dist/learn/index.html');
assert(learnHtml.includes('device-disclosure'), 'learn keeps the yellow disclosure');
assert(learnHtml.includes('id="kid-target"'), 'learn keeps yellow jobs');
assert(learnHtml.includes('Xpancom, LLC'), 'learn copyright stays');

const n03 = JSON.parse(read('scripts/fixtures/n03-grownup-discoverability.json'));
const header = learnHtml.slice(learnHtml.indexOf('<header'), learnHtml.indexOf('</header>'));
const footer = learnHtml.includes('<footer')
  ? learnHtml.slice(learnHtml.indexOf('<footer'))
  : '';
assert(header.includes(`id="${n03.chromeControlId}"`), 'hub chrome has the grown-up helper control');
assert(header.includes(n03.chromeControlClass), 'grown-up helper control is marked as hub chrome');
assert(header.includes(`href="${n03.chromeHref}"`), 'hub chrome links /learn/?view=grown-up');
const chromeBlock = header.slice(header.indexOf('learn-nav-actions'));
assert(chromeBlock.includes(`id="${n03.chromeControlId}"`) && chromeBlock.includes(n03.chromeHref), 'grown-up helper sits in header actions, not only the foot');
assert(!footer.includes(`id="${n03.chromeControlId}"`), 'the chrome control is not only a buried foot link');
assert(n03.defaultViewMustNotBeGrownUp === true, 'fixture says default /learn is not grown-up');
assert(parseGrownupView(null) === false, 'missing view stays on the kid hub');
assert(parseGrownupView('') === false, 'empty view stays on the kid hub');
assert(parseGrownupView('grown-up') === true, 'view=grown-up opens the helper');
assert(!learnHtml.includes('view=grown-up" aria-current'), 'default learn HTML does not mark grown-up as the current view');
const learnJs = read('dist/learn/learn.js');
assert(learnJs.includes("parseGrownupView(params.get('view'))"), 'grown-up helper opens only from the view query');
assert(!/const showGrownup = true/.test(learnJs), 'learn.js does not hard-open the grown-up helper');
for (const phrase of n03.honestyMustInclude) {
  assert(GROWNUP_HONESTY.includes(phrase), `grown-up honesty states ${phrase}`);
}
const grownupSurface = `${learnHtml}\n${hubJs}\n${GROWNUP_HONESTY}\n${read('dist/js/grownup.js')}`;
const grownupLower = grownupSurface.toLowerCase();
for (const phrase of n03.bannedPhrases) {
  assert(!grownupLower.includes(phrase.toLowerCase()), `learn/grown-up surfaces must not say ${phrase}`);
}
assert(!grownupLower.includes('lime') && !grownupSurface.includes('vermilion'), 'learn copy does not introduce banned palette names');
assert(!/#00f|#4f46|#6366|linear-gradient/i.test(read('dist/learn/learn.css')), 'learn CSS has no blue/purple gradient restyle');
assert(home.includes(n03.homeMustKeepParentPointer), 'home keeps the N01 grown-up pointer');
for (const phrase of n03.homeMustMarkCloudProfilesFuture) {
  assert(home.includes(phrase), `home still marks cloud family profiles as future (${phrase})`);
}
assert(!/cloud family profiles (are ready|are live|already exist)/i.test(home), 'home must not imply cloud family profiles already exist');

const n04 = JSON.parse(read('scripts/fixtures/n04-first-session-setup.json'));
assert(SETUP_STORAGE_KEY === n04.storageKey, 'setup strip uses the fixture localStorage key');
assert(SETUP_SURFACES.join(',') === n04.surfaces.join(','), 'setup strip shows on hub and L01');
assert(SETUP_CONTINUE_HREF === n04.l01Href, 'setup continue path is L01');
assert(SETUP_COPY.continueLabel === n04.l01Action, 'setup continue label is Start Meet the keyboard');
assert(learnHtml.includes(`id="${n04.mountId}"`), 'learn HTML has the setup strip mount');
assert(learnJs.includes('paintSetupStrip()'), 'learn paints the first-sit strip');
assert(learnJs.includes("surface: 'hub'") || learnJs.includes('currentSetupSurface()'), 'setup strip can show on the hub');
assert(learnJs.includes("id === 'L01'") && learnJs.includes('markSetupHeard'), 'L01 can complete setup with one heard note');
assert(hubJs.includes('renderSetupStrip') && hubJs.includes(n04.stripId), 'hub view renders the setup strip');
for (const id of n04.controlIds) {
  assert(hubJs.includes(`id: '${id}'`), `setup strip exposes ${id}`);
}
assert(n04.noWizard === true, 'fixture forbids a multi-step wizard');
assert(!/step 1 of 3|wizard maze|setup-step/i.test(`${hubJs}\n${learnJs}\n${JSON.stringify(SETUP_COPY)}`), 'setup is one strip, not a wizard');

assert(shouldShowSetupStrip({
  store: n04.firstRun.store,
  setup: n04.firstRun.setup,
  surface: 'hub'
}) === n04.firstRun.expectShow, 'fresh hub shows the setup strip');
assert(shouldShowSetupStrip({
  store: n04.firstRun.store,
  setup: n04.firstRun.setup,
  surface: 'L01'
}) === n04.firstRun.expectShow, 'fresh L01 shows the setup strip');
assert(shouldShowSetupStrip({
  store: emptyStore(),
  setup: emptySetupState(),
  surface: 'hub'
}) === true, 'emptyStore first-run shows the setup strip');
assert(shouldShowSetupStrip({
  store: emptyStore(),
  setup: emptySetupState(),
  surface: 'grown-up'
}) === false, 'grown-up helper does not take over as a setup maze');

for (const row of n04.returning) {
  for (const surface of n04.surfaces) {
    assert(
      shouldShowSetupStrip({ store: row.store, setup: row.setup, surface }) === row.expectShow,
      `returning ${row.reason} hides the strip on ${surface}`
    );
  }
}

const heard = applySetupEvent(emptySetupState(), { type: 'hear' });
assert(heard.heardNote === true && shouldShowSetupStrip({
  store: emptyStore(),
  setup: heard,
  surface: 'hub'
}) === false, 'one heard note hides the strip');
const skipped = applySetupEvent(emptySetupState(), { type: 'dismiss' });
assert(skipped.dismissed === true && shouldShowSetupStrip({
  store: emptyStore(),
  setup: skipped,
  surface: 'L01'
}) === false, 'dismiss hides the strip');

const blocked = describeAudioUnlock({ canPlay: true, state: n04.audio.blockedState });
assert(blocked.kind === 'blocked' && blocked.message.includes(n04.audio.blockedMustInclude), 'suspended audio explains unlock');
const missing = describeAudioUnlock({ canPlay: false, state: n04.audio.missingState });
assert(missing.kind === 'missing' && missing.message.includes(n04.audio.missingMustInclude), 'missing audio stays honest');
assert(describeSetupMidi('unsupported').includes(n04.midi.unsupportedMustInclude), 'unsupported MIDI stays optional');
assert(describeSetupMidi('denied').includes(n04.midi.deniedMustInclude), 'denied MIDI stays optional');
assert(SETUP_COPY.midiIdle.includes('MIDI is optional'), 'idle MIDI copy stays optional');
assert(n04.midi.optional === true, 'fixture marks MIDI optional');

const setupSurface = `${JSON.stringify(SETUP_COPY)}\n${hubJs}\n${learnJs}\n${read('dist/js/setup-strip.js')}`;
const setupLower = setupSurface.toLowerCase();
for (const phrase of n04.honestyMustInclude) {
  assert(setupSurface.includes(phrase), `setup honesty states ${phrase}`);
}
for (const phrase of n04.bannedPhrases) {
  assert(!setupLower.includes(phrase.toLowerCase()), `setup surfaces must not say ${phrase}`);
}
assert(!setupLower.includes('lime') && !setupSurface.includes('vermilion'), 'setup copy does not introduce banned palette names');
assert(!/#00f|#4f46|#6366|linear-gradient/i.test(read('dist/learn/learn.css')), 'learn CSS still has no blue/purple gradient restyle');
assert(!/hardware[- ]midi[- ]verified|verified midi hardware/i.test(setupLower), 'setup does not claim hardware MIDI verified');

const n05 = JSON.parse(read('scripts/fixtures/n05-device-switch-export.json'));
const deviceSwitchJs = read('dist/js/device-switch.js');
const portabilityJs = read('dist/js/portability.js');
assert(n05.noSecondExportUi === true, 'fixture forbids a second export UI');
assert(n05.pointerMustNotDownload === true, 'fixture says the pointer must not download');
assert(DEVICE_SWITCH_WARNING_ID === n05.warningId, 'warning id matches the fixture');
assert(DEVICE_SWITCH_POINTER_ID === n05.pointerId, 'pointer id matches the fixture');
assert(EXISTING_EXPORT_ID === n05.exportControlId, 'pointer targets the existing export control');
assert(EXISTING_EXPORT_HREF === n05.pointerHref, 'pointer href is the existing export hash');
assert(DEVICE_SWITCH_COPY.pointerLabel === n05.pointerLabel, 'pointer label does not become a second Export JSON');
assert(DEVICE_SWITCH_COPY.pointerLabel !== n05.existingExportLabel, 'pointer is not a parallel Export JSON button');
assert(hubJs.includes('deviceSwitchWarning') && hubJs.includes('portabilityCard'), 'warning is rendered with the existing progress/export card');
assert(hubJs.includes("id: EXISTING_EXPORT_ID") || hubJs.includes(`id: '${n05.exportControlId}'`), 'existing Export JSON keeps a focus target');
assert(hubJs.includes('focusExistingExport'), 'pointer focuses the existing export');
assert(!deviceSwitchJs.includes('exportProgress'), 'device-switch is not a new export module');
assert(!deviceSwitchJs.includes('createObjectURL') && !deviceSwitchJs.includes('download'), 'device-switch does not download');
assert((hubJs.match(/'Export JSON'/g) || []).length === 1, 'hub/grown-up share one Export JSON label');
assert((hubJs.match(/onClick: onExport/g) || []).length === 1, 'one existing export click handler');
assert((learnJs.match(/function exportRecords/g) || []).length === 1, 'learn.js keeps one export download path');
assert((learnJs.match(/onExport: exportRecords/g) || []).length === 1, 'hub and grown-up reuse the same export callback');
assert(hubJs.includes(`'${n05.existingImportLabel}'`), 'import label stays Import JSON');
assert(hubJs.includes(`'${n05.existingResetLabel}'`), 'reset label stays Reset this device');
assert(portabilityJs.includes("kind: EXPORT_KIND"), 'MP-06 export module stays the only exporter');
for (const phrase of n05.honestyMustInclude) {
  assert(DEVICE_SWITCH_COPY.warning.includes(phrase), `device-switch warning states ${phrase}`);
}
const switchSurface = `${JSON.stringify(DEVICE_SWITCH_COPY)}\n${hubJs}\n${deviceSwitchJs}\n${read('README.md')}`;
const switchLower = switchSurface.toLowerCase();
for (const phrase of n05.bannedImplications) {
  assert(!switchLower.includes(phrase.toLowerCase()), `device-switch must not imply ${phrase}`);
}
for (const phrase of n05.bannedPhrases) {
  assert(!switchLower.includes(phrase.toLowerCase()), `device-switch surfaces must not say ${phrase}`);
}
assert(!/#00f|#4f46|#6366|linear-gradient/i.test(read('dist/learn/learn.css')), 'learn CSS still has no blue/purple gradient restyle after N05');

const exportControl = {
  scrolled: false,
  focused: false,
  scrollIntoView() { this.scrolled = true; },
  focus() { this.focused = true; }
};
const fakeRoot = {
  querySelector(sel) { return sel === `#${n05.exportControlId}` ? exportControl : null; }
};
assert(focusExistingExport(fakeRoot) === true, 'pointer helper finds the existing export');
assert(exportControl.scrolled && exportControl.focused, 'pointer scrolls to and focuses the existing export');
assert(focusExistingExport({ querySelector: () => null }) === false, 'pointer does not invent an export control');

const n06 = JSON.parse(read('scripts/fixtures/n06-enough-for-today.json'));
const closerJs = read('dist/js/session-closer.js');
const pauseJs = read(n06.pauseModule);
assert(CLOSER_CONTROL_ID === n06.controlId, 'closer control id matches the fixture');
assert(CLOSER_OVERLAY_ID === n06.overlayId, 'closer overlay id matches the fixture');
assert(CLOSER_RESUME_ID === n06.resumeId, 'closer resume id matches the fixture');
assert(CLOSER_STAY_ID === n06.stayId, 'closer stay id matches the fixture');
assert(CLOSER_HUB_ID === n06.hubId, 'closer hub id matches the fixture');
assert(CLOSER_CUE_ID === n06.cueId, 'closer cue id matches the fixture');
assert(CLOSER_COPY.controlLabel === n06.controlLabel, 'control label is Enough for today');
assert(learnHtml.includes(`id="${n06.controlId}"`), 'learn HTML has the closer control');
assert(learnHtml.includes(`id="${n06.overlayId}"`), 'learn HTML has the closer overlay');
assert(learnHtml.includes('id="pause-overlay"') && learnHtml.includes('id="pause-button"'), 'Pause chrome stays');
assert(learnHtml.indexOf(`id="${n06.overlayId}"`) !== learnHtml.indexOf('id="pause-overlay"'), 'closer overlay is distinct from Pause');
assert(hubJs.includes('renderSessionCloser') && hubJs.includes('hub-enough'), 'hub can open the closer');
assert(hubJs.includes('hub-continue'), 'Continue-hub stays');
assert(learnJs.includes('onEnough: openCloser'), 'hub wires Enough for today');
assert(learnJs.includes("import { clearPause, readPause, resumeHref, writePause } from '../js/session-pause.js'"), 'learn.js still uses session-pause');
assert(!closerJs.includes('writePause') && !closerJs.includes('clearPause') && !closerJs.includes('PAUSE_KEY'), 'closer does not write or clear Pause');
assert(!closerJs.includes(n06.pauseResumeQuery), 'closer resume is not the Pause resume query');
assert(pauseJs.includes(`export const PAUSE_KEY = '${n06.pauseKey}'`), 'Pause storage key is unchanged');
assert(pauseJs.includes('export function writePause') && pauseJs.includes('export function resumeHref'), 'Pause helpers stay exported');

const pauseMemory = {
  data: {},
  getItem(key) { return Object.prototype.hasOwnProperty.call(this.data, key) ? this.data[key] : null; },
  setItem(key, value) { this.data[key] = String(value); },
  removeItem(key) { delete this.data[key]; }
};
const savedPause = writePause({ lessonId: 'L02', phase: 'guided', takeWasLive: false }, pauseMemory);
assert(savedPause.lessonId === 'L02', 'Pause still writes a waiting try');
assert(resumeHref(savedPause).includes(n06.pauseResumeQuery), 'Pause resume still uses resume=1');
assert(readPause(pauseMemory).lessonId === 'L02', 'Pause still reads the waiting try');
closerResumeTarget({ lessons: { L01: { evidenceState: 'practiced' } } });
assert(readPause(pauseMemory).lessonId === 'L02', 'computing a closer resume does not clear Pause');
assert(clearPause(pauseMemory) === true && readPause(pauseMemory) === null, 'Pause clear still works after closer');

for (const row of n06.resumeTargets) {
  const target = closerResumeTarget(row.store);
  assert(target.lessonId === row.expectLessonId, `${row.reason} resume is ${row.expectLessonId}`);
  assert(target.action === row.expectAction, `${row.reason} action is ${row.expectAction}`);
  if (row.expectHref) assert(target.href === row.expectHref, `${row.reason} href is ${row.expectHref}`);
  assert(!target.href.includes(row.mustNotIncludeHref), `${row.reason} href is not a Pause resume`);
  assert(target.unlocked === true, `${row.reason} only names an unlocked lesson`);
  assert(isLessonUnlocked(row.store, target.lessonId) === true, `${row.reason} target is unlocked`);
  if (row.unlockedAlso) {
    assert(isLessonUnlocked(row.store, row.unlockedAlso) === true, `${row.reason} still unlocks ${row.unlockedAlso}`);
    assert(target.lessonId !== row.unlockedAlso, `${row.reason} follows existing Continue, not a skip ahead`);
  }
  if (row.lockedLessonId) {
    assert(isLessonUnlocked(row.store, row.lockedLessonId) === false, `${row.reason} does not unlock ${row.lockedLessonId}`);
    assert(target.lessonId !== row.lockedLessonId, `${row.reason} resume is not the locked lesson`);
  }
}

for (const gate of n06.independentGates) {
  const card = JOURNEY_LESSONS.find((item) => item.lessonId === gate.lessonId);
  assert(card.unlocksAfter === gate.unlocksAfter, `${gate.lessonId} still unlocks after ${gate.unlocksAfter}`);
  assert(card.unlockNeeds === gate.unlockNeeds, `${gate.lessonId} still needs Independent`);
  assert(meetsUnlock('practiced', gate.unlockNeeds) === false, `${gate.lessonId} still rejects Practiced`);
  assert(meetsUnlock('independent', gate.unlockNeeds) === true, `${gate.lessonId} still accepts Independent`);
  const lockedStore = {
    lessons: { [gate.unlocksAfter]: { evidenceState: 'practiced' } }
  };
  const openStore = {
    lessons: { [gate.unlocksAfter]: { evidenceState: 'independent' } }
  };
  assert(isLessonUnlocked(lockedStore, gate.lessonId) === false, `${gate.lessonId} stays locked after Practiced`);
  assert(isLessonUnlocked(openStore, gate.lessonId) === true, `${gate.lessonId} unlocks after Independent`);
}

const closerOwn = `${JSON.stringify(CLOSER_COPY)}\n${closerJs}`;
const closerLower = closerOwn.toLowerCase();
for (const phrase of n06.honestyMustInclude) {
  assert(closerOwn.includes(phrase), `closer honesty states ${phrase}`);
}
for (const phrase of n06.bannedStreakPhrases) {
  assert(!closerLower.includes(phrase.toLowerCase()), `closer must not pressure with ${phrase}`);
}
for (const phrase of n06.bannedMasteryPhrases) {
  assert(!closerLower.includes(phrase.toLowerCase()), `closer must not invent ${phrase}`);
}
for (const phrase of n06.bannedGuiltPhrases) {
  assert(!closerLower.includes(phrase.toLowerCase()), `closer must not guilt with ${phrase}`);
}
assert(!closerLower.includes('lime') && !closerOwn.includes('vermilion'), 'closer copy does not introduce banned palette names');
assert(!/#00f|#4f46|#6366|linear-gradient/i.test(read('dist/learn/learn.css')), 'learn CSS still has no blue/purple gradient restyle after N06');
assert(!/account|notification|push alert/i.test(JSON.stringify(CLOSER_COPY)), 'closer does not add accounts or notifications');

const n07 = JSON.parse(read('scripts/fixtures/n07-hardware-midi-honesty.json'));
assert(existsSync(join(root, n07.protocolPath)), `hardware MIDI protocol is at ${n07.protocolPath}`);
assert(existsSync(join(root, n07.templatePath)), `hardware MIDI log template is at ${n07.templatePath}`);
const protocol = read(n07.protocolPath);
const midiLogTemplate = read(n07.templatePath);
for (const field of n07.requiredLogFields) {
  assert(protocol.includes(field), `protocol names field ${field}`);
  assert(midiLogTemplate.includes(field), `template includes field ${field}`);
}
assert(/BLOCKED/.test(protocol) && /No filled PASS log exists/.test(protocol), 'protocol records physical hardware as BLOCKED until a PASS log');
assert(!/MIDI stack rewrite|rewrite the MIDI stack to satisfy/.test(protocol) || /Do not rewrite the MIDI stack/.test(protocol), 'protocol forbids a MIDI stack rewrite');
assert(n07.bannedPhrases.includes('hardware midi verified'), 'N07 fixture bans hardware midi verified');
assert(n07.bannedPhrases.includes('midi-verified'), 'N07 fixture bans midi-verified');
assert(n07.bannedPhrases.includes('universal keyboard'), 'N07 fixture bans universal keyboard');

const honestyFiles = n07.honestySurfaces.map((rel) => {
  assert(existsSync(join(root, rel)), `honesty surface ${rel} exists`);
  return read(rel);
});
const honestySurface = honestyFiles.join('\n');
const honestyLower = honestySurface.toLowerCase();
for (const phrase of n07.bannedPhrases) {
  assert(!honestyLower.includes(phrase.toLowerCase()), `home + learn honesty surfaces must not say ${phrase}`);
}
for (const [rel, needles] of Object.entries(n07.surfaceMustInclude)) {
  const text = read(rel);
  for (const needle of needles) {
    assert(text.includes(needle), `${rel} keeps honesty line “${needle}”`);
  }
}
assert(SETUP_COPY.midiIdle.includes('Physical MIDI hardware is not verified'), 'setup strip keeps the not-verified baseline');
assert(GROWNUP_HONESTY.includes('device-local observation aid'), 'grown-up helper stays a device-local aid');
assert(!/verified badge|hardware certified|midi certified/i.test(honestySurface), 'honesty surfaces do not invent a verified badge');

const n08 = JSON.parse(read('scripts/fixtures/n08-cross-browser-honesty.json'));
assert(existsSync(join(root, n08.matrixPath)), `critical-path matrix is at ${n08.matrixPath}`);
assert(existsSync(join(root, n08.templatePath)), `critical-path row template is at ${n08.templatePath}`);
const n08Matrix = read(n08.matrixPath);
const rowTemplate = read(n08.templatePath);
for (const column of n08.requiredColumns) {
  assert(n08Matrix.includes(column), `matrix names column ${column}`);
  assert(rowTemplate.includes(column), `row template includes column ${column}`);
}
for (const step of n08.requiredCriticalPath) {
  assert(n08Matrix.includes(step), `matrix names critical-path step ${step}`);
  assert(rowTemplate.includes(step.replace('open `/learn`', 'open `/learn`')), `row template names critical-path step ${step}`);
}
for (const label of n08.requiredLabels) {
  assert(n08Matrix.includes(label), `matrix defines label ${label}`);
  assert(rowTemplate.includes(label), `row template defines label ${label}`);
}
assert(n08.untestedMustBeBlocked === true, 'fixture requires untested browsers to be BLOCKED');
assert(/Untested browsers are BLOCKED/i.test(n08Matrix), 'matrix forbids silent green for untested browsers');
assert(/not silent green/i.test(n08Matrix), 'matrix says untested rows are not silent green');
for (const needle of n08.chromeBaselineMustInclude) {
  assert(n08Matrix.includes(needle), `Chrome desktop baseline records ${needle}`);
}
assert(/Google Chrome 148[\s\S]*simulated/i.test(n08Matrix), 'Chrome desktop baseline is labeled simulated, not a silent all-browser pass');
for (const row of n08.blockedRows) {
  assert(n08Matrix.includes(row.name), `matrix includes a ${row.name} row`);
  assert(n08Matrix.includes(row.reasonNeedle), `${row.name} row is BLOCKED with reason`);
  assert(n08Matrix.includes(`BLOCKED — ${row.reasonNeedle}`) || n08Matrix.includes(`BLOCKED\` — ${row.reasonNeedle}`), `${row.name} is labeled BLOCKED, not silent green`);
}
assert(n08.bannedPhrases.includes('works everywhere'), 'N08 fixture bans works everywhere');
assert(n08.bannedPhrases.includes('universal compatibility'), 'N08 fixture bans universal compatibility');
assert(n08.bannedPhrases.includes('works in all browsers'), 'N08 fixture bans works in all browsers');

const n08Surfaces = n08.honestySurfaces.map((rel) => {
  assert(existsSync(join(root, rel)), `N08 honesty surface ${rel} exists`);
  return read(rel);
});
const n08Surface = n08Surfaces.join('\n').toLowerCase();
for (const phrase of n08.bannedPhrases) {
  assert(!n08Surface.includes(phrase.toLowerCase()), `product honesty surfaces must not say ${phrase}`);
}
assert(!/\bworks everywhere\b/i.test(n08Matrix.split('What this matrix is not')[0]), 'matrix body before the ban list does not claim works everywhere');

const n09 = JSON.parse(read('scripts/fixtures/n09-docs-tip-refresh.json'));
assert(/^[0-9a-f]{40}$/.test(n09.mainTipSha), 'N09 fixture records a full 40-character tip SHA');
assert(n09.mainTipSha === '6ea24b9d36cfb71a07d5fb62b87451ded4456d62', 'N09 fixture tip SHA matches the re-verified N08 main tip');
assert(n09.liveLessonRange === 'L01–L24', 'N09 fixture live range is L01–L24');
assert(n09.hardwareMidiStatus === 'unverified', 'N09 fixture keeps hardware MIDI unverified');
assert(n09.learningValidationStatus === 'pending', 'N09 fixture keeps learning validation pending');
assert(n09.chromeLabel === 'simulated', 'N09 fixture keeps Chrome labeled simulated');
assert(n09.blockedBrowsers.join(',') === 'Safari,iPadOS,Firefox', 'N09 fixture keeps Safari / iPadOS / Firefox BLOCKED');
assert(n09.formerTipShaShort === '3da09b9', 'N09 fixture names the banned former short tip');
assert(n09.formerTipShaFull === '3da09b909fc54aaf54f0be8b00b374c3adf5cf5f', 'N09 fixture names the banned former full tip');

const n09Surfaces = n09.currentLiveSurfaces.map((rel) => {
  assert(existsSync(join(root, rel)), `N09 current-live surface ${rel} exists`);
  return { rel, text: read(rel) };
});
for (const rel of n09.surfacesMustIncludeTipSha) {
  const row = n09Surfaces.find((item) => item.rel === rel);
  assert(row, `N09 tip-SHA surface ${rel} is listed`);
  assert(row.text.includes(n09.mainTipSha), `${rel} records current tip ${n09.mainTipSha}`);
}
for (const rel of n09.surfacesMustIncludeLiveRange) {
  const row = n09Surfaces.find((item) => item.rel === rel);
  assert(row, `N09 live-range surface ${rel} is listed`);
  assert(row.text.includes(n09.liveLessonRange), `${rel} states live range ${n09.liveLessonRange}`);
}

const statusBoard = read('docs/missions/first-piano-journey-status.md');
for (const phrase of n09.statusMustNotInclude) {
  assert(!statusBoard.includes(phrase), `status board must not treat ${phrase} as current`);
}
assert(statusBoard.includes(n09.liveLessonRange), 'status board states L01–L24 is live');
assert(/Learning validation pending/i.test(statusBoard), 'status board keeps learning validation pending');
assert(/Hardware MIDI unverified/i.test(statusBoard), 'status board keeps hardware MIDI unverified');

const n09Joined = n09Surfaces.map((item) => item.text).join('\n');
for (const phrase of n09.bannedCurrentLivePhrases) {
  assert(!n09Joined.includes(phrase), `current-live surfaces must not still claim “${phrase}”`);
}
for (const phrase of n09.honestyMustInclude) {
  assert(n09Joined.includes(phrase), `current-live surfaces still state ${phrase}`);
}
assert(n09Joined.includes('Current live (N09'), 'current-live surfaces name the N09 refresh');
assert(!/Live brand today is L01–L12|live brand still merged `main` only \(L01–L12\)/.test(n09Joined), 'current-live surfaces do not keep L01–L12 as the live range');

const packetCurrent = packet.split('## Status labels')[0];
assert(packetCurrent.includes(n09.mainTipSha), 'release packet current-live section records the tip SHA');
assert(packetCurrent.includes(n09.liveLessonRange), 'release packet current-live section states L01–L24');
assert(!packetCurrent.includes('Lessons | L01–L12 |'), 'release packet current-live section does not list L01–L12 as the live lesson column');
assert(packet.includes('former tip `3da09b9`') || packet.includes('Former tip (not current)'), 'release packet marks 3da09b9 as former, not current');

console.log('pilot pack and CTA checks passed');
