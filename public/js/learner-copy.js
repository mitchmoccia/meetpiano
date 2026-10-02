import { GROWNUP_HONESTY } from './grownup.js';

const PROFILE = "this learner's profile";
const KEEP_DEVICE_LOCAL = 'Picking up where you left off on this device.';

/**
 * Guest copy says "this device" because guest records only live in this browser. When a parent-chosen learner is
 * practicing, records save to that learner's family profile, so the same screens are reworded. Order matters: the
 * specific sentences run before the generic " on this device" rule.
 */
const RULES = [
  [GROWNUP_HONESTY, `This grown-up helper is an observation aid. It lists what ${PROFILE} shows for a person sitting nearby. It is not a login and not privacy protection; family settings stay behind the grown-up sign-in.`],
  ['is a device-local observation aid. It lists what this browser has already stored. It is not a login, not a cloud parent account, and not privacy protection.', `is an observation aid. It lists what ${PROFILE} shows. It is not privacy protection.`],
  ['This is a device-local observation aid, not authenticated privacy protection.', 'This is an observation aid, not privacy protection.'],
  ['Guest records stay on the browsers you control; a grown-up can sign in to save to a family profile instead.', `Practice summaries save to ${PROFILE}; note-by-note detail stays in this browser.`],
  ['Export stays on the browsers you control.', 'Profile data and deletion live in the parent dashboard.'],
  ['Device record: ', 'Practice record: '],
  [' and tried something on this device.', ' and tried something.'],
  [' saved on this device only.', ` saved to ${PROFILE}.`],
  ['Saved on this device only.', `Saved to ${PROFILE}.`],
  ['Saved on this device', `Saved to ${PROFILE}`],
  ['First finish on this device. We will not show this sticker again here.', 'First finish for this learner. We will not show this sticker again.'],
  ['You already finished this check on this device.', 'You already finished this check.'],
  ['Saved records stay on this device.', `Saved records stay in ${PROFILE}.`],
  ['Saved progress on this device stays.', 'Saved progress stays.'],
  ['Progress on this device stays.', 'Progress stays.'],
  ['Saved progress stays on this device.', 'Saved progress stays.'],
  ['Device-local only', 'Family profile'],
  ['SIX WORLDS · SAME DEVICE', 'SIX WORLDS · ONE LEARNER'],
  ['NEXT ON THIS DEVICE', 'NEXT FOR THIS LEARNER'],
  ['SAVED ON THIS DEVICE', 'SAVED TO THIS LEARNER'],
  ['NEARBY HELPER · THIS DEVICE', 'NEARBY HELPER · THIS LEARNER'],
  ['What this browser has already seen', "What this learner's record shows"],
  ['This device has not stored a lesson try yet.', 'This learner has no lesson try yet.'],
  ['when this device is ready', 'when this learner is ready'],
  ['earlier activities on this device are ready', 'earlier activities are ready'],
  ['Come back on this same device to continue.', 'Come back to continue.']
];

export function learnerText(text) {
  if (typeof text !== 'string' || !/device|browser|Export stays/i.test(text)) return text;
  let next = text;
  for (const [from, to] of RULES) if (next.includes(from)) next = next.replaceAll(from, to);
  return next
    .split(KEEP_DEVICE_LOCAL)
    .map((part) => part.replaceAll(' on this device', ' for this learner'))
    .join(KEEP_DEVICE_LOCAL);
}

const ATTRIBUTES = ['aria-label', 'title'];

function rewriteNode(node, skip) {
  if (skip?.contains(node)) return;
  if (node.nodeType === Node.TEXT_NODE) {
    const next = learnerText(node.nodeValue);
    if (next !== node.nodeValue) node.nodeValue = next;
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  for (const name of ATTRIBUTES) {
    const value = node.getAttribute(name);
    const next = value == null ? value : learnerText(value);
    if (next !== value) node.setAttribute(name, next);
  }
  for (const child of node.childNodes) rewriteNode(child, skip);
}

/** Rewrites guest wording while a family learner is active. Rewrites are idempotent, so the observer settles. */
export function installLearnerCopy(root, { skip } = {}) {
  rewriteNode(root, skip);
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') mutation.addedNodes.forEach((node) => rewriteNode(node, skip));
      else rewriteNode(mutation.target, skip);
    }
  });
  observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRIBUTES });
  return observer;
}
