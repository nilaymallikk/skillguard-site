// SkillGuard landing page: copy buttons, reveal-on-scroll, rule filter.
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── copy buttons ─────────────────────────────────────────────
document.querySelectorAll('[data-copy]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const src = document.querySelector(btn.dataset.copy);
    if (!src) return;
    try {
      await navigator.clipboard.writeText(src.innerText);
      btn.dataset.copied = 'yes';
      btn.textContent = 'copied';
      setTimeout(() => { delete btn.dataset.copied; btn.textContent = 'copy'; }, 1600);
    } catch {
      // clipboard is unavailable on non-secure origins: select the text so ctrl/cmd+C works
      const range = document.createRange();
      range.selectNodeContents(src);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      btn.textContent = 'press ctrl/cmd + C';
      setTimeout(() => { btn.textContent = 'copy'; }, 2600);
    }
  });
});

// ── reveal on scroll, plus the two bits of motion inside the verdict card ──
// the score counts up once, the way an instrument settles
const scoreEl = document.querySelector('.verdict__num');
function countUp() {
  if (!scoreEl || reduceMotion) return;
  const target = parseInt(scoreEl.textContent.trim(), 10);
  if (!Number.isFinite(target)) return;
  const started = performance.now();
  const tick = (now) => {
    const progress = Math.min((now - started) / 620, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    scoreEl.textContent = String(Math.round(target * eased));
    if (progress < 1) requestAnimationFrame(tick);
  };
  scoreEl.textContent = '0';
  requestAnimationFrame(tick);
}
const revealTargets = [
  '.verdict',
  '.shead',
  '.flow li',
  '.analyzers',
  '.table-scroll',
  '.filter',
  '.panel',
  '.cmd',
  '.closer',
  '.foot__in > *',
];

const targets = [...document.querySelectorAll(revealTargets.join(','))];
if (reduceMotion || !('IntersectionObserver' in window)) {
  targets.forEach((el) => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      // stagger siblings so a row of cards does not pop as one block
      el.style.transitionDelay = `${Math.min([...el.parentElement.children].indexOf(el), 6) * 55}ms`;
      el.classList.add('is-in');
      if (el.classList.contains('verdict')) countUp();
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  targets.forEach((el) => { el.classList.add('reveal'); io.observe(el); });
}

// ── rule filter ──────────────────────────────────────────────
const rows = [...document.querySelectorAll('#rules-body tr')];
const counter = document.getElementById('rules-visible');
const buttons = [...document.querySelectorAll('.fbtn')];

const severityCount = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
rows.forEach((row) => { severityCount[row.dataset.sev] += 1; });

function applyFilter(sev) {
  let shown = 0;
  rows.forEach((row) => {
    const match = sev === 'all' || row.dataset.sev === sev;
    row.hidden = !match;
    if (match) shown += 1;
  });
  counter.textContent = `Showing ${shown} of ${rows.length}`;
}

buttons.forEach((btn) => {
  btn.addEventListener('click', () => {
    buttons.forEach((b) => b.classList.toggle('is-on', b === btn));
    applyFilter(btn.dataset.filter);
  });
});

document.getElementById('yr').textContent = `© ${new Date().getFullYear()} NilLab`;

// the nav picks up a shadow once the page moves
const nav = document.querySelector('.nav');
const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
onScroll();
addEventListener('scroll', onScroll, { passive: true });
