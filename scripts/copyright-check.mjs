import { readFileSync } from 'node:fs';
import { currentCopyrightYear, stampCopyrightYear } from '../dist/js/copyright.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(currentCopyrightYear(new Date('2031-02-01T00:00:00Z')) === '2031', 'year follows the given date');
assert(currentCopyrightYear(new Date('2026-09-09T00:00:00Z')) === '2026', 'year for 2026');

const node = { textContent: '1999' };
const stamped = stampCopyrightYear({ querySelectorAll: () => [node] }, new Date('2028-06-01T00:00:00Z'));
assert(stamped === '2028', 'stamp returns the runtime year');
assert(node.textContent === '2028', 'stamp writes the year into marked nodes');

const pages = ['dist/index.html', 'dist/learn/index.html'];
for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  assert(html.includes('data-copyright-year'), `${file} has a dynamic year hook`);
  assert(/©\s*<span data-copyright-year>/.test(html), `${file} uses the © {year} pattern`);
  assert(html.includes('Xpancom, LLC'), `${file} names the legal entity`);
  assert(!html.includes('© 2026 MeetPiano'), `${file} no longer uses the product-name copyright`);
  assert(html.includes('/js/copyright.js'), `${file} loads the copyright helper`);
}

const source = readFileSync('dist/js/copyright.js', 'utf8');
assert(source.includes('getFullYear()'), 'copyright helper uses a runtime year');

console.log('copyright footer checks passed');
