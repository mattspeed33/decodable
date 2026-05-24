---
target: sessions-tab
total_score: 22
p0_count: 0
p1_count: 4
timestamp: 2026-05-24T00-09-01Z
slug: src-screens-tabs-sessionstab-jsx
---
# Critique: Sessions Tab — Round 1

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Loading + banners. No autosave on plan-feedback state. |
| 2 | Match System / Real World | 3 | Tutor language. "Generate" CTA could be more specific. |
| 3 | User Control and Freedom | 3 | ModeHeader Back, expand/collapse. No regenerate-plan. |
| 4 | Consistency and Standards | 1 | Side-stripe borders (absolute ban), shadow on template tiles, dead-CSS borders, mixed v4 + raw Tailwind, duplicate h3. |
| 5 | Error Prevention | 2 | handleSavePlan has no try/catch — silent failure risk. |
| 6 | Recognition Rather Than Recall | 3 | Past-sessions row badges are well-formed. |
| 7 | Flexibility and Efficiency | 2 | No keyboard. No autosave. No regenerate-with-tweak. |
| 8 | Aesthetic and Minimalist Design | 2 | Plan view has 6+ colored info blocks; status color is decoration here. |
| 9 | Error Recovery | 2 | Generic copy. One save path has no catch at all. |
| 10 | Help and Documentation | 1 | No tooltips, no Plan-vs-Log-vs-Template guidance. |
| **Total** | | **22/40 (Acceptable)** | |

## Anti-Patterns Verdict

LLM: more "AI made that" than Student Work currently. Side-stripe borders on plan blocks, heavy semantic-color decoration (6+ colored zones), emoji loading messages, ⚠ emoji warning.

Detector: 1 finding. side-tab at line 388 — border-l-4 driven by blockBorder map. Direct hit on absolute ban.

Visual overlays: unavailable.

## Overall Impression

Sessions is the busiest, most-colored surface in the app, and the busiest place where the Tutor's Notebook philosophy is least visible. Bones are good (mode IA, past-sessions list, this-week-context). Visual treatment has accumulated decoration that compounds.

Single biggest opportunity: commit the session-plan view to the Tutor's Notebook treatment.

## What's Working

- Mode IA is sharp: Plan / Log / Template as three focused entry actions.
- Past-sessions expandable list with session number + date + UFLI + Notes badges.
- This Week's Focus context card frames new sessions in the engagement arc.

## Priority Issues

### [P1] Side-stripe borders on every plan block (absolute ban)
blockBorder map at lines 26-33 + border-l-4 at line 388. Detector caught this. DESIGN.md's most-named anti-pattern.
Fix: Replace with leading icon tile, eyebrow label in block-type color, or drop differentiator entirely.
Suggested: /impeccable shape session-plan-view first, then polish.

### [P1] Cumulative color overload in plan view
8-10 colored info blocks visible at once (purple goal, blue This Week, purple UFLI, amber Reminder, amber Needs Work, green Went Well, red Gaps, side-striped block borders).
Fix: Reduce to 2-3 colored zones. Replace block tints with dots/icons + paper-surface backgrounds.
Suggested: /impeccable quieter session-plan-view

### [P1] handleSavePlan has no try/catch
Tutor's plan + feedback notes silently lost if save fails after long-lived form state.
Fix: try/catch, red Banner, preserve plan + planNotes for retry.
Suggested: /impeccable harden sessions-tab

### [P1] Dead CSS — same-color border + background, twice
Lines 379 and 424. Same bug we fixed on AI Analysis card.
Fix: Remove both border declarations.

### [P2] shadow-sm hover on template tiles
Line 519. Flat-By-Default violation.
Fix: hover:bg-[var(--v4-surface-2)].

### [P2] blockBorder mixes design tokens and raw Tailwind classes
Lines 26-33: border-l-purple-400 and border-l-pink-400 vs the other four using v4 tokens.
Fix: Drop the map when fixing the side-stripe pattern.

### [P2] Duplicate <h3>Sessions</h3>
Line 299. Same as Student Work.
Fix: Remove; let actions sit alone.

## Persona Red Flags

Maria: weekly session prep → print → in-session → feedback fill → Save. Three risk points: silent save failure, busy print output, no autosave on long-lived form.

Jordan: after first session, returns to a tab with Plan / Log / Template — no inline explanation of which to use when. Mode confusion likely.

## Minor Observations

- Emoji in loading messages (🗓️ 🎯 📘 📝 📸 💾).
- ⚠ emoji warning on line 405 (use Lucide AlertTriangle).
- bg-white on line 584 (use --v4-surface token).
- "Generate" button should be "Generate Plan".
- Past-session purple-on-purple-lt tile carries more color weight than the system pattern warrants.
- ActionTile and template-picker tile duplicate the same pattern.
- Expand/collapse button has no aria-expanded, no focus-visible (custom button, not BtnSecondary).
- ModeHeader back arrow has no aria-label.

## Questions to Consider

- Should Plan and Log be one unified mode? Both produce a Session row.
- Is the session-plan view's density a bug? A dedicated /students/:id/session/:id/plan route optimized for in-session use might be better.
- Should the session plan have its own print stylesheet for a paper-friendly Tutor's Notebook output?
