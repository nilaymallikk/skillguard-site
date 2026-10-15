// Structural self-check. Run: node check.mjs
// Guards the facts that came from the SkillGuard repo (38 rules, 10 categories,
// severity mix) plus the html/js/css wiring the page depends on.
import { readFileSync, existsSync } from 'node:fs';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');
const js = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const logo = new URL('./assets/logo-96.png', import.meta.url);
const logo2x = new URL('./assets/logo-256.png', import.meta.url);

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

const flowStart = html.indexOf('<ol class="flow">');
const flow = html.slice(flowStart, html.indexOf('</ol>', flowStart));
ok('one node name per flow step',
  [...html.matchAll(/<code class="node">/g)].length === [...flow.matchAll(/<li[\s>]/g)].length,
  `${[...html.matchAll(/<code class="node">/g)].length} nodes, ${[...flow.matchAll(/<li[\s>]/g)].length} steps`);

const count = (s, re) => (s.match(re) ?? []).length;
ok('div tags balanced', count(html, /<div[\s>]/g) === count(html, /<\/div>/g),
  `${count(html, /<div[\s>]/g)} open / ${count(html, /<\/div>/g)} close`);
ok('section tags balanced', count(html, /<section[\s>]/g) === count(html, /<\/section>/g));
ok('every code block is closed', count(html, /<pre[\s>]/g) === count(html, /<\/pre>/g));

// ── branding and credits ─────────────────────────────────────
function usedClasses(src) {
  const out = new Set();
  for (const m of src.matchAll(/class="([^"]+)"/g)) m[1].split(/\s+/).forEach((c) => c && out.add(c));
  return out;
}
ok('logo is referenced', html.includes('assets/logo-96.png') && html.includes('assets/logo-256.png'));
ok('logo files exist', existsSync(logo) && existsSync(logo2x), 'assets/logo-96.png and assets/logo-256.png');
ok('favicon uses the logo', /rel="icon" href="assets\/logo-96\.png"/.test(html));
ok('github mark is inline svg', (html.match(/viewBox="0 0 16 16"/g) ?? []).length >= 2,
  `${(html.match(/viewBox="0 0 16 16"/g) ?? []).length} marks`);
ok('github repo is linked', html.includes('https://github.com/NilLab-agi/SkillGuard'));
ok('built by Nilay links to nilaymallik.dev',
  /Built by\s*<a href="https:\/\/nilaymallik\.dev"/.test(html));

// ── css ───────────────────────────────────────────────────────
for (const token of ['--critical', '--high', '--medium', '--low', '--mono', '--paper', '--ink', '--dark', '--serif'])
  ok(`css defines ${token}`, css.includes(token));
ok('cream paper from the logo', /--paper:\s*#fdf8f1/i.test(css));
ok('dark blocks set their own text colour',
  /\.cmd\s*\{[^}]*color:/.test(css) && /\.verdict\s*\{[^}]*color:/.test(css));
ok('reduced-motion is honoured', css.includes('prefers-reduced-motion'));
ok('every class in the html has a rule', [...usedClasses(html)].every((c) => css.includes('.' + c)));

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
