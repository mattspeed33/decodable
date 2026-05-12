// Server-backed data access. Every function is async. Names match the pre-API
// localStorage shape so most components only need to await the calls.
import { apiList, apiGet, apiSave, apiDelete } from './api'

// ── STUDENTS ──────────────────────────────────────────
export const getStudents = () => apiList('students').then(r => r || [])
export const getStudent = (id) => apiGet('students', id)
export const saveStudent = (student) => apiSave('students', student)
export const deleteStudent = (id) => apiDelete('students', id)

// ── ASSESSMENTS ───────────────────────────────────────
export const getAssessments = (studentId) =>
  apiList('assessments', { student_id: studentId }).then(r => r || [])

export const getLatestAssessment = async (studentId) => {
  const list = await getAssessments(studentId)
  return list[0] || null
}

export const saveAssessment = (assessment) => apiSave('assessments', assessment)
export const deleteAssessment = (id) => apiDelete('assessments', id)

// ── ANALYSES ─────────────────────────────────────────
export const getAllAnalyses = () => apiList('analyses').then(r => r || [])

export const getAnalyses = (studentId) =>
  apiList('analyses', { student_id: studentId }).then(r => r || [])

export const getLatestAnalysis = async (studentId) => {
  const list = await getAnalyses(studentId)
  if (list.length > 0) return list[0]
  // Legacy fallback: an old assessment might still embed ai_analysis directly.
  const a = await getLatestAssessment(studentId)
  if (a?.ai_analysis) {
    return {
      id: a.id,
      student_id: studentId,
      date: a.date,
      assessment_ids: [a.id],
      ai_analysis: a.ai_analysis,
    }
  }
  return null
}

export const saveAnalysis = (analysis) => apiSave('analyses', analysis)
export const deleteAnalysis = (id) => apiDelete('analyses', id)

// ── SESSIONS ──────────────────────────────────────────
export const getAllSessions = () => apiList('sessions').then(r => r || [])

export const getSessions = (studentId) =>
  apiList('sessions', { student_id: studentId }).then(r => r || [])

export const getLatestSession = async (studentId) => {
  const list = await getSessions(studentId)
  return list[0] || null
}

export const saveSession = (session) => apiSave('sessions', session)

// ── SCHEDULED SESSIONS ────────────────────────────────
export const getScheduledSessions = (studentId = null) => {
  const filter = studentId ? { student_id: studentId } : undefined
  return apiList('scheduled-sessions', filter).then(r => r || [])
}

export const saveScheduledSession = (s) => apiSave('scheduled-sessions', s)
export const deleteScheduledSession = (id) => apiDelete('scheduled-sessions', id)

// ── EMAIL LOG ─────────────────────────────────────────
export const getEmailLog = (studentId) =>
  apiList('emails', { student_id: studentId }).then(r => r || [])

export const getLatestEmailSummary = async (studentId) => {
  const list = await getEmailLog(studentId)
  return list[0]?.summary_for_next_prompt || null
}

export const saveEmail = (record) => apiSave('emails', record)

// ── ASSESSMENT TEMPLATES ──────────────────────────────
export const getAssessmentTemplates = () =>
  apiList('assessment-templates').then(r => r || [])

export const getAssessmentTemplate = (templateId) =>
  apiGet('assessment-templates', templateId)

export const saveAssessmentTemplate = (template) =>
  apiSave('assessment-templates', template)

export const deleteAssessmentTemplate = (templateId) =>
  apiDelete('assessment-templates', templateId)

// ── TEMPLATE ASSIGNMENTS ──────────────────────────────
export const getTemplateAssignments = (studentId = null) => {
  const filter = studentId ? { student_id: studentId } : undefined
  return apiList('template-assignments', filter).then(r => r || [])
}

export const saveTemplateAssignment = (a) => apiSave('template-assignments', a)

// ── HOMEWORK SHEETS ───────────────────────────────────
export const getHomeworkSheets = (studentId = null) => {
  const filter = studentId ? { student_id: studentId } : undefined
  return apiList('homework-sheets', filter).then(r => r || [])
}

export const getHomeworkSheet = (sheetId) => apiGet('homework-sheets', sheetId)
export const saveHomeworkSheet = (sheet) => apiSave('homework-sheets', sheet)

// ── REPORT CARDS ─────────────────────────────────────
export const getAllReportCards = () => apiList('report-cards').then(r => r || [])

export const getReportCards = (studentId) =>
  apiList('report-cards', { student_id: studentId }).then(r => r || [])

export const saveReportCard = (report) => apiSave('report-cards', report)
export const deleteReportCard = (id) => apiDelete('report-cards', id)

// ── PROGRESS ──────────────────────────────────────────
export async function getProgress(studentId) {
  const [student, assessments, sessions, analyses] = await Promise.all([
    getStudent(studentId),
    getAssessments(studentId),
    getSessions(studentId),
    getAnalyses(studentId),
  ])

  const gradeTargets = {
    'K':   { fluency_pct: 60, ufli_unit: 10 },
    '1st': { fluency_pct: 85, ufli_unit: 17 },
    '2nd': { fluency_pct: 85, ufli_unit: 20 },
    '3rd': { fluency_pct: 90, ufli_unit: 24 },
  }
  const target = gradeTargets[student?.grade] || gradeTargets['1st']
  const latestAn = analyses[0]

  return {
    student_id: studentId,
    assessments_completed: assessments.length,
    sessions_completed: sessions.length,
    sessions_remaining: (student?.total_sessions_planned || 4) - sessions.length,
    fluency_over_time: analyses.map(a => ({
      date: a.date,
      fluency_pct: a.ai_analysis?.fluency_estimate_pct || 0,
    })).reverse(),
    ufli_units_over_time: analyses.map(a => ({
      date: a.date,
      working_unit: a.ai_analysis?.ufli_placement?.current_working_unit || 0,
    })).reverse(),
    grade_level_benchmark: {
      grade: student?.grade,
      expected_fluency_pct: target.fluency_pct,
      expected_ufli_unit: target.ufli_unit,
      current_fluency_pct: latestAn?.ai_analysis?.fluency_estimate_pct || 0,
      current_ufli_unit: latestAn?.ai_analysis?.ufli_placement?.current_working_unit || 0,
      fluency_gap: target.fluency_pct - (latestAn?.ai_analysis?.fluency_estimate_pct || 0),
      unit_gap: target.ufli_unit - (latestAn?.ai_analysis?.ufli_placement?.current_working_unit || 0),
    },
    flags_still_active: latestAn?.ai_analysis?.patterns_to_watch || [],
  }
}
