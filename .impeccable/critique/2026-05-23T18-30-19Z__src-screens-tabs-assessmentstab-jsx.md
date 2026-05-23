---
target: student-work-tab
total_score: 31
p0_count: 0
p1_count: 0
timestamp: 2026-05-23T18-30-19Z
slug: src-screens-tabs-assessmentstab-jsx
---
# Critique: Student Work Tab — Round 2

## Design Health Score

| # | Heuristic | Score Δ | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 (=) | Banners present, error path surfaces. No per-photo upload progress. |
| 2 | Match System / Real World | **4 (+1)** | Form-entries section reads tutor-natural ("12 automatic · 3 slow") instead of raw schema keys. |
| 3 | User Control and Freedom | 3 (=) | ESC, backdrop, X buttons, native confirm. No undo after delete. |
| 4 | Consistency and Standards | **4 (+2)** | All three modal violations fixed. AI Analysis matches other panels. Pure-Black carve-out closed. Focus-visible consistent. |
| 5 | Error Prevention | 3 (=) | Disabled-until-valid button, confirm before delete. No autosave. |
| 6 | Recognition Rather Than Recall | **4 (+1)** | Icon buttons have aria-label + 32×32 hit area. Title still serves sighted hover. |
| 7 | Flexibility and Efficiency | 2 (=) | No keyboard shortcuts. No bulk select. Edit still opens the full form. |
| 8 | Aesthetic and Minimalist Design | **4 (+1)** | Duplicate h3 gone, modal/card flat-by-default per spec. |
| 9 | Error Recovery | **3 (+1)** | Upload error path surfaces specific copy + preserves photos. Analysis error copy still vague. |
| 10 | Help and Documentation | 1 (=) | No tooltips, no in-tab guidance after the empty state. |
| **Total** | | **31/40 (+6)** | **Good** |

## Anti-Patterns Verdict

LLM: surface now reads on-system top to bottom. Dual-card empty state is intentional pattern (Primary CTA Card variant in DESIGN.md). AI Analysis card no longer dominates the modal visually. AI-tells from round 1 mostly gone.

Detector: 0 findings across both touched files. Round 1's pure-black on modal backdrop and round 2's secondary pure-black on BtnPrimary hover both resolved.

Visual overlays: unavailable (Clerk-gated, no chromium-cli).

## Overall Impression

Student-work tab is on-spec, professional, accessible to ship. Polish series closed every priority issue with no regressions. The remaining weaknesses (Flexibility 2, Help 1) are deliberate deferrals.

Single biggest improvement: AI Analysis card from loudest element to third-tier panel.
Single biggest leverage move: focus-visible wired into primitives.jsx — ripples to 24 callers across the app.

## What's Now Working

- Modal reads like the rest of the app (rounded-[10px], no shadows, ink-tinted backdrop, ruled panels).
- AI Analysis is third-tier visually. Sequence: Photos > Form Entries > AI Analysis.
- Dual-card empty state documented as Primary CTA Card variant.
- Every interactive element has focus path. AAA-where-practical from PRODUCT.md is real on this surface.
- Form-entries section is tutor-readable via getFormDisplay.

## Remaining Priority Issues

### [P2] Help & Documentation (1/4)
After empty state disappears, returning tutor has no affordance explaining Upload vs New Assessment. No tooltips, no first-run nudge after first upload.
Suggested: /impeccable onboard student-work-tab

### [P2] Flexibility & Efficiency (2/4)
5-click path from upload to analyzed result. No hotkey for Run Analysis, no bulk select, no inline analyze.
Suggested: /impeccable shape on the analyze-flow architectural question first.

## Persona Red Flags (round 2)

Maria: focus rings now help, 32×32 helps trackpad, modal matches the app. But 5-click upload-to-analysis flow unchanged.

Jordan: no nudge after first upload. Empty state still serves him well; activation moment after that not designed.

## Minor Observations

- --v4-ink-3 text fails WCAG AA at body sizes. System-wide, not addressed.
- Native confirm() for Delete still in place.
- Run Analysis still navigates to a separate selector view.
- No per-photo upload progress.

## Questions to Consider

- Extract WorkLightbox to a reusable primitive now that it's on-spec? Sessions / Report Cards could share.
- Inline analyze (per-row or per-modal button) vs the selector view as primary path?
- Is the assessment vs student-work IA distinction still felt by users after first session?
