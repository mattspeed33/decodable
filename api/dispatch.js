import { makeCollectionHandler, makeItemHandler } from './_lib/crud.js'

// All resource configs in one place. URL slug (kebab-case) → DB table config.
// Vercel hobby caps at 12 serverless functions per project; one catch-all
// keeps the whole CRUD surface as a single function.
const RESOURCES = {
  students: { table: 'students' },
  assessments: {
    table: 'assessments',
    columns: ['student_id', 'date'],
    orderBy: 'date',
    scopeColumns: ['student_id'],
  },
  analyses: {
    table: 'analyses',
    columns: ['student_id', 'date'],
    orderBy: 'date',
    scopeColumns: ['student_id'],
  },
  sessions: {
    table: 'sessions',
    columns: ['student_id', 'date'],
    orderBy: 'date',
    scopeColumns: ['student_id'],
  },
  'scheduled-sessions': {
    table: 'scheduled_sessions',
    columns: ['student_id', 'date'],
    orderBy: 'date',
    orderDir: 'asc',
    scopeColumns: ['student_id'],
  },
  emails: {
    table: 'emails',
    columns: ['student_id', 'date_sent'],
    orderBy: 'date_sent',
    scopeColumns: ['student_id'],
    hasUpdatedAt: false,
  },
  'assessment-templates': { table: 'assessment_templates' },
  'template-assignments': {
    table: 'template_assignments',
    columns: ['student_id', 'template_id'],
    scopeColumns: ['student_id'],
    hasUpdatedAt: false,
  },
  'homework-sheets': {
    table: 'homework_sheets',
    columns: ['student_id'],
    scopeColumns: ['student_id'],
  },
  'report-cards': {
    table: 'report_cards',
    columns: ['student_id', 'date'],
    orderBy: 'date',
    scopeColumns: ['student_id'],
  },
}

// Pre-build the handlers once at cold start.
const handlers = {}
for (const [slug, config] of Object.entries(RESOURCES)) {
  handlers[slug] = {
    collection: makeCollectionHandler(config),
    item: makeItemHandler({ table: config.table }),
  }
}

export default async function handler(req, res) {
  // slug and id arrive as query params from the vercel.json rewrites:
  //   /api/<slug>         → /api/dispatch?slug=<slug>
  //   /api/<slug>/<id>    → /api/dispatch?slug=<slug>&id=<id>
  const { slug, id } = req.query
  if (!slug) return res.status(404).json({ error: 'Missing resource slug' })

  const resource = handlers[slug]
  if (!resource) return res.status(404).json({ error: `Unknown resource: ${slug}` })

  if (id) return resource.item(req, res)
  return resource.collection(req, res)
}
