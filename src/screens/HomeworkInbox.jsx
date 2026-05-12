import { useNavigate, useParams } from 'react-router-dom'
import { Plus, FileText, ArrowRight } from 'lucide-react'
import { getHomeworkSheets, getStudents, getStudent } from '../lib/storage'
import { useAsync } from '../lib/useAsync'
import { BtnPrimary, BtnSecondary } from '../components/v4/primitives.jsx'

export default function HomeworkInbox({ studentId }) {
  const navigate = useNavigate()
  const params = useParams()
  const id = studentId || params.id

  const { data: student } = useAsync(() => id ? getStudent(id) : Promise.resolve(null), [id])
  const { data: students = [] } = useAsync(() => getStudents())
  const { data: sheets = [] } = useAsync(() => getHomeworkSheets(id || null), [id])

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[22px] font-bold text-[var(--v4-ink)] tracking-[-0.5px]">
          {id ? `${student?.name || 'Student'} · Homework` : 'Homework'}
        </h2>
        {id ? (
          <BtnPrimary onClick={() => navigate(`/students/${id}/homework/new`)}>
            <Plus className="w-3.5 h-3.5" /> Generate & Assign
          </BtnPrimary>
        ) : (
          <BtnSecondary onClick={() => navigate('/students')}>
            Open a Student
          </BtnSecondary>
        )}
      </div>

      {!id && (
        <p className="text-[12.5px] text-[var(--v4-ink-3)]">
          Viewing all saved homework. Open a student profile to generate a new assignment.
        </p>
      )}

      {sheets.length === 0 ? (
        <div className="border border-[var(--v4-border)] rounded-[10px] bg-[var(--v4-surface)] px-4 py-10 text-center">
          <FileText className="w-5 h-5 mx-auto mb-2 text-[var(--v4-ink-3)]" />
          <p className="text-[13px] font-medium text-[var(--v4-ink-2)]">No saved homework yet</p>
          <p className="text-[12px] text-[var(--v4-ink-3)] mt-0.5">Generated homework will appear here and can be printed any time.</p>
        </div>
      ) : (
        <div className="border border-[var(--v4-border)] rounded-[10px] bg-[var(--v4-surface)] overflow-hidden">
          {sheets.map((sheet, i) => {
            const listStudent = student || students.find(s => s.id === sheet.student_id)
            return (
              <button
                key={sheet.id}
                onClick={() => navigate(`/students/${sheet.student_id}/homework/${sheet.id}`)}
                className={`w-full grid items-center gap-3 px-4 py-3 text-left hover:bg-[var(--v4-surface-2)] ${
                  i === sheets.length - 1 ? '' : 'border-b border-[var(--v4-border)]'
                }`}
                style={{ gridTemplateColumns: '32px 1fr auto auto' }}
              >
                <div className="w-8 h-8 rounded-md bg-[var(--v4-amber-lt)] text-[var(--v4-amber)] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-[var(--v4-ink)] truncate">{listStudent?.name || 'Unknown student'}</p>
                  <p className="text-[11.5px] text-[var(--v4-ink-3)] truncate mt-0.5">
                    {sheet.skill_focus || 'Practice'}{sheet.week_of ? ` · Week of ${sheet.week_of}` : ''}
                  </p>
                </div>
                <span className="text-[10.5px] bg-[var(--v4-amber-lt)] text-[var(--v4-amber)] px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
                  Ready to print
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--v4-ink-4)]" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
