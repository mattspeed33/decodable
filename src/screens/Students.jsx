import { useNavigate } from 'react-router-dom'
import { getStudents, getAllSessions, getAllAnalyses } from '../lib/storage'
import { useAsync } from '../lib/useAsync'

const gradeEmoji = { 'K': '🌱', '1st': '🌿', '2nd': '🌳', '3rd': '🏆' }

export default function Students() {
  const navigate = useNavigate()
  const { data: students = [], loading } = useAsync(() => getStudents())
  const { data: allSessions = [] } = useAsync(() => getAllSessions())
  const { data: allAnalyses = [] } = useAsync(() => getAllAnalyses())

  // Latest analysis per student. The list is already sorted by date desc.
  const latestByStudent = {}
  for (const a of allAnalyses) {
    if (!latestByStudent[a.student_id]) latestByStudent[a.student_id] = a
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black text-black tracking-tight">Students</h2>
        <button
          onClick={() => navigate('/students/new')}
          className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-[var(--primary-hover)] transition shadow-sm"
        >
          + Add Student
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-20 text-sm font-bold">Loading…</p>
      ) : students.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl block mb-4">📚</span>
          <p className="text-gray-500 text-lg font-bold mb-1">No students yet</p>
          <p className="text-gray-400 text-sm">Add your first student to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {students.map(s => {
            const a = latestByStudent[s.id]
            const fluency = a?.ai_analysis?.fluency_estimate_pct || 0
            const ufli = a?.ai_analysis?.ufli_placement
            const sessCount = allSessions.filter(ses => ses.student_id === s.id).length
            const sessRemaining = (s.total_sessions_planned === 999 ? null : s.total_sessions_planned) ? s.total_sessions_planned - sessCount : null

            return (
              <button
                key={s.id}
                onClick={() => navigate(`/students/${s.id}`)}
                className="bg-white rounded-2xl border-2 border-gray-100 p-6 text-left hover:border-[var(--primary)] hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{gradeEmoji[s.grade] || '📚'}</span>
                    <div>
                      <h3 className="font-black text-black text-lg leading-tight">{s.name}</h3>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{s.grade} grade &middot; Age {s.age}</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-[var(--primary-light)] text-[var(--primary)] px-2.5 py-1 rounded-full font-black uppercase tracking-wide">
                    {s.session_type}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs bg-[var(--blue-light)] text-[var(--blue)] px-2 py-0.5 rounded-full font-bold">
                    {sessCount} session{sessCount !== 1 ? 's' : ''}
                  </span>
                  {ufli && (
                    <span className="text-xs bg-[var(--primary-light)] text-[var(--primary)] px-2 py-0.5 rounded-full font-bold">
                      📘 Unit {ufli.current_working_unit}
                    </span>
                  )}
                  {sessRemaining !== null && sessRemaining > 0 && (
                    <span className="text-xs bg-[var(--gold-light)] text-[var(--orange)] px-2 py-0.5 rounded-full font-bold">
                      {sessRemaining} left
                    </span>
                  )}
                </div>

                {/* Fluency bar */}
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-2.5 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, fluency)}%`,
                      background: fluency >= 80 ? 'var(--green)' : fluency >= 50 ? 'var(--orange)' : fluency > 0 ? 'var(--red)' : '#e5e7eb',
                      minWidth: fluency > 0 ? '8px' : '0'
                    }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 font-bold mt-1">
                  {fluency > 0 ? `${fluency}% fluency` : 'No assessment yet'}
                </p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
