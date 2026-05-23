# Product

## Register

product

## Users

**The independent solo literacy tutor.** A specialist running their own small practice, typically with five to fifteen students at a time, charging parents directly. They are not a classroom teacher and not a chain-tutoring employee; they are the whole business. Decodable is their entire back office: case notes, assessments, AI analysis, session plans, report cards, parent emails, homework, and scheduling.

Their context is a laptop or iPad at a kitchen table or small home office, often sitting next to a child during the session itself, in bright daylight or warm lamp light. They are time-conscious because every hour they spend on paperwork is an hour not spent teaching. They are not power users of developer tools, but they are professionals; the bar is "respects their craft" not "tutorialized for beginners". They lean toward older-educator demographics, which raises the stakes on legibility, contrast, and unambiguous controls.

The job to be done: *compress the unglamorous parts of running a tutoring practice so the actual teaching stays the focus, and produce the documentation parents need to see their child progress.*

## Product Purpose

Decodable is the AI co-pilot for independent literacy tutors. It captures student work (digital forms, photo uploads), analyzes it against research-based literacy benchmarks (the science of reading, UFLI placement, structured-literacy frameworks), drafts session plans and parent updates, and produces report cards that hold up under a parent's eye.

The product exists because the alternatives are wrong-shaped: classroom LMS tools are built for districts, tutoring marketplaces are built for matching, and the only "system of record" most independent tutors have is a spiral notebook and a Google Doc. Decodable is the system of record that knows literacy.

**Success looks like a tutor saying:** *"I got five hours back every week, and my parents finally see what they're paying for."*

## Brand Personality

**Crafted. Thoughtful. Quiet.** In that order of dominance.

- **Crafted.** Every surface is the well-made thing in a category full of bloat. Type is considered, spacing is intentional, every word in every label has been chosen. Decodable is to literacy tutoring what a good kitchen knife is to cooking: unshowy, precise, reaches for itself.
- **Thoughtful.** The product knows the science of reading. It chooses what to surface and what to hide, what to draft and what to leave to the tutor, what to alert on and what to let pass. Thoughtfulness shows up as restraint more than as cleverness.
- **Quiet.** Decodable does not market itself inside its own UI. No sparkle icons everywhere. No "Powered by AI" badges. No celebration confetti, no progress streaks, no gamification. The voice is calm and confident, never folksy and never robotic.

The reconciliation tension to keep in mind: the **mission** is AI co-pilot; the **personality** is quiet. AI is therefore visible as an outcome (a drafted email, a graded sample, a session plan) but never as a feature claim. The model is Linear's AI integration or Granola's transcription, not Notion AI's sparkle-icon-on-every-surface.

## Anti-references

What Decodable should feel nothing like, by category. Each carries strategic risk to position against, not just a visual to avoid.

- **Gamified edtech** (Duolingo, ABCmouse, Reading IQ, IXL). No streaks, no badges, no mascot characters, no celebration confetti, no XP. The user is a professional adult, not a learner being kept engaged. Voice-level guard: never "Great job!" copy.
- **Classroom LMS bloat** (Google Classroom, Schoology, Canvas, Seesaw). No admin-built feature sprawl, no district-level workflows, no every-stakeholder-gets-a-view nav. Decodable is for one tutor doing one tutor's work; if a feature would only matter at 50 students, it doesn't belong.
- **Tutoring marketplaces** (Wyzant, Outschool, Varsity Tutors, Preply). Decodable is not about matching tutors with parents. Tutors come to Decodable with their parents already. Never lean on marketplace UX (browse, rate, search, book).

The visual-level anti-references (SaaS-cliché gradients, kid-coded edtech aesthetic, clinical/medical, creator-tool maximalism) live in `DESIGN.md` Do's and Don'ts.

## Design Principles

Five strategic principles, derived from the conversation above. These are decision rules, not visual rules. Every other impeccable command reads from this list when deciding what to build, what to cut, what to surface, what to recede.

1. **AI is the engine, never the marketing.** Decodable's job is to be an AI co-pilot, but no surface leads with a sparkle icon, a "Powered by AI" badge, or magic-wand metaphors. AI appears as outcome (a drafted email, a graded work sample, a session plan), never as feature claim. The Linear / Granola model, not the Notion-AI model.

2. **The notebook a parent could see.** Every screen is something the tutor would be proud to leave open on the desk during a parent meeting. No engineer-flavored copy, no placeholder strings, no half-finished states. Respect the child as much as the user; respect the parent as much as the tutor.

3. **The unglamorous work, well-made.** Be obsessively good at the parts nobody else bothers to craft: assessment forms, report cards, parent emails, homework sheets. The Stripe move. Glamorous features are deliberately quiet; functional features are deliberately precise.

4. **Confidence from evidence, not from claims.** Parents and tutors trust Decodable because they see the actual student work, not because the app insists. Never "AI says she's doing great." Always "here is what she wrote, here is what improved, here is where to focus." This principle directly shapes how analyses, report cards, and emails are framed.

5. **The solo tutor's hands.** Every feature scales for one person doing this on a Tuesday night. No coordination layers, no team views, no admin roles, no "share with cohort." If it would only matter at 50 students or in a 5-tutor team, it doesn't belong. This narrows the surface aggressively, on purpose.

## Accessibility & Inclusion

**WCAG 2.2 AAA where practical, AA as the floor.**

- **Parent-facing surfaces** (report cards, parent emails, exported PDFs) target **AAA contrast and readable type sizes**. These are the surfaces with the highest stakes and the broadest audience; they hold themselves to the higher bar.
- **Tutor-facing app surfaces** target **AA contrast** as the floor. Density is allowed inside the app, but a 13px row label still has to pass AA at `#1a1a1a` on `#ffffff` (it does) and `#9a9a9a` on `#ffffff` (only at 14px+; eyebrow labels are larger or bolder to compensate).
- **Color-blind safe by construction.** The three status colors (green, amber, red) are always paired with shape, icon, position, or text label. Status meaning never depends on color alone. The status-dot primitive is acceptable only because it appears next to a label.
- **Reduced-motion respected.** Any motion the app introduces honors `prefers-reduced-motion`. No essential information is conveyed by animation, and currently the system uses motion sparingly enough that this is mostly free.
- **Keyboard navigable throughout.** Every interactive element reaches focus via Tab, activates with Enter/Space, and shows a visible focus ring (the `outline: 2px solid #1a1a1a; outline-offset: 2px` pattern from DESIGN.md).
- **Real form labels.** `<label for="…">` everywhere, never placeholder-only labels. Form validation messages are programmatically associated, not just styled in red below the input.
- **Audience considerations.** Tutors over 40 with average computer literacy, occasional iPad use during a session, sometimes used in direct daylight (so contrast matters more than density). The aesthetic-first defaults (warm cream paper, ink) already serve this audience well; the accessibility commitment formalizes it.
