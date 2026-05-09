// One-time migration: split legacy assessment records (with baked-in ai_analysis)
// into separate assessment + analysis records.

const MIGRATION_KEY = 'decodable_migration_version'
const CURRENT_VERSION = 2

export function runMigration() {
  const version = Number(localStorage.getItem(MIGRATION_KEY) || '1')
  if (version >= CURRENT_VERSION) return

  if (version < 2) migrateV2()

  localStorage.setItem(MIGRATION_KEY, String(CURRENT_VERSION))
}

function migrateV2() {
  const assessments = JSON.parse(localStorage.getItem('decodable_assessments') || '[]')
  const analyses = JSON.parse(localStorage.getItem('decodable_analyses') || '[]')

  let changed = false

  for (const assessment of assessments) {
    if (!assessment.ai_analysis || assessment._migrated) continue

    // Create a new analysis record from the baked-in ai_analysis
    analyses.push({
      id: crypto.randomUUID(),
      student_id: assessment.student_id,
      date: assessment.date,
      assessment_ids: [assessment.id],
      ai_analysis: assessment.ai_analysis,
      created_at: assessment.created_at || new Date().toISOString(),
    })

    // Tag the assessment as migrated and add missing fields
    assessment._migrated = true
    if (!assessment.category_id) assessment.category_id = 'intake-snapshot'
    if (!assessment.entry_method) assessment.entry_method = 'photo'
    if (!assessment.form_data) assessment.form_data = {}
    if (!assessment.photos) assessment.photos = []
    if (!assessment.notes) assessment.notes = ''

    changed = true
  }

  if (changed) {
    localStorage.setItem('decodable_assessments', JSON.stringify(assessments))
    localStorage.setItem('decodable_analyses', JSON.stringify(analyses))
  }
}
