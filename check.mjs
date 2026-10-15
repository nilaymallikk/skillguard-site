// Structural self-check. Run: node check.mjs
// Guards the facts that came from the SkillGuard repo (38 rules, 10 categories,
// severity mix) plus the html/js/css wiring the page depends on.
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');
const js = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const logo = new URL('./assets/logo-96.png', import.meta.url);
const logo2x = new URL('./assets/logo-256.png', import.meta.url);
const mark = new URL('./assets/logo-mark-96.png', import.meta.url);
const mark2x = new URL('./assets/logo-mark-256.png', import.meta.url);

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
ok('transparent mark is the page logo', html.includes('assets/logo-mark-96.png') && html.includes('assets/logo-mark-256.png'));
ok('mark files exist', existsSync(mark) && existsSync(mark2x), 'assets/logo-mark-96.png and assets/logo-mark-256.png');
ok('solid disc kept for favicon and og:image',
  /rel="icon" href="assets\/logo-96\.png"/.test(html) && existsSync(logo) && existsSync(logo2x));
ok('the wordmark is gone', !html.includes('brand__name') && !html.includes('foot__name'));
ok('github mark is inline svg', (html.match(/viewBox="0 0 16 16"/g) ?? []).length >= 1,
  `${(html.match(/viewBox="0 0 16 16"/g) ?? []).length} marks`);
ok('nav is one centred group with the github link',
  /class="wrap nav__in"[\s\S]*nav__links[\s\S]*nav__gh[\s\S]*GitHub/.test(html) && !html.includes('nav__end'));
ok('hero mark sits above the headline',
  html.indexOf('hero__mark') > -1 && html.indexOf('hero__mark') < html.indexOf('<h1>'));
ok('footer carries the repository and elsewhere columns',
  /foot__col[\s\S]*Repository[\s\S]*foot__col[\s\S]*Elsewhere/.test(html));
ok('scroll progress line is present', html.includes('class="progress"'));
ok('github repo is linked', html.includes('https://github.com/NilLab-agi/SkillGuard'));
ok('built by Nilay links to nilaymallik.dev',
  /Built by\s*<a href="https:\/\/nilaymallik\.dev"/.test(html));

// ── copy that was cut on request ─────────────────────────────
for (const gone of ['Source on GitHub', 'No trackers', 'Clone SkillGuard', 'Browse the rules',
                    'Scan the next skill', 'Static analysis, zero execution', 'Get it on GitHub'])
  ok(`removed: "${gone}"`, !html.includes(gone));

// ── css ───────────────────────────────────────────────────────
for (const token of ['--critical', '--high', '--medium', '--low', '--mono', '--paper', '--ink', '--dark', '--font'])
  ok(`css defines ${token}`, css.includes(token));
ok('one typeface: JetBrains Mono', /--font:\s*'JetBrains Mono'/.test(css) && html.includes('family=JetBrains+Mono'));
ok('no other typeface survives', !/Plex|Newsreader|Inter/.test(css + html));
ok('cream paper from the logo', /--paper:\s*#fdf8f1/i.test(css));
ok('dark blocks set their own text colour',
  /\.cmd\s*\{[^}]*color:/.test(css) && /\.verdict\s*\{[^}]*color:/.test(css));
ok('reduced-motion is honoured', css.includes('prefers-reduced-motion'));
ok('every class in the html has a rule', [...usedClasses(html)].every((c) => css.includes('.' + c)));
// and the reverse: a rule with no markup behind it is dead weight
const jsAdded = new Set(['reveal', 'is-in', 'is-on', 'is-scrolled', 'js-anim']);
const inSelector = css.replace(/\{[^}]*\}/g, '');
const defined = new Set([...inSelector.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]));
const dead = [...defined].filter((c) => !usedClasses(html).has(c) && !jsAdded.has(c));
ok('no dead css classes', dead.length === 0, dead.join(', '));

// ── no em dash or en dash anywhere ────────────────────────────
for (const [name, src] of [['index.html', html], ['styles.css', css], ['app.js', js]]) {
  const bad = [...src.matchAll(/[\u2013\u2014]/g)].map((m) => m[0]);
  ok(`no dash characters in ${name}`, bad.length === 0, `${bad.length} found (U+${bad[0] ? bad[0].codePointAt(0).toString(16).toUpperCase() : ''})`);
}

// ── the page script has to parse ──────────────────────────────
// a syntax error here silently kills every interaction on the page,
// so it is worth a real parse instead of trusting a read-through
try {
  execFileSync(process.execPath, ['--check', new URL('./app.js', import.meta.url).pathname], { stdio: 'pipe' });
} catch (error) {
  ok('app.js parses', false, String(error.stderr || error.message).split('\n').slice(0, 3).join(' ').trim());
}
ok('no duplicate top level declarations', new Set([...js.matchAll(/^const (\w+)/gm)].map((m) => m[1])).size
  === [...js.matchAll(/^const (\w+)/gm)].length);

if (fail.length) {
  console.error(`FAIL (${fail.length})`);
  fail.forEach((f) => console.error('  ✗', f));
  process.exit(1);
}
console.log(`PASS, 38 rules, ${Object.keys(byCategory).length} categories, html/css/js wired`);
