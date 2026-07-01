# synon.ai — Design Spec (Engineering Dossier)

> Direction locked 2026-07-01. One sentence: **a precise, light "engineering dossier" —
> technical-paper canvas with a hairline blueprint grid, ink-black structural type, monospace
> metadata, and a single restrained vermilion annotation accent.** Reads like a serious
> engineering-consultancy technical report, not a SaaS landing page.

CSS strategy: **Vanilla CSS only** (one `style.css`, matches existing stack).

## 1. Theme & atmosphere
Light. Enterprise-B2B buyers (insurance / energy / retail conglomerate executives) reward
legibility and institutional restraint over neon. This is the deliberate inverse of the previous
cyan-on-dark AI-slop build. Dense but calm; whitespace carries hierarchy; the accent is used like
a red pen on a blueprint — sparingly, for emphasis and annotation only.

## 2. Palette (roles)
| Token | Value | Role |
|---|---|---|
| `--paper` | `#FAF9F6` | page canvas (warm technical paper) |
| `--paper-2` | `#F1EFEA` | panel / inset surface step |
| `--ink` | `#16181D` | primary text + structural rules |
| `--ink-2` | `#3B3F47` | secondary headings |
| `--muted` | `#6B7079` | supporting text |
| `--line` | `rgba(22,24,29,0.12)` | hairline dividers |
| `--grid` | `rgba(22,24,29,0.05)` | blueprint background grid |
| `--accent` | `#C6431C` | signal vermilion — annotation / emphasis only |
| `--accent-soft` | `rgba(198,67,28,0.09)` | accent wash |

Single dominant neutral (paper/ink) + one sharp accent. No gradients-as-decoration, no
`background-clip:text`, no glassmorphism, no cyan.

## 3. Typography
- **Display / headings:** `Archivo` (Omnibus-Type grotesque — engineered, mechanical) for Latin;
  CJK falls to `PingFang SC / Microsoft YaHei`. Weights 600–800. Tracking −0.022em ≥32px, −0.012em mid.
- **Mono / metadata / metrics:** `JetBrains Mono` — section numbers, labels, all figures (with
  `tabular-nums`). This is the register that sells "engineering dossier".
- **Body:** system sans + `PingFang SC`. `text-wrap: pretty` on paragraphs, `balance` on headings.
- Rejected reflex fonts: Inter, Outfit, Space Grotesk/Mono, IBM Plex.

## 4. Signature (the one memorable thing)
**Section-numbered technical dossier.** Every section carries a mono spec label
(`§02 · ECHO-DELTA MODEL`), a hairline blueprint grid sits behind the hero, metrics render in mono
with tabular figures, and the vermilion accent appears only as a short annotation tick / underline.

## 5. Components
- **Radii:** sharp technical scale `{2px inputs/tags, 4px panels}`. No pill cards.
- **Depth:** background-step + hairline rules, not drop shadows. Panels sit on `--paper-2`.
- **Nav:** left wordmark, right links; real mobile menu (hamburger → panel), not wrapped flex.
- **Buttons:** square 2px; primary = solid ink, accent tick; secondary = hairline outline.
  `active` press `scale(0.97)`; hover guarded by `@media(hover:hover)`.
- **Charts:** horizontal before→after comparison bars with a hairline baseline and a mono delta
  readout; legacy in muted ink, result in accent. Data-forward, no glow.

## 6. Motion
Staggered reveal (opacity + translateY 12px, ease-out-quint), accent ticks draw in via `scaleX`.
`transform`/`opacity` only; honors `prefers-reduced-motion`.

## 7. Do / Don't
- DO label everything like a spec sheet; DO keep figures monospaced + tabular.
- DO let the grid + paper carry the brand; the first screen must be unmistakably an engineering firm.
- DON'T reintroduce gradient text, cyan, glow blobs, or rounded SaaS cards.
- DON'T use the accent as a fill on large areas — it is a pen, not a paint bucket.
