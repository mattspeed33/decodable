import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStudents, getAllSessions, getLatestAnalysis, getReportCards } from '../lib/storage'
import { GRADE_LEVELS, GRADE_LEVEL_MAP, EXPECTED_LEVEL, getStatus, getLevelPercent } from '../lib/gradeLevels'

export default function Dashboard() {
  const navigate = useNavigate()
  const students = getStudents()
  const allSessions = useMemo(() => getAllSessions(), [])

  // Stats
  const totalStudents = students.length

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const sessionsThisWeek = allSessions.filter(s => new Date(s.date) >= sevenDaysAgo).length

  // Per-student grade-level data from latest report card
  const studentLevels = students.map(s => {
    const reports = getReportCards(s.id)
    const latest = reports[0]
    if (!latest?.skillLevels) return { student: s, skills: null, statusCounts: null }

    const filled = Object.entries(latest.skillLevels).filter(([, v]) => v && v !== 'not-assessed')
    const statusCounts = { ahead: 0, 'on-track': 0, behind: 0 }
    let totalIdx = 0
    let count = 0
    for (const [, level] of filled) {
      const st = getStatus(level, s.grade)
      if (statusCounts[st.status] !== undefined) statusCounts[st.status]++
      const idx = GRADE_LEVELS.findIndex(g => g.key === level)
      if (idx >= 0) { totalIdx += idx; count++ }
    }
    const avgIdx = count > 0 ? Math.round(totalIdx / count) : -1
    const avgLevel = avgIdx >= 0 ? GRADE_LEVELS[Math.min(avgIdx, GRADE_LEVELS.length - 1)] : null
    const avgStatus = avgLevel ? getStatus(avgLevel.key, s.grade) : null

    return { student: s, skills: latest.skillLevels, statusCounts, avgLevel, avgStatus, filledCount: filled.length }
  })

  const studentsWithData = studentLevels.filter(s => s.skills)
  const totalAhead = studentsWithData.reduce((sum, s) => sum + (s.statusCounts?.ahead || 0), 0)
  const totalBehind = studentsWithData.reduce((sum, s) => sum + (s.statusCounts?.behind || 0), 0)
  const totalOnTrack = studentsWithData.reduce((sum, s) => sum + (s.statusCounts?.['on-track'] || 0), 0)

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
        <StatCard icon="🟢" value={studentsWithData.length > 0 ? `${totalAhead}` : '—'} label="Skills Ahead" color="var(--green)" />
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

      {/* ── STUDENT GRADE LEVEL OVERVIEW ── */}
      {studentsWithData.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
          <h3 className="font-black text-black mb-4">📊 Student Reading Levels</h3>
          <div className="space-y-4">
            {studentLevels.map((sl, i) => {
              if (!sl.skills) return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-black w-20 truncate">{sl.student.name}</span>
                  <span className="text-xs text-gray-400">No report card yet</span>
                </div>
              )

              const expectedKey = EXPECTED_LEVEL[sl.student.grade]
              const expectedPct = expectedKey ? getLevelPercent(expectedKey) : 0
              const avgPct = sl.avgLevel ? getLevelPercent(sl.avgLevel.key) : 0

              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-black truncate max-w-[100px]">{sl.student.name}</span>
                      <span className="text-[10px] text-gray-400 font-semibold">{sl.student.grade}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {sl.avgLevel && (
                        <span className="text-xs font-bold text-black">{sl.avgLevel.label}</span>
                      )}
                      {sl.avgStatus?.emoji && <span className="text-sm">{sl.avgStatus.emoji}</span>}
                      <span className="text-[10px] font-bold" style={{ color: sl.avgStatus?.color || '#9ca3af' }}>
                        {sl.avgStatus?.label || 'N/A'}
                      </span>
                    </div>
                  </div>
                  {/* Grade-level bar */}
                  <div className="relative">
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      {avgPct > 0 && (
                        <div
                          className="h-3 rounded-full transition-all"
                          style={{ width: `${avgPct}%`, background: sl.avgStatus?.color || '#9ca3af' }}
                        />
                      )}
                    </div>
                    {/* Expected level marker */}
                    {expectedPct > 0 && (
                      <div
                        className="absolute top-0 h-3 w-0.5 bg-black opacity-30"
                        style={{ left: `${expectedPct}%` }}
                      />
                    )}
                    <div className="flex justify-between mt-0.5">
                      {['PK', 'K', '1st', '2nd', '3rd'].map((label, j) => (
                        <span key={j} className="text-[7px] text-gray-400 font-bold">{label}</span>
                      ))}
                    </div>
                  </div>
                  {/* Status badges */}
                  <div className="flex gap-2 mt-1">
                    {sl.statusCounts.ahead > 0 && (
                      <span className="text-[9px] font-bold" style={{ color: 'var(--green)' }}>🟢 {sl.statusCounts.ahead}</span>
                    )}
                    {sl.statusCounts['on-track'] > 0 && (
                      <span className="text-[9px] font-bold" style={{ color: 'var(--orange)' }}>🟡 {sl.statusCounts['on-track']}</span>
                    )}
                    {sl.statusCounts.behind > 0 && (
                      <span className="text-[9px] font-bold" style={{ color: 'var(--red)' }}>🔴 {sl.statusCounts.behind}</span>
                    )}
                    <span className="text-[9px] text-gray-300 font-semibold">{sl.filledCount} skills rated</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-[10px] text-gray-400 font-semibold">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-black opacity-30 inline-block" /> Expected</span>
            <span className="flex items-center gap-1">🟢 Ahead</span>
            <span className="flex items-center gap-1">🟡 On Track</span>
            <span className="flex items-center gap-1">🔴 Behind</span>
          </div>
        </div>
      )}

      {/* ── STUDENT LIST ── */}
      <div>
        <h3 className="font-black text-black mb-3">👩‍🎓 Students</h3>
        <div className="space-y-2">
          {students.map(s => {
            const a = getLatestAnalysis(s.id)
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
