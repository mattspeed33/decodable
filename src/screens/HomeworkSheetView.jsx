import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Printer, RefreshCw } from 'lucide-react'
import { getHomeworkSheet, getStudent } from '../lib/storage'
import { useAsync } from '../lib/useAsync'
import { BtnPrimary, BtnSecondary, Card } from '../components/v4/primitives.jsx'

export default function HomeworkSheetView() {
  const navigate = useNavigate()
  const { id, sheetId } = useParams()
  const { data: student, loading: l1 } = useAsync(() => getStudent(id), [id])
  const { data: sheet, loading: l2 } = useAsync(() => getHomeworkSheet(sheetId), [sheetId])

  if (l1 || l2) {
    return <p className="text-center text-[var(--v4-ink-3)] py-20 text-sm font-medium">Loading…</p>
  }

  if (!student || !sheet || sheet.student_id !== id) {
    return <p className="text-center text-[var(--v4-ink-3)] py-20 text-sm font-medium">Homework sheet not found.</p>
  }

  return (
    <div className="max-w-3xl space-y-5">
      <button
        onClick={() => navigate(`/students/${id}`)}
        className="flex items-center gap-1 text-[11.5px] text-[var(--v4-ink-3)] hover:text-[var(--v4-ink)] font-medium"
      >
        <ArrowLeft className="w-3 h-3" /> {student.name}
      </button>

      <div className="homework-sheet space-y-4">
        <div>
          <h2 className="text-[22px] font-bold text-[var(--v4-ink)] tracking-[-0.5px]">Homework</h2>
          <p className="text-[12.5px] text-[var(--v4-ink-3)] mt-0.5">
            {sheet.student_name || student.name} · Week of {sheet.week_of}
          </p>
          {sheet.skill_focus && (
            <p className="text-[13px] font-semibold text-[var(--v4-ink)] mt-1">Skill: {sheet.skill_focus}</p>
          )}
        </div>

        <div className="space-y-3">
          {(sheet.activities || []).map((activity, i) => (
            <Card key={i} padding="p-4">
              <div className="flex items-start justify-between mb-1.5">
                <p className="text-[13.5px] font-semibold text-[var(--v4-ink)]">
                  Activity {activity.number}: {activity.name}
                </p>
                <span className="text-[10.5px] text-[var(--v4-ink-3)] font-semibold bg-[var(--v4-surface-3)] px-1.5 py-0.5 rounded whitespace-nowrap shrink-0 ml-2">
                  {activity.time_minutes} min
                </span>
              </div>
              {activity.skill && (
                <p className="text-[11.5px] text-[var(--v4-ink-3)] mb-2">{activity.skill}</p>
              )}
              <ol className="text-[13px] text-[var(--v4-ink-2)] list-decimal ml-4 space-y-1">
                {(activity.parent_instructions || []).map((step, j) => (
                  <li key={j}>{step}</li>
                ))}
              </ol>
            </Card>
          ))}
        </div>

        {sheet.tutor_note_to_parent && (
          <Card padding="p-4">
            <p className="text-[10.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-1">Note from tutor</p>
            <p className="text-[13px] text-[var(--v4-ink-2)]">{sheet.tutor_note_to_parent}</p>
          </Card>
        )}
      </div>

      <div className="action-buttons flex items-center gap-2">
        <BtnPrimary onClick={() => window.print()} className="flex-1 justify-center py-2.5">
          <Printer className="w-3.5 h-3.5" /> Print
        </BtnPrimary>
        <BtnSecondary onClick={() => navigate(`/students/${id}/homework/new`)} className="flex-1 justify-center py-2.5">
          <RefreshCw className="w-3.5 h-3.5" /> Regenerate
        </BtnSecondary>
      </div>
    </div>
  )
}
