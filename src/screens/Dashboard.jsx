import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, Calendar, BookOpenCheck, TrendingUp, ArrowRight } from 'lucide-react'
import { getStudents, getAllSessions, getAllAnalyses, getAllReportCards } from '../lib/storage'
import { useAsync } from '../lib/useAsync'
import { GRADE_LEVELS, EXPECTED_LEVEL, getStatus, getLevelPercent } from '../lib/gradeLevels'
import {
  Section, SectionHead, ListTable, ListRow, HighlightCard,
  BtnPrimary, Card,
} from '../components/v4/primitives.jsx'

const GRADE_EMOJI = { 'K': '🌱', '1st': '🌿', '2nd': '🌳', '3rd': '🏆' }

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: students = [], loading } = useAsync(() => getStudents())
  const { data: allSessions = [] } = useAsync(() => getAllSessions())
  const { data: allAnalyses = [] } = useAsync(() => getAllAnalyses())
  const { data: allReportCards = [] } = useAsync(() => getAllReportCards())

  const latestAnalysisByStudent = useMemo(() => {
    const m = {}
    for (const a of allAnalyses) if (!m[a.student_id]) m[a.student_id] = a
    return m
  }, [allAnalyses])

  const latestReportByStudent = useMemo(() => {
    const m = {}
    for (const r of allReportCards) if (!m[r.student_id]) m[r.student_id] = r
    return m
  }, [allReportCards])

  const activeStudents = students.filter(s => (s.status ?? 'active') !== 'inactive')
  const totalStudents = activeStudents.length
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const sessionsThisWeek = allSessions.filter(s => new Date(s.date) >= sevenDaysAgo).length

  const studentLevels = activeStudents.map(s => {
    const latest = latestReportByStudent[s.id]
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

  const dailySessions = useMemo(() => {
    const today = new Date()
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = d.toISOString().split('T')[0]
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' })
      const count = allSessions.filter(s => s.date === dateStr).length
      days.push({ dayLabel, count, dateStr })
    }
    return days
  }, [allSessions])

  const maxDailySessions = Math.max(...dailySessions.map(d => d.count), 1)

  if (loading) {
    return <p className="text-center text-[var(--v4-ink-3)] py-20 text-sm font-medium">Loading…</p>
  }

  if (totalStudents === 0) {
    return (
      <div className="space-y-6">
        <Header onAdd={() => navigate('/students/new')} />
        <div className="text-center py-20">
          <span className="text-6xl block mb-4">📚</span>
          <p className="text-[var(--v4-ink-2)] text-base font-semibold mb-1">No students yet</p>
          <p className="text-[var(--v4-ink-3)] text-sm">Add your first student to get started.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Header onAdd={() => navigate('/students/new')} />

      {/* STAT CARDS */}
      <div>
        <SectionHead title="Overview" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <HighlightCard
            icon={<Users className="w-3.5 h-3.5" />}
            label="Students"
            value={<span>{totalStudents}</span>}
          />
          <HighlightCard
            icon={<Calendar className="w-3.5 h-3.5" />}
            label="Sessions (7d)"
            value={<span>{sessionsThisWeek}</span>}
          />
          <HighlightCard
            icon={<BookOpenCheck className="w-3.5 h-3.5" />}
            label="Total Sessions"
            value={<span>{allSessions.length}</span>}
          />
          <HighlightCard
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            label="Skills Ahead"
            value={<span>{studentsWithData.length > 0 ? totalAhead : '—'}</span>}
          />
        </div>
      </div>

      {/* SESSIONS BAR CHART */}
      <Card>
        <SectionHead title="Sessions This Week" />
        <div className="flex items-end gap-2 h-32">
          {dailySessions.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] font-semibold text-[var(--v4-ink)]">{day.count > 0 ? day.count : ''}</span>
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height: `${day.count > 0 ? Math.max(8, (day.count / maxDailySessions) * 100) : 4}%`,
                  background: day.count > 0 ? 'var(--v4-blue)' : 'var(--v4-surface-3)',
                  minHeight: day.count > 0 ? '12px' : '4px',
                }}
              />
              <span className="text-[10px] font-medium text-[var(--v4-ink-3)]">{day.dayLabel}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* READING LEVELS */}
      {studentsWithData.length > 0 && (
        <Card>
          <SectionHead title="Reading Levels" />
          <div className="space-y-3.5">
            {studentLevels.map((sl, i) => {
              if (!sl.skills) return (
                <div key={i} className="flex items-center gap-3 text-[12.5px]">
                  <span className="font-semibold text-[var(--v4-ink)] w-20 truncate">{sl.student.name}</span>
                  <span className="text-[var(--v4-ink-3)]">No report card yet</span>
                </div>
              )
              const expectedKey = EXPECTED_LEVEL[sl.student.grade]
              const expectedPct = expectedKey ? getLevelPercent(expectedKey) : 0
              const avgPct = sl.avgLevel ? getLevelPercent(sl.avgLevel.key) : 0
              const statusToneClass =
                sl.avgStatus?.status === 'ahead' ? 'bg-[var(--v4-green)]' :
                sl.avgStatus?.status === 'behind' ? 'bg-[var(--v4-red)]' :
                'bg-[var(--v4-amber)]'
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12.5px] font-semibold text-[var(--v4-ink)] truncate max-w-[120px]">{sl.student.name}</span>
                      <span className="text-[10.5px] text-[var(--v4-ink-3)] font-medium">{sl.student.grade}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {sl.avgLevel && (
                        <span className="text-[12px] font-semibold text-[var(--v4-ink)]">{sl.avgLevel.label}</span>
                      )}
                      <span className="text-[10.5px] font-semibold" style={{ color: sl.avgStatus?.color || '#9a9a9a' }}>
                        {sl.avgStatus?.label || '—'}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="w-full h-2 bg-[var(--v4-surface-3)] rounded-full overflow-hidden">
                      {avgPct > 0 && (
                        <div className={`h-2 rounded-full transition-all ${statusToneClass}`} style={{ width: `${avgPct}%` }} />
                      )}
                    </div>
                    {expectedPct > 0 && (
                      <div className="absolute top-0 h-2 w-0.5 bg-[var(--v4-ink)] opacity-30" style={{ left: `${expectedPct}%` }} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* STUDENT LIST */}
      <Section title="Students" action="View all →" onAction={() => navigate('/students')}>
        <ListTable>
          {activeStudents.map(s => {
            const a = latestAnalysisByStudent[s.id]
            const fluency = a?.ai_analysis?.fluency_estimate_pct || 0
            const ufli = a?.ai_analysis?.ufli_placement?.current_working_unit
            const sessCount = allSessions.filter(ses => ses.student_id === s.id).length
            return (
              <ListRow
                key={s.id}
                icon={<span className="text-base">{GRADE_EMOJI[s.grade] || '📚'}</span>}
                iconTone="green"
                title={s.name}
                tag={ufli ? { text: `Unit ${ufli}`, tone: 'blue' } : null}
                sub={`${s.grade} grade · ${sessCount} session${sessCount !== 1 ? 's' : ''}${fluency ? ` · ${fluency}% fluency` : ''}`}
                date=""
                right={<ArrowRight className="w-3.5 h-3.5 text-[var(--v4-ink-4)]" />}
                onClick={() => navigate(`/students/${s.id}`)}
              />
            )
          })}
        </ListTable>
      </Section>
    </div>
  )
}

function Header({ onAdd }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[22px] font-bold text-[var(--v4-ink)] tracking-[-0.5px]">Dashboard</h2>
      <BtnPrimary onClick={onAdd}>
        <Plus className="w-3.5 h-3.5" /> Add Student
      </BtnPrimary>
    </div>
  )
}
