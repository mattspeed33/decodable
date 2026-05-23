# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Design Context

Before any UI/UX work, read `PRODUCT.md` (strategic: users, mission, brand personality, anti-references, five design principles) and `DESIGN.md` (visual: tokens, typography, components, do's and don'ts, the "Tutor's Notebook" north star). Both live at the repo root. The impeccable skill reads them automatically; other tools should treat them as load-bearing.

## What this is

Decodable is a React + Vite literacy-tutoring app. A tutor signs in with Clerk, manages students, captures reading assessments (digital forms or PDF photo uploads), runs AI analyses against them, plans sessions, generates report cards, and emails parents. Deployed on Vercel; data lives in Neon Postgres.

This is a pure-JS React app (no TypeScript despite `vite.config.ts`). `package.json` name `"temp-vite"` is vestigial — the app is "Decodable."

## Commands

```bash
npm run dev          # Vite dev server on :5173 (front-end only; API calls go to deployed /api or vercel dev)
npm run dev:vercel   # `vercel dev` — Vite + the api/ functions locally
npm run server       # Local Express server on :4000 — only used for PDF skill-template uploads
npm run dev:full     # concurrently: Express :4000 + Vite :5173
npm run build        # vite build
npm run lint         # eslint .
node --env-file=.env.local db/migrate.js   # apply db/migrations/*.sql to Neon
node --env-file=.env.local db/verify.js    # sanity-check the schema
```

The local Express server (`server/index.js`) handles skill-template PDF uploads to disk under `server/uploads/`. **It is not deployed.** Those endpoints are localhost-only — features that depend on them don't work in production.

## High-level architecture

### Auth + data plane

- **Clerk** (Vercel Marketplace integration) gates the entire app. `src/App.jsx` shows `<SignIn/>` to signed-out users; everything else lives inside `<SignedIn>`. The publishable key is read from `import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Vite picks it up because `vite.config.ts` declares `envPrefix: ['VITE_', 'NEXT_PUBLIC_']`.
- **Neon Postgres** holds all user data. Schema lives in `db/migrations/0001_initial.sql`. Every domain table follows the same shape: `id text pk`, `user_id text`, optional `student_id`/`date`, and a `data jsonb` blob for everything else. The frontend stores objects flat (`{ id, ...fields }`); `data` is reassembled on read.

### Single-function API dispatch

Vercel's hobby plan caps at 12 serverless functions, so the whole CRUD surface is one function:

- `vercel.json` rewrites `/api/<slug>` → `/api/dispatch?slug=<slug>` and `/api/<slug>/<id>` → `/api/dispatch?slug=<slug>&id=<id>`.
- `api/dispatch.js` declares every resource (table name, scope columns, promoted columns, ordering) in a single `RESOURCES` map and dispatches to handlers built by `api/_lib/crud.js`.
- `api/_lib/crud.js` builds `GET (list) + POST (upsert)` and `GET (one) + DELETE` handlers. POSTs are upserts (`INSERT … ON CONFLICT (id) DO UPDATE`), scoped to `user_id` so a user can never overwrite another user's rows. Promoted columns (`student_id`, `date`, etc.) are copied out of the payload alongside the full `data` jsonb.
- `api/_lib/auth.js` reads a Bearer token from the `Authorization` header and verifies it with `@clerk/backend`'s `verifyToken`. Every handler calls `requireUser(req, res)` and returns early if it's null.
- `api/ai/run-prompt.js` is the only other function — it proxies Anthropic Messages API calls so `ANTHROPIC_API_KEY` stays server-side. Model is `claude-sonnet-4-5`, `maxDuration: 60`.

**To add a new resource:** add a `create table` to a new migration, add an entry to `RESOURCES` in `api/dispatch.js`, then add typed wrappers in `src/lib/storage.js`. Don't add new files under `api/` — every route should keep funneling through `dispatch.js`.

### Frontend data access

- `src/lib/api.js` is a thin `authedFetch` wrapper. It pulls the Clerk JWT via `window.Clerk?.session?.getToken()` and attaches it to every request. Exports `apiList`, `apiGet`, `apiSave`, `apiDelete`.
- `src/lib/storage.js` wraps `api.js` with per-resource helpers (`getStudents`, `saveAssessment`, etc.). **All data access goes through this file** — components should not call `fetch` or `apiSave` directly. Function names match the pre-API localStorage shape on purpose, so most call sites are just `await`-ed without other changes.
- `src/lib/useAsync.js` is the standard hook for loading data into components. Caveat: it starts data as `undefined` — destructuring defaults only apply for `undefined`, not `null`, so don't pass `null` as the initial value if you want the default.

### Migrations

Two unrelated kinds of "migration":

1. **`db/migrations/*.sql`** — Postgres schema, applied by `db/migrate.js`.
2. **`src/lib/migration.js`** (legacy, splits old `assessment.ai_analysis` blobs into separate analysis rows) and **`src/lib/firstRunMigration.js`** (one-time localStorage → server import on first sign-in, gated by the `decodable_migrated_v1` flag). The `<MigrationGate>` in `App.jsx` runs the first-run import before rendering the app.

### Routing + layout

`App.jsx` defines two layout shells:

- `DefaultLayout` — fixed 220px `<NavBar/>` on the left + `ml-[220px] max-w-6xl` main pane. Used by every route.
- `StudentPage` (`/students/:id`) — opts out of `DefaultLayout` entirely and renders its own full-viewport 3-column grid (sidebar + main + right panel). This is the Attio-flavored "v4" view.

### Design system (v4)

- Reference HTML: `design-refs/v4.html`.
- Primitives in `src/components/v4/primitives.jsx` — `Section`, `SectionHead`, `Card`, `ListTable`, `ListRow`, `EmptyRow`, `HighlightCard`, `BtnPrimary`, `BtnSecondary`, `StatusDot`. Use these instead of re-rolling styled `div`s.
- CSS vars in `src/index.css` under `--v4-*` (surface/ink/border + tone pairs green/amber/red/blue/purple/teal each with a `-lt` light variant).
- Typography: Geist (sans) and Geist Mono (`.font-mono`), loaded via Google Fonts in `index.html`.
- Icons: `lucide-react`. Favor Lucide over emoji except where emoji is decorative (grade emoji, brand sprout).
- Tailwind v4 with the `@tailwindcss/vite` plugin — no `tailwind.config.js`; theme tokens are CSS vars.

### Domain shape

- **12 assessment categories** with PDF templates in `public/skills-defaults/` and matching digital forms. Schemas in `src/lib/assessmentFormSchemas.js`; category metadata in `src/lib/skillsCategories.js`.
- **Assessments vs Analyses are decoupled.** Assessments are raw data entry; analyses are AI-generated and live in a separate table. Downstream consumers must use `getLatestAnalysis()` — never `assessment.ai_analysis` (legacy field, only handled as a fallback inside `getLatestAnalysis`).
- **Grade-level scale** (Pre-K through Above 3rd) lives in `src/lib/gradeLevels.js` and drives the report-card skill bars and dashboard status badges.
- **AI prompts** are in `src/prompts/` — one file per task (`analysisPrompt.js`, `reportPrompt.js`, `sessionPrompt.js`, `emailPrompt.js`, `homeworkPrompt.js`, `assessmentTemplatePrompt.js`). All routed through `src/lib/claude.js` → `/api/ai/run-prompt`.
- `src/lib/dataHelpers.js` bundles cross-resource data for prompt inputs (session planning, parent emails, homework).

## Gotchas

- **Sensitive Vercel env vars pull as empty strings.** After `vercel env pull`, grep `.env.local` for `=""` — `CLERK_SECRET_KEY`, `DATABASE_URL`, `ANTHROPIC_API_KEY` are all marked sensitive and need to be filled in by hand from the Vercel dashboard.
- **Adding a serverless function is expensive.** Hobby plan = 12 functions max, and dispatch.js + run-prompt.js already use 2. Prefer extending `RESOURCES` over creating a new `api/*.js` file.
- **`server/` is dev-only.** If you touch a feature that POSTs to `localhost:4000`, the production app silently does nothing. Either move the route into `api/dispatch.js` or wire it through a separate deployed function (and update the function count).
- **Clerk token in tests / scripts.** There's no service account — every API call needs a real user JWT. Local scripts that need DB access should import from `api/_lib/db.js` directly with `DATABASE_URL` and skip the HTTP layer.
