---
target: parent-hub-tab
total_score: 32
p0_count: 0
p1_count: 0
timestamp: 2026-05-24T00-38-54Z
slug: src-screens-tabs-parenthubtab-jsx
---
# Critique: Parent Hub Tab — Round 1 (single pass)

## Design Health Score (pre-fix → post-fix)

| # | Heuristic | Pre | Post | Key Issue |
|---|---|---|---|---|
| 1 | Visibility of System Status | 3 | 3 | Loading state, copy/save status. |
| 2 | Match System / Real World | 3 | **4** | Empty state copy fixed ("Upload student work" not "Upload an assessment"). |
| 3 | User Control and Freedom | 3 | 3 | X close, Redo regenerate, mailto. |
| 4 | Consistency and Standards | 2 | **4** | Duplicate h3 gone, AVATAR_BGS hex literals tokenized to var(--v4-*), tutor-note amber-lt block replaced with eyebrow + body, X buttons now 32x32 with aria-label + focus-visible, EmailRow aria-expanded + focus-visible. |
| 5 | Error Prevention | 3 | 3 | Saved-state prevents double-save. |
| 6 | Recognition Rather Than Recall | 4 | 4 | EmailRow shows avatar + subject + snippet + session badge + date. |
| 7 | Flexibility and Efficiency | 2 | 2 | No keyboard, no bulk. Deferred. |
| 8 | Aesthetic and Minimalist Design | 3 | **4** | Tutor-note no longer in amber block. Emoji loading messages removed. |
| 9 | Error Recovery | 2 | **3** | handleSaveDraft + handleCopy now catch; error surfaces in red banner above the draft action row. |
| 10 | Help and Documentation | 2 | 2 | Self-explanatory mostly. Deferred. |
| **Total** | | **27** | **32** | Good band, mid. |

## What was fixed (single pass)

- Removed duplicate `<h3>Emails</h3>` (fourth surface with this pattern).
- AVATAR_BGS literal hex values → var(--v4-*) CSS vars. Avatar colors now come from the design system.
- Loading messages stripped of emoji (✉️ 💬). Geist text now carries the moment.
- Tutor-note amber-lt full-block treatment → eyebrow + body. The amber color survives only on the eyebrow label.
- X close buttons (DraftCard, GeneratedDraftCard) bumped to 32x32, got aria-label, focus-visible outline, hover bg-surface-3 to match the IconBtn pattern from Student Work.
- EmailRow: aria-expanded + focus-visible outline.
- handleSaveDraft + handleCopy now have try/catch. handleSaveDraft surfaces via the existing red banner pattern; handleCopy falls back to a helpful message ("Select the text manually or try Open in Mail").
- Empty state copy: "Upload an assessment first" → "Upload student work first" (aligns with the Student Work rename).
