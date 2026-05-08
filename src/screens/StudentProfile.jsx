import { getStudent, getLatestAssessment, getSessions, getProgress } from '../lib/storage'
import ProgressBar from '../components/ProgressBar.jsx'

const gradeTargets = {
  'K': 60, '1st': 85, '2nd': 85, '3rd': 90
}

const gradeEmoji = {
  'K': '🌱', '1st': '🌿', '2nd': '🌳', '3rd': '🏆'
}

export default function StudentProfile({ studentId, onNavigateTab }) {
  const student = getStudent(studentId)
  const assessment = getLatestAssessment(studentId)
  const sessions = getSessions(studentId)
  const progress = getProgress(studentId)

  if (!student) return null

  const analysis = assessment?.ai_analysis
  const fluency = analysis?.fluency_estimate_pct || 0
  const target = gradeTargets[student.grade] || 75
  const ufli = analysis?.ufli_placement

  const actions = [
    { label: 'Upload Assessment', icon: '📸', desc: 'Take photos and run AI analysis', tab: 'upload', always: true },
    { label: 'Plan My Session', icon: '🗓️', desc: 'Generate a minute-by-minute plan', tab: 'session', always: false },
    { label: 'Draft Parent Email', icon: '✉️', desc: 'AI-written progress email', tab: 'email', always: false },
    { label: 'Generate Homework', icon: '✏️', desc: 'Printable take-home practice sheet', tab: 'homework', always: false },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{gradeEmoji[student.grade] || '📚'}</span>
          <div>
            <h2 className="text-3xl font-black text-black tracking-tight">{student.name}</h2>
            <p className="text-gray-400 mt-0.5 font-semibold">{student.grade} grade &middot; Age {student.age}</p>
          </div>
        </div>
        <span className="text-[10px] bg-[var(--primary-light)] text-[var(--primary)] px-3 py-1 rounded-full font-black uppercase tracking-wide">
          {student.session_type}
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-4 text-center">
          <p className="text-2xl font-black text-black">{progress.sessions_completed}</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-0.5">Sessions</p>
        </div>
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-4 text-center">
          <p className="text-2xl font-black text-[var(--blue)]">{ufli?.current_working_unit || '—'}</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-0.5">UFLI Unit</p>
        </div>
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-4 text-center">
          <p className="text-2xl font-black" style={{ color: fluency >= 80 ? 'var(--green)' : fluency >= 50 ? 'var(--orange)' : 'var(--red)' }}>{fluency}%</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-0.5">Fluency</p>
        </div>
      </div>

      {/* Fluency Bar */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-5">
        <ProgressBar current={fluency} target={target} label="Fluency vs. Grade Benchmark" />
      </div>

      {/* Flags */}
      {progress.flags_still_active.length > 0 && (
        <div className="bg-[var(--orange-light)] rounded-2xl border-2 border-orange-200 p-5">
          <h3 className="text-sm font-black text-[var(--orange)] mb-2">⚠️ Patterns to Watch</h3>
          <ul className="space-y-1">
            {progress.flags_still_active.map((flag, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2"><span>&bull;</span><span>{flag}</span></li>
            ))}
          </ul>
        </div>
      )}

      {/* Week Arc */}
      {(analysis?.week_arc || analysis?.four_week_arc) && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-5">
          <h3 className="font-black text-black mb-3">📅 {(analysis.week_arc || analysis.four_week_arc).length}-Week Plan</h3>
          <ul className="space-y-2">
            {(analysis.week_arc || analysis.four_week_arc).map((week, i) => (
              <li key={i} className="text-sm flex gap-2 items-start">
                <span className="bg-[var(--primary-light)] text-[var(--primary)] text-xs font-black w-7 h-7 rounded-lg flex items-center justify-center shrink-0">{week.week}</span>
                <span><span className="font-bold text-black">{week.focus}</span> <span className="text-gray-400">— {week.activity_type}</span></span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Latest Assessment */}
      {assessment && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-5">
          <h3 className="font-black text-black mb-2">📊 Latest Assessment</h3>
          <p className="text-sm text-gray-500">
            {assessment.date} &middot; Session {assessment.session_number} &middot; {assessment.photo_count} photos
          </p>
          {analysis && (
            <div className="flex gap-2 mt-2">
              <span className="text-xs bg-[var(--blue-light)] text-[var(--blue)] px-2.5 py-1 rounded-full font-bold">{analysis.passage_level_reached}</span>
              <span className="text-xs bg-[var(--green-light)] text-[var(--green)] px-2.5 py-1 rounded-full font-bold">{analysis.confidence} confidence</span>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons grid grid-cols-2 gap-3">
        {actions.map((action, i) => {
          const enabled = action.always || assessment
          return (
            <button
              key={i}
              onClick={() => enabled && onNavigateTab(action.tab)}
              disabled={!enabled}
              className={`bg-white rounded-2xl border-2 p-4 text-left transition-all ${
                enabled ? 'border-gray-100 hover:border-[var(--primary)] hover:shadow-md cursor-pointer' : 'border-gray-50 opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="text-2xl block mb-1">{action.icon}</span>
              <span className="font-bold text-black text-sm block">{action.label}</span>
              <p className="text-[11px] text-gray-400 mt-0.5">{enabled ? action.desc : 'Upload an assessment first'}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
