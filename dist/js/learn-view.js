import { PHASE_ORDER } from './player.js';
import { evidenceRank, JOURNEY_LESSONS, nextLessonId, unitView } from './unit.js';
import { recommendNext, laneSummary } from './recommend.js';
import { sourceHonesty } from './evidence.js';
import { kidLine, kidTitle } from './kid-copy.js';
import { grownupReport } from './grownup.js';
import { resumeHref } from './session-pause.js';

const STEP_LABELS = ['Explain', 'See', 'Try', 'Check', 'Done'];

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') node.className = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value === false || value == null) continue;
    else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, String(value));
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

export function renderSteps(root, phaseIndex) {
  root.replaceChildren(...STEP_LABELS.map((label, index) => {
    const state = index < phaseIndex ? 'done' : index === phaseIndex ? 'active' : '';
    return el('li', { className: `phase-step ${state}`, 'aria-current': index === phaseIndex ? 'step' : null }, String(index + 1), el('span', {}, label));
  }));
}

export function renderParagraphs(root, paragraphs) {
  root.replaceChildren(...(paragraphs || []).map((text) => el('p', {}, text)));
}

export function renderKidTarget(root, view, { onHear, hearLabel, hearDisabled } = {}) {
  if (!root) return;
  const job = kidLine(view);
  root.hidden = false;
  root.replaceChildren(
    el('p', { className: 'kid-kicker' }, kidTitle(view)),
    el('p', { className: 'kid-job', id: 'kid-job' }, job),
    el('button', {
      className: 'button button-small button-outline kid-hear',
      type: 'button',
      disabled: hearDisabled === true,
      onClick: () => onHear?.(job)
    }, hearLabel || 'Hear the words')
  );
}

export function renderGrownupView(root, store, { onExport, onImport, onReset, pauseState } = {}) {
  const report = grownupReport(store);
  const rows = report.observed.length
    ? report.observed.map((row) => grownupLesson(row))
    : [el('p', {}, 'This device has not stored a lesson try yet. Nothing here is invented.')];
  root.replaceChildren(...[
    el('div', { className: 'game-topline' },
      el('span', { className: 'game-label' }, el('span', { className: 'game-live-dot' }), ' GROWN-UP VIEW'),
      el('span', { className: 'game-xp' }, 'Helper card · not a login')
    ),
    el('section', { className: 'grownup-intro' },
      el('p', { className: 'mission-eyebrow' }, 'NEARBY HELPER · THIS DEVICE'),
      el('h1', {}, 'What this browser has already seen'),
      el('p', { className: 'grownup-honesty' }, report.honesty),
      el('p', {}, `${report.observedCount} ${report.observedCount === 1 ? 'activity' : 'activities'} have a stored record. ${report.practicedCount} reached Practiced or higher. This is not authenticated privacy protection.`)
    ),
    pauseState
      ? el('p', { className: 'unit-limit' },
        el('a', { className: 'button button-dark', href: resumeHref(pauseState) }, `Resume ${pauseState.lessonId}`)
      )
      : null,
    el('section', { className: 'grownup-practice', id: 'offline-practice' },
      el('p', { className: 'mission-eyebrow' }, 'ONE THING TO TRY OFF THE SCREEN'),
      el('h2', {}, report.practice.title),
      el('p', {}, report.practice.activity)
    ),
    el('section', { className: 'grownup-skills', 'aria-label': 'Observed skills on this device' },
      el('h2', {}, 'Observed skills'),
      ...rows
    ),
    portabilityCard(onExport, onImport, onReset),
    el('p', { className: 'unit-limit' }, 'No child email. No public profile. No chat. No recording upload. No advertising tracker. No billing. Export stays on the browsers you control.'),
    el('p', { className: 'unit-limit' },
      el('a', { className: 'button button-outline', href: '/learn/' }, 'Back to the journey')
    )
  ].filter(Boolean));
}

function grownupLesson(row) {
  return el('article', { className: 'grownup-lesson' },
    el('p', { className: 'unit-id' }, `${row.lessonId} · ${evidenceLabel(row.evidenceState)}`),
    el('h3', {}, row.title),
    el('p', { className: 'unit-blurb' }, row.honesty),
    el('ol', { className: 'grownup-skill-list' },
      ...row.skills.map((skill) => el('li', {},
        el('strong', {}, skill.title),
        el('span', {}, skill.state ? evidenceLabel(skill.state) : 'not stored'),
        skill.adultObserved
          ? el('span', { className: skill.adultMarked ? 'grownup-mark yes' : 'grownup-mark no' },
            skill.adultMarked ? 'grown-up marked' : 'needs a grown-up mark')
          : null
      ))
    )
  );
}

export function phaseCopy(view) {
  const { lessonSpec, phase, guidedStep, independentStep, transferStep } = view;
  const copy = lessonSpec.copy;
  if (phase === 'explanation') return copy.explanation;
  if (phase === 'demo') return copy.demo;
  if (phase === 'guided') return stepCopy(copy.guided, guidedTitles(lessonSpec.lessonId, 'guided'), guidedStep);
  if (phase === 'independent') return stepCopy(copy.independent, guidedTitles(lessonSpec.lessonId, 'independent'), independentStep);
  if (phase === 'transfer') return stepCopy(copy.transfer, guidedTitles(lessonSpec.lessonId, 'transfer'), transferStep);
  if (phase === 'review') return copy.review;
  if (phase === 'remediation') {
    return {
      eyebrow: 'EASIER PATH',
      title: 'A smaller try',
      paragraphs: [
        'Same skill, an easier pattern. Repeating the identical hard check again would not help.',
        view.lessonSpec.copy.independent?.remediation || view.lessonSpec.copy.guided?.remediation || ''
      ].filter(Boolean)
    };
  }
  return resultCopy(view);
}

function stepCopy(block, titles, step) {
  if (!block) return { eyebrow: '', title: '', paragraphs: [] };
  const title = titles[step] || block.title;
  const camel = String(step || '').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  const paragraph = block[step] || block[camel];
  const paragraphs = paragraph ? [paragraph] : (block.paragraphs || []);
  return { ...block, title, paragraphs: paragraphs.length ? paragraphs : [block.title] };
}

function guidedTitles(lessonId, phase) {
  if (lessonId === 'L01' && phase === 'guided') {
    return { unlock: 'Wake the sound', 'high-low': 'High, then low', groups: 'Clumps of two and three', posture: 'A grown-up check' };
  }
  if (lessonId === 'L01' && phase === 'independent') {
    return { 'high-low': 'No glow this time', groups: 'Find both clumps', done: 'Ready for one more look' };
  }
  if (lessonId === 'L01' && phase === 'transfer') {
    return { 'other-two': 'Another clump of two', three: 'The clump of three' };
  }
  if (lessonId === 'L02' && phase === 'guided') {
    return { find: 'The doorstep', name: 'Name it', other: 'Another room', done: 'Ready for a quiet check' };
  }
  if (lessonId === 'L02' && phase === 'independent') {
    return { find: 'No glow this time', register: 'A C in a new room', done: 'Ready for another house' };
  }
  if (lessonId === 'L02' && phase === 'transfer') {
    return { 'other-house': 'Another house of two', done: 'Saved' };
  }
  if (lessonId === 'L03' && phase === 'guided') {
    return { 'find-c': 'Find C first', neighbors: 'Next door', row: 'C–D–E in a row', fingering: 'A grown-up check', done: 'Ready for a quiet check' };
  }
  if (lessonId === 'L03' && phase === 'independent') {
    return { order: 'A new order', done: 'Ready for one more walk' };
  }
  if (lessonId === 'L03' && phase === 'transfer') {
    return { order: 'Another new order', done: 'Saved' };
  }
  if (lessonId === 'L04' && phase === 'guided') {
    return { hear: 'Hear Little Wave', head: 'First four', tail: 'Last three', all: 'The whole wave', cousin: 'A cousin — just listening', done: 'Ready for a quiet check' };
  }
  if (lessonId === 'L04' && phase === 'independent') {
    return { home: 'Little Wave, no tiles', done: 'Now the cousin' };
  }
  if (lessonId === 'L04' && phase === 'transfer') {
    return { cousin: 'Wave the other way', done: 'Saved' };
  }
  if (['L05', 'L06', 'L07', 'L08'].includes(lessonId) && phase === 'guided') {
    return { hear: 'Just listening', echo: 'Your turn with the clock', cousin: 'A cousin — just listening', done: 'Ready for a quiet check' };
  }
  if (['L05', 'L06', 'L07', 'L08'].includes(lessonId) && phase === 'independent') {
    return { perform: 'Performance windows', done: 'Ready for one more pattern' };
  }
  if (['L05', 'L06', 'L07', 'L08'].includes(lessonId) && phase === 'transfer') {
    return { perform: 'A new pattern', done: 'Saved' };
  }
  if (lessonId === 'L09' && phase === 'guided') {
    return { find: 'The longer doorstep', name: 'Name it', neighbor: 'Next door — G', fingering: 'A grown-up check', done: 'Ready for a quiet check' };
  }
  if (lessonId === 'L09' && phase === 'independent') {
    return { find: 'This F, then this G', done: 'Ready for neighbors the other way' };
  }
  if (lessonId === 'L09' && phase === 'transfer') {
    return { neighbors: 'G then F', done: 'Saved' };
  }
  if (lessonId === 'L10' && phase === 'guided') {
    return { step: 'A step', repeat: 'A repeat', skip: 'A skip', make: 'A three-note goodbye', done: 'Ready for a quiet check' };
  }
  if (lessonId === 'L10' && phase === 'independent') {
    return { chain: 'Step, repeat, skip', done: 'Ready for the other way' };
  }
  if (lessonId === 'L10' && phase === 'transfer') {
    return { chain: 'Down the path', done: 'Saved' };
  }
  if (lessonId === 'L11' && phase === 'guided') {
    return { walk: 'The staff walk', neighbors: 'F and G on the picture', ear: 'Hear, then find', done: 'Ready for a quiet check' };
  }
  if (lessonId === 'L11' && phase === 'independent') {
    return { walk: 'The picture is the boss', done: 'Ready for a new order' };
  }
  if (lessonId === 'L11' && phase === 'transfer') {
    return { order: 'Same friends, new picture', done: 'Saved' };
  }
  if (lessonId === 'L12' && phase === 'guided') {
    return { hear: 'Hear Porch Steps', head: 'First four', tail: 'Last three', all: 'The whole porch', make: 'A three-note goodbye', cousin: 'A cousin — just listening', done: 'Ready for a quiet check' };
  }
  if (lessonId === 'L12' && phase === 'independent') {
    return { home: 'Porch Steps, no letters', done: 'Now the cousin' };
  }
  if (lessonId === 'L12' && phase === 'transfer') {
    return { cousin: 'Porch the other way', done: 'Saved' };
  }
  if (lessonId === 'L13' && phase === 'guided') {
    return { find: 'The lower doorstep', name: 'Name it', neighbors: 'C–D–E in the left room', fingering: 'A grown-up check', done: 'Ready for a quiet check' };
  }
  if (lessonId === 'L13' && phase === 'independent') {
    return { find: 'This lower C, then neighbors', done: 'Ready to walk home' };
  }
  if (lessonId === 'L13' && phase === 'transfer') {
    return { neighbors: 'E then D then C', done: 'Saved' };
  }
  if (lessonId === 'L14' && phase === 'guided') {
    return { walk: 'The bass walk', neighbors: 'F and G on the bass picture', ear: 'Hear, then find', done: 'Ready for a quiet check' };
  }
  if (lessonId === 'L14' && phase === 'independent') {
    return { walk: 'The bass picture is the boss', done: 'Ready for a new order' };
  }
  if (lessonId === 'L14' && phase === 'transfer') {
    return { order: 'Same friends, new bass picture', done: 'Saved' };
  }
  if (lessonId === 'L15' && phase === 'guided') {
    return { question: 'Just the question', answer: 'Just the answer', both: 'Question, then answer', hands: 'A grown-up check', done: 'Ready for a quiet check' };
  }
  if (lessonId === 'L15' && phase === 'independent') {
    return { both: 'The whole conversation', done: 'Ready for the other way' };
  }
  if (lessonId === 'L15' && phase === 'transfer') {
    return { both: 'Answer, then ask', done: 'Saved' };
  }
  if (lessonId === 'L16' && phase === 'guided') {
    return { hear: 'Just listening', echo: 'Hold and walk with the clock', cousin: 'A cousin — just listening', done: 'Ready for a quiet check' };
  }
  if (lessonId === 'L16' && phase === 'independent') {
    return { perform: 'Performance windows', done: 'Ready for one more pattern' };
  }
  if (lessonId === 'L16' && phase === 'transfer') {
    return { perform: 'Hold, walk down', done: 'Saved' };
  }
  if (['L17', 'L18', 'L19', 'L20'].includes(lessonId) && phase === 'guided') {
    return {
      left: 'Just the left room',
      right: 'Just the right room',
      loop: 'A small loop',
      together: 'Both rooms together',
      cousin: 'A cousin — just listening',
      done: 'Ready for a quiet check'
    };
  }
  if (['L17', 'L18', 'L19', 'L20'].includes(lessonId) && phase === 'independent') {
    return { perform: 'Both rooms, no glow', done: 'Ready for one more pattern' };
  }
  if (['L17', 'L18', 'L19', 'L20'].includes(lessonId) && phase === 'transfer') {
    return { perform: 'A new together pattern', done: 'Saved' };
  }
  if (lessonId === 'L21' && phase === 'guided') {
    return { hear: 'Just listening', notes: 'Quieter, then stronger', listen: 'A grown-up listen', cousin: 'A cousin — just listening', done: 'Ready for a quiet check' };
  }
  if (lessonId === 'L21' && phase === 'independent') {
    return { play: 'Shape Soft Walk, no glow', notes: 'Shape Soft Walk, no glow', done: 'Ready for the cousin' };
  }
  if (lessonId === 'L21' && phase === 'transfer') {
    return { play: 'Down, then stronger', notes: 'Down, then stronger', done: 'Saved' };
  }
  if (lessonId === 'L22' && phase === 'guided') {
    return { pick: 'Pick an ending', play: 'Play the one you picked', cousin: 'A cousin — just listening', done: 'Ready for a quiet check' };
  }
  if (lessonId === 'L22' && phase === 'independent') {
    return { pick: 'Pick again, no glow', play: 'Your ending, no glow', done: 'Ready for a new start' };
  }
  if (lessonId === 'L22' && phase === 'transfer') {
    return { pick: 'A new start, your ending', play: 'Down the hill, your ending', done: 'Saved' };
  }
  if (lessonId === 'L23' && phase === 'guided') {
    return { pick: 'Name the job', work: 'Do only that job', whole: 'Put Little Wave back', cousin: 'A cousin — just listening', done: 'Ready for a quiet check' };
  }
  if (lessonId === 'L23' && phase === 'independent') {
    return { pick: 'Name the job again', work: 'The job, no glow', play: 'The job, no glow', done: 'Ready for the other wave' };
  }
  if (lessonId === 'L23' && phase === 'transfer') {
    return { pick: 'Same kind of job', work: 'The cousin job', play: 'The cousin job', done: 'Saved' };
  }
  if (lessonId === 'L24' && phase === 'guided') {
    return { pick: 'Pick a piece to share', remind: 'One reminder', play: 'Play it through', listen: 'A grown-up listened', done: 'Ready for recital mode' };
  }
  if (lessonId === 'L24' && phase === 'independent') {
    return { pick: 'Pick the piece', play: 'Recital mode — no glow', done: 'Ready for another share' };
  }
  if (lessonId === 'L24' && phase === 'transfer') {
    return { pick: 'A different piece', play: 'Another share, no glow', done: 'Saved' };
  }
  return {};
}

function resultCopy(view) {
  const state = view.lesson.evidenceState;
  const copy = view.lessonSpec.copy.result;
  const sentence = evidenceSentence(state, view.lessonSpec);
  const honesty = sourceHonesty(view.attempt?.inputMode);
  if (state === 'independent' || state === 'retained') {
    return { ...copy, paragraphs: [sentence, honesty, view.firstCompletionNow ? copy.firstRewardNote : copy.repeatNote] };
  }
  if (state === 'practiced') {
    return { eyebrow: copy.eyebrow, title: copy.practicedTitle, paragraphs: [sentence, honesty, 'Independent is still waiting if you want a quiet check next time.'] };
  }
  return { eyebrow: copy.eyebrow, title: copy.startedTitle, paragraphs: [sentence, honesty, 'Nothing here claims a finished skill. Come back on this same device to continue.'] };
}

export function renderResultCard(card) {
  if (!card) return null;
  const rows = [
    ['Notes', laneWord(card.notes)],
    ['Rhythm', laneWord(card.rhythm)],
    ['Assistance', card.assistance === 'assisted' ? 'help used' : 'none'],
    ['Self-observation', card.selfObservation ? 'marked' : 'not marked'],
    ['We listened', card.listened ? 'yes' : 'not yet'],
    ['Later transfer', laneWord(card.transferLater)]
  ];
  if (card.dynamics != null) rows.splice(2, 0, ['Dynamics', laneWord(card.dynamics)]);
  if (card.finishedThrough != null) rows.push(['Finished through wobbles', card.finishedThrough ? 'yes' : 'not yet']);
  return el('ol', { className: 'result-card', 'aria-label': 'How this try is stored' },
    ...rows.map(([label, value]) => el('li', {}, el('strong', {}, label), el('span', {}, value)))
  );
}

function laneWord(value) {
  if (value === 'pass' || value === true) return 'pass';
  if (value === 'miss' || value === false) return 'miss';
  if (value === 'unavailable') return 'unavailable on this input';
  if (value === 'not-asked' || value === 'not asked') return 'not asked';
  if (value === 'later') return 'later check';
  if (value === 'done') return 'done';
  return 'not scored';
}

export function evidenceSentence(state, lessonSpec) {
  const custom = lessonSpec?.copy?.result?.evidence?.[state];
  if (custom) return custom;
  if (state === 'independent') return 'Device record: Independent. The computer heard high/low and both black-key groups. It still cannot see posture.';
  if (state === 'practiced') return 'Device record: Practiced. Guided exploration is saved on this device only.';
  if (state === 'explored') return 'Device record: Explored. You opened the lesson and tried something on this device.';
  if (state === 'retained') return 'Device record: Retained. A later review already succeeded on this device.';
  return 'Device record: started, not yet Explored. We did not mark a success.';
}

export function evidenceLabel(state) {
  if (!state) return 'Not yet explored';
  return state.charAt(0).toUpperCase() + state.slice(1);
}

export function renderPhraseTiles(root, phrase) {
  if (!root) return;
  if (!phrase || phrase.kind === 'hidden') {
    root.hidden = true;
    root.replaceChildren();
    return;
  }
  root.hidden = false;
  root.replaceChildren(...phrase.letters.map((letter, index) => {
    const state = phrase.current < 0 ? '' : index < phrase.current ? 'done' : index === phrase.current ? 'current' : '';
    return el('span', { className: `sequence-note ${state}` }, letter);
  }));
}

export function renderUnitHub(root, store, { onOpen, onContinue, focusUnit, onExport, onImport, onReset, pauseState } = {}) {
  const view = unitView(store);
  const rec = recommendNext(store, store.session);
  const continueCard = [...view.units.flatMap((unit) => unit.cards)]
    .find((card) => card.lessonId === view.continueLessonId);
  const extraContinue = continueCard && rec?.lessonId !== continueCard.lessonId
    ? el('p', { className: 'unit-limit' },
      el('button', {
        className: 'button button-outline',
        type: 'button',
        onClick: () => onContinue(continueCard.lessonId)
      }, continueCard.inProgress
        ? `Continue ${continueCard.title}`
        : evidenceRank(continueCard.evidenceState) >= 3
          ? `Replay ${continueCard.title}`
          : `Start ${continueCard.title}`)
    )
    : null;
  root.replaceChildren(...[
    el('div', { className: 'game-topline' },
      el('span', { className: 'game-label' }, el('span', { className: 'game-live-dot' }), ' FIRST PIANO JOURNEY'),
      el('span', { className: 'game-xp' }, 'Device-local only')
    ),
    el('section', { className: 'unit-intro' },
      el('p', { className: 'mission-eyebrow' }, 'SIX WORLDS · SAME DEVICE'),
      el('h1', {}, 'First Piano Journey'),
      el('p', {}, 'Twenty-four little jobs. Play, listen, try again. A yellow job tells you what to do now. Hear the words if you like. A grown-up can sit nearby. The next activity unlocks when this device is ready. Nothing here is a teacher grade.')
    ),
    pauseState
      ? el('section', { className: 'next-session', id: 'resume-session' },
        el('p', { className: 'mission-eyebrow' }, 'PAUSED ON THIS DEVICE'),
        el('h2', {}, `Resume ${pauseState.lessonId}`),
        el('p', {}, 'You paused. Saved records stay. Resume picks up that lesson.'),
        el('a', { className: 'button button-dark', href: resumeHref(pauseState) }, `Resume ${pauseState.lessonId}`)
      )
      : null,
    nextSessionCard(rec, onContinue),
    extraContinue,
    ...view.units.map((unit) => unitSection(unit, onOpen, focusUnit)),
    portabilityCard(onExport, onImport, onReset),
    el('p', { className: 'unit-limit' },
      el('a', { className: 'button button-outline', href: '/learn/?view=grown-up' }, 'Grown-up view')
    ),
    el('p', { className: 'unit-limit' }, 'Playable lessons are L01–L24 when earlier activities on this device are ready. On-screen keys are an exploration stand-in, not proof of hand coordination or quiet-versus-strong. MIDI reports pitch, time, and velocity if the keyboard sent it — never technique. A grown-up marks listening for a recital. Export stays on the browsers you control. There is no account.')
  ].filter(Boolean));
}

function nextSessionCard(rec, onContinue) {
  if (!rec) return null;
  return el('section', { className: 'next-session', id: 'next-session' },
    el('p', { className: 'mission-eyebrow' }, 'NEXT ON THIS DEVICE'),
    el('h2', {}, rec.title),
    el('p', {}, rec.reason),
    rec.kind === 'rest'
      ? null
      : el('button', {
        className: 'button button-dark',
        type: 'button',
        onClick: () => onContinue(rec.lessonId, rec)
      }, rec.action)
  );
}

function portabilityCard(onExport, onImport, onReset) {
  if (!onExport && !onImport && !onReset) return null;
  return el('section', { className: 'progress-port', id: 'progress-port' },
    el('p', { className: 'mission-eyebrow' }, 'THIS DEVICE ONLY'),
    el('h2', {}, 'Copy or clear records on browsers you control'),
    el('p', {}, 'Export is a JSON file of lesson and attempt records. Import checks versions and skips duplicate attempt IDs. It cannot invent Independent or Retained. Reset clears this browser only. Nothing is uploaded to an account. This is not privacy protection.'),
    el('div', { className: 'phase-actions' },
      onExport ? el('button', { className: 'button button-outline', type: 'button', onClick: onExport }, 'Export JSON') : null,
      onImport ? el('label', { className: 'button button-outline import-label' },
        'Import JSON',
        el('input', {
          type: 'file',
          accept: 'application/json,.json',
          hidden: true,
          onChange: (event) => {
            const file = event.target.files?.[0];
            if (file && onImport) onImport(file);
            event.target.value = '';
          }
        })
      ) : null,
      onReset ? el('button', { className: 'button button-outline', type: 'button', onClick: onReset }, 'Reset this device') : null
    )
  );
}

function unitSection(unit, onOpen, focusUnit) {
  return el('section', {
    className: `unit-world ${unit.unlocked ? 'open' : 'locked'} ${focusUnit === unit.unitId ? 'focus' : ''}`,
    id: `unit-${unit.unitId}`
  },
    el('p', { className: 'mission-eyebrow' }, unit.kicker),
    el('h2', {}, unit.title),
    unit.unlocked
      ? null
      : el('p', { className: 'unit-lock-note' }, lockNoteForUnit(unit.unitId)),
    el('ol', { className: 'unit-map', 'aria-label': `${unit.title} activities` },
      ...unit.cards.map((card) => unitCard(card, onOpen))
    )
  );
}

function unitCard(card, onOpen) {
  const locked = !card.unlocked;
  const state = evidenceLabel(card.evidenceState);
  const action = locked
    ? lockReason(card)
    : card.inProgress
      ? 'Continue'
      : evidenceRank(card.evidenceState) >= 3
        ? 'Replay'
        : 'Open';
  const lanes = laneSummary(card);
  return el('li', { className: `unit-card ${locked ? 'locked' : 'open'} ${card.inProgress ? 'current' : ''}` },
    el('span', { className: 'unit-id' }, card.lessonId),
    el('strong', {}, card.title),
    el('span', { className: 'unit-blurb' }, card.blurb),
    el('span', { className: 'unit-state' }, locked ? 'Locked' : state),
    locked ? null : evidenceLaneList(lanes),
    locked
      ? el('p', { className: 'unit-lock-note' }, action)
      : el('button', {
        className: 'button button-small button-outline',
        type: 'button',
        onClick: () => onOpen(card.lessonId)
      }, action)
  );
}

function evidenceLaneList(lanes) {
  return el('ol', { className: 'evidence-lanes', 'aria-label': 'Evidence on this device' },
    ...lanes.map((lane) => el('li', {
      className: `evidence-lane ${lane.earned ? 'earned' : 'empty'}`,
      title: lane.honesty || ''
    }, evidenceLabel(lane.state === 'explored' ? 'explored' : lane.state)))
  );
}

function lockNoteForUnit(unitId) {
  if (unitId === 'expression') return 'Expression unlocks when Complete little piece is Independent on this device.';
  if (unitId === 'together') return 'Together unlocks when Two parts one pulse is Independent on this device.';
  if (unitId === 'left-hand') return 'Left hand unlocks when Read a little tune is Independent on this device.';
  if (unitId === 'read-and-play') return 'Read and play unlocks when Notes with a beat is Independent on this device.';
  return 'Rhythm Club unlocks when First little tune is Independent on this device.';
}

function lockReason(card) {
  const prior = JOURNEY_LESSONS.find((item) => item.lessonId === card.unlocksAfter);
  if (!prior) return 'Locked';
  if (card.unlockNeeds === 'independent') return `Locked until ${prior.title} is Independent on this device.`;
  return `Locked until ${prior.title} is Practiced on this device.`;
}

export function parseGrownupView(value) {
  if (typeof value !== 'string') return false;
  const id = value.trim().toLowerCase();
  return id === 'grown-up' || id === 'grownup' || id === 'adult';
}

export function lessonHref(lessonId) {
  return `/learn/?lesson=${lessonId}`;
}

export function nextHref(lessonId) {
  const next = nextLessonId(lessonId);
  return next ? lessonHref(next) : '/learn/';
}

export { PHASE_ORDER, STEP_LABELS, unitView };
