import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import {
  ChevronLeft, Sparkles, Mail, ClipboardList, Home, Users, Calendar, BarChart3,
  BookOpen, Brain, FileText, Pencil, Camera, Target,
} from 'lucide-react'
import {
  getStudent, getStudents, getLatestAnalysis, getAnalyses,
  getAssessments, getSessions, getEmailLog, getHomeworkSheets, getReportCards,
} from '../lib/storage'
import { useAsync } from '../lib/useAsync'
import { GRADE_LEVELS, getStatus } from '../lib/gradeLevels'

import ProfileTab from './tabs/ProfileTab.jsx'
import AssessmentsTab from './tabs/AssessmentsTab.jsx'
import SessionsTab from './tabs/SessionsTab.jsx'
import ParentHubTab from './tabs/ParentHubTab.jsx'
import ReportCardTab from './tabs/ReportCardTab.jsx'

const GRADE_EMOJI = { 'K': '🌱', '1st': '🌿', '2nd': '🌳', '3rd': '🏆' }

const STUDENT_DOT_COLORS = ['#7c3aed', '#2563eb', '#16a34a', '#dc2626', '#ea580c', '#0d9488']

// Stable color per student id so the sidebar dots don't reshuffle on refetch.
function dotColorFor(id) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return STUDENT_DOT_COLORS[h % STUDENT_DOT_COLORS.length]
}

function relativeDay(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  const days = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} wk ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function StudentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState('overview')
  const [editing, setEditing] = useState(null) // null | 'profile' | 'parent' | 'schedule'

  const { data: student, loading: studentLoading, refresh: refreshStudent } =
    useAsync(() => getStudent(id), [id])
  const { data: allStudents = [] } = useAsync(() => getStudents())
  const { data: latestAnalysis } = useAsync(() => getLatestAnalysis(id), [id])
  const { data: analyses = [] } = useAsync(() => getAnalyses(id), [id])
  const { data: assessments = [] } = useAsync(() => getAssessments(id), [id])
  const { data: sessions = [] } = useAsync(() => getSessions(id), [id])
  const { data: emails = [] } = useAsync(() => getEmailLog(id), [id])
  const { data: homework = [] } = useAsync(() => getHomeworkSheets(id), [id])
  const { data: reportCards = [] } = useAsync(() => getReportCards(id), [id])

  const tabCounts = {
    assessments: assessments.length,
    analyses: analyses.length,
    sessions: sessions.length,
    emails: emails.length,
    reports: reportCards.length,
  }

  if (studentLoading || !student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--v4-bg)]">
        <p className="text-sm text-[var(--v4-ink-3)] font-medium">Loading…</p>
      </div>
    )
  }

  return (
    <div
      className="grid min-h-screen bg-[var(--v4-bg)] text-[var(--v4-ink)]"
      style={{ gridTemplateColumns: '220px 1fr 300px' }}
    >
      <Sidebar currentId={id} allStudents={allStudents} navigate={navigate} />

      <main className="overflow-y-auto h-screen bg-[var(--v4-surface)]">
        <TopBar onBack={() => navigate('/students')} user={user} />
        <StudentHeader
          student={student}
          latestAnalysis={latestAnalysis}
          reportCards={reportCards}
          onPlanSession={() => setActiveTab('sessions')}
          onEmailParent={() => setActiveTab('emails')}
        />
        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} counts={tabCounts} />

        <div className="px-7 pt-6 pb-16">
          {activeTab === 'overview' && (
            <OverviewTab
              student={student}
              latestAnalysis={latestAnalysis}
              analyses={analyses}
              assessments={assessments}
              sessions={sessions}
              emails={emails}
              homework={homework}
              reportCards={reportCards}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === 'assessments' && (
            <AssessmentsTab studentId={id} onRefresh={refreshStudent} />
          )}
          {activeTab === 'analyses' && (
            <AnalysesTab analyses={analyses} />
          )}
          {activeTab === 'sessions' && (
            <SessionsTab studentId={id} onRefresh={refreshStudent} />
          )}
          {activeTab === 'emails' && (
            <ParentHubTab studentId={id} onRefresh={refreshStudent} />
          )}
          {activeTab === 'reports' && (
            <ReportCardTab studentId={id} />
          )}
        </div>
      </main>

      <RightPanel
        student={student}
        reportCards={reportCards}
        onEdit={setEditing}
      />

      {editing && (
        <EditModal
          mode={editing}
          studentId={id}
          onClose={() => { setEditing(null); refreshStudent() }}
        />
      )}
    </div>
  )
}

// ─── LEFT SIDEBAR ────────────────────────────────────────────────────────────

function Sidebar({ currentId, allStudents, navigate }) {
  const navItems = [
    { icon: Home, label: 'Home', to: '/' },
    { icon: Users, label: 'Students', to: '/students', active: true },
    { icon: Calendar, label: 'This Week', to: '/calendar' },
    { icon: BarChart3, label: 'Reports', to: '/templates' },
  ]

  return (
    <aside className="bg-[var(--v4-surface-2)] border-r border-[var(--v4-border)] px-2.5 py-3.5 flex flex-col gap-0.5 overflow-y-auto h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-2.5 pt-1 pb-4 mb-2">
        <div className="w-7 h-7 rounded-md flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg, #86efac, #16a34a)' }}>
          🌱
        </div>
        <div className="text-[14.5px] font-bold tracking-[-0.3px]">Decodable</div>
      </div>

      {navItems.map(({ icon: Icon, label, to, active }) => (
        <button
          key={label}
          onClick={() => navigate(to)}
          className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium cursor-pointer text-left ${
            active
              ? 'bg-[var(--v4-surface)] text-[var(--v4-ink)] shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
              : 'text-[var(--v4-ink-2)] hover:bg-[var(--v4-surface-3)] hover:text-[var(--v4-ink)]'
          }`}
        >
          <Icon className="w-[14px] h-[14px]" strokeWidth={2} />
          {label}
        </button>
      ))}

      <div className="text-[10px] font-bold text-[var(--v4-ink-3)] uppercase tracking-[0.8px] px-2.5 pt-[18px] pb-1.5">
        Students
      </div>
      {allStudents.map(s => (
        <button
          key={s.id}
          onClick={() => navigate(`/students/${s.id}`)}
          className={`flex items-center gap-2.5 px-2.5 py-1 rounded-md text-[12.5px] font-medium text-left ${
            s.id === currentId
              ? 'bg-[var(--v4-surface)] text-[var(--v4-ink)] shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
              : 'text-[var(--v4-ink-2)] hover:bg-[var(--v4-surface-3)]'
          }`}
        >
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dotColorFor(s.id) }} />
          <span className="flex-1 truncate">{s.name}</span>
          <span className="text-[10.5px] text-[var(--v4-ink-3)] font-medium">{s.grade}</span>
        </button>
      ))}
    </aside>
  )
}

// ─── TOP BAR ─────────────────────────────────────────────────────────────────

function TopBar({ onBack, user }) {
  const initials = (user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')
  return (
    <div className="flex items-center gap-2 px-6 py-2.5 border-b border-[var(--v4-border)] sticky top-0 bg-[var(--v4-surface)] z-10">
      <button onClick={onBack} className="w-[26px] h-[26px] flex items-center justify-center rounded-md text-[var(--v4-ink-3)] hover:bg-[var(--v4-surface-3)] hover:text-[var(--v4-ink)]">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-[12.5px] text-[var(--v4-ink-3)] font-medium">Students</span>
      <div className="ml-auto flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-[var(--v4-surface-3)] text-[12px] font-semibold text-[var(--v4-ink-2)] hover:bg-[var(--v4-ink-4)]">
          <Sparkles className="w-3.5 h-3.5" /> Ask Decodable
        </button>
        <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
          {initials || 'D'}
        </div>
      </div>
    </div>
  )
}

// ─── STUDENT HEADER ──────────────────────────────────────────────────────────

function getOverallStatus(reportCards, studentGrade) {
  const latest = reportCards[0]
  if (!latest?.skillLevels) return null
  const filled = Object.values(latest.skillLevels).filter(v => v && v !== 'not-assessed')
  if (filled.length === 0) return null
  const counts = { ahead: 0, 'on-track': 0, behind: 0 }
  for (const level of filled) {
    const s = getStatus(level, studentGrade)
    if (counts[s.status] !== undefined) counts[s.status]++
  }
  if (counts.behind > counts.ahead && counts.behind > counts['on-track']) {
    return { label: 'Behind', color: 'var(--v4-red)' }
  }
  if (counts.ahead > counts.behind && counts.ahead > counts['on-track']) {
    return { label: 'Ahead', color: 'var(--v4-green)' }
  }
  return { label: 'On track', color: 'var(--v4-amber)' }
}

function StudentHeader({ student, reportCards, onEmailParent, onPlanSession }) {
  const status = getOverallStatus(reportCards, student.grade)
  return (
    <div className="px-7 pt-6 pb-1 flex items-center gap-3.5">
      <div className="w-[42px] h-[42px] rounded-[10px] bg-[var(--v4-green-lt)] flex items-center justify-center text-xl">
        {GRADE_EMOJI[student.grade] || '📚'}
      </div>
      <div className="flex-1">
        <div className="text-[22px] font-bold tracking-[-0.5px] leading-[1.15]">{student.name}</div>
        <div className="text-[12.5px] text-[var(--v4-ink-3)] mt-0.5 font-medium flex items-center gap-2">
          <span>{student.grade} grade · Age {student.age}</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--v4-purple-lt)] text-[var(--v4-purple)]">
            {student.session_type}
          </span>
          {status && (
            <>
              <span className="text-[var(--v4-ink-3)]">·</span>
              <span className="font-semibold" style={{ color: status.color }}>● {status.label}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <button onClick={onEmailParent} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--v4-surface)] border border-[var(--v4-border)] text-[12.5px] font-medium text-[var(--v4-ink-2)] hover:bg-[var(--v4-surface-3)]">
          <Mail className="w-3.5 h-3.5" /> Email Parent
        </button>
        <button onClick={onPlanSession} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[var(--v4-ink)] text-white text-[12.5px] font-semibold hover:bg-black">
          <ClipboardList className="w-3.5 h-3.5" /> Plan Next Session
        </button>
      </div>
    </div>
  )
}

// ─── TAB BAR ─────────────────────────────────────────────────────────────────

function TabBar({ activeTab, setActiveTab, counts }) {
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'assessments', label: 'Assessments', count: counts.assessments },
    { key: 'analyses', label: 'AI Analysis', count: counts.analyses },
    { key: 'sessions', label: 'Sessions', count: counts.sessions },
    { key: 'emails', label: 'Emails', count: counts.emails },
    { key: 'reports', label: 'Report Cards', count: counts.reports },
  ]
  return (
    <div className="flex gap-0 px-7 pt-3 border-b border-[var(--v4-border)]">
      {tabs.map(tab => {
        const active = activeTab === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3.5 py-2.5 text-[13px] cursor-pointer border-b-2 -mb-px flex items-center gap-1.5 ${
              active
                ? 'text-[var(--v4-ink)] border-[var(--v4-ink)] font-semibold'
                : 'text-[var(--v4-ink-3)] border-transparent hover:text-[var(--v4-ink-2)] font-medium'
            }`}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className={`text-[10.5px] font-semibold px-1.5 py-px rounded-lg ${
                active ? 'bg-[var(--v4-ink)] text-white' : 'bg-[var(--v4-surface-3)] text-[var(--v4-ink-3)]'
              }`}>{tab.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── OVERVIEW TAB ────────────────────────────────────────────────────────────

function OverviewTab({ student, latestAnalysis, analyses, assessments, sessions, emails, homework, reportCards, setActiveTab }) {
  const navigate = useNavigate()
  const ai = latestAnalysis?.ai_analysis
  const weekArc = ai?.week_arc || ai?.four_week_arc

  // Current week from sessions count, clamped to arc length.
  const currentWeekIdx = weekArc ? Math.min(sessions.length, weekArc.length - 1) : 0
  const currentWeek = weekArc?.[currentWeekIdx]

  // Activity feed: merge analyses, emails, sessions, homework — sort desc.
  const activity = useMemo(() => {
    const items = []
    for (const a of analyses) {
      items.push({
        type: 'analysis',
        date: a.date,
        title: `Analysis run — ${a.ai_analysis?.passage_level_reached || 'placement'}`,
        sub: a.ai_analysis?.ufli_placement
          ? `UFLI Unit ${a.ai_analysis.ufli_placement.current_working_unit} · ${(a.ai_analysis.priority_gaps?.length || 0)} priority gaps identified`
          : `${(a.ai_analysis?.priority_gaps?.length || 0)} priority gaps identified`,
        sortDate: a.date || a.created_at,
      })
    }
    for (const e of emails) {
      items.push({
        type: 'email',
        date: e.date_sent,
        title: `Parent email sent — ${e.subject || 'Update'}`,
        sub: student.parent_email ? `Sent to ${student.parent_email}` : 'Sent to parent',
        sortDate: e.date_sent || e.created_at,
      })
    }
    for (const s of sessions) {
      items.push({
        type: 'session',
        date: s.date,
        title: `Session ${s.ses_number || ''} logged`.trim(),
        sub: [s.tutor_notes, `${s.length_minutes || ''} min`].filter(Boolean).join(' · '),
        sortDate: s.date || s.created_at,
      })
    }
    for (const h of homework) {
      items.push({
        type: 'homework',
        date: h.assigned_at || h.created_at,
        title: `Homework assigned — ${h.skill_focus || 'Practice'}`,
        sub: `Week of ${h.week_of || '—'}`,
        sortDate: h.assigned_at || h.created_at,
      })
    }
    return items
      .filter(x => x.sortDate)
      .sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate))
      .slice(0, 5)
  }, [analyses, emails, sessions, homework, student.parent_email])

  return (
    <div className="flex flex-col gap-5">

      {/* THIS WEEK */}
      {currentWeek && (
        <button
          onClick={() => setActiveTab('sessions')}
          className="rounded-xl border border-[var(--v4-blue-lt)] px-5 py-4 flex items-center gap-4 cursor-pointer hover:border-[var(--v4-blue)] text-left transition-colors"
          style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #faf9f6 100%)' }}
        >
          <div className="w-11 h-11 rounded-[10px] bg-[var(--v4-blue-lt)] flex items-center justify-center shrink-0">
            <Target className="w-5 h-5 text-[var(--v4-blue)]" />
          </div>
          <div className="flex-1">
            <div className="text-[10.5px] font-bold tracking-[1px] text-[var(--v4-blue)] uppercase mb-1">
              This Week's Focus
            </div>
            <div className="text-[15.5px] font-bold text-[var(--v4-ink)] tracking-[-0.2px] mb-0.5">
              {currentWeek.focus}
            </div>
            <div className="text-[12.5px] text-[var(--v4-ink-2)]">
              Session {sessions.length + 1} next · {currentWeek.activity_type}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex gap-1">
              {weekArc.map((_, i) => (
                <div
                  key={i}
                  className={`w-[18px] h-[5px] rounded-[2px] ${i <= currentWeekIdx ? 'bg-[var(--v4-blue)]' : 'bg-[var(--v4-surface-3)]'}`}
                />
              ))}
            </div>
            <span className="text-[11px] text-[var(--v4-ink-3)] font-semibold">
              Week {currentWeekIdx + 1} of {weekArc.length}
            </span>
          </div>
        </button>
      )}

      {/* HIGHLIGHTS */}
      <Highlights
        student={student}
        latestAnalysis={latestAnalysis}
        emails={emails}
        reportCards={reportCards}
      />

      {/* RECENT ASSESSMENTS */}
      <Section title="Recent Assessments" onSeeAll={() => setActiveTab('assessments')}>
        {assessments.length === 0 ? (
          <EmptyRow icon={<ClipboardList className="w-4 h-4" />} text="No assessments yet." />
        ) : (
          <ListTable>
            {assessments.slice(0, 3).map(a => (
              <ListRow
                key={a.id}
                icon={<ClipboardList className="w-3.5 h-3.5" />}
                iconTone="blue"
                title={a.category_id ? a.category_id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Assessment'}
                tag={a.form_data?.ufli_unit ? { text: `Unit ${a.form_data.ufli_unit}`, tone: 'purple' } : null}
                sub={a.notes || 'No notes'}
                date={relativeDay(a.date || a.created_at)}
                onClick={() => setActiveTab('assessments')}
              />
            ))}
          </ListTable>
        )}
      </Section>

      {/* RECENT ACTIVITY */}
      <Section title="Recent Activity">
        {activity.length === 0 ? (
          <EmptyRow icon={<Camera className="w-4 h-4" />} text="No activity yet." />
        ) : (
          <ListTable>
            {activity.map((item, i) => (
              <ListRow
                key={i}
                icon={
                  item.type === 'analysis' ? <Brain className="w-3.5 h-3.5" /> :
                  item.type === 'email'    ? <Mail className="w-3.5 h-3.5" /> :
                  item.type === 'session'  ? <Pencil className="w-3.5 h-3.5" /> :
                                              <FileText className="w-3.5 h-3.5" />
                }
                iconTone={
                  item.type === 'analysis' ? 'purple' :
                  item.type === 'email'    ? 'amber' :
                  item.type === 'session'  ? 'green' : 'teal'
                }
                title={item.title}
                sub={item.sub}
                date={relativeDay(item.date)}
                onClick={() => {
                  if (item.type === 'analysis') setActiveTab('analyses')
                  else if (item.type === 'email') setActiveTab('emails')
                  else if (item.type === 'session') setActiveTab('sessions')
                  else if (item.type === 'homework') navigate('/homework')
                }}
              />
            ))}
          </ListTable>
        )}
      </Section>
    </div>
  )
}

// ─── HIGHLIGHTS GRID ─────────────────────────────────────────────────────────

function Highlights({ student, latestAnalysis, emails, reportCards }) {
  const ai = latestAnalysis?.ai_analysis
  const latestEmail = emails[0]
  const latestReport = reportCards[0]

  // Reading-level highlight: use latest report card's average level, otherwise
  // fall back to AI analysis passage_level_reached.
  let readingLevel = 'Not assessed yet'
  let readingStatus = 'amber'
  let readingSub = `On track for ${student.grade}`
  if (latestReport?.skillLevels) {
    const filled = Object.values(latestReport.skillLevels).filter(v => v && v !== 'not-assessed')
    if (filled.length > 0) {
      const idxs = filled.map(l => GRADE_LEVELS.findIndex(g => g.key === l)).filter(i => i >= 0)
      if (idxs.length > 0) {
        const avgIdx = Math.round(idxs.reduce((a, b) => a + b, 0) / idxs.length)
        const avgLevel = GRADE_LEVELS[Math.min(avgIdx, GRADE_LEVELS.length - 1)]
        readingLevel = avgLevel.label
        const status = getStatus(avgLevel.key, student.grade)
        readingStatus = status.status === 'ahead' ? 'green' : status.status === 'behind' ? 'red' : 'amber'
        readingSub = status.label === 'On track' ? `On track for ${student.grade}` : status.label
      }
    }
  } else if (ai?.passage_level_reached) {
    readingLevel = ai.passage_level_reached
  }

  return (
    <div>
      <SectionHead title="Highlights" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <HighlightCard
          icon={<BookOpen className="w-3.5 h-3.5" />}
          label="Reading Level"
          value={
            <>
              <span className={`inline-block w-[7px] h-[7px] rounded-full mr-1.5 ${readingStatus === 'green' ? 'bg-[var(--v4-green)]' : readingStatus === 'red' ? 'bg-[var(--v4-red)]' : 'bg-[var(--v4-amber)]'}`} />
              {readingLevel}
            </>
          }
          sub={readingSub}
        />
        <HighlightCard
          icon={<Brain className="w-3.5 h-3.5" />}
          label="Latest AI Analysis"
          value={
            ai?.ufli_placement
              ? <span className="text-[13px]">UFLI Unit {ai.ufli_placement.current_working_unit}</span>
              : <span className="text-[13px] text-[var(--v4-ink-3)]">Not run yet</span>
          }
          sub={
            ai
              ? `${ai.priority_gaps?.length || 0} priority gaps · ${relativeDay(latestAnalysis.date || latestAnalysis.created_at)}`
              : 'Run an analysis to see placement'
          }
        />
        <HighlightCard
          icon={<Mail className="w-3.5 h-3.5" />}
          label="Last Parent Email"
          value={
            latestEmail
              ? <span className="text-[13px] truncate block">{latestEmail.subject || 'Update'}</span>
              : <span className="text-[13px] text-[var(--v4-ink-3)]">None sent yet</span>
          }
          sub={latestEmail ? relativeDay(latestEmail.date_sent) : 'Draft your first email'}
        />
        <HighlightCard
          icon={<FileText className="w-3.5 h-3.5" />}
          label="Latest Report Card"
          value={
            latestReport
              ? <span className="text-[13px] truncate block">{latestReport.name || 'Report Card'}</span>
              : <span className="text-[13px] text-[var(--v4-ink-3)]">None yet</span>
          }
          sub={
            latestReport
              ? new Date(latestReport.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : 'Create your first report card'
          }
        />
      </div>
    </div>
  )
}

function HighlightCard({ icon, label, value, sub }) {
  return (
    <div className="bg-[var(--v4-surface)] border border-[var(--v4-border)] rounded-[10px] px-3.5 py-3 flex flex-col gap-1 cursor-pointer transition-colors hover:border-[var(--v4-border-2)]">
      <div className="text-[10.5px] font-medium text-[var(--v4-ink-3)] flex items-center gap-1.5">
        {icon} {label}
      </div>
      <div className="text-[15px] font-bold text-[var(--v4-ink)] tracking-[-0.2px] mt-0.5 flex items-center gap-1.5 min-w-0">
        {value}
      </div>
      <div className="text-[11px] text-[var(--v4-ink-3)]">{sub}</div>
    </div>
  )
}

// ─── LIST PRIMITIVES ─────────────────────────────────────────────────────────

function SectionHead({ title, onSeeAll }) {
  return (
    <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[var(--v4-ink-3)] uppercase tracking-[0.6px] mb-2.5">
      <span>{title}</span>
      {onSeeAll && (
        <button onClick={onSeeAll} className="ml-auto text-[11.5px] text-[var(--v4-ink-2)] normal-case tracking-normal font-medium hover:text-[var(--v4-ink)] cursor-pointer">
          View all →
        </button>
      )}
    </div>
  )
}

function Section({ title, onSeeAll, children }) {
  return (
    <div>
      <SectionHead title={title} onSeeAll={onSeeAll} />
      {children}
    </div>
  )
}

function ListTable({ children }) {
  return (
    <div className="border border-[var(--v4-border)] rounded-[10px] bg-[var(--v4-surface)] overflow-hidden">
      {children}
    </div>
  )
}

const TONE_CLASSES = {
  purple: 'bg-[var(--v4-purple-lt)] text-[var(--v4-purple)]',
  blue:   'bg-[var(--v4-blue-lt)] text-[var(--v4-blue)]',
  green:  'bg-[var(--v4-green-lt)] text-[var(--v4-green)]',
  amber:  'bg-[var(--v4-amber-lt)] text-[var(--v4-amber)]',
  teal:   'bg-[var(--v4-teal-lt)] text-[var(--v4-teal)]',
  gray:   'bg-[var(--v4-surface-3)] text-[var(--v4-ink-2)]',
}

function ListRow({ icon, iconTone = 'gray', title, tag, sub, date, onClick }) {
  return (
    <div
      onClick={onClick}
      className="grid items-center gap-3 px-3.5 py-2.5 border-b border-[var(--v4-border)] last:border-b-0 cursor-pointer hover:bg-[var(--v4-surface-2)]"
      style={{ gridTemplateColumns: '28px 1fr auto auto' }}
    >
      <div className={`w-[26px] h-[26px] rounded-md flex items-center justify-center text-[13px] ${TONE_CLASSES[iconTone]}`}>
        {icon}
      </div>
      <div className="flex flex-col gap-px min-w-0">
        <div className="text-[13px] font-medium text-[var(--v4-ink)] flex items-center gap-1.5 min-w-0">
          <span className="truncate">{title}</span>
          {tag && (
            <span className={`shrink-0 text-[10.5px] font-semibold px-1.5 py-0.5 rounded ${TONE_CLASSES[tag.tone]}`}>{tag.text}</span>
          )}
        </div>
        {sub && <div className="text-[11.5px] text-[var(--v4-ink-3)] truncate">{sub}</div>}
      </div>
      <div />
      <div className="text-[11.5px] text-[var(--v4-ink-3)] whitespace-nowrap">{date}</div>
    </div>
  )
}

function EmptyRow({ icon, text }) {
  return (
    <div className="border border-[var(--v4-border)] rounded-[10px] bg-[var(--v4-surface)] px-4 py-5 flex items-center gap-2.5 text-[13px] text-[var(--v4-ink-3)]">
      <span className="w-7 h-7 rounded-md bg-[var(--v4-surface-3)] flex items-center justify-center text-[var(--v4-ink-3)]">{icon}</span>
      {text}
    </div>
  )
}

// ─── AI ANALYSIS TAB (lightweight — list of saved analyses) ──────────────────

function AnalysesTab({ analyses }) {
  if (analyses.length === 0) {
    return (
      <EmptyRow icon={<Brain className="w-4 h-4" />} text="No analyses yet. Run one from the Assessments tab." />
    )
  }
  return (
    <ListTable>
      {analyses.map(a => (
        <ListRow
          key={a.id}
          icon={<Brain className="w-3.5 h-3.5" />}
          iconTone="purple"
          title={`Analysis · ${a.ai_analysis?.passage_level_reached || 'Placement'}`}
          tag={a.ai_analysis?.ufli_placement
            ? { text: `Unit ${a.ai_analysis.ufli_placement.current_working_unit}`, tone: 'purple' }
            : null}
          sub={
            a.ai_analysis?.priority_gaps?.length
              ? `${a.ai_analysis.priority_gaps.length} priority gaps · ${(a.ai_analysis.strengths?.length || 0)} strengths`
              : 'No detail recorded'
          }
          date={relativeDay(a.date || a.created_at)}
        />
      ))}
    </ListTable>
  )
}

// ─── RIGHT PANEL ─────────────────────────────────────────────────────────────

const SKILL_DISPLAY = [
  { key: 'sight_words', label: 'Sight Words' },
  { key: 'phonics_decoding', label: 'Phonics & Decoding' },
  { key: 'phonological_awareness', label: 'Phonological Awareness' },
  { key: 'alphabet_knowledge', label: 'Alphabet Knowledge' },
  { key: 'phonics_automaticity', label: 'Phonics Automaticity' },
]

function RightPanel({ student, reportCards, onEdit }) {
  const latestReport = reportCards[0]
  const skillLevels = latestReport?.skillLevels || {}

  function statusDot(level) {
    if (!level || level === 'not-assessed') return null
    const s = getStatus(level, student.grade)
    if (s.status === 'ahead') return 'bg-[var(--v4-green)]'
    if (s.status === 'behind') return 'bg-[var(--v4-red)]'
    return 'bg-[var(--v4-amber)]'
  }

  function levelLabel(level) {
    if (!level || level === 'not-assessed') return '—'
    return GRADE_LEVELS.find(g => g.key === level)?.label || level
  }

  return (
    <aside className="bg-[var(--v4-surface-2)] border-l border-[var(--v4-border)] h-screen overflow-y-auto sticky top-0 p-5 text-[var(--v4-ink)]">
      <PanelSection
        title={<><BarChart3 className="w-3.5 h-3.5" /> Skills</>}
        action={Object.keys(skillLevels).length > 0 ? 'View all →' : null}
        onAction={() => { /* future: scroll to full skill list */ }}
      >
        {SKILL_DISPLAY.map(s => {
          const dot = statusDot(skillLevels[s.key])
          return (
            <div key={s.key} className="grid items-center gap-2 py-1 text-[12px]" style={{ gridTemplateColumns: '1fr auto' }}>
              <div className="flex items-center gap-1.5 text-[var(--v4-ink-2)] font-medium">
                {dot ? <span className={`inline-block w-[7px] h-[7px] rounded-full ${dot}`} /> : <span className="inline-block w-[7px] h-[7px] rounded-full bg-[var(--v4-ink-4)]" />}
                {s.label}
              </div>
              <div className="text-[var(--v4-ink)] font-semibold text-[11.5px]">{levelLabel(skillLevels[s.key])}</div>
            </div>
          )
        })}
      </PanelSection>

      <PanelSection title={<>👨‍👩‍👧 Parent</>} action="Edit" onAction={() => onEdit('parent')}>
        <PanelField label="Name" value={student.parent_name} />
        <PanelField label="Email" value={student.parent_email} mono={false} small />
        <PanelField label="Phone" value={student.parent_phone} placeholder="Add phone..." />
      </PanelSection>

      <PanelSection title={<>📅 Schedule</>} action="Edit" onAction={() => onEdit('schedule')}>
        <PanelField
          label="When"
          value={(student.session_day || student.session_time) ? `${student.session_day || ''}${student.session_time ? ' · ' + student.session_time : ''}` : null}
          placeholder="Add schedule..."
        />
        <PanelField label="Length" value={student.session_length_minutes ? `${student.session_length_minutes} min` : null} />
        <PanelField label="Start" value={student.start_date} mono />
        <PanelField label="End" value={student.total_sessions_planned && student.total_sessions_planned !== 999 && student.start_date
          ? new Date(new Date(student.start_date).getTime() + student.total_sessions_planned * 7 * 86400000)
              .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : (student.total_sessions_planned === 999 ? 'Ongoing' : null)} mono />
      </PanelSection>
    </aside>
  )
}

function PanelSection({ title, action, onAction, children }) {
  return (
    <div className="mb-[22px]">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--v4-ink-3)] mb-2.5 uppercase tracking-[0.6px]">
        {title}
        {action && (
          <button onClick={onAction} className="ml-auto text-[10.5px] text-[var(--v4-ink-2)] font-medium normal-case tracking-normal hover:text-[var(--v4-ink)] cursor-pointer">
            {action}
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function PanelField({ label, value, mono, small, placeholder }) {
  const empty = !value
  return (
    <div className="grid items-center gap-2 py-1 text-[12px]" style={{ gridTemplateColumns: '80px 1fr' }}>
      <div className="text-[var(--v4-ink-3)] font-medium">{label}</div>
      <div className={`flex items-center gap-1.5 ${empty ? 'text-[var(--v4-ink-3)] font-normal' : 'text-[var(--v4-ink)] font-medium'} ${mono ? 'font-mono' : ''} ${small ? 'text-[11.5px]' : ''}`}>
        {empty ? (placeholder || '—') : value}
      </div>
    </div>
  )
}

// ─── EDIT MODAL ──────────────────────────────────────────────────────────────

function EditModal({ studentId, onClose }) {
  // The ProfileTab already has the full editing form (name, grade, age,
  // session, schedule, parent). It enters edit mode on its own "Edit" button
  // click; here we just open it inside a modal shell.
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={onClose}>
      <div
        className="bg-[var(--v4-surface)] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--v4-ink)]">Edit Student</h2>
          <button onClick={onClose} className="text-[var(--v4-ink-3)] hover:text-[var(--v4-ink)] text-xl leading-none">×</button>
        </div>
        <ProfileTab studentId={studentId} onRefresh={onClose} defaultEditing />
      </div>
    </div>
  )
}
