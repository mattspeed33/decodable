import {
  getStudent,
  getLatestAssessment,
  getLatestSession,
  getLatestEmailSummary
} from './storage'

export function bundleForSessionPlan(studentId, sessionLength, lastNotes) {
  const student = getStudent(studentId)
  const assessment = getLatestAssessment(studentId)
  const lastSession = getLatestSession(studentId)

  return `
STUDENT: ${student.name}, ${student.grade} grade, age ${student.age}
SESSION TYPE: ${student.session_type}
SESSION LENGTH TODAY: ${sessionLength} minutes
SESSIONS COMPLETED: ${lastSession?.session_number || 0} of ${student.total_sessions_planned}
TUTOR NAME: ${student.tutor_name}

CURRENT UFLI PLACEMENT:
Last unit mastered: Unit ${assessment.ai_analysis.ufli_placement.last_unit_mastered} — ${assessment.ai_analysis.ufli_placement.last_unit_name}
Working unit: Unit ${assessment.ai_analysis.ufli_placement.current_working_unit} — ${assessment.ai_analysis.ufli_placement.current_unit_name}
Next unlock: Unit ${assessment.ai_analysis.ufli_placement.next_unlock_unit} — ${assessment.ai_analysis.ufli_placement.next_unlock_name}

PRIORITY GAPS:
${assessment.ai_analysis.priority_gaps.map(g =>
  `${g.rank}. ${g.gap} — ${g.why_it_matters}`
).join('\n')}

PATTERNS TO WATCH:
${assessment.ai_analysis.patterns_to_watch.join('\n')}

NOTES FROM LAST SESSION:
${lastNotes || lastSession?.tutor_notes || 'No previous session notes — this is session 1.'}
  `.trim()
}

export function bundleForEmail(studentId, sessionNotes) {
  const student = getStudent(studentId)
  const assessment = getLatestAssessment(studentId)
  const lastSession = getLatestSession(studentId)
  const lastEmailSummary = getLatestEmailSummary(studentId)

  return `
STUDENT: ${student.name}, ${student.grade} grade
PARENT NAME: ${student.parent_name}
TUTOR NAME: ${student.tutor_name}
CURRENT UFLI UNIT: Unit ${assessment.ai_analysis.ufli_placement.current_working_unit} — ${assessment.ai_analysis.ufli_placement.current_unit_name}

WHAT WAS WORKED ON THIS SESSION:
${sessionNotes || lastSession?.tutor_notes || 'General literacy session'}

WHAT WENT WELL:
${lastSession?.what_went_well || 'Not noted'}

WHAT NEEDS MORE WORK:
${lastSession?.what_needs_more_work || 'Not noted'}

LAST WEEK EMAIL SUMMARY (do not repeat this content):
${lastEmailSummary || 'This is the first parent email for this student.'}
  `.trim()
}

export function bundleForHomework(studentId) {
  const student = getStudent(studentId)
  const assessment = getLatestAssessment(studentId)

  return `
STUDENT NAME: ${student.name}
GRADE: ${student.grade}
AGE: ${student.age}
TUTOR NAME: ${student.tutor_name}
CURRENT UFLI UNIT: Unit ${assessment.ai_analysis.ufli_placement.current_working_unit} — ${assessment.ai_analysis.ufli_placement.current_unit_name}

SPECIFIC PATTERN GAPS TO ADDRESS:
${assessment.ai_analysis.priority_gaps.map(g =>
  `• ${g.gap}`
).join('\n')}

PATTERNS TO WATCH:
${assessment.ai_analysis.patterns_to_watch.join('\n')}
  `.trim()
}
