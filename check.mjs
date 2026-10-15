// Structural self-check. Run: node check.mjs
// Guards the facts that came from the SkillGuard repo (38 rules, 10 categories,
// severity mix) plus the html/js/css wiring the page depends on.
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');
const js = readFileSync(new URL('./app.js', import.meta.url), 'utf8');

const fail = [];
const ok = (label, cond, detail = '') => {
  if (!cond) fail.push(`${label}${detail ? `, ${detail}` : ''}`);
};

// ── rules table ───────────────────────────────────────────────
const rows = [...html.matchAll(/<tr data-sev="(\w+)"><td class="rid">([A-Z]+\d+)<\/td><td>([^<]+)<\/td>/g)]
  .map(([, sev, id, cat]) => ({ sev, id, cat }));

ok('38 rule rows', rows.length === 38, `found ${rows.length}`);

const bySeverity = rows.reduce((a, r) => ((a[r.sev] = (a[r.sev] ?? 0) + 1), a), {});
const expectedSeverity = { CRITICAL: 2, HIGH: 26, MEDIUM: 8, LOW: 2 };
const sameCounts = (a, b) => Object.keys(b).length === Object.keys(a).length && Object.keys(b).every((k) => a[k] === b[k]);
ok('severity mix matches docs/RULES.md', sameCounts(bySeverity, expectedSeverity), JSON.stringify(bySeverity));

const byCategory = rows.reduce((a, r) => ((a[r.cat] = (a[r.cat] ?? 0) + 1), a), {});
const expectedCategory = {
  'Prompt injection': 3, 'Anti-refusal': 3, 'Data exfiltration': 4, 'Privilege escalation': 3,
  'Supply chain': 8, 'Dangerous execution': 8, 'MCP least privilege': 3,
  'MCP tool poisoning': 3, 'Tool misuse': 1, 'Trigger abuse': 2,
};
ok('10 categories with the documented counts', sameCounts(byCategory, expectedCategory), JSON.stringify(byCategory));

ok('rule ids unique', new Set(rows.map((r) => r.id)).size === rows.length);
ok('every severity filter button has rules',
  ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].every((s) => bySeverity[s] > 0));

// ── wiring ────────────────────────────────────────────────────
const ids = new Set([...html.matchAll(/\sid="([\w-]+)"/g)].map(([, id]) => id));
for (const [, id] of js.matchAll(/getElementById\('([\w-]+)'\)/g)) ok(`#${id} exists`, ids.has(id));
for (const [, sel] of js.matchAll(/data-copy="#([\w-]+)"/g)) ok(`copy target #${sel} exists`, ids.has(sel));
for (const [, target] of html.matchAll(/data-copy="#([\w-]+)"/g)) ok(`data-copy #${target} exists`, ids.has(target));

const anchors = [...html.matchAll(/href="#([\w-]+)"/g)].map(([, a]) => a);
for (const a of anchors) ok(`anchor #${a} resolves`, ids.has(a));

ok('one node name per pipeline step',
  [...html.matchAll(/class="node"/g)].length === [...html.matchAll(/<li><span class="rail__n">/g)].length);

const count = (s, re) => (s.match(re) ?? []).length;
ok('div tags balanced', count(html, /<div[\s>]/g) === count(html, /<\/div>/g),
  `${count(html, /<div[\s>]/g)} open / ${count(html, /<\/div>/g)} close`);
ok('section tags balanced', count(html, /<section[\s>]/g) === count(html, /<\/section>/g));
ok('every code block is closed', count(html, /<pre[\s>]/g) === count(html, /<\/pre>/g));

// ── css ───────────────────────────────────────────────────────
for (const token of ['--critical', '--high', '--medium', '--low', '--mono', '--paper', '--blue', '--dark'])
  ok(`css defines ${token}`, css.includes(token));
ok('light theme: white paper', /--paper:\s*#fff/i.test(css));
ok('dark panels kept for contrast', /--dark:\s*#0a1b2e/i.test(css));
ok('dark blocks set their own text colour', /\.cmd\s*\{[^}]*color:/.test(css) && /\.verdict\s*\{[^}]*color:/.test(css));
ok('reduced-motion is honoured', css.includes('prefers-reduced-motion'));
ok('meter animation variable present', css.includes('width: var(--v)'));

// ── no em dash or en dash anywhere ────────────────────────────
for (const [name, src] of [['index.html', html], ['styles.css', css], ['app.js', js]]) {
  const bad = [...src.matchAll(/[\u2013\u2014]/g)].map((m) => m[0]);
  ok(`no dash characters in ${name}`, bad.length === 0, `${bad.length} found (U+${bad[0] ? bad[0].codePointAt(0).toString(16).toUpperCase() : ''})`);
}

if (fail.length) {
  console.error(`FAIL (${fail.length})`);
  fail.forEach((f) => console.error('  ✗', f));
  process.exit(1);
}
console.log(`PASS, 38 rules, ${Object.keys(byCategory).length} categories, html/css/js wired`);
