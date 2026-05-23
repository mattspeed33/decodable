---
name: Decodable
description: A literacy-tutoring workspace for tutors. The Tutor's Notebook in software form.
colors:
  ink: "#1a1a1a"
  ink-2: "#4a4a4a"
  ink-3: "#9a9a9a"
  ink-4: "#d4d4cf"
  paper-bg: "#f5f3ef"
  paper-surface: "#ffffff"
  paper-surface-2: "#faf9f6"
  paper-surface-3: "#f0eee9"
  rule-line: "#e8e6e0"
  rule-line-strong: "#d4d4cf"
  status-green: "#16a34a"
  status-green-tint: "#dcfce7"
  status-amber: "#d97706"
  status-amber-tint: "#fef3c7"
  status-red: "#dc2626"
  status-red-tint: "#fee2e2"
  tag-blue: "#2563eb"
  tag-blue-tint: "#dbeafe"
  tag-purple: "#7c3aed"
  tag-purple-tint: "#ede9fe"
  tag-teal: "#0d9488"
  tag-teal-tint: "#ccfbf1"
typography:
  display:
    fontFamily: "Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.5px"
  headline:
    fontFamily: "Geist, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "normal"
  title:
    fontFamily: "Geist, -apple-system, sans-serif"
    fontSize: "13.5px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "normal"
  body:
    fontFamily: "Geist, -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "normal"
  label:
    fontFamily: "Geist, -apple-system, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.6px"
  mono:
    fontFamily: "'Geist Mono', ui-monospace, SFMono-Regular, monospace"
    fontSize: "12.5px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "6px"
  lg: "10px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "28px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-surface}"
    rounded: "{rounded.md}"
    padding: "6px 14px"
  button-primary-hover:
    backgroundColor: "#000000"
  button-secondary:
    backgroundColor: "{colors.paper-surface}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  button-secondary-hover:
    backgroundColor: "{colors.paper-surface-3}"
  card:
    backgroundColor: "{colors.paper-surface}"
    rounded: "{rounded.lg}"
    padding: "20px"
  list-table:
    backgroundColor: "{colors.paper-surface}"
    rounded: "{rounded.lg}"
  list-row:
    backgroundColor: "{colors.paper-surface}"
    padding: "10px 14px"
  list-row-hover:
    backgroundColor: "{colors.paper-surface-2}"
  highlight-card:
    backgroundColor: "{colors.paper-surface}"
    rounded: "{rounded.lg}"
    padding: "12px 14px"
  tag:
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  status-dot:
    rounded: "{rounded.pill}"
    size: "7px"
---

# Design System: Decodable

## 1. Overview

**Creative North Star: "The Tutor's Notebook"**

Decodable is software that feels like a tutor's actual notebook: warm paper, ink, ruled lines, and the same patient density a working tutor builds up across a year of sessions. Every screen is a page you'd be proud to leave open on a desk during a parent meeting. The aesthetic prioritizes calm over excitement; the user is a teacher doing careful work for a child, not a power user grinding through tickets.

Density is high but never crowded. Information lives in ruled tables, eyebrow labels, and short titled paragraphs rather than tiles and metric heroes. Color is restrained and warm. Type carries most of the hierarchy. Surfaces are flat: depth comes from ink weight, rule lines, and rhythm, not shadows.

This system explicitly rejects four families: kid-coded edtech (lime green, cartoon mascots, gamification), SaaS dashboard cliché (purple-to-blue gradients, hero metric tiles, identical card grids), clinical software (sterile white + teal, government-form rigor), and creator-tool maximalism (dark mode, neon, dense panels). Decodable is for an adult professional, in daylight, with kindness in the voice.

**Key Characteristics:**
- Warm off-white paper (`#f5f3ef`) is the dominant surface, never pure white as the background.
- Ink-on-paper contrast (`#1a1a1a` on `#ffffff` cards) carries primary affordances.
- Status color appears only when it earns it: a tag, a dot, a banner. Not as decoration.
- Geist (sans) carries body and UI; Geist Mono carries data, IDs, and dates.
- Flat by default. No shadows on rest state. Hover lifts via background tint, not elevation.

## 2. Colors

The palette is one strong ink, a warm-cream paper ladder, and a small set of role-bound semantic tags. Hex is the canonical format because the working CSS uses it; perceptual lightness was chosen to keep neutrals warm without drifting yellow.

### Primary
- **Ink** (`#1a1a1a`): the workhorse. Primary text, primary buttons, focused borders, sidebar active state. Not pure black; tuned just warm enough to sit next to paper without humming.

### Neutral (the Paper Ladder)
- **Paper Background** (`#f5f3ef`): the page itself. Visible behind every screen. Warm cream that reads as paper, not as off-spec gray.
- **Paper Surface** (`#ffffff`): cards, tables, the right sidebar, modals. The piece of paper laid on the desk.
- **Paper Surface 2** (`#faf9f6`): row hover, the nav rail, alternate surface for layered context. A whisper warmer than pure white.
- **Paper Surface 3** (`#f0eee9`): tag backgrounds, deeper ground for muted state. Where the page would be slightly more compressed.
- **Ink 2** (`#4a4a4a`): secondary body text, subdued button labels.
- **Ink 3** (`#9a9a9a`): tertiary text, eyebrow labels, subdued icons.
- **Ink 4** (`#d4d4cf`): faintest UI text, inactive dots, disabled states.
- **Rule Line** (`#e8e6e0`): default borders. The grain of the paper.
- **Rule Line Strong** (`#d4d4cf`): hover borders, decisive separators.

### Tertiary (Status & Tags)
Semantic-only. None of these is a brand color; each carries meaning.
- **Status Green** (`#16a34a`, tint `#dcfce7`): "ahead", "on track", positive deltas, "saved" banners.
- **Status Amber** (`#d97706`, tint `#fef3c7`): "on track", warnings, soft alerts.
- **Status Red** (`#dc2626`, tint `#fee2e2`): "behind", destructive intent, errors.
- **Tag Blue** (`#2563eb`, tint `#dbeafe`): assessment categories, neutral classifying tags.
- **Tag Purple** (`#7c3aed`, tint `#ede9fe`): AI / analysis surfaces, session-type pills.
- **Tag Teal** (`#0d9488`, tint `#ccfbf1`): secondary tag color for non-conflicting categories.

### Named Rules
**The Ink-Carries-Action Rule.** Primary action color is ink, not purple, not green, not blue. If a button needs attention, ink-on-paper is the strongest signal in the system; reach for color only when ink is already in use nearby.

**The Tint-or-Solid Rule.** Status colors appear as a saturated solid (dot, icon) OR as a `-tint` background carrying its same-hue solid text. Never as a saturated background carrying white text in product UI. Reserve white-on-saturated for banner-level confirmations only.

**The Pure-Black Prohibition.** Never `#000`. Hover state on the primary button is the only place black appears, and it sits next to ink-on-paper, not as a primary surface.

## 3. Typography

**Display & Body Font:** Geist (with `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` fallback).
**Mono Font:** Geist Mono (with `ui-monospace, SFMono-Regular, monospace` fallback).

**Character:** Geist is a neutral grotesque with enough warmth in the curves to sit on cream paper. It does not editorialize the way a serif would, but it never reads "system default" the way Inter does at small sizes. Geist Mono carries dates, IDs, and any value the tutor might transcribe.

### Hierarchy
- **Display** (700, 22px, line-height 1.15, letter-spacing -0.5px): student name, page title. Tight tracking; never used twice on the same screen.
- **Headline** (700, 15px, line-height 1.3): card and section headings ("Recent Student Work", "Student Work"). The voice of a section title in a notebook.
- **Title** (600, 13.5px): list row titles, modal subjects, the strongest text inside a row.
- **Body** (500, 13px, line-height 1.45): default text, button labels, form values. Cap reading width at 65–75ch when wrapped to paragraph blocks.
- **Label** (700, 11px, uppercase, letter-spacing 0.6px): eyebrow section labels, sidebar group titles, "STUDENT", "SKILLS", "PARENT". The notebook tab marker.
- **Mono** (500, 12.5px): dates, IDs, tutor names in tables, anything that should look transcribed. Carried by the `.font-mono` utility class.

### Named Rules
**The Eyebrow Rule.** Every panel section in the right sidebar leads with an uppercase 11px label at 0.6px tracking. Removing the eyebrow flattens the rhythm; never replace it with a regular-case headline.

**The Tracking-Tightens-As-Size-Grows Rule.** Body and small sizes use normal tracking. The 22px display tightens to `-0.5px`. Tight tracking on small body text reads as cheap; loose tracking on the display reads as billboard.

**No-System-Default Rule.** Decodable never falls through to Arial or pure system-default. If Geist fails to load, the stack lands on the macOS / Windows system sans — which is acceptable — but never on a serif fallback.

## 4. Elevation

Decodable is flat. There are no `box-shadow` rules on cards, list rows, panels, or the navigation rail at rest. Depth comes from three places:

1. **Rule lines** (`#e8e6e0`): the borders on cards and the dividers between list rows are the system's primary depth signal.
2. **Surface ladder**: the three paper surfaces (`paper-bg` < `paper-surface-2` < `paper-surface`) layer light, not shadow. The page is darker than the card; the card hover is lighter than the page.
3. **Ink weight**: bold ink on cream reads as "in front of" because it has presence, not because it floats.

### Shadow Vocabulary
A single 1px-bleed shadow is used in **exactly one place**: the active nav-bar item.
- **Active-tile** (`box-shadow: 0 1px 2px rgba(0,0,0,0.04)`): the active sidebar nav item lifts ~1px off the rail. Nowhere else in the system uses this token. If a new component reaches for a shadow, the design has drifted; redesign with rule lines instead.

### Named Rules
**The Flat-By-Default Rule.** Cards, list rows, modals, and panels carry no shadow at rest. If a surface needs to read as primary, increase its ink content or thicken its border, do not float it.

**The Hover-Tints-Don't-Lift Rule.** Hover state on rows and cards swaps the background from `paper-surface` to `paper-surface-2` (or vice versa). Never `transform: translateY()`. Never a shadow ramp.

## 5. Components

Every component reads as a notebook element first and a UI primitive second. Buttons recede until needed; cards are pieces of paper; rows are ledger lines.

### Buttons
- **Shape:** small rectangles with a `6px` corner (`rounded-md`). Never pill-shaped except status dots.
- **Primary:** `paper-surface` text on `ink` background, 6px / 14px padding. Hover deepens to pure `#000`. The hover is the only place black appears in the system.
- **Secondary:** `ink-2` text on `paper-surface` with a 1px `rule-line` border, 6px / 12px padding. Hover swaps surface for `paper-surface-3`.
- **Icon button:** 28px square, ink-3 default, hover ink-2 on `paper-surface-3`. Used for inline edit / delete actions in list rows.

### Tags
- **Style:** 4px corner, 2px / 6px padding, 10.5px font-semibold. Always one of the six tag-tint pairs (green / amber / red / blue / purple / teal). Background is the `-tint`, text is the solid.
- **States:** monochrome only; no selected / unselected. Tags are read, not toggled.

### Cards
- **Corner:** 10px (`rounded-lg`).
- **Background:** `paper-surface`.
- **Border:** 1px `rule-line`.
- **Shadow:** none.
- **Internal Padding:** 20px (`p-5`) default; 12px / 14px for compact `HighlightCard`; 0 when the card hosts a list table directly so the table's own dividers can run flush.

### Inputs / Fields
- **Style:** 1px `rule-line` border, `paper-surface` background, 6px corner, 8px / 12px padding, 13px body type.
- **Focus:** border darkens to `ink`. No glow, no ring, no shift.
- **Error:** border to `status-red`, helper text in `status-red` below. No filled red background.

### Navigation
- **Style:** 220px fixed left rail on `paper-surface-2`. Items are 13px body type at `ink-2`.
- **Active:** background swaps to `paper-surface`, text to `ink`, the only `Active-tile` shadow in the system applies (1px lift).
- **Section titles in nav:** the eyebrow label style (11px uppercase, 0.6px tracking, `ink-3`).

### Status Dots
A signature primitive. 7px solid circle in `status-green`, `status-amber`, `status-red`, `tag-blue`, or `ink-4` for inactive. Always 7px, always perfectly round, used inline next to a label. The dot is the second-most-used motif after the eyebrow label.

### List Table & Row (signature)
The Attio-style ruled table is the project's most-used pattern. A `list-table` is a `paper-surface` card with no padding; each `list-row` is a 28-by-1fr-by-auto grid with a tinted-tile icon, a title + sub line, and a date. Hover tints the row; click navigates. **The dividers are 1px `rule-line` on the bottom of every row, with the last row's divider explicitly removed.** This is the closest the system gets to a ledger.

## 6. Do's and Don'ts

### Do:
- **Do** lead each panel section with an 11px uppercase 0.6px-tracked eyebrow label. The eyebrow is the system's rhythm.
- **Do** use `#1a1a1a` ink on `#ffffff` cards, on `#f5f3ef` paper. Never pure black, never pure white as the page background.
- **Do** carry hover state by swapping `paper-surface` ↔ `paper-surface-2`. Never via translate or shadow.
- **Do** use Geist Mono for dates, IDs, tutor names in tables; anything the tutor might transcribe.
- **Do** keep status color rare. A row that uses no color is the norm; a row that uses one tag is informative; a row with three tags is broken.
- **Do** prefer ruled list rows for showing many things. Cards are for one thing at a time.

### Don't:
- **Don't** ship a Duolingo-style edtech aesthetic: lime greens (#58cc02 is in the legacy palette and should NOT migrate), cartoon mascots, badge gamification, or gradient buttons.
- **Don't** ship a SaaS dashboard cliché: purple-to-blue gradients, hero metric tiles with a big number + supporting stats + gradient accent, identical card grids of icon-headline-text.
- **Don't** ship a clinical / medical look: sterile pure-white background, teal accent strips, government-form field density.
- **Don't** ship a creator-tool look: dark mode, neon accents, complex panels.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored accent stripe on cards or list rows. Use a full border or a status dot.
- **Don't** use `background-clip: text` gradient text. The Decodable title and logo are solid ink.
- **Don't** add `box-shadow` to cards or rows. The single 1px Active-tile shadow on nav is the only shadow that ships.
- **Don't** use `transform: translateY()` on hover. Decodable does not lift; it tints.
- **Don't** introduce a new accent color outside the six semantic colors above. If a new role needs color, it needs a doctrine first.
- **Don't** use em dashes in UI copy. Use commas, colons, semicolons, periods, or parentheses.
- **Don't** wrap everything in a card. The right sidebar's panel sections live directly on `paper-surface-2`; they don't need cards.
- **Don't** nest cards inside cards. If a card needs internal structure, use rule lines and padded rows, not a second card.
- **Don't** revive the legacy palette in `--primary`, `--green`, `--orange`, `--red`, `--blue`, `--gold` from `src/index.css`. Those are kept only for non-migrated screens; new work uses only `--v4-*`.
