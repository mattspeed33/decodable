import {
  getStudent,
  getLatestAnalysis,
  getLatestSession,
  getLatestEmailSummary,
} from './storage'

export async function bundleForSessionPlan(studentId, sessionLength, lastNotes) {
  const [student, analysis, lastSession] = await Promise.all([
    getStudent(studentId),
    getLatestAnalysis(studentId),
    getLatestSession(studentId),
  ])
  const a = analysis?.ai_analysis

  return `
STUDENT: ${student.name}, ${student.grade} grade, age ${student.age}
SESSION TYPE: ${student.session_type}
SESSION LENGTH TODAY: ${sessionLength} minutes
SESSIONS COMPLETED: ${lastSession?.session_number || 0} of ${student.total_sessions_planned}
TUTOR NAME: ${student.tutor_name}

CURRENT UFLI PLACEMENT:
Last unit mastered: Unit ${a?.ufli_placement?.last_unit_mastered || '?'} — ${a?.ufli_placement?.last_unit_name || '?'}
Working unit: Unit ${a?.ufli_placement?.current_working_unit || '?'} — ${a?.ufli_placement?.current_unit_name || '?'}
Next unlock: Unit ${a?.ufli_placement?.next_unlock_unit || '?'} — ${a?.ufli_placement?.next_unlock_name || '?'}

PRIORITY GAPS:
${a?.priority_gaps?.map(g =>
  `${g.rank}. ${g.gap} — ${g.why_it_matters}`
).join('\n') || 'Not yet analyzed'}

PATTERNS TO WATCH:
${a?.patterns_to_watch?.join('\n') || 'Not yet analyzed'}

NOTES FROM LAST SESSION:
${lastNotes || lastSession?.tutor_notes || 'No previous session notes — this is session 1.'}
  `.trim()
}

export async function bundleForEmail(studentId, sessionNotes) {
  const [student, analysis, lastSession, lastEmailSummary] = await Promise.all([
    getStudent(studentId),
    getLatestAnalysis(studentId),
    getLatestSession(studentId),
    getLatestEmailSummary(studentId),
  ])
  const a = analysis?.ai_analysis

  return `
STUDENT: ${student.name}, ${student.grade} grade
PARENT NAME: ${student.parent_name}
TUTOR NAME: ${student.tutor_name}
CURRENT UFLI UNIT: Unit ${a?.ufli_placement?.current_working_unit || '?'} — ${a?.ufli_placement?.current_unit_name || '?'}

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

export async function bundleForHomework(studentId) {
  const [student, analysis] = await Promise.all([
    getStudent(studentId),
    getLatestAnalysis(studentId),
  ])
  const a = analysis?.ai_analysis

  return `
STUDENT NAME: ${student.name}
GRADE: ${student.grade}
AGE: ${student.age}
TUTOR NAME: ${student.tutor_name}
CURRENT UFLI UNIT: Unit ${a?.ufli_placement?.current_working_unit || '?'} — ${a?.ufli_placement?.current_unit_name || '?'}

SPECIFIC PATTERN GAPS TO ADDRESS:
${a?.priority_gaps?.map(g =>
  `• ${g.gap}`
).join('\n') || 'Not yet analyzed'}

PATTERNS TO WATCH:
${a?.patterns_to_watch?.join('\n') || 'Not yet analyzed'}
  `.trim()
}
