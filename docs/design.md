---
# ==============================================================================
# ContractIQ Design System
# ==============================================================================
meta:
  name: "ContractIQ Design System"
  version: "2.0.0"
  updated: "2026-10-04"
  units: "px (unless stated)"
  character: >-
    Quiet, airy, editorial. A framed 1120px white sheet on a light-grey page.
    One loud visual moment (the blue radial burst section). Everything else is
    restrained: neutral greys, a single accent blue, hairline borders, no
    decorative shadows. Hierarchy comes from type weight and scale, not colour.
  dark-mode: "Full dark-mode support via CSS custom properties and data-theme attribute."

# ------------------------------------------------------------------------------
# 1. CSS CUSTOM PROPERTIES (single source of truth)
# ------------------------------------------------------------------------------
tokens:
  light:
    --bg:           "#f4f4f5"   # Page background (grey)
    --sheet:        "#ffffff"   # Content sheet (max 1120px, centred, side borders)
    --fg:           "#0c0c0e"   # Primary text / headings
    --muted:        "#6b6d76"   # Secondary text, labels, captions
    --line:         "#e6e7ea"   # Borders, dividers, rules
    --accent:       "#2f80d1"   # Primary blue — buttons, icons, links, highlights
    --accent-soft:  "#e8f1fb"   # Soft blue fill — pills, icon bg, hover
    --ink:          "#000000"   # Dark button fill
    --on-ink:       "#ffffff"   # Text on dark buttons
    --risk:         "#d12f3a"   # Risk / danger highlight text
    --chip:         "#eef0f3"   # Ghost button / chip fill
    --shadow:       "0 10px 40px rgba(20,30,60,0.10)"

  dark:
    --bg:           "#0a0a0c"
    --sheet:        "#111114"
    --fg:           "#f2f2f4"
    --muted:        "#9a9ca6"
    --line:         "#26272c"
    --accent:       "#5aa2ee"
    --accent-soft:  "#16253a"
    --ink:          "#f2f2f4"
    --on-ink:       "#0c0c0e"
    --risk:         "#ff6a73"
    --chip:         "#1c1d22"
    --shadow:       "0 10px 40px rgba(0,0,0,0.50)"

  switching: >-
    Dark mode applies via @media (prefers-color-scheme:dark) on :root:not([data-theme="light"])
    and via :root[data-theme="dark"] for the manual toggle. Never hardcode hex values in
    components — always reference CSS custom properties.

# ------------------------------------------------------------------------------
# 2. TYPOGRAPHY
# ------------------------------------------------------------------------------
typography:
  families:
    sans:  "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif"
    mono:  "'JetBrains Mono', ui-monospace, Menlo, monospace"
  base:
    size:        15
    line-height: 1.55
    weight:      400
    color:       var(--fg)

  scale:
    h1:  { size: "clamp(34px, 5.2vw, 52px)", line-height: 1.06, weight: 500, tracking: "-0.025em" }
    h2:  { size: "clamp(30px, 4.2vw, 42px)", line-height: 1.10, weight: 500, tracking: "-0.025em" }
    h3:  { size: 16px,  line-height: 1.40, weight: 500, tracking: "-0.01em" }
    h4:  { size: 12px,  line-height: 1.30, weight: 500 }   # Panel sub-headers
    body:      { size: 15px, weight: 400, line-height: 1.55 }
    body-sm:   { size: 13.5px, weight: 400, line-height: 1.55, color: var(--muted) }
    body-xs:   { size: 12.5px, weight: 400, line-height: 1.55, color: var(--muted) }
    label:     { size: 13px, weight: 500 }
    overline:  { size: 11px, weight: 400, letter-spacing: "0.01em" }
    mono-body: { family: mono, size: 11px, weight: 400 }

  rules:
    - "h1 and h2 use letter-spacing -0.025em; h3 uses -0.01em."
    - "text-wrap: balance on all headings."
    - "font-smoothing: antialiased on body."
    - "Numeric cells use font-variant-numeric: tabular-nums."
    - "Minimum UI text size: 11px (overlines, badges). Prefer 12px+."

# ------------------------------------------------------------------------------
# 3. COLOR USAGE
# ------------------------------------------------------------------------------
color:
  primary:
    accent:       { value: "var(--accent)", usage: "Buttons (primary fill border), icon fill, link text, stat numbers, active indicators" }
    accent-soft:  { value: "var(--accent-soft)", usage: "Pill badge bg, icon container bg, button hover fill (outline variants)" }

  text:
    fg:    { value: "var(--fg)",    usage: "Headings, primary body text, button labels" }
    muted: { value: "var(--muted)", usage: "Secondary text, captions, placeholder, nav links at rest" }
    risk:  { value: "var(--risk)",  usage: "High-risk clause labels only — never decorative" }

  surface:
    bg:    { value: "var(--bg)",    usage: "Page background — outer grey" }
    sheet: { value: "var(--sheet)", usage: "Main content sheet, cards, panels, nav, modals" }
    chip:  { value: "var(--chip)",  usage: "Ghost buttons, code chips, subdued tags" }

  border:
    line:  { value: "var(--line)",  usage: "All borders: card edges, table dividers, nav underline, input borders" }

  actions:
    ink:     { value: "var(--ink)",     usage: "Dark/primary button background" }
    on-ink:  { value: "var(--on-ink)",  usage: "Text on dark buttons" }

  burst-section:
    note: "The radial burst section uses a hardcoded gradient (#bfe0ff → #5a9cf5 → #1f56d6 → #0a2a9a → #071a63). This is the one exception to the token rule."

  rules:
    - "var(--accent) is the only coloured action token. Never add a second brand hue."
    - "var(--risk) is semantic — danger only, never used for decoration."
    - "Never hardcode hex in components. Always var(--token)."

# ------------------------------------------------------------------------------
# 4. SPACING (4px grid)
# ------------------------------------------------------------------------------
spacing:
  base: 4
  scale: [4, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 40, 48, 56, 60, 64, 72, 80, 88, 92]
  component-tokens:
    btn-height:        38
    btn-padding:       "0 18"
    btn-sm-height:     30
    btn-sm-padding:    "0 14"
    nav-height:        56
    topbar-padding:    "9px 16"
    sheet-max-width:   1120
    section-padding-v: 88    # desktop section padding-block
    section-padding-v-mobile: 60
    gutter:            "clamp(16px, 5vw, 48px)"   # wrap padding-inline

# ------------------------------------------------------------------------------
# 5. LAYOUT
# ------------------------------------------------------------------------------
layout:
  sheet:
    max-width:  1120px
    centered:   true
    background: var(--sheet)
    border:     "1px solid var(--line) on inline edges"
    overflow:   hidden

  page-background: var(--bg)
  page-padding-inline: 16px
  page-padding-block:  "0 24px"

  grid-columns:
    hero:      "1.05fr 1fr"
    features:  "1fr 1fr"
    stats:     "1fr 1fr"
    mini:      "repeat(3, 1fr)"
    app-burst: "1fr 1.15fr"
    footer:    "1.4fr repeat(3, 1fr)"

  sticky-nav:
    position:       sticky
    backdrop:       "color-mix(in srgb, var(--sheet) 88%, transparent)"
    backdrop-filter: "blur(10px)"
    z-index:        20

  responsive-breakpoint: 820px
  mobile-changes:
    - "links in nav: hidden"
    - "hero, feat, stats, app, mini grids: 1 column"
    - "section padding-block: 60px"
    - "footer: 2 columns"

# ------------------------------------------------------------------------------
# 6. BORDERS & ELEVATION
# ------------------------------------------------------------------------------
border:
  width:  1
  color:  var(--line)
  radius:
    xs:     6
    sm:     8
    md:     10
    lg:     12
    pill:   999
    circle: "50%"

elevation:
  card:    "var(--shadow)"
  panel:   "0 16px 40px rgba(0,20,80,0.35)"
  burst:   "0 30px 80px rgba(0,10,60,0.45)"
  nav:     none   # nav uses backdrop-blur, not shadow
  rule: >-
    Shadows are used only on floating panels (tip cards, review panel, burst app card).
    Regular cards and borders use var(--line) only. Do not add shadows to table rows or inputs.

# ------------------------------------------------------------------------------
# 7. COMPONENTS
# ------------------------------------------------------------------------------
components:

  # ── Buttons ──────────────────────────────────────────────────────────────────
  button:
    base:
      display:      inline-flex
      align-items:  center
      gap:          8
      height:       38
      padding:      "0 18"
      border-radius: 999   # pill
      font-size:    13
      font-weight:  500
      border:       "1px solid transparent"
      transition:   "transform 0.15s, background 0.15s"
      hover:        "translateY(-1px)"

    dark:
      background:  var(--ink)
      color:       var(--on-ink)
      usage:       "Primary CTA — one per section"

    ghost:
      background:  var(--chip)
      color:       var(--fg)
      usage:       "Secondary CTA, alongside a dark button"

    light:
      background:  "#ffffff"
      color:       "#0c0c0e"
      border:      "1px solid var(--line)"
      usage:       "On dark backgrounds (burst section)"

    sm:
      height:  30
      padding: "0 14"
      font-size: 12

  # ── Navigation ───────────────────────────────────────────────────────────────
  nav:
    height:       56
    border-bottom: "1px solid var(--line)"
    logo: { font-size: 14, font-weight: 600, icon: "20px star SVG in var(--accent)" }
    links: { font-size: 12.5, color: var(--muted), hover: var(--fg), gap: 22 }
    theme-toggle: { size: "30×30", shape: circle, border: "1px solid var(--line)" }

  # ── Pills / Badges ────────────────────────────────────────────────────────────
  pill:
    font-size:    11
    padding:      "4px 10px"
    border-radius: 6
    background:   var(--accent-soft)
    color:        var(--accent)
    border:       "1px solid color-mix(in srgb, var(--accent) 30%, transparent)"

  # ── Icon container ────────────────────────────────────────────────────────────
  ico:
    size:         44
    border:       "1px solid var(--line)"
    border-radius: 8
    background:   var(--accent-soft)
    color:        var(--accent)
    icon-size:    20

  # ── Feature / content cards ───────────────────────────────────────────────────
  feat-cell:
    border:   "1px solid var(--line)"
    padding:  24
    vis-height: 230   # visual cells (mock UI)

  # ── Review panel (blue burst card) ───────────────────────────────────────────
  review-panel:
    background:   "rgba(255,255,255,0.96)"
    color:        "#0c0c0e"
    border-radius: 6
    shadow:       "0 16px 40px rgba(0,20,80,0.35)"
    padding:      "14px 16px"
    font-size:    10.5

  # ── Stat numbers ─────────────────────────────────────────────────────────────
  stat:
    number: { font-size: 30, color: var(--accent), letter-spacing: "-0.03em", numeric: tabular-nums }
    label:  { font-size: 13, font-weight: 500 }
    caption: { font-size: 11.5, color: var(--muted) }
    row-padding: "30px 28px"

  # ── Chat mock (burst section) ─────────────────────────────────────────────────
  chat-mock:
    font-size:    10.5
    bubble:       { background: "#f1f3f6", border-radius: 8, padding: "7px 10px" }
    table-header: { background: "#fafbfc", color: "#8a8d97" }
    compose:      { border: "1px solid #e1e3e8", border-radius: 6 }

  # ── Testimonial cards ────────────────────────────────────────────────────────
  testimonial-card:
    aspect-ratio:   "16/10"
    border-radius:  10
    inactive:       { opacity: 0.45, filter: "grayscale(1)" }
    active:         { opacity: 1, filter: none }
    overlay:        "linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.65))"
    quote:          { font-size: 14, font-weight: 500, line-height: 1.4 }
    cite:           { font-size: 11, opacity: 0.85 }
    transition:     "opacity 0.4s, filter 0.4s"

  # ── FAQ ──────────────────────────────────────────────────────────────────────
  faq:
    element:      "<details>/<summary> — no JavaScript"
    border:       "1px solid var(--line)"
    border-radius: 8
    padding:      "0 18px"
    summary-font: { size: 13, weight: 500 }
    answer-font:  { size: 12.5, color: var(--muted) }
    chevron:      "CSS ::after pseudo-element, rotates 45→-135deg on open"
    gap-between:  8

  # ── Footer ───────────────────────────────────────────────────────────────────
  footer:
    watermark: { font-size: "clamp(60px, 17vw, 190px)", weight: 600, color: "color-mix(in srgb, var(--fg) 5%, transparent)", tracking: "-0.06em" }
    columns:   "1.4fr repeat(3, 1fr)"
    link-font: { size: 12, color: var(--muted) }
    heading:   { size: 12, weight: 500 }

# ------------------------------------------------------------------------------
# 8. SPECIAL SECTION: BURST
# ------------------------------------------------------------------------------
burst-section:
  background: >-
    repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.18) 1.2deg, rgba(255,255,255,0) 3.4deg),
    radial-gradient(circle at 50% 50%, #bfe0ff 0%, #5a9cf5 22%, #1f56d6 50%, #0a2a9a 80%, #071a63 100%)
  dot-overlay: "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1.4px) — 4×4px grid, overlay blend"
  padding:     "92px clamp(16px, 5vw, 60px)"
  app-card:
    max-width:     760
    border-radius: 12
    shadow:        "0 30px 80px rgba(0,10,60,0.45)"
    grid:          "1fr 1.15fr"

# ------------------------------------------------------------------------------
# 9. RULES
# ------------------------------------------------------------------------------
rules:
  do:
    - "Always use CSS custom properties — never hardcode hex values in components."
    - "Wrap page content in the 1120px .sheet with side borders."
    - "Use .wrap (clamp gutter) for all horizontal padding."
    - "Buttons are pill-shaped (border-radius: 999px)."
    - "h1/h2 text-wrap: balance."
    - "The sticky nav uses backdrop-filter blur — never a solid background."
    - "Dark mode switches via data-theme attribute AND prefers-color-scheme media query."
    - "The blue burst is the only section with a gradient background."
    - "Use <details>/<summary> for the FAQ — no JavaScript accordion."
  dont:
    - "Do not add shadows to nav, table rows, or regular card borders."
    - "Do not use more than one dark (ink) button per section."
    - "Do not add new brand colours beyond var(--accent)."
    - "Do not use var(--risk) decoratively — only for flagged risk content."
    - "Do not break dark mode — test both themes when adding new sections."
    - "Do not hardcode hex values in JSX inline styles — use CSS custom properties."

# ------------------------------------------------------------------------------
# CHANGELOG
# ------------------------------------------------------------------------------
changelog:
  "2.0.0":
    - "Complete redesign. Replaced flat data-dense system with quiet editorial aesthetic."
    - "New CSS custom property token system with full dark-mode support."
    - "Pill buttons (border-radius 999px) replace rectangular buttons."
    - "1120px framed sheet layout replaces full-width layout."
    - "Added Inter + JetBrains Mono font pairing."
    - "Burst section codified as the one loud visual moment."
    - "FAQ changed from JS accordion to native <details>/<summary>."
    - "Testimonial carousel added with carousel animation spec."
    - "Sticky nav with backdrop-filter blur codified."
    - "Footer large watermark text pattern added."
  "1.2.2":
    - "Final version of the allNeurons design system (data-dense, flat, #FAFAFA page)."
---

# ContractIQ Design System v2.0

All tokens and component specs are in the YAML front matter above. Reference them by path, for example `tokens.light.--accent`, `components.button.dark`, `burst-section.background`.

## Quick reference — CSS custom properties

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--bg` | `#f4f4f5` | `#0a0a0c` | Page background |
| `--sheet` | `#ffffff` | `#111114` | Content sheet |
| `--fg` | `#0c0c0e` | `#f2f2f4` | Primary text |
| `--muted` | `#6b6d76` | `#9a9ca6` | Secondary text |
| `--line` | `#e6e7ea` | `#26272c` | Borders |
| `--accent` | `#2f80d1` | `#5aa2ee` | Brand blue |
| `--accent-soft` | `#e8f1fb` | `#16253a` | Soft blue bg |
| `--ink` | `#000000` | `#f2f2f4` | Dark button |
| `--on-ink` | `#ffffff` | `#0c0c0e` | Text on dark btn |
| `--risk` | `#d12f3a` | `#ff6a73` | Risk / danger |
| `--chip` | `#eef0f3` | `#1c1d22` | Ghost btn fill |

## Button variants

```
.btn.dark   → background: var(--ink); color: var(--on-ink)   [primary CTA]
.btn.ghost  → background: var(--chip); color: var(--fg)       [secondary CTA]
.btn.light  → background: #fff; border: 1px solid var(--line) [on dark bg]
.btn.sm     → height: 30px; padding: 0 14px; font-size: 12px
```