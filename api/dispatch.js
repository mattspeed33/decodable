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
  // Vercel's legacy Node runtime doesn't reliably populate req.query.path for
  // catch-all routes, so derive the segments from req.url directly.
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  const segments = url.pathname.replace(/^\/api\//, '').split('/').filter(Boolean)

  if (segments.length === 0 || segments.length > 2) {
    return res.status(404).json({ error: 'Not found' })
  }

  const [slug, id] = segments
  const resource = handlers[slug]
  if (!resource) return res.status(404).json({ error: `Unknown resource: ${slug}` })

  if (id) {
    req.query.id = id
    return resource.item(req, res)
  }
  return resource.collection(req, res)
}
