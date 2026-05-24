---
target: analysis-tab
total_score: 34
p0_count: 0
p1_count: 0
timestamp: 2026-05-24T00-35-42Z
slug: src-screens-tabs-analysistab-jsx
---
# Critique: AI Analysis Tab — Round 1 (baseline + immediate polish, single pass)

## Design Health Score (pre-fix → post-fix)

| # | Heuristic | Pre | Post | Key Issue |
|---|---|---|---|---|
| 1 | Visibility of System Status | 3 | 3 | useAsync loading. |
| 2 | Match System / Real World | 3 | **4** | Em-dashes replaced with colons in Focus Areas + Week Arc lines. |
| 3 | User Control and Freedom | 3 | 3 | Expand/collapse via row click. |
| 4 | Consistency and Standards | 2 | **4** | Duplicate h3 gone, DetailBlock backgrounds removed, UfliCell no longer hero-metric, bg-white tokens replaced, inline-style → conditional className, focus-visible + aria-expanded added. |
| 5 | Error Prevention | 4 | 4 | Read-only surface, n/a. |
| 6 | Recognition Rather Than Recall | 4 | 4 | Each row shows fluency %, UFLI unit, gap count, date. |
| 7 | Flexibility and Efficiency | 2 | 2 | No keyboard expand, no compare-runs. Deferred. |
| 8 | Aesthetic and Minimalist Design | 2 | **4** | Expanded view from 3+ full-color blocks (Strengths/Focus/Watch) to consistent eyebrow + body pattern. UFLI cells neutral with thin ink border on current. |
| 9 | Error Recovery | 4 | 4 | Read-only, n/a. |
| 10 | Help and Documentation | 2 | 2 | Domain terms (Scarborough, Hegarty) unexplained but tutor-targeted. Deferred. |
| **Total** | | **29** | **34** | Good band, near Excellent. |

## What was fixed in a single pass

- Removed duplicate `<h3>AI Analysis</h3>` (third surface where this pattern existed).
- `DetailBlock` no longer wraps content in a full-color tinted background. Strengths / Focus Areas / Watch now use eyebrow + body with the semantic color on the eyebrow only.
- `UfliCell` "highlight" variant was a hero-metric template (absolute ban): big purple unit number on full purple-lt block. Replaced with a neutral paper-surface tile, ink-colored border on the current cell only. Prop renamed `highlight` → `current` for clarity.
- 3× `bg-white` → `bg-[var(--v4-surface)]` token alignment (rank chip, details bg, ufli cell).
- Inline `style={{ background, color }}` for the fluency-percent badge extracted to a `fluencyChipClass` helper that returns the v4 tone class.
- Expand/collapse button: `aria-expanded` + focus-visible outline added.
- ✓ Unicode for Strengths replaced with lucide `<Check>` for icon consistency.
- ● Unicode for Watch patterns replaced with a 1.5px ink-color dot for the same.
- Em-dashes in `Focus Areas` and `Week Arc` lines replaced with colons (DESIGN.md Don'ts).

## What remains

- Flexibility (2/4): no keyboard expand on rows, no side-by-side compare. Worth a `/impeccable shape` pass if you want to push past Good.
- Help & Documentation (2/4): no inline explanations for domain terms (Scarborough's Rope, Hegarty). Tutor-targeted so probably fine, but a tooltip pass would lift to 3+.
- Detector: clean.
