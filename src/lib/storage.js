// ── STUDENTS ──────────────────────────────────────────
export function getStudents() {
  return JSON.parse(localStorage.getItem('decodable_students') || '[]')
}

export function getStudent(id) {
  return getStudents().find(s => s.id === id) || null
}

export function saveStudent(student) {
  const students = getStudents()
  const index = students.findIndex(s => s.id === student.id)
  if (index >= 0) {
    students[index] = student
  } else {
    students.push(student)
  }
  localStorage.setItem('decodable_students', JSON.stringify(students))
}

export function deleteStudent(id) {
  const students = getStudents().filter(s => s.id !== id)
  localStorage.setItem('decodable_students', JSON.stringify(students))
}

// ── ASSESSMENTS ───────────────────────────────────────
export function getAssessments(studentId) {
  const all = JSON.parse(
    localStorage.getItem('decodable_assessments') || '[]'
  )
  return all
    .filter(a => a.student_id === studentId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function getLatestAssessment(studentId) {
  return getAssessments(studentId)[0] || null
}

export function saveAssessment(assessment) {
  const all = JSON.parse(
    localStorage.getItem('decodable_assessments') || '[]'
  )
  const index = all.findIndex(a => a.id === assessment.id)
  if (index >= 0) {
    all[index] = assessment
  } else {
    all.push(assessment)
  }
  localStorage.setItem('decodable_assessments', JSON.stringify(all))
}

// ── SCHEDULED SESSIONS ────────────────────────────────
export function getScheduledSessions(studentId = null) {
  const all = JSON.parse(localStorage.getItem('decodable_scheduled_sessions') || '[]')
  const filtered = studentId ? all.filter(s => s.student_id === studentId) : all
  return filtered.sort((a, b) => new Date(a.date) - new Date(b.date))
}

export function saveScheduledSession(scheduled) {
  const all = JSON.parse(localStorage.getItem('decodable_scheduled_sessions') || '[]')
  const index = all.findIndex(s => s.id === scheduled.id)
  if (index >= 0) { all[index] = scheduled } else { all.push(scheduled) }
  localStorage.setItem('decodable_scheduled_sessions', JSON.stringify(all))
}

export function deleteScheduledSession(id) {
  const all = JSON.parse(localStorage.getItem('decodable_scheduled_sessions') || '[]').filter(s => s.id !== id)
  localStorage.setItem('decodable_scheduled_sessions', JSON.stringify(all))
}

// ── SESSIONS ──────────────────────────────────────────
export function getAllSessions() {
  return JSON.parse(localStorage.getItem('decodable_sessions') || '[]')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function getSessions(studentId) {
  const all = JSON.parse(
    localStorage.getItem('decodable_sessions') || '[]'
  )
  return all
    .filter(s => s.student_id === studentId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function getLatestSession(studentId) {
  return getSessions(studentId)[0] || null
}

export function saveSession(session) {
  const all = JSON.parse(
    localStorage.getItem('decodable_sessions') || '[]'
  )
  const index = all.findIndex(s => s.id === session.id)
  if (index >= 0) {
    all[index] = session
  } else {
    all.push(session)
  }
  localStorage.setItem('decodable_sessions', JSON.stringify(all))
}

// ── EMAIL LOG ─────────────────────────────────────────
export function getEmailLog(studentId) {
  const all = JSON.parse(
    localStorage.getItem('decodable_emails') || '[]'
  )
  return all
    .filter(e => e.student_id === studentId)
    .sort((a, b) => new Date(b.date_sent) - new Date(a.date_sent))
}

export function getLatestEmailSummary(studentId) {
  const latest = getEmailLog(studentId)[0]
  return latest?.summary_for_next_prompt || null
}

export function saveEmail(emailRecord) {
  const all = JSON.parse(
    localStorage.getItem('decodable_emails') || '[]'
  )
  all.push(emailRecord)
  localStorage.setItem('decodable_emails', JSON.stringify(all))
}

// ── ASSESSMENT TEMPLATES ──────────────────────────────
export function getAssessmentTemplates() {
  return JSON.parse(localStorage.getItem('decodable_assessment_templates') || '[]')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export function getAssessmentTemplate(templateId) {
  return getAssessmentTemplates().find(t => t.id === templateId) || null
}

export function saveAssessmentTemplate(template) {
  const all = getAssessmentTemplates()
  const index = all.findIndex(t => t.id === template.id)
  if (index >= 0) {
    all[index] = template
  } else {
    all.push(template)
  }
  localStorage.setItem('decodable_assessment_templates', JSON.stringify(all))
}

export function deleteAssessmentTemplate(templateId) {
  const all = getAssessmentTemplates().filter(t => t.id !== templateId)
  localStorage.setItem('decodable_assessment_templates', JSON.stringify(all))
}

// ── TEMPLATE ASSIGNMENTS ──────────────────────────────
export function getTemplateAssignments(studentId = null) {
  const all = JSON.parse(localStorage.getItem('decodable_template_assignments') || '[]')
  const filtered = studentId ? all.filter(a => a.student_id === studentId) : all
  return filtered.sort((a, b) => new Date(b.assigned_at) - new Date(a.assigned_at))
}

export function saveTemplateAssignment(assignment) {
  const all = JSON.parse(localStorage.getItem('decodable_template_assignments') || '[]')
  const index = all.findIndex(a => a.id === assignment.id)
  if (index >= 0) {
    all[index] = assignment
  } else {
    all.push(assignment)
  }
  localStorage.setItem('decodable_template_assignments', JSON.stringify(all))
}

// ── HOMEWORK SHEETS ───────────────────────────────────
export function getHomeworkSheets(studentId = null) {
  const all = JSON.parse(localStorage.getItem('decodable_homework_sheets') || '[]')
  const filtered = studentId ? all.filter(s => s.student_id === studentId) : all
  return filtered.sort((a, b) => new Date(b.assigned_at || b.created_at) - new Date(a.assigned_at || a.created_at))
}

export function getHomeworkSheet(sheetId) {
  return getHomeworkSheets().find(s => s.id === sheetId) || null
}

export function saveHomeworkSheet(sheet) {
  const all = getHomeworkSheets()
  const index = all.findIndex(s => s.id === sheet.id)
  if (index >= 0) {
    all[index] = sheet
  } else {
    all.push(sheet)
  }
  localStorage.setItem('decodable_homework_sheets', JSON.stringify(all))
}

// ── PROGRESS ──────────────────────────────────────────
export function getProgress(studentId) {
  const student = getStudent(studentId)
  const assessments = getAssessments(studentId)
  const sessions = getSessions(studentId)

  const gradeTargets = {
    'K':   { fluency_pct: 60, ufli_unit: 10 },
    '1st': { fluency_pct: 85, ufli_unit: 17 },
    '2nd': { fluency_pct: 85, ufli_unit: 20 },
    '3rd': { fluency_pct: 90, ufli_unit: 24 }
  }

  const target = gradeTargets[student?.grade] || gradeTargets['1st']
  const latest = assessments[0]

  return {
    student_id: studentId,
    assessments_completed: assessments.length,
    sessions_completed: sessions.length,
    sessions_remaining:
      (student?.total_sessions_planned || 4) - sessions.length,
    fluency_over_time: assessments.map(a => ({
      session: a.session_number,
      date: a.date,
      fluency_pct: a.ai_analysis?.fluency_estimate_pct || 0
    })).reverse(),
    ufli_units_over_time: assessments.map(a => ({
      session: a.session_number,
      date: a.date,
      working_unit: a.ai_analysis?.ufli_placement?.current_working_unit || 0
    })).reverse(),
    grade_level_benchmark: {
      grade: student?.grade,
      expected_fluency_pct: target.fluency_pct,
      expected_ufli_unit: target.ufli_unit,
      current_fluency_pct: latest?.ai_analysis?.fluency_estimate_pct || 0,
      current_ufli_unit:
        latest?.ai_analysis?.ufli_placement?.current_working_unit || 0,
      fluency_gap: target.fluency_pct -
        (latest?.ai_analysis?.fluency_estimate_pct || 0),
      unit_gap: target.ufli_unit -
        (latest?.ai_analysis?.ufli_placement?.current_working_unit || 0)
    },
    flags_still_active:
      latest?.ai_analysis?.patterns_to_watch || []
  }
}
