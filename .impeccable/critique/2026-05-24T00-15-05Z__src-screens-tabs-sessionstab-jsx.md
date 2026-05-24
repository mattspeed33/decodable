---
target: sessions-tab
total_score: 27
p0_count: 0
p1_count: 0
timestamp: 2026-05-24T00-15-05Z
slug: src-screens-tabs-sessionstab-jsx
---
# Critique: Sessions Tab — Round 2 (after polish pass)

## Design Health Score

| # | Heuristic | Score Δ | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 (=) | No autosave on long-lived plan-feedback. |
| 2 | Match System / Real World | 3 (=) | "Generate" button still doesn't say "Generate Plan". |
| 3 | User Control and Freedom | 3 (=) | Error preserves form state for retry (improved). No regenerate-plan. |
| 4 | Consistency and Standards | **3 (+2)** | Side-stripe gone, hero-metric gone, dead CSS gone, blockBorder replaced with system-aligned BLOCK_META. Duplicate h3 and shadow-sm hover remain (P2). |
| 5 | Error Prevention | **3 (+1)** | handleSavePlan has try/catch; plan + feedback state preserved on save failure. |
| 6 | Recognition Rather Than Recall | 3 (=) | Past-sessions row badges work. |
| 7 | Flexibility and Efficiency | 2 (=) | Deferred. |
| 8 | Aesthetic and Minimalist Design | **3 (+1)** | Plan view reduced from 6+ colored blocks to 2. Block tiles with leading icons matches ListRow pattern. Past-sessions expanded view still has full color blocks (out of scope this round). |
| 9 | Error Recovery | **3 (+1)** | handleSavePlan error path now real. |
| 10 | Help and Documentation | 1 (=) | Deferred. |
| **Total** | | **27/40 (+5)** | **Still Acceptable** — one point shy of Good band. |

## Anti-Patterns Verdict

Detector: 0 findings (was 1 — the border-l-4 side-stripe absolute-ban hit). Clean across the file.

LLM: AI slop tells largely gone from the plan view. The Tutor's Notebook treatment now reads through to the session-plan surface. Past-sessions expanded view still has the green/amber/blue colored blocks for Notes/Wins/Needs — out of round-2 scope, but worth a future quieter pass.

## Remaining P2 + Minor

These would push the score over 28 into Good band:
- Duplicate h3 above the tab (same as Student Work was)
- shadow-sm hover on template picker tiles (Flat-By-Default violation)
- bg-white instead of token on past-session assessment block (line 584)
- "Generate" button text → "Generate Plan"
- Emoji loading messages (charming but Duolingo-lean)
- Past-session expanded view's full-color Notes/Wins/Needs blocks

## What's now working

- Plan view reads as a Tutor's Notebook page: photos/analysis context at top, ledger-style blocks with leading category icons, quiet reminders.
- BLOCK_META + BLOCK_TILE replace the side-stripe blockBorder map. All six block types differentiate via lucide icon + tinted tile. Wrap-up uses gray to avoid a 6th brand tone.
- handleSavePlan failure now surfaces in the red Banner with photos preserved for retry.
- Reminder block reads as quiet warning with AlertTriangle icon, not a full amber wall.
