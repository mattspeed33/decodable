import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStudents, getAllSessions, getLatestAssessment } from '../lib/storage'

const gradeTargets = { 'K': 60, '1st': 85, '2nd': 85, '3rd': 90 }

export default function Dashboard() {
  const navigate = useNavigate()
  const students = getStudents()
  const allSessions = useMemo(() => getAllSessions(), [])

  // Stats
  const totalStudents = students.length

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const sessionsThisWeek = allSessions.filter(s => new Date(s.date) >= sevenDaysAgo).length

  // Average fluency across students
  const fluencyData = students.map(s => {
    const a = getLatestAssessment(s.id)
    return a?.ai_analysis?.fluency_estimate_pct ?? null
  }).filter(f => f !== null)
  const avgFluency = fluencyData.length > 0 ? Math.round(fluencyData.reduce((a, b) => a + b, 0) / fluencyData.length) : null

  // Per-student fluency for chart
  const studentFluency = students.map(s => {
    const a = getLatestAssessment(s.id)
    const fluency = a?.ai_analysis?.fluency_estimate_pct || 0
    const target = gradeTargets[s.grade] || 75
    return { name: s.name, fluency, target, grade: s.grade }
  })

  // Sessions per day (last 7 days) for bar chart
  const dailySessions = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = d.toISOString().split('T')[0]
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' })
      const count = allSessions.filter(s => s.date === dateStr).length
      days.push({ dayLabel, count, dateStr })
    }
    return days
  }, [allSessions])

  const maxDailySessions = Math.max(...dailySessions.map(d => d.count), 1)

  if (totalStudents === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black text-black tracking-tight">Dashboard</h2>
          <button onClick={() => navigate('/students/new')} className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-[var(--primary-hover)] transition shadow-sm">
            + Add Student
          </button>
        </div>
        <div className="text-center py-20">
          <span className="text-6xl block mb-4">📚</span>
          <p className="text-gray-500 text-lg font-bold mb-1">No students yet</p>
          <p className="text-gray-400 text-sm">Add your first student to get started!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-black tracking-tight">Dashboard</h2>
        <button onClick={() => navigate('/students/new')} className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-[var(--primary-hover)] transition shadow-sm">
          + Add Student
        </button>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon="👩‍🎓" value={totalStudents} label="Students" color="var(--primary)" />
        <StatCard icon="🗓️" value={sessionsThisWeek} label="Sessions (7d)" color="var(--blue)" />
        <StatCard icon="📚" value={allSessions.length} label="Total Sessions" color="var(--green)" />
        <StatCard icon="🎯" value={avgFluency !== null ? `${avgFluency}%` : '—'} label="Avg Fluency" color={avgFluency >= 80 ? 'var(--green)' : avgFluency >= 50 ? 'var(--orange)' : 'var(--red)'} />
      </div>

      {/* ── SESSIONS THIS WEEK BAR CHART ── */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
        <h3 className="font-black text-black mb-4">📊 Sessions This Week</h3>
        <div className="flex items-end gap-2 h-32">
          {dailySessions.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-black">{day.count > 0 ? day.count : ''}</span>
              <div className="w-full rounded-t-lg transition-all" style={{
                height: `${day.count > 0 ? Math.max(8, (day.count / maxDailySessions) * 100) : 4}%`,
                background: day.count > 0 ? 'var(--primary)' : '#e5e7eb',
                minHeight: day.count > 0 ? '12px' : '4px'
              }} />
              <span className="text-[10px] font-semibold text-gray-400">{day.dayLabel}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── STUDENT FLUENCY CHART ── */}
      {studentFluency.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
          <h3 className="font-black text-black mb-4">🎯 Student Fluency vs. Benchmark</h3>
          <div className="space-y-3">
            {studentFluency.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm font-bold text-black w-20 truncate">{s.name}</span>
                <div className="flex-1 relative">
                  {/* Background bar (benchmark) */}
                  <div className="w-full bg-gray-100 rounded-full h-5 overflow-hidden relative">
                    {/* Fluency fill */}
                    <div
                      className="h-5 rounded-full transition-all relative"
                      style={{
                        width: `${Math.min(100, s.fluency)}%`,
                        background: s.fluency >= s.target ? 'var(--green)' : s.fluency >= s.target * 0.7 ? 'var(--orange)' : 'var(--red)',
                        minWidth: s.fluency > 0 ? '20px' : '0'
                      }}
                    >
                      {s.fluency > 10 && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white">{s.fluency}%</span>
                      )}
                    </div>
                    {/* Benchmark marker */}
                    <div
                      className="absolute top-0 h-5 w-0.5 bg-black opacity-30"
                      style={{ left: `${s.target}%` }}
                    />
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 font-bold w-10 text-right">{s.target}%</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-400 font-semibold">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-black opacity-30 inline-block" /> Benchmark</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--green)' }} /> On track</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--orange)' }} /> Getting there</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--red)' }} /> Needs work</span>
          </div>
        </div>
      )}

      {/* ── STUDENT LIST ── */}
      <div>
        <h3 className="font-black text-black mb-3">👩‍🎓 Students</h3>
        <div className="space-y-2">
          {students.map(s => {
            const a = getLatestAssessment(s.id)
            const fluency = a?.ai_analysis?.fluency_estimate_pct || 0
            const ufli = a?.ai_analysis?.ufli_placement?.current_working_unit
            const sessCount = allSessions.filter(ses => ses.student_id === s.id).length
            return (
              <button
                key={s.id}
                onClick={() => navigate(`/students/${s.id}`)}
                className="w-full bg-white rounded-2xl border-2 border-gray-100 p-4 flex items-center gap-4 hover:border-[var(--primary)] transition text-left"
              >
                <div className="bg-[var(--primary-light)] text-[var(--primary)] w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="font-black text-sm">{s.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-black text-sm">{s.name}</p>
                  <p className="text-[11px] text-gray-400 font-semibold">{s.grade} grade &middot; {sessCount} sessions</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {ufli && (
                    <span className="text-[10px] bg-[var(--blue-light)] text-[var(--blue)] px-2 py-0.5 rounded-full font-bold">Unit {ufli}</span>
                  )}
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{
                    background: fluency >= 80 ? 'var(--green-light)' : fluency >= 50 ? 'var(--orange-light)' : fluency > 0 ? 'var(--red-light)' : '#f3f4f6',
                    color: fluency >= 80 ? 'var(--green)' : fluency >= 50 ? 'var(--orange)' : fluency > 0 ? 'var(--red)' : '#9ca3af'
                  }}>{fluency > 0 ? `${fluency}%` : '—'}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, value, label, color }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 p-5 text-center">
      <span className="text-2xl block mb-1">{icon}</span>
      <p className="text-2xl font-black" style={{ color }}>{value}</p>
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  )
}
