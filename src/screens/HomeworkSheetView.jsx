import { useNavigate, useParams } from 'react-router-dom'
import { getHomeworkSheet, getStudent } from '../lib/storage'
import { useAsync } from '../lib/useAsync'
import StudentTabs from '../components/StudentTabs.jsx'

export default function HomeworkSheetView() {
  const navigate = useNavigate()
  const { id, sheetId } = useParams()
  const { data: student, loading: l1 } = useAsync(() => getStudent(id), [id])
  const { data: sheet, loading: l2 } = useAsync(() => getHomeworkSheet(sheetId), [sheetId])

  if (l1 || l2) {
    return <p className="text-center text-gray-400 py-20 text-sm font-bold">Loading…</p>
  }

  if (!student || !sheet || sheet.student_id !== id) {
    return <p className="text-center text-gray-400 py-20">Homework sheet not found.</p>
  }

  return (
    <div className="space-y-5">
      <StudentTabs studentId={id} />

      <div className="homework-sheet">
        <div className="mb-6">
          <h2 className="text-3xl font-black text-black tracking-tight">Homework</h2>
          <p className="text-sm text-gray-500 mt-1">{sheet.student_name || student.name} &middot; Week of {sheet.week_of}</p>
          <p className="text-sm font-semibold text-black mt-1">Skill: {sheet.skill_focus}</p>
        </div>

        <div className="space-y-4">
          {(sheet.activities || []).map((activity, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 p-5 bg-white">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-black">Activity {activity.number}: {activity.name}</h3>
                <span className="text-xs text-gray-400 shrink-0 ml-2">{activity.time_minutes} min</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">{activity.skill}</p>
              <ol className="text-sm text-gray-700 list-decimal ml-4 space-y-1">
                {(activity.parent_instructions || []).map((step, j) => (
                  <li key={j}>{step}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        {sheet.tutor_note_to_parent && (
          <div className="rounded-2xl border border-gray-200 p-5 mt-4 bg-white">
            <p className="text-sm text-gray-700">{sheet.tutor_note_to_parent}</p>
          </div>
        )}
      </div>

      <div className="action-buttons flex gap-3">
        <button onClick={() => window.print()} className="flex-1 bg-[var(--primary)] text-white py-3 rounded-full font-semibold hover:bg-[var(--primary-hover)] transition">
          Print
        </button>
        <button onClick={() => navigate(`/students/${id}/homework/new`)} className="flex-1 bg-white border border-gray-200 py-3 rounded-full font-semibold text-black hover:border-black transition">
          Regenerate
        </button>
      </div>
    </div>
  )
}
