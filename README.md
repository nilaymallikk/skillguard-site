# SkillGuard: landing page

A static landing page for [NilLab-agi/SkillGuard](https://github.com/NilLab-agi/SkillGuard): a
static security scanner for agent skills, MCP servers and agent extensions.

**Live: <https://skillguardscan.vercel.app>**

No build step, no framework, no dependencies. Open `index.html` directly or serve the folder from
any static host.

```
index.html            the page (all copy, all 38 rules, all code samples)
styles.css            design system + responsive rules
app.js                copy buttons, reveal on scroll, severity filter
check.mjs             structural self-check (node check.mjs)
assets/               logo derivatives used by the page
SkillGuardLogo.png    the source logo, kept in the repo, not deployed
```

## Preview

```bash
open index.html                      # or: xdg-open index.html
python3 -m http.server 8080          # then browse to http://localhost:8080
```

## Verify

```bash
node check.mjs
```

Asserts the facts that came from the repo (38 rules, 10 categories, severity mix, unique ids), that
the flow diagram has one node name per step, that every anchor and `data-copy` target resolves, that
every class used in the HTML has a CSS rule and every CSS class has markup behind it, that `app.js`
parses without duplicate top level declarations, that the logo, the GitHub mark and the
`nilaymallik.dev` credit are present, that the copy cut on request stays cut, and that no dash
character (U+2013 or U+2014) appears in the HTML, CSS or JS.

## Design

Cream paper and black ink, both taken from the logo: paper `#fdf8f1`, ink `#100e0c`, banded sections
`#f7f0e4`. The only colour on the page is a severity verdict
(CRITICAL `#9c1c1c`, HIGH `#8a4a10`, MEDIUM `#75570a`, LOW `#1b5b34`), lit to coral inside the black
panel. Links are ink with a drawn underline rather than blue, so the page holds to two colours.

One typeface throughout: **JetBrains Mono**, at three weights. Hierarchy comes from size and weight
rather than from mixing families, which is why the headings are smaller than a serif display would
need to be and the body sits at 16px with a 1.75 line height.

The two heavy blocks are the dark ones: the scan verdict card in the hero, with a ten segment gauge
instead of a progress bar, and the code blocks. Section 04 is a full black band, which is where the
CI gate lives.

`SkillGuardLogo.png` is the original upload (1254x1254, 826 KB, a cream horse on a black plate). Two
kinds of derivative ship:

- `assets/logo-mark-*.png` are transparent, with the plate keyed out and the horse recoloured to ink,
  so the mark sits directly on the cream paper in the nav and the footer.
- `assets/logo-96.png` and `logo-256.png` keep the solid disc, because a favicon and an `og:image`
  need to read on a light or a dark background.

The original is versioned in git but excluded from the deployment, so a browser never pulls 826 KB.

Colour pairs were checked against WCAG AA: 21 combinations of text and background clear 4.5:1 (3:1
for the large score figure), including the coloured tags on their tints, the faint text on black, and
the fine print on all three cream tones.

Motion is deliberately small: the gauge fills left to right when the card lands, the score counts up
once, sections fade up on scroll, the nav picks up a shadow after 8px of scroll, and buttons lift by
1px on hover. Everything is off under `prefers-reduced-motion` and in print.

## Page structure

Hero (install command and the verdict card) → 01 How it reads (the seven node flow) → 02 Coverage
(all 38 rules, filterable) → 03 The score (points, the multiplier, a worked example, the bands) →
04 Ship it (the CI gate, on black).

The nav centres `Rules`, `Score`, `Ship it` on the page and groups the GitHub button and the horse
mark on the right, with no wordmark. The hero carries one button, `See what gets caught`, because the
nav already holds the GitHub link. The footer is the mark, one line of description, `Built by Nilay`
linked to nilaymallik.dev, and the copyright.

## Where the content came from

Facts on the page are taken from the repo at the time of writing:

| Page section | Source |
| --- | --- |
| Rules, categories, severities | `docs/RULES.md` |
| Scoring points, x1.3 multiplier, bands, exit codes | `src/skillguard/scoring.py`, `src/skillguard/cli.py` |
| Flow nodes and the 12 analyzers | `README.md`, `src/skillguard/nodes/` |
| CI snippet | `docs/examples/scan-skill.yml` (abridged on the page) |

The page deliberately does not transcribe the repo: no CLI flag reference, no Docker section, no
dependency list, no input-limit table, no baseline or `.env` samples, no full workflow YAML. What
stays is what a README cannot show well: the scan output, the full rule coverage list, and the
arithmetic behind the score.

Two things to check before publishing:

- **License.** `LICENSE` is MIT, but `pyproject.toml` and `README.md` say Apache-2.0. The page does
  not name a license.
- **The verdict card is illustrative.** No scan output is shipped in the repo as text, so the card is
  a mock built from `src/skillguard/reporters/terminal.py` and labelled as illustrative on the page.
  The worked example in section 03 follows the real scoring code: 50 + 25 = 75, x1.3 = 97 (the code
  truncates the float), band 81 to 100.

## Deploy

Deployed on Vercel as the project `skillguardscan` (personal scope `nilaymallikk-gmailcoms-projects`).

```bash
vercel deploy --prod          # project is already linked in .vercel/project.json
```

`skillguard.vercel.app` and `skillguardai.vercel.app` were both already taken by other projects, which
is why the production URL is `skillguardscan.vercel.app`. To roll back, promote an earlier deployment:

```bash
vercel ls skillguardscan      # find a previous deployment URL
vercel promote <deployment-url>
```

`.vercelignore` keeps `check.mjs`, `README.md`, `.env*`, `.gitignore`, `.vercel` and the full size
`SkillGuardLogo.png` out of the deployment, so the token that `vercel link` writes to `.env.local` is
never uploaded.

The folder is plain static output, so it can also be dropped on GitHub Pages, Cloudflare Pages,
Netlify, S3 or nginx with no changes.
