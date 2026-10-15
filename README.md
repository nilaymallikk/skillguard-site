# SkillGuard, landing page

A static landing page for [NilLab-agi/SkillGuard](https://github.com/NilLab-agi/SkillGuard):
a static security scanner for AI-agent skills, MCP servers and agent extensions.

**Live: <https://skillguardscan.vercel.app>**

No build step, no framework, no dependencies. Three files, opened directly or served from any
static host.

```
index.html    the page (all copy, all 38 rules, all code samples)
styles.css    design system + responsive rules
app.js        copy buttons, reveal-on-scroll, rule severity filter
check.mjs     structural self-check (node check.mjs)
```

## Preview

```bash
open index.html                      # or: xdg-open index.html
python3 -m http.server 8080          # then browse to http://localhost:8080
```

## Deploy

Deployed on Vercel as the project `skillguardscan` (personal scope `nilaymallikk-gmailcoms-projects`).

```bash
vercel deploy --prod          # project is already linked in .vercel/project.json
```

`skillguard.vercel.app` and `skillguardai.vercel.app` were both already taken by other projects,
so the production URL is `skillguardscan.vercel.app`, it mirrors the `skillguard scan` command.
A shorter name needs a custom domain (e.g. `skillguard.dev`), which is a DNS + purchase step on top
of this deployment.

`.vercelignore` keeps `check.mjs`, `README.md`, `.env*`, `.gitignore` and `.vercel` out of the
public deployment, so the OIDC token that `vercel link` writes to `.env.local` is never uploaded.
Both `.env.local` and `.vercel/` are gitignored locally.

The folder is also plain static output, so it can be dropped on GitHub Pages, Cloudflare Pages,
Netlify, S3 or nginx with no changes.

Copy buttons use the Clipboard API, which needs a secure origin (`https://` or `localhost`), on `file://` they fall back to selecting the text so `ctrl/cmd + C` works.

## Verify

```bash
node check.mjs
```

Asserts the facts that came from the repo (38 rules, 10 categories, severity mix, unique ids),
that every anchor/`data-copy` target and `getElementById` in `app.js` resolves, that html tags are
balanced, and that the CSS tokens and reduced-motion rules are present.

## Where the content came from

Facts on the page are taken from the repo at the time of writing:

| Page section | Source |
| --- | --- |
| Rules, categories, severities | `docs/RULES.md` |
| Scoring points, ×1.3 multiplier, bands, exit codes | `src/skillguard/scoring.py`, `src/skillguard/cli.py` |
| Pipeline nodes and the 12 analyzers | `README.md`, `src/skillguard/nodes/` |
| CI snippet | `docs/examples/scan-skill.yml` (abridged on the page) |

The page deliberately does not transcribe the repo: no CLI flag reference, no Docker section, no
dependency or toolchain list, no input-limit table, no baseline or `.env` samples, no full workflow
YAML. That material belongs in the README, which the page links to once. What stays is what a README
can't show well, the scan output, the 38-rule coverage list, and the arithmetic behind the score.

Two things to check before publishing:

- **License.** `LICENSE` is MIT, but `pyproject.toml` and `README.md` say Apache-2.0. The page
  links to `LICENSE` without naming a license, so it stays correct either way.
- **The hero output is illustrative.** No real scan output is shipped in the repo as text, so the
  verdict card is a mock built from `src/skillguard/reporters/terminal.py` and labelled
  "Illustrative output" on the page.

## Page structure

Hero (install command + illustrative verdict card) → 01 How it reads → 02 Coverage (all 38 rules) →
03 The score → 04 Ship it (CI gate). The nav holds only `Rules`, `Score` and `Ship it`; the footer is
a single credit line. No trust/limits section and no footer link columns, both removed by request.

## Design notes

White paper, blue text, dark navy panels. Body copy is navy (`#0a2540` / `#1e3a5f`), the accent is
blue (`#1a56db`) on links, eyebrows, rule ids and numbers, and the two heavy blocks, the scan
verdict card and the code blocks, are dark navy (`#0a1b2e`) with light text. Sections alternate
white and a very light blue band (`#f4f7fc`). Severity keeps its own four colours
(CRITICAL `#b91c1c`, HIGH `#a34a08`, MEDIUM `#8a6100`, LOW `#15803d`), lightened only inside the
dark verdict card.

Type is IBM Plex Sans + IBM Plex Mono from Google Fonts, with system fallbacks if the CDN is
unreachable. Motion is limited to one reveal-on-scroll pass and one meter fill, and it is disabled
under `prefers-reduced-motion` and in print, so content is never hidden from print or non-scrolling
viewers.

Two rules are enforced by `check.mjs` rather than by discipline:

- **No dash characters.** No em dashes or en dashes in `index.html`, `styles.css` or `app.js`.
  `21 to 50` rather than a dash range.
- **Light-theme tokens stay put.** The check asserts `--paper: #fff` and the dark panel colour, and
  that both dark blocks declare their own text colour (otherwise a light theme leaves dark text on
  dark navy).

Colour pairs were checked against WCAG AA: 22 combinations of text and background all clear 4.5:1
(large text 3:1), including the coloured severity pills on their tints, the blue link colour on both
white and the band, and the faint text inside the dark panels.
