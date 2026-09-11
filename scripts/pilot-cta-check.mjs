import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emptyStore } from '../dist/js/progress.js';
import { recommendNext } from '../dist/js/recommend.js';
import { parseGrownupView } from '../dist/js/learn-view.js';
import { GROWNUP_HONESTY } from '../dist/js/grownup.js';
import { JOURNEY_LESSONS, parseLessonId, parseUnitId } from '../dist/js/unit.js';

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

console.log('pilot pack and CTA checks passed');
