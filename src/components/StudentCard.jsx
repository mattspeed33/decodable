import { useNavigate } from 'react-router-dom'
import { getLatestAssessment, getSessions } from '../lib/storage'
import ProgressBar from './ProgressBar.jsx'

const gradeTargets = {
  'K': 60, '1st': 85, '2nd': 85, '3rd': 90
}

const gradeEmoji = {
  'K': '🌱', '1st': '🌿', '2nd': '🌳', '3rd': '🏆'
}

export default function StudentCard({ student }) {
  const navigate = useNavigate()
  const assessment = getLatestAssessment(student.id)
  const sessions = getSessions(student.id)
  const sessionsCompleted = sessions.length
  const sessionsRemaining = (student.total_sessions_planned || 4) - sessionsCompleted
  const fluency = assessment?.ai_analysis?.fluency_estimate_pct || 0
  const ufliUnit = assessment?.ai_analysis?.ufli_placement?.current_working_unit
  const target = gradeTargets[student.grade] || 75

  return (
    <div
      onClick={() => navigate(`/students/${student.id}`)}
      className="bg-white rounded-2xl border-2 border-gray-100 p-5 hover:border-[var(--primary)] hover:shadow-md cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{gradeEmoji[student.grade] || '📚'}</span>
          <div>
            <h3 className="font-black text-black text-lg leading-tight">{student.name}</h3>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{student.grade} grade</p>
          </div>
        </div>
        <span className="text-[10px] bg-[var(--primary-light)] text-[var(--primary)] px-2.5 py-1 rounded-full font-black uppercase tracking-wide">
          {student.session_type}
        </span>
      </div>

      <div className="space-y-2.5 text-sm">
        <div className="flex gap-2">
          {ufliUnit && (
            <span className="text-xs bg-[var(--blue-light)] text-[var(--blue)] px-2 py-0.5 rounded-full font-bold">
              📘 Unit {ufliUnit}
            </span>
          )}
          <span className="text-xs bg-[var(--gold-light)] text-[var(--orange)] px-2 py-0.5 rounded-full font-bold">
            {sessionsRemaining > 0 ? `${sessionsRemaining} left` : '✅ Done'}
          </span>
        </div>

        <ProgressBar current={fluency} target={target} label="Fluency" />
      </div>
    </div>
  )
}
