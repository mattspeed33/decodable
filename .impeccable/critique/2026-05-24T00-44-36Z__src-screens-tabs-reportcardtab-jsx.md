---
target: report-card-tab
total_score: 32
p0_count: 0
p1_count: 0
timestamp: 2026-05-24T00-44-36Z
slug: src-screens-tabs-reportcardtab-jsx
---
# Critique: Report Card Tab — Round 1 (single pass, large rewrite)

## Design Health Score (pre-fix → post-fix)

| # | Heuristic | Pre | Post | Δ | Key Issue |
|---|---|---|---|---|---|
| 1 | Visibility of System Status | 3 | 3 | = | Loading present. |
| 2 | Match System / Real World | 3 | **4** | +1 | Status labels read in plain sentence case; emoji-heavy copy ("💪 Strengths & Wins") replaced with "Strengths and wins". |
| 3 | User Control and Freedom | 2 | **3** | +1 | Real BtnSecondary with ArrowLeft for Back; focus paths everywhere via primitives. |
| 4 | Consistency and Standards | 1 | **4** | +3 | Legacy palette purged (--primary, --green, --gold, --orange, --red, --green-light, --gold-light, --red-light all gone). No pure-black/white. rounded-3xl chrome → rounded-[10px]. font-black 900 → font-bold 700. text-3xl h1 → text-[22px] per DESIGN.md display. Inline buttons → BtnPrimary / BtnSecondary. |
| 5 | Error Prevention | 2 | **3** | +1 | handleSave try/catch. |
| 6 | Recognition Rather Than Recall | 3 | **4** | +1 | StatusCount + LegendItem use the system's StatusDot pattern with proper labels (was emoji status dots 🟢🟡🔴). |
| 7 | Flexibility and Efficiency | 2 | 2 | = | Deferred. |
| 8 | Aesthetic and Minimalist Design | 1 | **4** | +3 | Stripped of decoration. Quiet professional document. "The notebook a parent could see" principle now honored on a parent-facing surface. |
| 9 | Error Recovery | 2 | **3** | +1 | handleSave catch surfaces error in red banner. |
| 10 | Help and Documentation | 2 | 2 | = | Deferred. |
| **Total** | | **21** | **32** | **+11** | **Good, mid.** Biggest single-surface jump in the series. |

## Anti-Patterns Verdict

Detector: 0 findings (was 1 — pure-black bg on the Save button).
LLM: AI slop tells comprehensively cleared. The report card now reads as a designed document a parent would receive, not a SaaS dashboard.

## What was fixed (single pass, big diff)

- All legacy palette tokens (--primary, --primary-hover, --green, --green-light, --gold-light, --orange, --red, --red-light) replaced with v4 equivalents.
- getStatus() in src/lib/gradeLevels.js updated to return v4 colors (var(--v4-green) / var(--v4-amber) / var(--v4-red)) instead of legacy.
- Pure-black/white usage eliminated: bg-black Save button → BtnPrimary, bg-white card → bg-[var(--v4-surface)], text-black → text-[var(--v4-ink)], all text-gray-* → v4 ink scale.
- rounded-3xl card chrome → rounded-[10px] (matches DESIGN.md rounded.lg).
- rounded-2xl Strengths/Working-On boxes removed entirely; replaced with eyebrow + body pattern on paper-surface (consistent with Sessions past-sessions and Analysis DetailBlock).
- rounded-full action buttons → rounded-md via BtnPrimary/BtnSecondary.
- font-black (900) replaced with font-bold (700). text-3xl h1 (30px) → text-[22px] per DESIGN.md display token.
- tracking-widest eyebrows → tracking-[0.6px].
- Status emoji (🟢🟡🔴) replaced with StatusCount + LegendItem components using v4 status colors and the system's 7px dot pattern.
- Button emoji (✨💾🖨️✏️←📊✍️📋) and content emoji (💪🎯✓●) replaced with lucide icons (Sparkles, Save, Printer, Pencil, ArrowLeft, Check, ●→dot).
- handleSave try/catch — error surfaces via the existing red banner; report state preserved for retry.
- IconBtn in the list view: aria-label, 32x32 hit area, focus-visible outline (matches the system pattern from Student Work).
- Duplicate <h3>Report Cards</h3> removed (sixth surface where this pattern existed; now removed everywhere).
- Tags "—" en-dashes replaced with colons or "to" per DESIGN.md Don'ts ("Don't use em dashes in UI copy").
- LoadingState messages stripped of emoji (📊 ✍️ 📋).

## What remains (deferred deliberately)

- Flexibility & Efficiency (2/4): no keyboard, no compare-reports, no duplicate-from-template.
- Help & Documentation (2/4): no inline doc beyond the legend.
- Native confirm() for delete still in place (system-wide pattern, would need a new inline-danger primitive).
- The Strengths/Working-On `ref={el => ...}` auto-resize textarea pattern is functional but doesn't match the rest of the system's textarea handling. Cosmetic, deferred.
