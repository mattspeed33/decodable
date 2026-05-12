// On first sign-in after the server backend lands, copy whatever data still
// lives in localStorage up to the user's account on the server. Idempotent
// across reloads (uses a localStorage flag); a failure on any one row logs
// and continues — we don't block the rest of the migration.
import { apiSave } from './api'

const MIGRATION_FLAG = 'decodable_migrated_v1'

const TABLES = [
  { lsKey: 'decodable_students',              slug: 'students' },
  { lsKey: 'decodable_assessments',           slug: 'assessments' },
  { lsKey: 'decodable_analyses',              slug: 'analyses' },
  { lsKey: 'decodable_sessions',              slug: 'sessions' },
  { lsKey: 'decodable_scheduled_sessions',    slug: 'scheduled-sessions' },
  { lsKey: 'decodable_emails',                slug: 'emails' },
  { lsKey: 'decodable_assessment_templates',  slug: 'assessment-templates' },
  { lsKey: 'decodable_template_assignments',  slug: 'template-assignments' },
  { lsKey: 'decodable_homework_sheets',       slug: 'homework-sheets' },
  { lsKey: 'decodable_report_cards',          slug: 'report-cards' },
]

export async function maybeMigrateOnce() {
  if (localStorage.getItem(MIGRATION_FLAG) === 'true') {
    return { migrated: false, counts: {} }
  }

  const counts = {}
  for (const { lsKey, slug } of TABLES) {
    const raw = localStorage.getItem(lsKey)
    if (!raw) continue
    let items
    try { items = JSON.parse(raw) } catch { continue }
    if (!Array.isArray(items) || items.length === 0) continue

    let saved = 0
    for (const item of items) {
      if (!item?.id) continue
      try {
        await apiSave(slug, item)
        saved++
      } catch (e) {
        console.warn(`Failed to migrate ${slug} id=${item.id}:`, e.message)
      }
    }
    if (saved > 0) counts[slug] = saved
  }

  localStorage.setItem(MIGRATION_FLAG, 'true')
  return { migrated: true, counts }
}
