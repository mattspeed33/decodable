import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { getStudent, getLatestAssessment, getLatestSession, getSessions, getAssessments, getEmailLog, getHomeworkSheets } from '../lib/storage'
import ProfileTab from './tabs/ProfileTab.jsx'
import AssessmentsTab from './tabs/AssessmentsTab.jsx'
import SessionsTab from './tabs/SessionsTab.jsx'
import ParentHubTab from './tabs/ParentHubTab.jsx'
import ReportCardTab from './tabs/ReportCardTab.jsx'


const tabs = [
  { key: 'profile', label: 'Profile', icon: '👤' },
  { key: 'assessments', label: 'Assessments', icon: '📊' },
  { key: 'sessions', label: 'Sessions', icon: '🗓️' },
  { key: 'parent', label: 'Parent Hub', icon: '👨‍👧' },
  { key: 'report', label: 'Report Card', icon: '📋' },
]

const gradeEmoji = { 'K': '🌱', '1st': '🌿', '2nd': '🌳', '3rd': '🏆' }

function getNextAction(student, assessment, sessions, emails, homework) {
  if (!assessment) {
    return { icon: '📸', text: 'Upload your first assessment to get started', tab: 'assessments', color: 'var(--primary)' }
  }
  if (sessions.length === 0) {
    return { icon: '🗓️', text: 'Plan your first session', tab: 'sessions', color: 'var(--blue)' }
  }
  const latestSession = sessions[0]
  const emailsForSession = emails.filter(e => e.session_number === latestSession.ses_number)
  if (emailsForSession.length === 0) {
    return { icon: '✉️', text: 'Send a progress update to the parent', tab: 'parent', color: 'var(--orange)' }
  }
  const recentHomework = homework.filter(h => {
    const d = new Date(h.created_at)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return d >= weekAgo
  })
  if (recentHomework.length === 0) {
    return { icon: '✏️', text: 'Assign homework before the next session', tab: 'parent', color: 'var(--green)' }
  }
  return { icon: '✅', text: 'All caught up! Great work this week.', tab: null, color: 'var(--green)' }
}

export default function StudentPage() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('profile')
  const [refreshKey, setRefreshKey] = useState(0)

  function refresh() { setRefreshKey(k => k + 1) }

  // Re-read all data from localStorage on every refresh
  const student = getStudent(id)

  if (!student) {
    return <p className="text-center text-gray-400 py-20">Student not found.</p>
  }

  const assessment = getLatestAssessment(id)
  const sessions = getSessions(id)
  const emails = getEmailLog(id)
  const homework = getHomeworkSheets(id)
  const nextAction = getNextAction(student, assessment, sessions, emails, homework)
  const analysis = assessment?.ai_analysis
  const weekArc = analysis?.week_arc || analysis?.four_week_arc
  const currentWeekIndex = Math.min(sessions.length, (weekArc?.length || 1) - 1)
  const currentWeek = weekArc?.[currentWeekIndex]

  function renderContent() {
    switch (activeTab) {
      case 'profile': return <ProfileTab studentId={id} onRefresh={refresh} />
      case 'assessments': return <AssessmentsTab studentId={id} onRefresh={refresh} />
      case 'sessions': return <SessionsTab studentId={id} onRefresh={refresh} />
      case 'parent': return <ParentHubTab studentId={id} onRefresh={refresh} />
      case 'report': return <ReportCardTab studentId={id} />
      default: return <ProfileTab studentId={id} onRefresh={refresh} />
    }
  }

  return (
    <div className="space-y-5">
      {/* Student header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{gradeEmoji[student.grade] || '📚'}</span>
          <div>
            <h2 className="text-2xl font-black text-black tracking-tight">{student.name}</h2>
            <p className="text-xs text-gray-400 font-semibold">{student.grade} grade &middot; Age {student.age} &middot; {sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <span className="text-[10px] bg-[var(--primary-light)] text-[var(--primary)] px-3 py-1 rounded-full font-black uppercase tracking-wide">
          {student.session_type}
        </span>
      </div>

      {/* What's next banner */}
      <button
        onClick={() => nextAction.tab && setActiveTab(nextAction.tab)}
        className={`w-full rounded-2xl border-2 p-4 flex items-center gap-3 transition text-left ${nextAction.tab ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}`}
        style={{ borderColor: nextAction.color, background: `color-mix(in srgb, ${nextAction.color} 8%, white)` }}
      >
        <span className="text-2xl">{nextAction.icon}</span>
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: nextAction.color }}>What's next</p>
          <p className="text-sm font-bold text-black">{nextAction.text}</p>
        </div>
        {nextAction.tab && <span className="text-gray-300 text-lg">→</span>}
      </button>

      {/* Week Arc Timeline */}
      {weekArc && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-black text-sm">📅 {weekArc.length}-Week Plan</h3>
            <span className="text-[10px] bg-[var(--primary-light)] text-[var(--primary)] px-2.5 py-0.5 rounded-full font-bold">
              Week {Math.min(sessions.length + 1, weekArc.length)} of {weekArc.length}
            </span>
          </div>
          {/* Progress bar */}
          <div className="relative h-2 bg-gray-100 rounded-full mb-5">
            <div
              className="absolute top-0 left-0 h-2 rounded-full transition-all"
              style={{
                width: `${Math.min(100, (sessions.length / weekArc.length) * 100)}%`,
                background: 'var(--primary)'
              }}
            />
          </div>

          {/* Week nodes */}
          <div className="flex">
            {weekArc.map((week, i) => {
              const isCompleted = sessions.length > i
              const isCurrent = sessions.length === i
              const nodeSize = weekArc.length > 8 ? 'w-7 h-7 text-[10px]' : weekArc.length > 6 ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
              return (
                <div key={i} className="flex flex-col items-center text-center" style={{ width: `${100 / weekArc.length}%` }}>
                  <div className={`${nodeSize} rounded-full flex items-center justify-center font-black border-2 transition-all ${
                    isCompleted
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                      : isCurrent
                        ? 'bg-white text-[var(--primary)] border-[var(--primary)] ring-4 ring-[var(--primary-light)]'
                        : 'bg-gray-50 text-gray-300 border-gray-200'
                  }`}>
                    {isCompleted ? '✓' : week.week}
                  </div>
                  <p className={`text-[10px] font-bold mt-1.5 leading-tight ${isCurrent ? 'text-[var(--primary)]' : isCompleted ? 'text-black' : 'text-gray-300'}`}>
                    {week.focus}
                  </p>
                  {isCurrent && (
                    <span className="text-[8px] bg-[var(--primary)] text-white px-1.5 py-0.5 rounded-full font-bold mt-1">NOW</span>
                  )}
                </div>
              )
            })}
          </div>
          {currentWeek && (
            <div className="mt-5 bg-[var(--blue-light)] rounded-xl p-3 flex items-start gap-2.5">
              <span className="text-lg">💡</span>
              <div>
                <p className="text-[10px] font-bold text-[var(--blue)] uppercase tracking-wide">Up Next</p>
                <p className="text-sm font-bold text-black">{currentWeek.focus}</p>
                <p className="text-xs text-gray-500">{currentWeek.activity_type}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="screen-nav flex gap-1 rounded-2xl bg-white border-2 border-gray-100 p-1.5">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === tab.key
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'text-gray-400 hover:text-black hover:bg-gray-50'
            }`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  )
}
