---
target: student-work-tab
total_score: 25
p0_count: 0
p1_count: 3
timestamp: 2026-05-23T17-30-04Z
slug: src-screens-tabs-assessmentstab-jsx
---
# Critique: Student Work Tab (src/screens/tabs/AssessmentsTab.jsx)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Loading + saved + error banners present. No per-photo upload progress or inline form validation. |
| 2 | Match System / Real World | 3 | Tutor-readable headings, but the modal's form-entries section shows raw schema keys (fluency_wcpm instead of "Fluency WCPM"). |
| 3 | User Control and Freedom | 3 | ESC, backdrop click, X buttons, native confirm-before-delete. No undo after delete. |
| 4 | Consistency and Standards | 2 | Modal panel uses rounded-2xl, shadow-xl, and bg-black/50 — three direct DESIGN.md violations on a single surface. |
| 5 | Error Prevention | 3 | confirm() before delete, disabled-until-valid Save Work button, try/catch around async work. No autosave or draft preservation. |
| 6 | Recognition Rather Than Recall | 3 | Strong inline summaries on list rows. Edit/Delete are icon-only with title= only, no visible text or aria-label. |
| 7 | Flexibility and Efficiency | 2 | No keyboard shortcuts. No inline multi-select for delete. Edit always opens a full form, no quick-edit. |
| 8 | Aesthetic and Minimalist Design | 3 | Generally clean and tight. Dual-card empty state and 3-button header crowd a little. |
| 9 | Error Recovery | 2 | handleSaveUpload's catch sets setSaving(false) silently and never surfaces the error. |
| 10 | Help and Documentation | 1 | No tooltips, no first-run hints inside the tab, no inline explanation of when to use Assessment vs Student Work after the empty state disappears. |
| **Total** | | **25/40** | **Acceptable** |

## Anti-Patterns Verdict

LLM assessment: Mostly not AI-shouty — surface respects PRODUCT.md's Quiet personality. The dual-card empty state reads as an AI-empty-state shape. Emoji as category iconography is a system-wide choice from CLAUDE.md, not specific to this tab.

Deterministic scan: 1 finding.
- pure-black-white at line 415 — `bg-black/50` on modal backdrop. Direct violation of DESIGN.md Pure-Black Prohibition.

Visual overlays: Not available (Clerk-gated app, no browser automation).

## Overall Impression

Structurally sound, design-system-leaky. IA is right (Student Work primary tab, Upload primary action, Assessment secondary). Three issues pull the score down: modal isn't on-system, help/efficiency tiers thin, error recovery silent. Single biggest opportunity: bring the modal onto the DESIGN.md spec.

## What's Working

- Dual upload-vs-assessment IA is sharp — matches how tutors think about "here's what they did" vs "let me probe what they know."
- Photo-first row rendering — 40px thumbnail of actual student work leads each row, fallback to emoji only when no photos. Show-evidence-not-claims in action.
- Modal information density is right — Photos, Form Entries, AI Analysis in that order with eyebrow labels. Reads like a notebook page.

## Priority Issues

### [P1] Modal violates three DESIGN.md rules at once
- rounded-2xl (16px, off-scale; lg token is 10px)
- shadow-xl (no shadow token outside active-tile)
- bg-black/50 on backdrop (Pure-Black Prohibition)
- shadow-xl also on zoomed image
Fix: rounded-[10px], remove shadow-xl in both places, bg-[var(--v4-ink)]/50.
Suggested command: /impeccable polish student-work-modal

### [P1] AI Analysis card is the loudest element in the system
Full purple-lt background with same-color border. Violates "AI is the engine, never the marketing." Border + background being same color is also dead CSS.
Fix: Drop the background tint; use purple only as accent on the Brain icon and the "View full analysis →" link. Card becomes border border-border + rounded-[10px] + paper-surface.
Suggested command: /impeccable quieter ai-analysis-card

### [P1] Upload-form error path is silent
handleSaveUpload's catch block sets setSaving(false) and returns; never surfaces error. Photos lost, no feedback.
Fix: Surface the error in the existing red Banner pattern, keep photo state intact for retry.
Suggested command: /impeccable harden student-work-tab

### [P2] Icon-only Edit/Delete + small hit targets
28×28 fails WCAG 2.2 AAA touch target (44×44). title= alone is unreliable for screen readers.
Fix: aria-label on both, bump size to 32-36×32-36, or convert to text+icon hover state.
Suggested command: /impeccable adapt student-work-tab

### [P2] Form-entries section shows raw schema keys
fluency_wcpm renders as "fluency_wcpm" instead of "Fluency WCPM". Engineer-flavored output in a tutor-facing surface.
Fix: Pretty-print or read label from assessmentFormSchemas.js.
Suggested command: /impeccable clarify student-work-modal-form-entries

## Persona Red Flags

**Maria (Independent solo tutor, 42, 12 active students):** Five clicks from "uploaded a photo" to "AI graded it" (Save → close → Run Analysis → check boxes → Analyze). No keyboard shortcut. Small Edit/Delete hit targets on trackpad.

**Jordan (First-time tutor, 1 student):** Lands on empty state, uploads photo. No nudge toward Run Analysis. May not realize action is needed for AI to do anything. First-run abandonment risk.

## Minor Observations

- Native confirm() browser dialog for Delete is outside the design system.
- Page-level h3 "Student Work" duplicates the tab label 12px above.
- "AI Analysis" eyebrow inside modal uses proper noun case instead of UPPERCASE 0.6px-tracked. Inconsistent with Eyebrow Rule.
- Lucide stroke width inherits default 1.5 in the modal's category tile; elsewhere uses 2.
- Primary CTA Card pattern (ink-colored border on near-white card) not documented in DESIGN.md.
- formatValue uses JSON.stringify for objects — engineer-flavored output.

## Questions to Consider

- What if single-click on a row triggered analysis when none exists yet, instead of opening the modal?
- Does the modal need to be a modal at all? "Modal as first thought" is in the absolute bans.
- What would a confident-but-quiet AI surface look like? The current purple block is one option. Dropping the analysis into the same ruled-list pattern as form entries with a single ink prefix is the other extreme.
- Should the WorkLightbox pattern be extracted before more callers arrive (Sessions, Report Cards could both use it)?
